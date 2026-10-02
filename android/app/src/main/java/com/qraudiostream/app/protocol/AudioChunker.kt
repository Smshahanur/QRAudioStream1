package com.qraudiostream.app.protocol

import android.graphics.Bitmap
import android.graphics.Color
import android.util.Base64
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.util.UUID
import kotlin.math.ceil

class AudioChunker(
    private val chunkSizeBytes: Int = 400,
    private val qrErrorCorrection: ErrorCorrectionLevel = ErrorCorrectionLevel.M
) {
    private val qrWriter = QRCodeWriter()
    private val hints = mapOf(
        EncodeHintType.ERROR_CORRECTION to qrErrorCorrection,
        EncodeHintType.CHARACTER_SET to "ISO-8859-1",
        EncodeHintType.MARGIN to 1
    )

    fun chunkAudio(
        inputStream: InputStream,
        filename: String,
        mimeType: String
    ): List<AudioChunkPacket> {
        val audioBytes = inputStream.readBytes()
        return chunkBytes(audioBytes, filename, mimeType)
    }

    fun chunkBytes(
        audioBytes: ByteArray,
        filename: String,
        mimeType: String
    ): List<AudioChunkPacket> {
        val totalSize = audioBytes.size
        val totalChunks = ceil(totalSize.toDouble() / chunkSizeBytes).toInt().coerceAtLeast(1)
        val sessionId = UUID.randomUUID().toString().substring(0, 6)
        val fileCrc32 = AudioChunkPacket.calculateCrc32(audioBytes)

        val packets = ArrayList<AudioChunkPacket>(totalChunks)

        for (index in 0 until totalChunks) {
            val start = index * chunkSizeBytes
            val end = (start + chunkSizeBytes).coerceAtMost(totalSize)
            val chunkBytes = audioBytes.copyOfRange(start, end)
            val chunkCrc = AudioChunkPacket.calculateCrc32(chunkBytes)
            val base64Payload = Base64.encodeToString(chunkBytes, Base64.NO_WRAP)

            packets.add(
                AudioChunkPacket(
                    sessionId = sessionId,
                    chunkIndex = index,
                    totalChunks = totalChunks,
                    filename = filename,
                    mimeType = mimeType,
                    checksum = chunkCrc,
                    fileCrc32 = fileCrc32,
                    payloadBase64 = base64Payload
                )
            )
        }

        return packets
    }

    fun generateQrBitmap(content: String, sizePx: Int = 512): Bitmap {
        val bitMatrix = qrWriter.encode(content, BarcodeFormat.QR_CODE, sizePx, sizePx, hints)
        val width = bitMatrix.width
        val height = bitMatrix.height
        val pixels = IntArray(width * height)

        for (y in 0 until height) {
            val offset = y * width
            for (x in 0 until width) {
                pixels[offset + x] = if (bitMatrix[x, y]) Color.BLACK else Color.WHITE
            }
        }

        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
        bitmap.setPixels(pixels, 0, width, 0, 0, width, height)
        return bitmap
    }
}
