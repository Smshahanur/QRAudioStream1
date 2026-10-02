import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Folder,
  FileCode,
  FileText,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import {
  ANDROID_PROJECT_FILES,
  AndroidFileEntry,
  downloadAndroidProjectZip,
} from '../utils/androidProjectZip';

interface AndroidCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeModal: React.FC<AndroidCodeModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<AndroidFileEntry>(
    ANDROID_PROJECT_FILES.find((f) => f.name.includes('MainActivity.kt')) || ANDROID_PROJECT_FILES[0]
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadAndroidProjectZip();
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[88vh] bg-[#070D18] border border-cyan-500/30 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Header */}
        <div className="h-14 px-5 border-b border-slate-800 bg-[#0A1222] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[#070D18] font-bold text-xs">
              KT
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Native Android Studio Project (Kotlin & Jetpack Compose)</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                CameraX · ML Kit Barcode · ZXing · Media3 ExoPlayer · Coroutines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070D18] font-bold text-xs transition-colors shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Zipping...' : 'Download Project .ZIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split File Explorer & Code View */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left: File Tree */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-[#091120] p-3 overflow-y-auto shrink-0 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>Project Files</span>
              </div>
              <div className="space-y-0.5">
                {ANDROID_PROJECT_FILES.map((file) => {
                  const isSelected = selectedFile.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      {file.name.endsWith('.md') ? (
                        <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate">{file.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Build Help Box */}
            <div className="mt-4 p-2.5 rounded-xl bg-[#0F1A2E] border border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Build with Gradle CLI:</span>
              </div>
              <code className="block bg-[#070D18] p-1.5 rounded text-[10px] text-slate-300 font-mono">
                ./gradlew assembleDebug
              </code>
            </div>
          </div>

          {/* Right: Code Editor & Viewer */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#060B14]">
            {/* File Path Bar */}
            <div className="h-10 px-4 border-b border-slate-800/80 bg-[#080E1C] flex items-center justify-between shrink-0">
              <div className="text-xs font-mono text-cyan-400 flex items-center gap-2">
                <span>{selectedFile.path}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {selectedFile.language}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre font-normal selection:bg-cyan-500/30">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="h-11 px-5 border-t border-slate-800 bg-[#0A1222] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Target SDK 35 · Kotlin 2.0.21 · Jetpack Compose BOM 2024.11.00</span>
          <a
            href="https://developer.android.com/jetpack/compose"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>Android Dev Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
