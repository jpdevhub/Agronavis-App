package expo.modules.gemma

import android.content.ComponentCallbacks2
import android.content.res.Configuration
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeout

private fun normalizeModelPath(modelPath: String): String {
    val trimmed = modelPath.trim()
    if (!trimmed.startsWith("file://", ignoreCase = true)) return trimmed
    // file:///data/user/0/... → /data/user/0/...
    return java.net.URLDecoder.decode(trimmed.substring(7), Charsets.UTF_8)
}

/**
 * Inference threads, leaving cores free for the UI.
 *
 * The native default takes every core. On an eight-core phone with four slow
 * cores that starves the main thread while an answer is being written, and
 * Android shows "isn't responding" even though nothing is stuck — the UI
 * thread simply never got scheduled. Half the cores, between 2 and 4, keeps
 * generation speed close to the default and the screen responsive.
 */
private fun inferenceThreads(): Int =
    (Runtime.getRuntime().availableProcessors() / 2).coerceIn(2, 4)

/**
 * The whole turn: prompt plus answer. JS sends the system prompt and the last
 * few messages every time, so a turn never needs more than this, and a smaller
 * KV cache is hundreds of megabytes less resident memory.
 */
private const val MAX_TOKENS = 4096

/**
 * Smallest window worth opening. Gemma 3 1B is built with a 2048-token cache,
 * and asking LiteRT for more than a model was exported with fails at load.
 */
private const val MIN_TOKENS = 512

class GemmaLlmModule : Module() {
    @Volatile private var engine: Engine? = null

    /** Which model the live engine was built from, so a reload can be skipped. */
    @Volatile private var loadedPath: String? = null
    @Volatile private var loadedWindow: Int = MAX_TOKENS

    /** The conversation currently generating, so it can be cancelled from any thread. */
    @Volatile private var active: Conversation? = null
    @Volatile private var isCancelled = false

    /**
     * Every create/use/close of the engine goes through this lock.
     *
     * Before, onTrimMemory closed the engine on the main thread while the IO
     * thread was in the middle of generating with it. Native close waits for
     * (or tears down under) the running inference: the main thread blocks,
     * which is the "Agronavis isn't responding" dialog, and the next question
     * finds no engine, which is "Sahayak is not running yet".
     */
    private val engineLock = Mutex()
    private val moduleJob = SupervisorJob()
    private val moduleScope = CoroutineScope(Dispatchers.IO + moduleJob)

    /** Caller must hold [engineLock]. */
    private fun releaseEngineLocked() {
        try {
            engine?.close()
        } catch (ex: Exception) {
            Log.w("GemmaLlm", "Error releasing engine: ${ex.message}")
        }
        engine = null
        loadedPath = null
    }

    /**
     * Release without ever blocking the calling thread.
     *
     * A running answer is cancelled first (a quick native flag), then the
     * close waits its turn on the lock in the background.
     */
    private fun requestRelease(reason: String) {
        if (engine == null) return
        Log.i("GemmaLlm", "Releasing model: $reason")
        try {
            active?.cancelProcess()
        } catch (_: Exception) {
        }
        moduleScope.launch {
            engineLock.withLock { releaseEngineLocked() }
        }
    }

    /**
     * One fresh conversation per question.
     *
     * The JS side already sends the system prompt and recent history in every
     * prompt. Reusing one native conversation meant each turn was appended to
     * all the previous ones — the system prompt stored once per question —
     * so every answer was slower than the last and the KV cache filled up.
     */
    private suspend fun runTurn(contents: Contents, promise: Promise) {
        val sb = StringBuilder()
        engineLock.withLock {
            val e = engine
            if (e == null) {
                promise.reject("NOT_LOADED", "Model not loaded. Call load() first.", null)
                return
            }
            isCancelled = false
            val conv = try {
                e.createConversation()
            } catch (ex: Exception) {
                promise.reject("GENERATE_FAILED", ex.message ?: "Could not start a conversation", ex)
                return
            }
            active = conv
            try {
                withTimeout(90_000L) {
                    conv.sendMessageAsync(contents).collect { message ->
                        if (isCancelled) return@collect
                        val token = message.toString()
                        sb.append(token)
                        sendEvent("onToken", mapOf("token" to token, "done" to false))
                    }
                }
                promise.resolve(sb.toString())
            } catch (ex: Exception) {
                if (isCancelled || ex is TimeoutCancellationException) {
                    // Stop the native side too; a timed-out flow otherwise
                    // keeps the CPU busy writing an answer nobody will see.
                    try { conv.cancelProcess() } catch (_: Exception) {}
                    promise.resolve(sb.toString())
                } else {
                    promise.reject("GENERATE_FAILED", ex.message ?: "Generation failed", ex)
                }
            } finally {
                active = null
                try { conv.close() } catch (_: Exception) {}
                sendEvent("onToken", mapOf("token" to "", "done" to true))
            }
        }
    }

    override fun definition() = ModuleDefinition {
        Name("GemmaLlm")
        Events("onToken")

        OnDestroy {
            try { active?.cancelProcess() } catch (_: Exception) {}
            moduleJob.cancel()
            try { engine?.close() } catch (_: Exception) {}
            engine = null
        }

        /** True when a model is in memory and ready to answer. */
        Function("isLoaded") {
            engine != null
        }

        /** Hands the model's memory back. Returns at once; the close runs in the background. */
        Function("unload") {
            requestRelease("requested by app")
            true
        }

        /**
         * Release before Android decides to take the whole process instead.
         * Runs on the main thread, so it must never wait for the engine.
         */
        OnCreate {
            appContext.reactContext?.registerComponentCallbacks(
                object : ComponentCallbacks2 {
                    override fun onTrimMemory(level: Int) {
                        val critical = level == ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL ||
                            level >= ComponentCallbacks2.TRIM_MEMORY_COMPLETE
                        if (critical) requestRelease("memory pressure (level $level)")
                    }

                    override fun onConfigurationChanged(newConfig: Configuration) {}

                    @Deprecated("Required by ComponentCallbacks2")
                    override fun onLowMemory() {
                        requestRelease("onLowMemory")
                    }
                },
            )
        }

        // maxTokens is optional so older JS that passes only the path still loads
        // the Gemma 4 models at their usual window.
        AsyncFunction("load") { modelPath: String, maxTokens: Int?, promise: Promise ->
            moduleScope.launch {
                engineLock.withLock {
                    try {
                        val fsPath = normalizeModelPath(modelPath)
                        val window = (maxTokens ?: MAX_TOKENS).coerceIn(MIN_TOKENS, MAX_TOKENS)

                        // Already holding this exact model: hand it straight back.
                        if (engine != null && loadedPath == fsPath && loadedWindow == window) {
                            promise.resolve(true)
                            return@withLock
                        }
                        releaseEngineLocked()

                        val config = EngineConfig(
                            modelPath = fsPath,
                            backend = Backend.CPU(numOfThreads = inferenceThreads()),
                            // No vision backend: nothing in the app sends an
                            // image to Sahayak, and the vision encoder is
                            // several hundred megabytes of RAM on its own.
                            // generateWithImage reports this instead.
                            visionBackend = null,
                            maxNumTokens = window,
                        )
                        val e = Engine(config)
                        e.initialize()
                        engine = e
                        loadedPath = fsPath
                        loadedWindow = window
                        promise.resolve(true)
                    } catch (ex: Throwable) {
                        // Throwable, not Exception: an OutOfMemoryError while
                        // mapping the model must reach JS as a failure, not
                        // leave the promise hanging forever.
                        releaseEngineLocked()
                        promise.reject("LOAD_FAILED", ex.message ?: "Failed to load model", ex)
                    }
                }
            }
        }

        AsyncFunction("generate") { prompt: String, promise: Promise ->
            moduleScope.launch {
                runTurn(Contents.of(Content.Text(prompt)), promise)
            }
        }

        AsyncFunction("generateWithImage") { _prompt: String, _imageBase64: String, _mimeType: String, promise: Promise ->
            // Kept so the JS API does not change. Nothing calls it today; to
            // use it, set visionBackend in load() again and budget the memory.
            promise.reject("NOT_SUPPORTED", "Image questions are not enabled in this build.", null)
        }

        /**
         * Stop the answer being written. Never closes anything here: this runs
         * on the JS thread, and closing a native conversation mid-inference
         * blocked it.
         */
        Function("cancel") {
            isCancelled = true
            try {
                active?.cancelProcess()
            } catch (_: Exception) {
                // nothing running
            }
        }
    }
}
