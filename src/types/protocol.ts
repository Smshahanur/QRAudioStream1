export interface AudioChunkPacket {
  s: string;        // Session ID
  i: number;        // Chunk index (0-based)
  t: number;        // Total chunks
  n: string;        // Filename
  m: string;        // MIME type (e.g. audio/wav, audio/mp4)
  c: number;        // CRC32 checksum of this chunk's payload
  fc: number;       // Whole file CRC32 checksum
  d: string;        // Base64 chunk audio bytes
}

export interface ReconstructProgress {
  sessionId: string;
  filename: string;
  mimeType: string;
  receivedCount: number;
  totalChunks: number;
  duplicateFrames: number;
  missingChunks: number[];
  progressFraction: number;
  bytesReceived: number;
  lastReceivedIndex: number | null;
}

export interface ReconstructComplete {
  blob: Blob;
  blobUrl: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  fileCrc32: number;
}

export interface TransferRecord {
  id: string;
  filename: string;
  type: 'SENT' | 'RECEIVED';
  sizeBytes: number;
  timestamp: string;
  checksum: string;
  blobUrl?: string;
  mimeType?: string;
  duration?: number;
}

export interface StreamSettings {
  defaultFps: number;
  chunkSizeBytes: number;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  highContrast: boolean;
  soundFeedback: boolean;
}
