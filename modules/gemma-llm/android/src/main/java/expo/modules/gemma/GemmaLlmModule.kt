package expo.modules.gemma

import android.util.Base64
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
    @Volatile private var conversation: com.google.ai.edge.litertlm.Conversation? = null
    @Volatile private var isCancelled = false
    private val moduleJob = SupervisorJob()
    private val moduleScope = CoroutineScope(Dispatchers.IO + moduleJob)

    override fun definition() = ModuleDefinition {
        Name("GemmaLlm")
        Events("onToken")

        OnDestroy {
            moduleJob.cancel()
            conversation?.close()
            engine?.close()
        }

        AsyncFunction("load") { modelPath: String, promise: Promise ->
            moduleScope.launch {
                try {
                    conversation?.close()
                    engine?.close()
                    val fsPath = normalizeModelPath(modelPath)
                    val config = EngineConfig(
                        modelPath = fsPath,
                        backend = Backend.CPU(),
                        visionBackend = Backend.CPU(),
                    )
                    val e = Engine(config)
                    e.initialize()
                    conversation = e.createConversation()
                    engine = e
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
