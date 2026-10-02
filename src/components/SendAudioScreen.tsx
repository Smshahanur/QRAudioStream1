import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Upload,
  Mic,
  Square,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Music,
  FileAudio,
  Hash,
  Activity,
  Sliders,
} from 'lucide-react';
import { AudioChunkPacket, StreamSettings } from '../types/protocol';
import { chunkAudioBlob, generateTestAudioWav } from '../utils/audioChunker';
import { VoiceRecorder } from '../utils/voiceRecorder';
import { formatHexChecksum } from '../utils/crc32';
import { addHistoryRecord } from '../utils/storage';

interface SendAudioScreenProps {
  onBack: () => void;
  settings: StreamSettings;
  onDirectSimulateReceive?: (packets: AudioChunkPacket[]) => void;
}

export const SendAudioScreen: React.FC<SendAudioScreenProps> = ({
  onBack,
  settings,
  onDirectSimulateReceive,
}) => {
  const [audioSource, setAudioSource] = useState<{
    blob: Blob;
    filename: string;
    mimeType: string;
    url: string;
    duration?: number;
  } | null>(null);

  const [packets, setPackets] = useState<AudioChunkPacket[]>([]);
  const [fileCrc32, setFileCrc32] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [fps, setFps] = useState<number>(settings.defaultFps || 10);
  const [chunkSize, setChunkSize] = useState<number>(settings.chunkSizeBytes || 380);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  // Canvas Ref for QR Rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animTimeoutRef = useRef<number | null>(null);

  // Preview Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Process and chunk audio blob
  const processAudioBlob = useCallback(
    async (blob: Blob, filename: string, mimeType: string) => {
      try {
        const url = URL.createObjectURL(blob);
        setAudioSource({ blob, filename, mimeType, url });

        const result = await chunkAudioBlob(blob, filename, mimeType, chunkSize);
        setPackets(result.packets);
        setFileCrc32(result.fileCrc32);
        setTotalBytes(result.totalBytes);
        setCurrentFrameIndex(0);
        setIsStreaming(true);

        // Add to history
        addHistoryRecord({
          id: `sent-${Date.now()}`,
          filename,
          type: 'SENT',
          sizeBytes: result.totalBytes,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          checksum: formatHexChecksum(result.fileCrc32),
          blobUrl: url,
          mimeType,
        });
      } catch (err) {
        console.error('Failed to chunk audio:', err);
      }
    },
    [chunkSize]
  );

  // Load preset demo audio
  const handleLoadDemo = async (type: 'voice' | 'synth') => {
    const filename = type === 'voice' ? 'voice_mission_brief.wav' : 'synth_arpeggio.wav';
    const blob = generateTestAudioWav(type, type === 'voice' ? 2.5 : 2.0);
    await processAudioBlob(blob, filename, 'audio/wav');
  };

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAudioBlob(file, file.name, file.type || 'audio/wav');
    }
  };

  // Microphone recording
  const handleStartRecord = async () => {
    try {
      const rec = new VoiceRecorder();
      recorderRef.current = rec;
      await rec.startRecording();
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or not available.');
      console.error(err);
    }
  };

  const handleStopRecord = async () => {
    if (!recorderRef.current) return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);

    try {
      const { blob, durationSec, mimeType } = await recorderRef.current.stopRecording();
      setIsRecording(false);
      const filename = `voice_note_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.webm`;
      await processAudioBlob(blob, filename, mimeType);
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  // Render current frame to Canvas
  useEffect(() => {
    if (packets.length === 0 || !canvasRef.current) return;

    const packet = packets[currentFrameIndex];
    if (!packet) return;

    const rawData = JSON.stringify(packet);

    QRCode.toCanvas(canvasRef.current, rawData, {
      width: 290,
      margin: 1,
      errorCorrectionLevel: settings.errorCorrection || 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }).catch((err) => {
      console.error('QR Render error:', err);
    });
  }, [packets, currentFrameIndex, settings.errorCorrection]);

  // High-frequency animation loop
  useEffect(() => {
    if (!isStreaming || packets.length === 0) return;

    const intervalMs = Math.max(40, Math.floor(1000 / fps));

    const nextFrame = () => {
      setCurrentFrameIndex((prev) => {
        if (prev + 1 >= packets.length) {
          return isLooping ? 0 : prev;
        }
        return prev + 1;
      });
      animTimeoutRef.current = window.setTimeout(nextFrame, intervalMs);
    };

    animTimeoutRef.current = window.setTimeout(nextFrame, intervalMs);

    return () => {
      if (animTimeoutRef.current) {
        clearTimeout(animTimeoutRef.current);
      }
    };
  }, [isStreaming, packets.length, fps, isLooping]);

  const currentPacket = packets[currentFrameIndex];

  return (
    <div className="w-full flex flex-col items-center py-4 px-4 max-w-lg mx-auto">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1A2E] hover:bg-[#13223D] border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Back</span>
        </button>

        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <span>Send Audio Stream</span>
        </h2>

        <div className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
          Air-Gapped
        </div>
      </div>

      {/* Input Selection Options Card */}
      <div className="w-full rounded-2xl bg-[#0F1A2E] border border-cyan-500/25 p-4 mb-4 shadow-lg shadow-cyan-500/5">
        <h3 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
          <FileAudio className="w-4 h-4 text-cyan-400" />
          <span>Select or Record Audio</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3.5">
          Pick an audio track, capture a live voice note, or load an instant offline demo tone.
        </p>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* File Picker */}
          <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#13223D] hover:bg-[#1A2E50] border border-cyan-500/30 text-cyan-300 font-semibold text-xs cursor-pointer transition-all active:scale-95 text-center">
            <Upload className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Upload Audio</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Voice Note Recorder */}
          {isRecording ? (
            <button
              onClick={handleStopRecord}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop ({recordSeconds}s)</span>
            </button>
          ) : (
            <button
              onClick={handleStartRecord}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#13223D] hover:bg-[#1A2E50] border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-all active:scale-95"
            >
              <Mic className="w-4 h-4 text-cyan-400" />
              <span>Record Voice</span>
            </button>
          )}
        </div>

        {/* 1-Click Offline Presets */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant Demos:</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleLoadDemo('voice')}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-medium text-[11px] transition-colors"
            >
              Voice Note (2.5s)
            </button>
            <button
              onClick={() => handleLoadDemo('synth')}
              className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-300 font-medium text-[11px] transition-colors"
            >
              Synth Loop (2.0s)
            </button>
          </div>
        </div>
      </div>

      {/* Selected Audio Info & Audio Preview */}
      {audioSource && (
        <div className="w-full rounded-xl bg-[#091120] border border-slate-800 p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {audioSource.filename}
              </p>
              <p className="text-[10px] text-slate-400">
                {(totalBytes / 1024).toFixed(1)} KB · {packets.length} QR Frames · CRC: {formatHexChecksum(fileCrc32)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <audio
              ref={audioPreviewRef}
              src={audioSource.url}
              onEnded={() => setIsPlayingAudio(false)}
              className="hidden"
            />
            <button
              onClick={() => {
                if (audioPreviewRef.current) {
                  if (isPlayingAudio) {
                    audioPreviewRef.current.pause();
                    setIsPlayingAudio(false);
                  } else {
                    audioPreviewRef.current.play();
                    setIsPlayingAudio(true);
                  }
                }
              }}
              className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors"
              title="Preview selected audio"
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Animated QR Transmission Stage */}
      {packets.length > 0 && (
        <div className="w-full rounded-2xl bg-[#0F1A2E] border border-cyan-500/30 p-4 flex flex-col items-center shadow-2xl">
          {/* Header Status Bar */}
          <div className="w-full flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="font-mono text-cyan-400 font-bold">
                Session: {currentPacket?.s || '---'}
              </span>
            </div>

            <div className="text-slate-300 font-mono font-semibold">
              Frame <span className="text-cyan-400">{currentFrameIndex + 1}</span> of{' '}
              <span className="text-slate-100">{packets.length}</span>
            </div>
          </div>

          {/* High-Contrast Canvas Viewport */}
          <div className="relative p-3 rounded-2xl bg-white shadow-xl flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={290}
              height={290}
              className="w-[280px] h-[280px] sm:w-[290px] sm:h-[290px] block"
            />
            {/* Corner alignment markers */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-500"></div>
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-500"></div>
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-500"></div>
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-500"></div>
          </div>

          {/* Interactive Frame Scrubber & Progress */}
          <div className="w-full mt-4">
            <input
              type="range"
              min={0}
              max={Math.max(0, packets.length - 1)}
              step={1}
              value={currentFrameIndex}
              onChange={(e) => {
                const targetIndex = parseInt(e.target.value, 10);
                setCurrentFrameIndex(targetIndex);
              }}
              className="w-full accent-cyan-400 h-2 bg-[#13223D] rounded-lg cursor-pointer"
              title="Scrub to specific frame"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1.5">
              <span>Chunk {currentFrameIndex + 1}/{packets.length} ({chunkSize}B)</span>
              <span>Frame CRC: {currentPacket ? formatHexChecksum(currentPacket.c) : '---'}</span>
              <span className="text-cyan-400 font-bold">{Math.round(((currentFrameIndex + 1) / packets.length) * 100)}%</span>
            </div>
          </div>

          {/* Playback & Transmission Controls */}
          <div className="w-full mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setCurrentFrameIndex((prev) => (prev > 0 ? prev - 1 : packets.length - 1));
              }}
              className="p-2.5 rounded-xl bg-[#13223D] hover:bg-[#1A2E50] text-slate-200 transition-colors"
              title="Previous frame"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#070D18] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 transition-all active:scale-98"
            >
              {isStreaming ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Stream</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentFrameIndex((prev) => (prev + 1) % packets.length);
              }}
              className="p-2.5 rounded-xl bg-[#13223D] hover:bg-[#1A2E50] text-slate-200 transition-colors"
              title="Next frame"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-2.5 rounded-xl transition-colors ${
                isLooping
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-[#13223D] text-slate-400'
              }`}
              title={isLooping ? 'Continuous loop active' : 'Single cycle'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed & Tuning Slider */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Stream Speed</span>
              </span>
              <span className="font-mono font-bold text-cyan-400">{fps} FPS</span>
            </div>
            <input
              type="range"
              min={4}
              max={22}
              step={1}
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 h-1.5 bg-[#13223D] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>4 FPS (Deep Focus)</span>
              <span>10–12 FPS (Optimal)</span>
              <span>22 FPS (High-Speed)</span>
            </div>
          </div>

          {/* Single-Device Virtual Receiver Loopback Shortcut */}
          {onDirectSimulateReceive && (
            <div className="w-full mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => onDirectSimulateReceive(packets)}
                className="w-full py-2 px-3 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Test in In-App Receiver (Single-Device Mode)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Optical Alignment Guide Box */}
      <div className="w-full mt-4 p-3.5 rounded-xl bg-[#0B1526] border border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-cyan-400" />
          <span>Transmission Instructions for Phone 2</span>
        </div>
        <p>1. Open QRAudioStream on Phone 2 and tap <strong>Receive Audio</strong>.</p>
        <p>2. Point Phone 2’s camera at this screen from ~15–20cm away.</p>
        <p>3. Maximize Phone 1 display brightness for optimal camera shutter locking.</p>
      </div>
    </div>
  );
};
