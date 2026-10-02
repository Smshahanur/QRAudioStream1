import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  WifiOff,
  Radio,
  ScanLine,
  History,
  Settings,
  ArrowRight,
  Sparkles,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (screen: 'send' | 'receive' | 'history' | 'settings') => void;
  onOpenAndroidCode: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onOpenAndroidCode }) => {
  const [phoneUrlQr, setPhoneUrlQr] = useState<string>('');
  const [showPairingModal, setShowPairingModal] = useState<boolean>(false);

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (currentAppUrl) {
      QRCode.toDataURL(currentAppUrl, {
        width: 260,
        margin: 1,
        color: {
          dark: '#070D18',
          light: '#FFFFFF',
        },
      })
        .then((url) => setPhoneUrlQr(url))
        .catch(() => {});
    }
  }, [currentAppUrl]);

  return (
    <div className="w-full flex flex-col items-center py-6 px-4 max-w-lg mx-auto">
      {/* 6. Offline Transfer Indicator */}
      <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0F1A2E] border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-6 shadow-sm shadow-cyan-500/5">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <WifiOff className="w-3.5 h-3.5" />
        <span>100% Offline Air-Gapped Transfer</span>
      </div>

      {/* 1. QRAudioStream Logo and Title */}
      <div className="relative mb-3 flex items-center justify-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 p-[2px] shadow-xl shadow-cyan-500/20">
          <div className="w-full h-full bg-[#070D18] rounded-[14px] flex items-center justify-center">
            <Radio className="w-10 h-10 text-cyan-400" />
          </div>
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-xl -z-10"></div>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 font-['Plus_Jakarta_Sans'] text-center">
        QRAudioStream
      </h1>

      <p className="text-sm text-slate-400 text-center mt-1.5 max-w-xs leading-relaxed">
        Transfer voice messages and music between Android phones using animated optical QR frames.
      </p>

      {/* Primary Actions Grid */}
      <div className="w-full mt-7 space-y-3.5">
        {/* 2. Send Audio Card */}
        <button
          onClick={() => onNavigate('send')}
          className="w-full group text-left p-4 rounded-2xl bg-[#0F1A2E] hover:bg-[#13223D] border border-cyan-500/30 hover:border-cyan-400 transition-all duration-200 shadow-lg shadow-cyan-500/5 active:scale-[0.99] flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-[#070D18] transition-colors">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  Send Audio
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-medium">
                  Transmitter
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Record mic or pick file & stream animated QR frames
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>

        {/* 3. Receive Audio Card */}
        <button
          onClick={() => onNavigate('receive')}
          className="w-full group text-left p-4 rounded-2xl bg-[#0F1A2E] hover:bg-[#13223D] border border-blue-500/30 hover:border-blue-400 transition-all duration-200 shadow-lg shadow-blue-500/5 active:scale-[0.99] flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-[#070D18] transition-colors">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                  Receive Audio
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 font-medium">
                  Camera Scanner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan stream, assemble chunks, and play audio
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>

        {/* 4. Transfer History Card */}
        <button
          onClick={() => onNavigate('history')}
          className="w-full text-left p-3.5 rounded-xl bg-[#0B1526] hover:bg-[#0F1A2E] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Transfer History</h4>
              <p className="text-xs text-slate-400">View and replay received and sent audio clips</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 5. Settings Card */}
        <button
          onClick={() => onNavigate('settings')}
          className="w-full text-left p-3.5 rounded-xl bg-[#0B1526] hover:bg-[#0F1A2E] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Settings & Calibration</h4>
              <p className="text-xs text-slate-400">Adjust FPS, chunk density & camera focus tips</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Two Phones Optical Link Banner */}
      <div className="w-full mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#0F1A2E] to-[#13223D] border border-cyan-500/20 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Test on Two Physical Phones</span>
          </div>
          <button
            onClick={() => setShowPairingModal(true)}
            className="text-xs px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors font-medium flex items-center gap-1"
          >
            <span>Scan URL QR</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Open this app on Phone 1 to <strong className="text-cyan-300">Send</strong> and on Phone 2 to <strong className="text-blue-300">Receive</strong>. Hold them face-to-face (15–20cm) to experience instant optical air-gapped audio streaming!
        </p>
      </div>

      {/* Android Kotlin Source Code Banner */}
      <div className="w-full mt-3.5 p-3.5 rounded-xl bg-[#091120] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300">
            Native Jetpack Compose & CameraX project ready
          </span>
        </div>
        <button
          onClick={onOpenAndroidCode}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
        >
          View Code & ZIP
        </button>
      </div>

      {/* Pairing QR Modal */}
      {showPairingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1526] border border-cyan-500/40 p-5 flex flex-col items-center">
            <h3 className="text-base font-bold text-slate-100">Open on Second Phone</h3>
            <p className="text-xs text-slate-400 text-center mt-1">
              Scan this QR code with Phone 2’s camera to launch QRAudioStream instantly.
            </p>

            <div className="mt-4 p-3 bg-white rounded-xl shadow-lg">
              {phoneUrlQr ? (
                <img src={phoneUrlQr} alt="Open App QR" className="w-52 h-52 object-contain" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-800 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-cyan-300 font-mono mt-3 break-all text-center px-2">
              {currentAppUrl}
            </p>

            <button
              onClick={() => setShowPairingModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070D18] font-bold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
