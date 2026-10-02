import { AudioChunkPacket } from '../types/protocol';
import { calculateCrc32 } from './crc32';

/**
 * Convert Uint8Array to Base64 in safe chunks to avoid maximum call stack size
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Slice audio file into indexed chunk packets
 */
export async function chunkAudioBlob(
  fileOrBlob: Blob,
  filename: string,
  mimeType: string,
  chunkSizeBytes: number = 400
): Promise<{ packets: AudioChunkPacket[]; fileCrc32: number; totalBytes: number }> {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const fullBytes = new Uint8Array(arrayBuffer);
  const totalBytes = fullBytes.length;
  const fileCrc32 = calculateCrc32(fullBytes);

  const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSizeBytes));
  // 6-character random hex session ID
  const sessionId = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

  const packets: AudioChunkPacket[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSizeBytes;
    const end = Math.min(start + chunkSizeBytes, totalBytes);
    const chunkBytes = fullBytes.subarray(start, end);
    const chunkCrc = calculateCrc32(chunkBytes);
    const payloadBase64 = uint8ArrayToBase64(chunkBytes);

    packets.push({
      s: sessionId,
      i: i,
      t: totalChunks,
      n: filename,
      m: mimeType || 'audio/wav',
      c: chunkCrc,
      fc: fileCrc32,
      d: payloadBase64,
    });
  }

  return { packets, fileCrc32, totalBytes };
}

/**
 * Synthesizes a compact, valid 16-bit PCM WAV audio file directly in the browser
 * for instant one-click transmission testing.
 */
export function generateTestAudioWav(
  type: 'voice' | 'synth' = 'voice',
  durationSec: number = 2.5
): Blob {
  const sampleRate = 16000; // 16kHz mono is crisp and light (~40KB for 2.5s)
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length minus RIFF identifier & length
  view.setUint32(4, 36 + numSamples * 2, true);
  // RIFF type & format chunk identifier
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * 1 channel * 2 bytes/sample)
  view.setUint32(28, sampleRate * 2, true);
  // block align (1 channel * 2 bytes)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, numSamples * 2, true);

  // Synthesize sound wave
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (type === 'voice') {
      // Harmonic voice-like formant chirp
      const pitch = 220 + Math.sin(t * 8) * 35;
      const env = Math.min(1, t * 10) * Math.max(0, 1 - t / durationSec);
      sample = (
        Math.sin(2 * Math.PI * pitch * t) * 0.5 +
        Math.sin(2 * Math.PI * pitch * 2 * t) * 0.25 +
        Math.sin(2 * Math.PI * pitch * 3 * t) * 0.15
      ) * env * 0.7;
    } else {
      // Arpeggiated electronic synth chord
      const noteFreqs = [440, 554.37, 659.25, 880]; // A major
      const currentNote = noteFreqs[Math.floor((t * 6) % noteFreqs.length)];
      const env = Math.min(1, (t % 0.16) * 30) * Math.max(0, 1 - (t % 0.16) / 0.16);
      sample = (
        Math.sin(2 * Math.PI * currentNote * t) * 0.6 +
        (Math.sin(2 * Math.PI * currentNote * 2 * t) > 0 ? 0.2 : -0.2)
      ) * env * 0.6;
    }

    // Clamp and convert to 16-bit signed PCM
    const clamped = Math.max(-1, Math.min(1, sample));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
