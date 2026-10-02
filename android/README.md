# QRAudioStream (Native Android - Kotlin & Jetpack Compose)

Offline audio and voice transfer between two Android phones using animated QR optical streaming.

---

## Architecture & Technology Stack

- **Platform**: Native Android (Kotlin, Min SDK 26, Target SDK 35)
- **UI Framework**: Jetpack Compose with Material 3 Dark Futuristic Theme
- **Optical Receiver**: Android CameraX + Google ML Kit Barcode Scanning
- **Optical Transmitter**: ZXing QR Code Generation with adaptive frame timing
- **Media Playback**: Android Media3 ExoPlayer
- **Concurrency**: Kotlin Coroutines & Flows
- **Protocol**: Chunked binary packet protocol with per-frame CRC32 and whole-file checksum verification
- **Network**: **0% (100% Air-Gapped)**. No Internet, no Wi-Fi, no Bluetooth, no Firebase.

---

## Build & Run Instructions

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or Ladybug (2024.2.1+)
- JDK 17
- Android SDK Platform 35
- Two physical Android phones (Android 8.0 / API 26 or newer) with working cameras

### Option A: Open in Android Studio
1. Launch Android Studio.
2. Choose **Open** and select the `/android` directory.
3. Allow Gradle to sync dependencies (`libs.versions.toml`).
4. Connect Phone 1 via USB and click **Run** (Green Play button).
5. Connect Phone 2 via USB and click **Run**.

### Option B: Build APK via Terminal / Gradle CLI
```bash
cd android
./gradlew assembleDebug
```
The compiled APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

Install to connected devices using ADB:
```bash
adb -s <DEVICE_1_ID> install -r app/build/outputs/apk/debug/app-debug.apk
adb -s <DEVICE_2_ID> install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## Two Physical Android Phones Testing Guide

### 1. Preparation
- On **Phone 1 (Sender)**:
  - Turn display brightness up to 80–100% for high contrast.
  - Open **QRAudioStream** and tap **Send Audio**.
  - Tap **Browse Audio** or **Demo Audio** (or record a voice note).
  - You will see the animated QR code cycling through the chunk packets.
  - Set streaming speed to **10–12 FPS** (optimal for standard 60Hz cameras).

- On **Phone 2 (Receiver)**:
  - Open **QRAudioStream** and tap **Receive Audio**.
  - Grant Camera permission when prompted.
  - The live camera viewfinder with the reticle will appear.

### 2. Optical Transmission
1. Hold **Phone 2 (Receiver)** facing **Phone 1 (Sender)** at a distance of **15 to 25 cm (6 to 10 inches)**.
2. Center the cycling QR code inside the viewfinder target reticle.
3. Watch the real-time progress indicators:
   - Chunk progress bar fills in real time.
   - Missing chunks and duplicate frames counters update dynamically.
   - Even if the camera misses a frame, the sender loops continuously until all chunks are collected!

### 3. Verification & Playback
1. Once all chunks (e.g., 12/12) are received, the reconstructor performs an automatic **CRC32 integrity verification** against the sender's original file hash.
2. An instant **Success Verification** badge appears.
3. Tap **Play** to listen to the received audio crystal clear via Android Media3 ExoPlayer.
4. Tap **Share File** to send it to WhatsApp, Files, Drive, or any other app on Phone 2.

---

## Air-Gapped Protocol Specification

Each frame encodes an `AudioChunkPacket`:
```json
{
  "s": "b4e8",          // Session ID (isolates distinct transfers)
  "i": 3,               // Chunk Index (0 to total-1)
  "t": 14,              // Total chunks
  "n": "voice_note.m4a",// Original filename
  "m": "audio/mp4",     // MIME type
  "c": 2849102482,      // CRC32 of this chunk's raw payload
  "fc": 938174921,      // CRC32 of complete audio file
  "d": "<Base64>"       // Raw binary audio slice (350-500 bytes)
}
```
If any chunk's payload CRC32 does not match, it is discarded. Only 100% bit-exact streams are reconstructed.
