package com.qraudiostream.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.qraudiostream.app.ui.theme.*

data class TransferRecord(
    val id: String,
    val filename: String,
    val type: String, // "SENT" or "RECEIVED"
    val sizeBytes: Long,
    val timestamp: String,
    val checksum: String
)

@Composable
fun HistoryScreen(
    onNavigateBack: () -> Unit
) {
    // Demonstration records showing sent and received optical audio transfers
    val mockHistory = listOf(
        TransferRecord("1", "voice_memo_field_report.m4a", "RECEIVED", 28400, "Today, 19:42", "7A89F1D2"),
        TransferRecord("2", "acoustic_intro_snippet.mp3", "SENT", 64500, "Today, 18:15", "4B22E981"),
        TransferRecord("3", "secure_voice_key.wav", "RECEIVED", 12800, "Yesterday, 14:02", "C91A04FF")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavyBackground)
            .statusBarsPadding()
            .navigationBarsPadding()
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
                text = "Transfer History",
                style = MaterialTheme.typography.titleLarge,
                color = TextPrimary
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(mockHistory.size) { index ->
                val item = mockHistory[index]
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkNavySurface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, DarkNavyBorder)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (item.type == "SENT") ElectricCyan.copy(alpha = 0.15f)
                                    else ElectricBlue.copy(alpha = 0.15f)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (item.type == "SENT") Icons.Default.CallMade else Icons.Default.CallReceived,
                                contentDescription = item.type,
                                tint = if (item.type == "SENT") ElectricCyan else ElectricBlue,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.filename,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                            Text(
                                text = "${item.timestamp} · ${(item.sizeBytes / 1024f).toInt()} KB · CRC: ${item.checksum}",
                                fontSize = 11.sp,
                                color = TextMuted
                            )
                        }

                        Icon(
                            imageVector = Icons.Default.PlayCircle,
                            contentDescription = "Play",
                            tint = ElectricCyan,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
            }
        }
    }
}
