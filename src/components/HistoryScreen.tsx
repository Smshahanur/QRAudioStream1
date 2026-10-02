import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Play,
  Pause,
  Download,
  FileAudio,
  Hash,
} from 'lucide-react';
import { TransferRecord } from '../types/protocol';
import { loadHistory, clearHistory } from '../utils/storage';

interface HistoryScreenProps {
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [history, setHistory] = useState<TransferRecord[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleClear = () => {
    if (confirm('Clear all transfer history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  const handlePlayToggle = (record: TransferRecord) => {
    if (!record.blobUrl) return;

    if (playingId === record.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      setPlayingId(record.id);
      if (audioRef.current) {
        audioRef.current.src = record.blobUrl;
        audioRef.current.play().catch(() => setPlayingId(null));
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-4 max-w-lg mx-auto">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        className="hidden"
      />

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
          <span>Transfer History</span>
        </h2>

        {history.length > 0 ? (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-[#0F1A2E] hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-7"></div>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[#0F1A2E] border border-slate-800">
          <FileAudio className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No transfers recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Files sent or received via optical QR stream will appear here.
          </p>
        </div>
      ) : (
        <div className="w-full space-y-2.5">
          {history.map((item) => {
            const isSent = item.type === 'SENT';
            const isCurrentlyPlaying = playingId === item.id;

            return (
              <div
                key={item.id}
                className="w-full p-3.5 rounded-2xl bg-[#0F1A2E] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSent
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {isSent ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>

                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">
                      {item.filename}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{item.timestamp}</span>
                      <span>·</span>
                      <span>{(item.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-cyan-400/90">
                        <Hash className="w-3 h-3" />
                        {item.checksum}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.blobUrl && (
                    <>
                      <button
                        onClick={() => handlePlayToggle(item)}
                        className={`p-2 rounded-xl transition-colors ${
                          isCurrentlyPlaying
                            ? 'bg-cyan-400 text-[#070D18]'
                            : 'bg-[#13223D] hover:bg-[#1A2E50] text-cyan-300'
                        }`}
                        title="Play audio clip"
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>

                      <a
                        href={item.blobUrl}
                        download={item.filename}
                        className="p-2 rounded-xl bg-[#13223D] hover:bg-[#1A2E50] text-slate-300 transition-colors"
                        title="Download audio file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
