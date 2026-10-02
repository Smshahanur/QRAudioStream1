import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Download,
  Share2,
  RefreshCw,
  Volume2,
  SwitchCamera,
  Layers,
  Sparkles,
  Flashlight,
  FlashlightOff,
} from 'lucide-react';
import { AudioChunkPacket, ReconstructProgress, ReconstructComplete, StreamSettings } from '../types/protocol';
import { AudioReconstructorWeb } from '../utils/audioReconstructor';
import { formatHexChecksum } from '../utils/crc32';
import { playTickSound, playSuccessSound } from '../utils/soundEffects';
import { addHistoryRecord } from '../utils/storage';

interface ReceiveAudioScreenProps {
  onBack: () => void;
  settings: StreamSettings;
  incomingSimulatedPackets?: AudioChunkPacket[] | null;
  onClearSimulated?: () => void;
}

export const ReceiveAudioScreen: React.FC<ReceiveAudioScreenProps> = ({
  onBack,
  settings,
  incomingSimulatedPackets,
  onClearSimulated,
}) => {
  // Camera & Stream Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  // Scanning State
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [lastScannedFrameTime, setLastScannedFrameTime] = useState<number>(0);
  const [torchAvailable, setTorchAvailable] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);

  // Reconstruction & Protocol State
  const reconstructorRef = useRef<AudioReconstructorWeb>(new AudioReconstructorWeb());
  const [progress, setProgress] = useState<ReconstructProgress | null>(null);
  const [completedAudio, setCompletedAudio] = useState<ReconstructComplete | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Playback State
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      setTorchOn(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      // Check if torch is supported on this track
      const track = stream.getVideoTracks()[0];
      if (track) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = (track.getCapabilities?.() || {}) as any;
        setTorchAvailable(Boolean(capabilities && capabilities.torch));
      } else {
        setTorchAvailable(false);
      }

      setHasCameraPermission(true);
      setErrorMessage(null);
    } catch (err: unknown) {
      console.warn('Camera access failed or unavailable:', err);
      setHasCameraPermission(false);
      setErrorMessage('Camera access was denied or is not supported in this browser.');
    }
  }, [cameraFacing]);

  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const next = !torchOn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ torch: next }],
        });
        setTorchOn(next);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
    };
  }, [startCamera]);

  // Handle incoming packet
  const handleIngestPacket = useCallback(
    (packet: AudioChunkPacket) => {
      const reconstructor = reconstructorRef.current;
      const res = reconstructor.handlePacket(packet);

      if (res.type === 'PROGRESS') {
        setProgress(res.progress);
        setLastScannedFrameTime(Date.now());
        if (settings.soundFeedback) {
          playTickSound();
        }
      } else if (res.type === 'COMPLETE') {
        setCompletedAudio(res.result);
        setProgress(reconstructor.calculateProgress());
        setIsScanning(false);

        // Sound & celebratory effect
        if (settings.soundFeedback) {
          playSuccessSound();
        }
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00F0FF', '#3B82F6', '#10B981'],
          });
        } catch {
          // Ignore
        }

        // Add to history
        addHistoryRecord({
          id: `recv-${Date.now()}`,
          filename: res.result.filename,
          type: 'RECEIVED',
          sizeBytes: res.result.sizeBytes,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          checksum: formatHexChecksum(res.result.fileCrc32),
          blobUrl: res.result.blobUrl,
          mimeType: res.result.mimeType,
        });
      } else if (res.type === 'ERROR') {
        setErrorMessage(res.message);
      }
    },
    [settings.soundFeedback]
  );

  // Real-time video frame scanning loop
  useEffect(() => {
    if (!isScanning || completedAudio) return;

    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let barcodeDetector: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BarcodeDetectorClass = typeof window !== 'undefined' ? (window as any).BarcodeDetector : null;
    if (BarcodeDetectorClass) {
      try {
        barcodeDetector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      } catch {
        barcodeDetector = null;
      }
    }

    const scanFrame = async () => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = hiddenCanvasRef.current;

      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        let detected = false;

        // 1. Try Hardware-Accelerated BarcodeDetector (Chrome Android / modern browsers)
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              for (const bc of barcodes) {
                if (bc.rawValue) {
                  try {
                    const parsed = JSON.parse(bc.rawValue);
                    if (parsed && parsed.s && parsed.d && parsed.c !== undefined) {
                      handleIngestPacket(parsed as AudioChunkPacket);
                      detected = true;
                    }
                  } catch {
                    // Not a QRAudioStream frame
                  }
                }
              }
            }
          } catch {
            // Hardware detector busy or threw, proceed to jsQR
          }
        }

        // 2. High-Precision Software jsQR fallback
        if (!detected) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
              try {
                const parsed = JSON.parse(code.data);
                if (parsed && parsed.s && parsed.d && parsed.c !== undefined) {
                  handleIngestPacket(parsed as AudioChunkPacket);
                }
              } catch {
                // Not a valid QRAudioStream frame, ignore silently
              }
            }
          }
        }
      }

      if (active) {
        scanLoopRef.current = requestAnimationFrame(scanFrame);
      }
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);

    return () => {
      active = false;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    };
  }, [isScanning, completedAudio, handleIngestPacket]);

  // Virtual In-Browser Simulation Handler
  useEffect(() => {
    if (incomingSimulatedPackets && incomingSimulatedPackets.length > 0) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < incomingSimulatedPackets.length) {
          handleIngestPacket(incomingSimulatedPackets[index]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 90);

      return () => clearInterval(interval);
    }
  }, [incomingSimulatedPackets, handleIngestPacket]);

  // Reset transfer to scan new audio
  const handleReset = () => {
    reconstructorRef.current.reset();
    setProgress(null);
    setCompletedAudio(null);
    setErrorMessage(null);
    setIsScanning(true);
    if (onClearSimulated) onClearSimulated();
  };

  // Flip camera
  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Audio download
  const handleDownload = () => {
    if (!completedAudio) return;
    const a = document.createElement('a');
    a.href = completedAudio.blobUrl;
    a.download = completedAudio.filename || 'received_audio.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Share
  const handleShare = async () => {
    if (!completedAudio) return;
    try {
      const file = new File([completedAudio.blob], completedAudio.filename, {
        type: completedAudio.mimeType,
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: completedAudio.filename,
          text: 'Audio received offline via QRAudioStream',
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-4 max-w-lg mx-auto">
      {/* Hidden processing canvas */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

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
          <span>Receive Audio Stream</span>
        </h2>

        <div className="flex items-center gap-2">
          {torchAvailable && (
            <button
              onClick={handleToggleTorch}
              className={`p-1.5 rounded-lg border transition-colors ${
                torchOn
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-[#0F1A2E] hover:bg-[#13223D] border-slate-700 text-slate-400'
              }`}
              title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
            >
              {torchOn ? (
                <Flashlight className="w-4 h-4 text-amber-400" />
              ) : (
                <FlashlightOff className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            onClick={handleFlipCamera}
            className="p-1.5 rounded-lg bg-[#0F1A2E] hover:bg-[#13223D] border border-slate-700 text-slate-300 transition-colors"
            title="Switch front/rear camera"
          >
            <SwitchCamera className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Main Viewport: Camera Scanner OR Completed Player */}
      {!completedAudio ? (
        <div className="w-full flex flex-col items-center">
          {/* Camera Viewfinder Box */}
          <div className="relative w-full aspect-[4/3] max-h-[340px] rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/50 shadow-2xl flex items-center justify-center">
            {hasCameraPermission === false ? (
              <div className="p-6 text-center">
                <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-rose-400 font-semibold mb-2">{errorMessage}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070D18] text-xs font-bold transition-colors"
                >
                  Grant Camera Permission
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Cyber Targeting Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-56 h-56 rounded-2xl border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                    {/* Corner Brackets */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-cyan-400"></div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-cyan-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-cyan-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-cyan-400"></div>

                    {/* Laser Scanline Beam */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#00f0ff] animate-bounce"></div>
                  </div>
                </div>

                {/* Real-time frame detector indicator */}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-[11px] text-cyan-300 font-mono">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      Date.now() - lastScannedFrameTime < 400
                        ? 'bg-cyan-400 animate-ping'
                        : 'bg-slate-500'
                    }`}
                  ></span>
                  <span>
                    {progress?.sessionId
                      ? `Session: ${progress.sessionId}`
                      : 'Align with Sender QR'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Real-time Progress & Chunk Grid Card */}
          <div className="w-full mt-4 rounded-2xl bg-[#0F1A2E] border border-cyan-500/30 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reconstruction Progress</span>
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {progress ? `${progress.receivedCount} / ${progress.totalChunks} Chunks` : '0 / 0'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#13223D] h-2.5 rounded-full overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-150"
                style={{
                  width: `${(progress?.progressFraction || 0) * 100}%`,
                }}
              ></div>
            </div>

            {/* Chunk Matrix Grid Visualizer */}
            {progress && progress.totalChunks > 0 && (
              <div className="w-full mt-2 mb-3">
                <div className="text-[11px] text-slate-400 mb-1.5 flex justify-between">
                  <span>Packet Reception Matrix:</span>
                  <span>{Math.round((progress.progressFraction || 0) * 100)}%</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-[#091120] rounded-xl border border-slate-800">
                  {Array.from({ length: progress.totalChunks }).map((_, idx) => {
                    const isReceived = reconstructorRef.current.isChunkReceived(idx);
                    const isLast = progress.lastReceivedIndex === idx;
                    return (
                      <div
                        key={idx}
                        title={`Chunk #${idx + 1}`}
                        className={`w-3.5 h-3.5 rounded-[3px] text-[8px] flex items-center justify-center font-mono transition-all ${
                          isLast
                            ? 'bg-cyan-300 text-black scale-110 shadow-[0_0_6px_#00F0FF]'
                            : isReceived
                            ? 'bg-cyan-500/80 text-white'
                            : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Duplicate & Missing Frames Counter */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#091120]">
                <span className="text-slate-400">Duplicate Frames:</span>
                <span className="font-mono font-bold text-slate-300">
                  {progress?.duplicateFrames || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#091120]">
                <span className="text-slate-400">Missing Frames:</span>
                <span
                  className={`font-mono font-bold ${
                    (progress?.missingChunks.length || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {progress?.missingChunks.length ?? '---'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Transfer Complete Card & Media Playback View */
        <div className="w-full rounded-2xl bg-gradient-to-b from-[#0F1A2E] to-[#070D18] border-2 border-emerald-500/50 p-6 flex flex-col items-center shadow-2xl animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>

          <h3 className="text-lg font-bold text-slate-100 text-center">
            Audio Transfer Verified & Complete!
          </h3>
          <p className="text-xs text-slate-400 text-center mt-1">
            Reconstructed from {progress?.totalChunks} optical frames with 100% bit-exact CRC32 verification.
          </p>

          {/* File Metadata Box */}
          <div className="w-full mt-5 p-3.5 rounded-xl bg-[#0B1526] border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">File Name:</span>
              <span className="text-cyan-300 font-sans font-semibold truncate max-w-[200px]">
                {completedAudio.filename}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Size:</span>
              <span className="text-slate-200">
                {(completedAudio.sizeBytes / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CRC-32 Checksum:</span>
              <span className="text-emerald-400 font-bold">
                {formatHexChecksum(completedAudio.fileCrc32)} (Verified)
              </span>
            </div>
          </div>

          {/* Audio Player Controls */}
          <div className="w-full mt-6 p-4 rounded-xl bg-[#0F1A2E] border border-cyan-500/30 flex flex-col items-center">
            <audio
              ref={audioPlayerRef}
              src={completedAudio.blobUrl}
              onTimeUpdate={() => {
                if (audioPlayerRef.current) {
                  setAudioCurrentTime(audioPlayerRef.current.currentTime);
                  setAudioDuration(audioPlayerRef.current.duration || 0);
                }
              }}
              onLoadedMetadata={() => {
                if (audioPlayerRef.current) {
                  setAudioDuration(audioPlayerRef.current.duration || 0);
                }
              }}
              onEnded={() => setIsPlayingAudio(false)}
            />

            {/* Play/Pause Button */}
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={() => {
                  if (audioPlayerRef.current) {
                    if (isPlayingAudio) {
                      audioPlayerRef.current.pause();
                      setIsPlayingAudio(false);
                    } else {
                      audioPlayerRef.current.play();
                      setIsPlayingAudio(true);
                    }
                  }
                }}
                className="w-14 h-14 rounded-full bg-cyan-400 hover:bg-cyan-300 text-[#070D18] flex items-center justify-center shadow-lg shadow-cyan-400/25 active:scale-95 transition-transform"
              >
                {isPlayingAudio ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                )}
              </button>
            </div>

            {/* Progress Slider */}
            <div className="w-full">
              <input
                type="range"
                min={0}
                max={audioDuration || 1}
                step={0.05}
                value={audioCurrentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setAudioCurrentTime(newTime);
                  if (audioPlayerRef.current) {
                    audioPlayerRef.current.currentTime = newTime;
                  }
                }}
                className="w-full accent-cyan-400 h-1.5 bg-[#13223D] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>{audioCurrentTime.toFixed(1)}s</span>
                <span>{audioDuration ? `${audioDuration.toFixed(1)}s` : '--'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Save & Share */}
          <div className="w-full mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070D18] font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Save Audio File</span>
            </button>

            <button
              onClick={handleShare}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Share File</span>
            </button>
          </div>

          {/* Scan Another Button */}
          <button
            onClick={handleReset}
            className="w-full mt-3 py-2 rounded-xl bg-[#0F1A2E] hover:bg-[#13223D] border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Scan Another Audio Stream</span>
          </button>
        </div>
      )}

      {/* Optical Alignment Tips */}
      {!completedAudio && (
        <div className="w-full mt-4 p-3.5 rounded-xl bg-[#0B1526] border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scanning Hints for Receiver</span>
          </div>
          <p>• Hold Phone 2 steady ~15–20cm (6–8 in) away from Phone 1.</p>
          <p>• Ensure both camera lens and sender screen are clean of smudges.</p>
          <p>• Frames loop automatically, so any missed chunk will be captured on the next cycle.</p>
        </div>
      )}
    </div>
  );
};
