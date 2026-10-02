package com.qraudiostream.app.protocol

import android.content.Context
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.ConcurrentHashMap

data class ReconstructProgress(
    val sessionId: String,
    val receivedCount: Int,
    val totalChunks: Int,
    val duplicateFrames: Int,
    val missingChunks: List<Int>,
    val progressFraction: Float,
    val filename: String
)

sealed class ReconstructResult {
    data class Progress(val progress: ReconstructProgress) : ReconstructResult()
    data class Complete(val file: File, val mimeType: String, val totalBytes: Long) : ReconstructResult()
    data class Error(val message: String) : ReconstructResult()
}

class AudioReconstructor(private val context: Context) {
    private var activeSessionId: String? = null
    private var totalChunks: Int = 0
    private var filename: String = "audio_received.m4a"
    private var mimeType: String = "audio/mp4"
    private var expectedFileCrc32: Long = 0L
    private val chunksMap = ConcurrentHashMap<Int, ByteArray>()
    private var duplicateCount = 0

    fun reset() {
        activeSessionId = null
        totalChunks = 0
        chunksMap.clear()
        duplicateCount = 0
    }

    @Synchronized
    fun onPacketReceived(packet: AudioChunkPacket): ReconstructResult {
        // If new session detected, switch and reset buffer
        if (activeSessionId != packet.sessionId) {
            activeSessionId = packet.sessionId
            totalChunks = packet.totalChunks
            filename = packet.filename
            mimeType = packet.mimeType
            expectedFileCrc32 = packet.fileCrc32
            chunksMap.clear()
            duplicateCount = 0
        }

        // Packet bounds check
        if (packet.chunkIndex < 0 || packet.chunkIndex >= packet.totalChunks) {
            return ReconstructResult.Error("Invalid chunk index: ${packet.chunkIndex} of ${packet.totalChunks}")
        }

        // Duplicate frame detection
        if (chunksMap.containsKey(packet.chunkIndex)) {
            duplicateCount++
            return ReconstructResult.Progress(calculateProgress())
        }

        // Insert validated chunk payload
        chunksMap[packet.chunkIndex] = packet.getPayloadBytes()

        // Check completion
        if (chunksMap.size == totalChunks && totalChunks > 0) {
            val audioBytes = assembleBytes()
            
            // Integrity validation
            if (expectedFileCrc32 != 0L) {
                val actualCrc = AudioChunkPacket.calculateCrc32(audioBytes)
                if (actualCrc != expectedFileCrc32) {
                    return ReconstructResult.Error("Total file CRC32 mismatch: expected $expectedFileCrc32, got $actualCrc")
                }
            }

            // Save to app-private cache
            val outputDir = File(context.cacheDir, "received_audio")
            if (!outputDir.exists()) outputDir.mkdirs()

            val safeFilename = "${System.currentTimeMillis()}_${filename.replace(" ", "_")}"
            val outputFile = File(outputDir, safeFilename)

            FileOutputStream(outputFile).use { fos ->
                fos.write(audioBytes)
                fos.flush()
            }

            return ReconstructResult.Complete(outputFile, mimeType, audioBytes.size.toLong())
        }

        return ReconstructResult.Progress(calculateProgress())
    }

    private fun assembleBytes(): ByteArray {
        val totalSize = (0 until totalChunks).sumOf { chunksMap[it]?.size ?: 0 }
        val result = ByteArray(totalSize)
        var offset = 0
        for (i in 0 until totalChunks) {
            val chunk = chunksMap[i] ?: continue
            System.arraycopy(chunk, 0, result, offset, chunk.size)
            offset += chunk.size
        }
        return result
    }

    fun calculateProgress(): ReconstructProgress {
        val missing = ArrayList<Int>()
        for (i in 0 until totalChunks) {
            if (!chunksMap.containsKey(i)) {
                missing.add(i)
            }
        }
        val fraction = if (totalChunks > 0) chunksMap.size.toFloat() / totalChunks else 0f
        return ReconstructProgress(
            sessionId = activeSessionId ?: "",
            receivedCount = chunksMap.size,
            totalChunks = totalChunks,
            duplicateFrames = duplicateCount,
            missingChunks = missing,
            progressFraction = fraction,
            filename = filename
        )
    }
}
