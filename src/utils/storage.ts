import { TransferRecord, StreamSettings } from '../types/protocol';

const HISTORY_KEY = 'qr_audio_stream_history';
const SETTINGS_KEY = 'qr_audio_stream_settings';

export const DEFAULT_SETTINGS: StreamSettings = {
  defaultFps: 10,
  chunkSizeBytes: 380,
  errorCorrection: 'M',
  highContrast: true,
  soundFeedback: true,
};

export function loadSettings(): StreamSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore and fallback
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: StreamSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage quota or disabled
  }
}

export function loadHistory(): TransferRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  // Default seeded history record so the history screen is demonstrative
  return [
    {
      id: 'demo-1',
      filename: 'tactical_voice_brief.wav',
      type: 'RECEIVED',
      sizeBytes: 38400,
      timestamp: 'Today, 20:10',
      checksum: '8E4C19A0',
      mimeType: 'audio/wav',
      duration: 2.4,
    },
    {
      id: 'demo-2',
      filename: 'synth_melodic_chime.wav',
      type: 'SENT',
      sizeBytes: 52100,
      timestamp: 'Today, 19:45',
      checksum: '3B99D0F1',
      mimeType: 'audio/wav',
      duration: 3.2,
    },
  ];
}

export function addHistoryRecord(record: TransferRecord): void {
  try {
    const current = loadHistory();
    const updated = [record, ...current.filter((r) => r.id !== record.id)].slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Storage quota
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore
  }
}
