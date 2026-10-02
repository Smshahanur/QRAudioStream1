package com.qraudiostream.app.protocol

import android.util.Base64
import org.json.JSONObject
import java.util.zip.CRC32

/**
 * High-speed air-gapped packet definition for optical QR audio streaming.
 * Includes session isolation, chunk indexing, frame checksum, and overall file CRC32.
 */
data class AudioChunkPacket(
    val sessionId: String,
    val chunkIndex: Int,
    val totalChunks: Int,
    val filename: String,
    val mimeType: String,
    val checksum: Long,
    val fileCrc32: Long,
    val payloadBase64: String
) {
    fun serialize(): String {
        val json = JSONObject()
        json.put("s", sessionId)
        json.put("i", chunkIndex)
        json.put("t", totalChunks)
        json.put("n", filename)
        json.put("m", mimeType)
        json.put("c", checksum)
        json.put("fc", fileCrc32)
        json.put("d", payloadBase64)
        return json.toString()
    }

    fun getPayloadBytes(): ByteArray {
        return Base64.decode(payloadBase64, Base64.NO_WRAP)
    }

    companion object {
        fun deserialize(raw: String): AudioChunkPacket? {
            return try {
                val json = JSONObject(raw)
                val s = json.getString("s")
                val i = json.getInt("i")
                val t = json.getInt("t")
                val n = json.optString("n", "audio_received.m4a")
                val m = json.optString("m", "audio/mp4")
                val c = json.getLong("c")
                val fc = json.optLong("fc", 0L)
                val d = json.getString("d")

                // Verify chunk integrity using CRC32
                val payloadBytes = Base64.decode(d, Base64.NO_WRAP)
                val crc = CRC32()
                crc.update(payloadBytes)
                if (crc.value != c) {
                    return null // Checksum mismatch: frame corrupted
                }

                AudioChunkPacket(
                    sessionId = s,
                    chunkIndex = i,
                    totalChunks = t,
                    filename = n,
                    mimeType = m,
                    checksum = c,
                    fileCrc32 = fc,
                    payloadBase64 = d
                )
            } catch (e: Exception) {
                null
            }
        }

        fun calculateCrc32(data: ByteArray): Long {
            val crc = CRC32()
            crc.update(data)
            return crc.value
        }
    }
}
