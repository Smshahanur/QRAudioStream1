package com.qraudiostream.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.qraudiostream.app.ui.theme.*

@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit
) {
    var defaultFps by remember { mutableFloatStateOf(10f) }
    var chunkSizeBytes by remember { mutableFloatStateOf(400f) }
    var highContrastMode by remember { mutableStateOf(true) }
    var soundFeedback by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavyBackground)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
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
                text = "Stream Settings",
                style = MaterialTheme.typography.titleLarge,
                color = TextPrimary
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Transfer Protocol Tuning
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = DarkNavySurface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Optical Link Calibration",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = "Fine-tune frame rate and payload density for camera focus & ambient light",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 2.dp, bottom = 14.dp)
                )

                // FPS
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Default Streaming Speed", fontSize = 13.sp, color = TextPrimary)
                    Text("${defaultFps.toInt()} FPS", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ElectricCyan)
                }
                Slider(
                    value = defaultFps,
                    onValueChange = { defaultFps = it },
                    valueRange = 5f..20f,
                    steps = 14,
                    colors = SliderDefaults.colors(
                        thumbColor = ElectricCyan,
                        activeTrackColor = ElectricCyan,
                        inactiveTrackColor = DarkNavyCard
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Chunk Size
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Chunk Payload Size", fontSize = 13.sp, color = TextPrimary)
                    Text("${chunkSizeBytes.toInt()} Bytes/frame", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ElectricBlue)
                }
                Slider(
                    value = chunkSizeBytes,
                    onValueChange = { chunkSizeBytes = it },
                    valueRange = 200f..800f,
                    steps = 11,
                    colors = SliderDefaults.colors(
                        thumbColor = ElectricBlue,
                        activeTrackColor = ElectricBlue,
                        inactiveTrackColor = DarkNavyCard
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // UI & Audio Preferences Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = DarkNavySurface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("High Contrast Display", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = TextPrimary)
                        Text("Pure white QR canvas for fast camera shutter locks", fontSize = 11.sp, color = TextMuted)
                    }
                    Switch(
                        checked = highContrastMode,
                        onCheckedChange = { highContrastMode = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = ElectricCyan)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Acoustic Frame Beep", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = TextPrimary)
                        Text("Play gentle click on verified chunk reception", fontSize = 11.sp, color = TextMuted)
                    }
                    Switch(
                        checked = soundFeedback,
                        onCheckedChange = { soundFeedback = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = ElectricCyan)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Offline notice
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkNavyCard),
            border = androidx.compose.foundation.BorderStroke(1.dp, DarkNavyBorder)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "Air-Gapped Security Guarantee",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = NeonEmerald
                )
                Text(
                    text = "No Wi-Fi, cellular, Bluetooth, or cloud servers are used. Transmission occurs strictly via modulated photons between the sender's display and the receiver's camera sensor.",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}
