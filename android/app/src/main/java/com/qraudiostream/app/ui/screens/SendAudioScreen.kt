package com.qraudiostream.app.ui.screens

import android.graphics.Bitmap
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.qraudiostream.app.protocol.AudioChunkPacket
import com.qraudiostream.app.protocol.AudioChunker
import com.qraudiostream.app.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

@Composable
fun SendAudioScreen(
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val chunker = remember { AudioChunker(chunkSizeBytes = 400) }

    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    var audioFilename by remember { mutableStateOf<String?>(null) }
    var audioMimeType by remember { mutableStateOf("audio/mp4") }
    var audioBytes by remember { mutableStateOf<ByteArray?>(null) }

    var packets by remember { mutableStateOf<List<AudioChunkPacket>>(emptyList()) }
    var currentFrameIndex by remember { mutableIntStateOf(0) }
    var isStreaming by remember { mutableStateOf(false) }
    var targetFps by remember { mutableFloatStateOf(10f) }
    var currentQrBitmap by remember { mutableStateOf<Bitmap?>(null) }

    // File picker launcher
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            selectedUri = uri
            audioFilename = uri.lastPathSegment ?: "audio_track.m4a"
            context.contentResolver.openInputStream(uri)?.use { stream ->
                val bytes = stream.readBytes()
                audioBytes = bytes
                packets = chunker.chunkBytes(bytes, audioFilename ?: "audio.m4a", audioMimeType)
                currentFrameIndex = 0
                isStreaming = true
            }
        }
    }

    // QR Animation loop
    LaunchedEffect(isStreaming, packets, targetFps) {
        if (isStreaming && packets.isNotEmpty()) {
            val frameDelayMs = (1000f / targetFps).toLong()
            while (isActive && isStreaming) {
                val packet = packets[currentFrameIndex]
                currentQrBitmap = chunker.generateQrBitmap(packet.serialize(), 512)
                delay(frameDelayMs)
                currentFrameIndex = (currentFrameIndex + 1) % packets.size
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavyBackground)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Top App Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onNavigateBack,
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(DarkNavySurface)
            ) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = TextPrimary
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = "Send Audio Stream",
                style = MaterialTheme.typography.titleLarge,
                color = TextPrimary
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Audio Source Selection Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = DarkNavySurface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Select Audio File",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = "Choose a voice message, song, or recording from your device",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 2.dp, bottom = 12.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { filePickerLauncher.launch("audio/*") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ElectricCyan)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AudioFile,
                            contentDescription = null,
                            tint = DarkNavyBackground,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Browse Audio",
                            fontWeight = FontWeight.Bold,
                            color = DarkNavyBackground
                        )
                    }

                    OutlinedButton(
                        onClick = {
                            // Demo tone / voice sample for testing
                            val dummyAudio = ByteArray(4096) { it.toByte() }
                            audioFilename = "voice_memo_demo.m4a"
                            audioBytes = dummyAudio
                            packets = chunker.chunkBytes(dummyAudio, "voice_memo_demo.m4a", "audio/mp4")
                            currentFrameIndex = 0
                            isStreaming = true
                        },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ElectricBlue)
                    ) {
                        Text("Demo Audio")
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Animated QR Transmission Display
        AnimatedVisibility(visible = packets.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(DarkNavySurface)
                    .border(1.dp, DarkNavyBorder, RoundedCornerShape(20.dp))
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Metadata pill
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Session: ${packets.firstOrNull()?.sessionId ?: "---"}",
                        style = MaterialTheme.typography.labelSmall
                    )
                    Text(
                        text = "Frame ${currentFrameIndex + 1} of ${packets.size}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = ElectricCyan
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // High-Contrast QR Code Viewport
                Box(
                    modifier = Modifier
                        .size(280.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(androidx.compose.ui.graphics.Color.White)
                        .padding(10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (currentQrBitmap != null) {
                        Image(
                            bitmap = currentQrBitmap!!.asImageBitmap(),
                            contentDescription = "Animated QR Frame",
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        CircularProgressIndicator(color = DarkNavyBackground)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Frame Progress Bar
                LinearProgressIndicator(
                    progress = {
                        if (packets.isNotEmpty()) (currentFrameIndex + 1).toFloat() / packets.size else 0f
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = ElectricCyan,
                    trackColor = DarkNavyCard
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Transmission Controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = {
                            if (packets.isNotEmpty()) {
                                currentFrameIndex = if (currentFrameIndex > 0) currentFrameIndex - 1 else packets.size - 1
                                currentQrBitmap = chunker.generateQrBitmap(packets[currentFrameIndex].serialize(), 512)
                            }
                        }
                    ) {
                        Icon(Icons.Default.SkipPrevious, "Prev Frame", tint = TextPrimary)
                    }

                    FilledIconButton(
                        onClick = { isStreaming = !isStreaming },
                        colors = IconButtonDefaults.filledIconButtonColors(containerColor = ElectricCyan)
                    ) {
                        Icon(
                            imageVector = if (isStreaming) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = "Play/Pause",
                            tint = DarkNavyBackground
                        )
                    }

                    IconButton(
                        onClick = {
                            if (packets.isNotEmpty()) {
                                currentFrameIndex = (currentFrameIndex + 1) % packets.size
                                currentQrBitmap = chunker.generateQrBitmap(packets[currentFrameIndex].serialize(), 512)
                            }
                        }
                    ) {
                        Icon(Icons.Default.SkipNext, "Next Frame", tint = TextPrimary)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Speed Slider (FPS)
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Stream Speed", fontSize = 12.sp, color = TextSecondary)
                        Text("${targetFps.toInt()} FPS", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ElectricCyan)
                    }
                    Slider(
                        value = targetFps,
                        onValueChange = { targetFps = it },
                        valueRange = 4f..20f,
                        steps = 15,
                        colors = SliderDefaults.colors(
                            thumbColor = ElectricCyan,
                            activeTrackColor = ElectricCyan,
                            inactiveTrackColor = DarkNavyCard
                        )
                    )
                }
            }
        }
    }
}
