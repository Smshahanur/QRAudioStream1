import React, { useState, useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { HomeScreen } from './components/HomeScreen';
import { SendAudioScreen } from './components/SendAudioScreen';
import { ReceiveAudioScreen } from './components/ReceiveAudioScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AndroidCodeModal } from './components/AndroidCodeModal';
import { StreamSettings, AudioChunkPacket } from './types/protocol';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './utils/storage';

type AppScreen = 'home' | 'send' | 'receive' | 'history' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [settings, setSettings] = useState<StreamSettings>(DEFAULT_SETTINGS);
  const [isAndroidCodeOpen, setIsAndroidCodeOpen] = useState<boolean>(false);
  const [phoneFrameMode, setPhoneFrameMode] = useState<boolean>(false);

  // Cross-screen virtual loopback packets for single-device verification
  const [simulatedPackets, setSimulatedPackets] = useState<AudioChunkPacket[] | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleUpdateSettings = (newSettings: StreamSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleDirectSimulate = (packets: AudioChunkPacket[]) => {
    setSimulatedPackets(packets);
    setCurrentScreen('receive');
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <AppHeader
        onOpenAndroidCode={() => setIsAndroidCodeOpen(true)}
        phoneFrameMode={phoneFrameMode}
        onTogglePhoneFrame={() => setPhoneFrameMode(!phoneFrameMode)}
      />

      {/* Main App Container */}
      <main className="flex-1 flex flex-col items-center justify-start p-0 md:p-4">
        {phoneFrameMode ? (
          /* Phone Bezel Simulator Frame */
          <div className="w-full max-w-[420px] my-2 bg-[#0B1526] rounded-[40px] border-4 border-slate-700 shadow-[0_0_50px_rgba(0,240,255,0.12)] overflow-hidden flex flex-col min-h-[760px] relative">
            {/* Phone Notch / Speaker Bar */}
            <div className="h-6 bg-[#070D18] flex items-center justify-center shrink-0">
              <div className="w-20 h-3 rounded-full bg-slate-800 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ml-auto mr-1"></div>
              </div>
            </div>

            {/* Screen Viewport */}
            <div className="flex-1 overflow-y-auto bg-[#070D18]">
              {currentScreen === 'home' && (
                <HomeScreen
                  onNavigate={setCurrentScreen}
                  onOpenAndroidCode={() => setIsAndroidCodeOpen(true)}
                />
              )}
              {currentScreen === 'send' && (
                <SendAudioScreen
                  onBack={() => setCurrentScreen('home')}
                  settings={settings}
                  onDirectSimulateReceive={handleDirectSimulate}
                />
              )}
              {currentScreen === 'receive' && (
                <ReceiveAudioScreen
                  onBack={() => setCurrentScreen('home')}
                  settings={settings}
                  incomingSimulatedPackets={simulatedPackets}
                  onClearSimulated={() => setSimulatedPackets(null)}
                />
              )}
              {currentScreen === 'history' && (
                <HistoryScreen onBack={() => setCurrentScreen('home')} />
              )}
              {currentScreen === 'settings' && (
                <SettingsScreen
                  onBack={() => setCurrentScreen('home')}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              )}
            </div>

            {/* Home Bar Indicator */}
            <div className="h-5 bg-[#070D18] flex items-center justify-center shrink-0">
              <div className="w-28 h-1 rounded-full bg-slate-700"></div>
            </div>
          </div>
        ) : (
          /* Full Responsive Viewport */
          <div className="w-full flex-1 flex flex-col items-center">
            {currentScreen === 'home' && (
              <HomeScreen
                onNavigate={setCurrentScreen}
                onOpenAndroidCode={() => setIsAndroidCodeOpen(true)}
              />
            )}
            {currentScreen === 'send' && (
              <SendAudioScreen
                onBack={() => setCurrentScreen('home')}
                settings={settings}
                onDirectSimulateReceive={handleDirectSimulate}
              />
            )}
            {currentScreen === 'receive' && (
              <ReceiveAudioScreen
                onBack={() => setCurrentScreen('home')}
                settings={settings}
                incomingSimulatedPackets={simulatedPackets}
                onClearSimulated={() => setSimulatedPackets(null)}
              />
            )}
            {currentScreen === 'history' && (
              <HistoryScreen onBack={() => setCurrentScreen('home')} />
            )}
            {currentScreen === 'settings' && (
              <SettingsScreen
                onBack={() => setCurrentScreen('home')}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            )}
          </div>
        )}
      </main>

      {/* Android Kotlin & Compose Code Modal */}
      <AndroidCodeModal
        isOpen={isAndroidCodeOpen}
        onClose={() => setIsAndroidCodeOpen(false)}
      />
    </div>
  );
}
