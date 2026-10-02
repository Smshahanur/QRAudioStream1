import JSZip from 'jszip';

export interface AndroidFileEntry {
  path: string;
  name: string;
  language: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFileEntry[] = [
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'kotlin',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "QRAudioStream"
include(":app")
`,
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`,
  },
  {
    path: 'gradle.properties',
    name: 'gradle.properties',
    language: 'properties',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`,
  },
  {
    path: 'gradle/libs.versions.toml',
    name: 'libs.versions.toml',
    language: 'toml',
    content: `[versions]
agp = "8.7.3"
kotlin = "2.0.21"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.11.00"
navigationCompose = "2.8.4"
cameraX = "1.4.1"
mlkitBarcode = "17.3.0"
zxing = "3.5.3"
media3 = "1.5.0"
coroutines = "1.9.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-compose-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }

# CameraX & ML Kit
androidx-camera-core = { group = "androidx.camera", name = "camera-core", version.ref = "cameraX" }
androidx-camera-camera2 = { group = "androidx.camera", name = "camera-camera2", version.ref = "cameraX" }
androidx-camera-lifecycle = { group = "androidx.camera", name = "camera-lifecycle", version.ref = "cameraX" }
androidx-camera-view = { group = "androidx.camera", name = "camera-view", version.ref = "cameraX" }
mlkit-barcode-scanning = { group = "com.google.mlkit", name = "barcode-scanning", version.ref = "mlkitBarcode" }

# ZXing & Media3
zxing-core = { group = "com.google.zxing", name = "core", version.ref = "zxing" }
androidx-media3-exoplayer = { group = "androidx.media3", name = "media3-exoplayer", version.ref = "media3" }
androidx-media3-ui = { group = "androidx.media3", name = "media3-ui", version.ref = "media3" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`,
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.qraudiostream.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.qraudiostream.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables { useSupportLibrary = true }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // CameraX + ML Kit
    implementation(libs.androidx.camera.core)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)
    implementation(libs.mlkit.barcode.scanning)

    // ZXing + Media3
    implementation(libs.zxing.core)
    implementation(libs.androidx.media3.exoplayer)
    implementation(libs.androidx.media3.ui)
    implementation(libs.kotlinx.coroutines.android)
}
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@android:drawable/ic_dialog_info"
        android:label="QRAudioStream"
        android:roundIcon="@android:drawable/ic_dialog_info"
        android:supportsRtl="true"
        android:theme="@style/Theme.QRAudioStream">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="QRAudioStream"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.QRAudioStream">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.provider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>
</manifest>
`,
  },
  {
    path: 'app/src/main/java/com/qraudiostream/app/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    content: `package com.qraudiostream.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.qraudiostream.app.ui.screens.*
import com.qraudiostream.app.ui.theme.DarkNavyBackground
import com.qraudiostream.app.ui.theme.QRAudioStreamTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            QRAudioStreamTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DarkNavyBackground
                ) {
                    AppNavigation()
                }
            }
        }
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onNavigateToSend = { navController.navigate("send") },
                onNavigateToReceive = { navController.navigate("receive") },
                onNavigateToHistory = { navController.navigate("history") },
                onNavigateToSettings = { navController.navigate("settings") }
            )
        }
        composable("send") { SendAudioScreen(onNavigateBack = { navController.popBackStack() }) }
        composable("receive") { ReceiveAudioScreen(onNavigateBack = { navController.popBackStack() }) }
        composable("history") { HistoryScreen(onNavigateBack = { navController.popBackStack() }) }
        composable("settings") { SettingsScreen(onNavigateBack = { navController.popBackStack() }) }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/qraudiostream/app/protocol/TransferProtocol.kt',
    name: 'TransferProtocol.kt',
    language: 'kotlin',
    content: `package com.qraudiostream.app.protocol

import android.util.Base64
import org.json.JSONObject
import java.util.zip.CRC32

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

    fun getPayloadBytes(): ByteArray = Base64.decode(payloadBase64, Base64.NO_WRAP)

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

                val payloadBytes = Base64.decode(d, Base64.NO_WRAP)
                val crc = CRC32()
                crc.update(payloadBytes)
                if (crc.value != c) return null

                AudioChunkPacket(s, i, t, n, m, c, fc, d)
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
`,
  },
  {
    path: 'app/src/main/java/com/qraudiostream/app/protocol/AudioChunker.kt',
    name: 'AudioChunker.kt',
    language: 'kotlin',
    content: `package com.qraudiostream.app.protocol

import android.graphics.Bitmap
import android.graphics.Color
import android.util.Base64
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
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

    fun chunkBytes(audioBytes: ByteArray, filename: String, mimeType: String): List<AudioChunkPacket> {
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

            packets.add(AudioChunkPacket(sessionId, index, totalChunks, filename, mimeType, chunkCrc, fileCrc32, base64Payload))
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
`,
  },
  {
    path: 'app/src/main/java/com/qraudiostream/app/protocol/AudioReconstructor.kt',
    name: 'AudioReconstructor.kt',
    language: 'kotlin',
    content: `package com.qraudiostream.app.protocol

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
        if (activeSessionId != packet.sessionId) {
            activeSessionId = packet.sessionId
            totalChunks = packet.totalChunks
            filename = packet.filename
            mimeType = packet.mimeType
            expectedFileCrc32 = packet.fileCrc32
            chunksMap.clear()
            duplicateCount = 0
        }

        if (packet.chunkIndex < 0 || packet.chunkIndex >= packet.totalChunks) {
            return ReconstructResult.Error("Invalid chunk index: \${packet.chunkIndex} of \${packet.totalChunks}")
        }

        if (chunksMap.containsKey(packet.chunkIndex)) {
            duplicateCount++
            return ReconstructResult.Progress(calculateProgress())
        }

        chunksMap[packet.chunkIndex] = packet.getPayloadBytes()

        if (chunksMap.size == totalChunks && totalChunks > 0) {
            val audioBytes = assembleBytes()
            if (expectedFileCrc32 != 0L) {
                val actualCrc = AudioChunkPacket.calculateCrc32(audioBytes)
                if (actualCrc != expectedFileCrc32) {
                    return ReconstructResult.Error("Total file CRC32 mismatch")
                }
            }

            val outputDir = File(context.cacheDir, "received_audio")
            if (!outputDir.exists()) outputDir.mkdirs()
            val outputFile = File(outputDir, "\${System.currentTimeMillis()}_\${filename}")

            FileOutputStream(outputFile).use { it.write(audioBytes) }
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
            if (!chunksMap.containsKey(i)) missing.add(i)
        }
        val fraction = if (totalChunks > 0) chunksMap.size.toFloat() / totalChunks else 0f
        return ReconstructProgress(activeSessionId ?: "", chunksMap.size, totalChunks, duplicateCount, missing, fraction, filename)
    }
}
`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    content: `# QRAudioStream (Native Android)
Air-gapped audio transfer between 2 Android phones via animated QR codes.
Built with Kotlin, Jetpack Compose, CameraX, Google ML Kit, and Media3 ExoPlayer.
Run with ./gradlew assembleDebug or open in Android Studio.
`,
  },
];

export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();

  for (const file of ANDROID_PROJECT_FILES) {
    zip.file(file.path, file.content);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'QRAudioStream-Android-Kotlin-Project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
