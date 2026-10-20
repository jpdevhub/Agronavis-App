package expo.modules.gemma

import android.content.ComponentCallbacks2
import android.content.res.Configuration
import android.util.Base64
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
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
import kotlinx.coroutines.withTimeout

private fun normalizeModelPath(modelPath: String): String {
    val trimmed = modelPath.trim()
    if (!trimmed.startsWith("file://", ignoreCase = true)) return trimmed
    // file:///data/user/0/... → /data/user/0/...
    return java.net.URLDecoder.decode(trimmed.substring(7), Charsets.UTF_8)
}

class GemmaLlmModule : Module() {
    private var engine: Engine? = null

    /** Which model the live engine was built from, so a reload can be skipped. */
    private var loadedPath: String? = null
    @Volatile private var conversation: com.google.ai.edge.litertlm.Conversation? = null
    @Volatile private var isCancelled = false
    private val moduleJob = SupervisorJob()
    private val moduleScope = CoroutineScope(Dispatchers.IO + moduleJob)

    /** Closes the engine and forgets it, so the next load rebuilds cleanly. */
    @Synchronized
    private fun releaseEngine() {
        try {
            conversation?.close()
            engine?.close()
        } catch (ex: Exception) {
            Log.w("GemmaLlm", "Error releasing engine: ${ex.message}")
        }
        conversation = null
        engine = null
        loadedPath = null
    }

    override fun definition() = ModuleDefinition {
        Name("GemmaLlm")
        Events("onToken")

        OnDestroy {
            moduleJob.cancel()
            conversation?.close()
            engine?.close()
        }

        /**
         * True when a model is already in memory and ready to answer.
         *
         * Lets the screen skip straight to the chat instead of offering a
         * "Start Sahayak" button that would spend half a minute rebuilding
         * something the process already holds.
         */
        Function("isLoaded") {
            engine != null && conversation != null
        }

        /**
         * Hands the model's memory back.
         *
         * The engine holds several gigabytes for the life of the process, and
         * nothing could release it — so a phone running this alongside the map
         * and the camera had no way to give anything up, and Android resolved
         * that by killing the app. Which looks, from the outside, like it
         * crashed for no reason.
         */
        Function("unload") {
            releaseEngine()
            true
        }

        /**
         * Release before Android decides to take the whole process instead.
         *
         * onTrimMemory is the system asking politely. At the critical levels
         * it is minutes from killing us, and the model is by far the largest
         * thing we hold, so letting go of it is usually enough to survive —
         * and reloading it later costs a wait, not a lost session.
         */
        OnCreate {
            appContext.reactContext?.registerComponentCallbacks(
                object : ComponentCallbacks2 {
                    override fun onTrimMemory(level: Int) {
                        /**
                         * Only when the system is genuinely about to start
                         * killing processes.
                         *
                         * RUNNING_LOW was too eager: UI_HIDDEN and BACKGROUND
                         * are numerically higher and fire every time the app
                         * goes behind another one, so switching away and back
                         * meant reading several gigabytes off disk again. The
                         * two levels left are the ones that actually precede
                         * being killed.
                         */
                        val critical = level == ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL ||
                            level >= ComponentCallbacks2.TRIM_MEMORY_COMPLETE
                        if (critical) {
                            if (engine != null) {
                                Log.i("GemmaLlm", "Releasing model under memory pressure (level $level)")
                                releaseEngine()
                            }
                        }
                    }

                    override fun onConfigurationChanged(newConfig: Configuration) {}

                    @Deprecated("Required by ComponentCallbacks2")
                    override fun onLowMemory() {
                        releaseEngine()
                    }
                },
            )
        }

        AsyncFunction("load") { modelPath: String, promise: Promise ->
            moduleScope.launch {
                try {
                    val fsPath = normalizeModelPath(modelPath)

                    // Already holding this exact model: hand it straight back.
                    // This used to close the engine and rebuild it on every
                    // call, so leaving the screen and returning paid the full
                    // multi-gigabyte load again for no reason at all.
                    if (engine != null && conversation != null && loadedPath == fsPath) {
                        promise.resolve(true)
                        return@launch
                    }

                    conversation?.close()
                    engine?.close()
                    conversation = null
                    engine = null
                    loadedPath = null

                    val config = EngineConfig(
                        modelPath = fsPath,
                        backend = Backend.CPU(),
                        visionBackend = Backend.CPU(),
                    )
                    val e = Engine(config)
                    e.initialize()
                    conversation = e.createConversation()
                    engine = e
                    loadedPath = fsPath
                    promise.resolve(true)
                } catch (ex: Exception) {
                    promise.reject("LOAD_FAILED", ex.message ?: "Failed to load model", ex)
                }
            }
        }

        AsyncFunction("generate") { prompt: String, promise: Promise ->
            moduleScope.launch {
                val sb = StringBuilder()
                try {
                    isCancelled = false
                    val conv = conversation
                    if (conv == null) {
                        promise.reject("NOT_LOADED", "Model not loaded. Call load() first.", null)
                        return@launch
                    }
                    try {
                        withTimeout(60_000L) {
                            conv.sendMessageAsync(Contents.of(Content.Text(prompt)))
                                .collect { message ->
                                    if (isCancelled) return@collect
                                    val token = message.toString()
                                    sb.append(token)
                                    sendEvent("onToken", mapOf("token" to token, "done" to false))
                                }
                        }
                    } finally {
                        sendEvent("onToken", mapOf("token" to "", "done" to true))
                    }
                    promise.resolve(sb.toString())
                } catch (ex: Exception) {
                    if (isCancelled || ex is TimeoutCancellationException) {
                        promise.resolve(sb.toString())
                    } else {
                        promise.reject("GENERATE_FAILED", ex.message ?: "Generation failed", ex)
                    }
                }
            }
        }

        AsyncFunction("generateWithImage") { prompt: String, imageBase64: String, _mimeType: String, promise: Promise ->
            moduleScope.launch {
                val sb = StringBuilder()
                try {
                    isCancelled = false
                    val conv = conversation
                    if (conv == null) {
                        promise.reject("NOT_LOADED", "Model not loaded. Call load() first.", null)
                        return@launch
                    }
                    val imageBytes = Base64.decode(imageBase64, Base64.DEFAULT)
                    try {
                        withTimeout(60_000L) {
                            conv.sendMessageAsync(
                                Contents.of(
                                    Content.ImageBytes(imageBytes),
                                    Content.Text(prompt),
                                )
                            )
                                .collect { message ->
                                    if (isCancelled) return@collect
                                    val token = message.toString()
                                    sb.append(token)
                                    sendEvent("onToken", mapOf("token" to token, "done" to false))
                                }
                        }
                    } finally {
                        sendEvent("onToken", mapOf("token" to "", "done" to true))
                    }
                    promise.resolve(sb.toString())
                } catch (ex: Exception) {
                    if (isCancelled || ex is TimeoutCancellationException) {
                        promise.resolve(sb.toString())
                    } else {
                        promise.reject("GENERATE_FAILED", ex.message ?: "Generation failed", ex)
                    }
                }
            }
        }

        Function("cancel") {
            isCancelled = true
            try {
                conversation?.close()
                engine?.let { e -> conversation = e.createConversation() }
            } catch (_: Exception) {
                // ignore — best effort reset
            }
        }
    }
}
