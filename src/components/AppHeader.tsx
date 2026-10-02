import React from 'react';
import { WifiOff, Code2, Smartphone, Monitor } from 'lucide-react';

interface AppHeaderProps {
  onOpenAndroidCode: () => void;
  phoneFrameMode: boolean;
  onTogglePhoneFrame: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenAndroidCode,
  phoneFrameMode,
  onTogglePhoneFrame,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#070D18]/90 backdrop-blur-md border-b border-[#1E293B]">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg
              className="w-4 h-4 text-[#070D18]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <path d="M7 7h.01"></path>
              <path d="M17 7h.01"></path>
              <path d="M7 17h.01"></path>
              <path d="M17 17h.01"></path>
            </svg>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-100 font-['Plus_Jakarta_Sans']">
              QRAudioStream
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Offline Air-Gapped Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Air-Gapped</span>
          </div>

          {/* Android Kotlin Source Code & ZIP */}
          <button
            onClick={onOpenAndroidCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1A2E] hover:bg-[#1E293B] border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Inspect Android Kotlin project source code & download ZIP"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Android Project</span>
            <span className="sm:hidden">Kotlin</span>
          </button>

          {/* Viewport Frame Mode (Phone Simulator vs Full Responsive) */}
          <button
            onClick={onTogglePhoneFrame}
            className="hidden md:flex items-center gap-1 p-1.5 rounded-lg bg-[#0F1A2E] hover:bg-[#1E293B] border border-slate-700 text-slate-300 text-xs transition-colors"
            title={phoneFrameMode ? 'Switch to Full Width View' : 'Switch to Phone Bezel Frame'}
          >
            {phoneFrameMode ? (
              <Monitor className="w-4 h-4 text-cyan-400" />
            ) : (
              <Smartphone className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
