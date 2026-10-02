import React from 'react';
import {
  ArrowLeft,
  Sliders,
  ShieldCheck,
  Smartphone,
  SunMedium,
  Volume2,
  RefreshCw,
  QrCode,
  Gauge,
} from 'lucide-react';
import { StreamSettings } from '../types/protocol';
import { DEFAULT_SETTINGS } from '../utils/storage';

interface SettingsScreenProps {
  onBack: () => void;
  settings: StreamSettings;
  onUpdateSettings: (newSettings: StreamSettings) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  settings,
  onUpdateSettings,
}) => {
  const handleChange = (partial: Partial<StreamSettings>) => {
    onUpdateSettings({ ...settings, ...partial });
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
  };

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
          <span>Transfer Settings</span>
        </h2>

        <button
          onClick={handleResetDefaults}
          className="p-1.5 rounded-lg bg-[#0F1A2E] hover:bg-[#13223D] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Reset to default settings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Protocol Tuning Card */}
      <div className="w-full rounded-2xl bg-[#0F1A2E] border border-cyan-500/30 p-4 mb-4 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Optical Link Calibration</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Adjust frame frequency and QR density to balance speed against camera shutter speed.
        </p>

        {/* Default FPS Slider */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Streaming Frame Rate (FPS)</span>
            </span>
            <span className="font-mono font-bold text-cyan-400">{settings.defaultFps} FPS</span>
          </div>
          <input
            type="range"
            min={4}
            max={20}
            step={1}
            value={settings.defaultFps}
            onChange={(e) => handleChange({ defaultFps: parseInt(e.target.value, 10) })}
            className="w-full accent-cyan-400 h-1.5 bg-[#13223D] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>5 FPS (High Reliability)</span>
            <span>10–12 FPS (Recommended)</span>
            <span>20 FPS (Ultra-Fast)</span>
          </div>
        </div>

        {/* Chunk Size Slider */}
        <div className="mb-4 pt-3 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Chunk Payload Size</span>
            </span>
            <span className="font-mono font-bold text-blue-400">
              {settings.chunkSizeBytes} Bytes/frame
            </span>
          </div>
          <input
            type="range"
            min={200}
            max={750}
            step={25}
            value={settings.chunkSizeBytes}
            onChange={(e) => handleChange({ chunkSizeBytes: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-400 h-1.5 bg-[#13223D] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>200B (Large QR Dots)</span>
            <span>380B (Balanced)</span>
            <span>750B (Dense QR Dots)</span>
          </div>
        </div>

        {/* Error Correction Level */}
        <div className="pt-3 border-t border-slate-800">
          <label className="text-xs text-slate-300 font-semibold block mb-2">
            QR Error Correction Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['L', 'M', 'Q', 'H'] as const).map((lvl) => {
              const active = settings.errorCorrection === lvl;
              const descriptions: Record<string, string> = {
                L: 'Low (7%)',
                M: 'Med (15%)',
                Q: 'Quart (25%)',
                H: 'High (30%)',
              };
              return (
                <button
                  key={lvl}
                  onClick={() => handleChange({ errorCorrection: lvl })}
                  className={`py-2 px-1 rounded-xl text-center transition-all ${
                    active
                      ? 'bg-cyan-500 text-[#070D18] font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-[#13223D] hover:bg-[#1A2E50] text-slate-300 font-medium'
                  }`}
                >
                  <div className="text-xs">{lvl}</div>
                  <div className="text-[9px] opacity-80">{descriptions[lvl]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hardware & UX Preferences Card */}
      <div className="w-full rounded-2xl bg-[#0F1A2E] border border-slate-800 p-4 mb-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <SunMedium className="w-4 h-4 text-cyan-400" />
          <span>Feedback & Display</span>
        </h3>

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">High Contrast White Canvas</div>
            <div className="text-[11px] text-slate-400">
              Surround QR code with pure white border for quick camera exposure locking.
            </div>
          </div>
          <button
            onClick={() => handleChange({ highContrast: !settings.highContrast })}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              settings.highContrast ? 'bg-cyan-400' : 'bg-[#13223D]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#070D18] transition-transform ${
                settings.highContrast ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sound Feedback */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Acoustic Reception Clicks</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Emit a subtle synthesized tick when each frame is verified.
            </div>
          </div>
          <button
            onClick={() => handleChange({ soundFeedback: !settings.soundFeedback })}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              settings.soundFeedback ? 'bg-cyan-400' : 'bg-[#13223D]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#070D18] transition-transform ${
                settings.soundFeedback ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Two Phones Testing Guide */}
      <div className="w-full rounded-2xl bg-[#091120] border border-cyan-500/20 p-4 space-y-2 text-xs">
        <h4 className="font-bold text-cyan-400 flex items-center gap-2 text-sm">
          <Smartphone className="w-4 h-4" />
          <span>Optimal Physical Phone Setup</span>
        </h4>
        <div className="text-slate-300 space-y-1.5 leading-relaxed">
          <p>
            <strong className="text-slate-100">1. Brightness:</strong> Set Phone 1 (Sender) screen brightness to 80–100%.
          </p>
          <p>
            <strong className="text-slate-100">2. Distance:</strong> Hold Phone 2 (Receiver) 15–22 cm away, centered on the QR box.
          </p>
          <p>
            <strong className="text-slate-100">3. Reflection:</strong> Avoid direct overhead light glare on Phone 1’s screen glass.
          </p>
          <p>
            <strong className="text-slate-100">4. Speed:</strong> 10–12 FPS is ideal for standard 60Hz camera sensors; lower to 6–8 FPS if ambient lighting is dim.
          </p>
        </div>
      </div>

      {/* Air-Gapped Security Notice */}
      <div className="w-full mt-4 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-emerald-300/90 leading-tight">
          <strong>Zero Network Emissions:</strong> QRAudioStream operates strictly within the optical spectrum. No RF (radio frequency) radiation, Bluetooth beacons, or IP routing packets are transmitted.
        </div>
      </div>
    </div>
  );
};
