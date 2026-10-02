import { AudioChunkPacket, ReconstructProgress, ReconstructComplete } from '../types/protocol';
import { calculateCrc32 } from './crc32';
import { base64ToUint8Array } from './audioChunker';

export type ReconstructEvent =
  | { type: 'PROGRESS'; progress: ReconstructProgress }
  | { type: 'COMPLETE'; result: ReconstructComplete }
  | { type: 'ERROR'; message: string };

export class AudioReconstructorWeb {
  private activeSessionId: string | null = null;
  private totalChunks: number = 0;
  private filename: string = 'received_audio.wav';
  private mimeType: string = 'audio/wav';
  private expectedFileCrc32: number = 0;
  private chunksMap: Map<number, Uint8Array> = new Map();
  private duplicateFrames: number = 0;
  private lastReceivedIndex: number | null = null;

  public reset() {
    this.activeSessionId = null;
    this.totalChunks = 0;
    this.chunksMap.clear();
    this.duplicateFrames = 0;
    this.lastReceivedIndex = null;
  }

  public getSessionId(): string | null {
    return this.activeSessionId;
  }

  public handlePacket(packet: AudioChunkPacket): ReconstructEvent {
    // Session change check
    if (this.activeSessionId !== packet.s) {
      this.activeSessionId = packet.s;
      this.totalChunks = packet.t;
      this.filename = packet.n || 'received_audio.wav';
      this.mimeType = packet.m || 'audio/wav';
      this.expectedFileCrc32 = packet.fc || 0;
      this.chunksMap.clear();
      this.duplicateFrames = 0;
    }

    // Packet bounds validation
    if (packet.i < 0 || packet.i >= packet.t) {
      return { type: 'ERROR', message: `Invalid chunk index: ${packet.i} of ${packet.t}` };
    }

    // Duplicate detection
    if (this.chunksMap.has(packet.i)) {
      this.duplicateFrames++;
      return {
        type: 'PROGRESS',
        progress: this.calculateProgress(),
      };
    }

    // Decode and verify chunk CRC32
    let payloadBytes: Uint8Array;
    try {
      payloadBytes = base64ToUint8Array(packet.d);
    } catch {
      return { type: 'ERROR', message: `Base64 decoding failed for chunk ${packet.i}` };
    }

    const calculatedChunkCrc = calculateCrc32(payloadBytes);
    if (calculatedChunkCrc !== packet.c) {
      return {
        type: 'ERROR',
        message: `CRC32 mismatch on chunk ${packet.i}. Expected ${packet.c}, got ${calculatedChunkCrc}`,
      };
    }

    // Store verified chunk
    this.chunksMap.set(packet.i, payloadBytes);
    this.lastReceivedIndex = packet.i;

    // Check if transfer complete
    if (this.totalChunks > 0 && this.chunksMap.size === this.totalChunks) {
      // Assemble full file bytes
      let totalLength = 0;
      for (let i = 0; i < this.totalChunks; i++) {
        const chunk = this.chunksMap.get(i);
        if (!chunk) {
          return { type: 'PROGRESS', progress: this.calculateProgress() };
        }
        totalLength += chunk.length;
      }

      const fullBytes = new Uint8Array(totalLength);
      let offset = 0;
      for (let i = 0; i < this.totalChunks; i++) {
        const chunk = this.chunksMap.get(i)!;
        fullBytes.set(chunk, offset);
        offset += chunk.length;
      }

      // Verify overall file CRC32
      const fullCrc = calculateCrc32(fullBytes);
      if (this.expectedFileCrc32 !== 0 && fullCrc !== this.expectedFileCrc32) {
        return {
          type: 'ERROR',
          message: `Total audio file checksum mismatch! Reconstructed CRC ${fullCrc} vs Expected ${this.expectedFileCrc32}`,
        };
      }

      const blob = new Blob([fullBytes], { type: this.mimeType });
      const blobUrl = URL.createObjectURL(blob);

      return {
        type: 'COMPLETE',
        result: {
          blob,
          blobUrl,
          filename: this.filename,
          mimeType: this.mimeType,
          sizeBytes: totalLength,
          fileCrc32: fullCrc,
        },
      };
    }

    return {
      type: 'PROGRESS',
      progress: this.calculateProgress(),
    };
  }

  public calculateProgress(): ReconstructProgress {
    const missing: number[] = [];
    let bytesReceived = 0;

    for (let i = 0; i < this.totalChunks; i++) {
      const chunk = this.chunksMap.get(i);
      if (!chunk) {
        missing.push(i);
      } else {
        bytesReceived += chunk.length;
      }
    }

    const fraction = this.totalChunks > 0 ? this.chunksMap.size / this.totalChunks : 0;

    return {
      sessionId: this.activeSessionId || '',
      filename: this.filename,
      mimeType: this.mimeType,
      receivedCount: this.chunksMap.size,
      totalChunks: this.totalChunks,
      duplicateFrames: this.duplicateFrames,
      missingChunks: missing,
      progressFraction: fraction,
      bytesReceived,
      lastReceivedIndex: this.lastReceivedIndex,
    };
  }

  public isChunkReceived(index: number): boolean {
    return this.chunksMap.has(index);
  }
}
