
import React from 'react';
import { AppSettings, SessionStats, SpokenLanguage, SignLanguage } from '../types';

interface SidebarProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  stats: SessionStats;
  onExport: () => void;
  onToggleJudgeMode: () => void;
  toggleAnalytics: () => void;
  showAnalytics: boolean;
  toggleLearning: () => void;
  showLearning: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  settings, setSettings, stats, onExport, 
  onToggleJudgeMode, toggleAnalytics, showAnalytics,
  toggleLearning, showLearning, isOpen, onClose
}) => {
  
  const handleSpokenLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ ...prev, spokenLanguage: e.target.value as SpokenLanguage }));
  };

  const handleSignLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ ...prev, signLanguage: e.target.value as SignLanguage }));
  };

  const toggleTheme = () => {
    setSettings(prev => ({ 
      ...prev, 
      theme: prev.theme === 'light' ? 'dark' : prev.theme === 'dark' ? 'high-contrast' : 'light' 
    }));
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-72 transform border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col p-4 space-y-6">
          
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end">
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode Toggles */}
          <div className="grid grid-cols-2 gap-2">
             <button
               onClick={() => { toggleAnalytics(); if(window.innerWidth < 1024) onClose(); }}
               className={`flex items-center justify-center gap-2 rounded-lg p-3 text-xs font-bold transition-all ${
                 showAnalytics ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
               }`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
               Analytics
             </button>
             <button
               onClick={() => { toggleLearning(); if(window.innerWidth < 1024) onClose(); }}
               className={`flex items-center justify-center gap-2 rounded-lg p-3 text-xs font-bold transition-all ${
                 showLearning ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
               }`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
               Learning
             </button>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Sign Bridge Settings
            </h2>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Input Sign Language</label>
              <select
                value={settings.signLanguage}
                onChange={handleSignLanguageChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="ASL">ASL (American)</option>
                <option value="BSL">BSL (British)</option>
                <option value="KSL">KSL (Kenyan)</option>
                <option value="ISL">ISL (Indian)</option>
                <option value="LSE">LSE (Spanish)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Output Voice Language</label>
              <select
                value={settings.spokenLanguage}
                onChange={handleSpokenLanguageChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="Swahili">Swahili</option>
                <option value="French">French</option>
                <option value="Arabic">Arabic</option>
              </select>
            </div>

            {/* AI Control Sliders */}
            <div className="space-y-3 pt-2">
                
                {/* Processing Speed / Mode */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Analysis Mode</label>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${settings.processingSpeed === 'accurate' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
                            {settings.processingSpeed}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">Fast</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="1"
                            value={settings.processingSpeed === 'accurate' ? 1 : 0}
                            onChange={(e) => setSettings(prev => ({ ...prev, processingSpeed: e.target.value === '1' ? 'accurate' : 'balanced' }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                        />
                        <span className="text-[10px] text-gray-400">Deep</span>
                    </div>
                </div>

                {/* Accuracy Threshold */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Confidence Threshold</label>
                        <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                            {settings.accuracyThreshold}%
                        </span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="5"
                        value={settings.accuracyThreshold}
                        onChange={(e) => setSettings(prev => ({ ...prev, accuracyThreshold: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                    />
                </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Conversation AI
              </label>
              <button
                onClick={() => setSettings(p => ({...p, conversationMode: !p.conversationMode}))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.conversationMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.conversationMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Appearance
              </label>
              <button
                onClick={toggleTheme}
                className="text-xs font-bold uppercase tracking-wide text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                {settings.theme}
              </button>
            </div>
          </div>

          {/* Hackathon Tools */}
          <div className="rounded-xl bg-gradient-to-r from-gray-900 to-black p-4 text-white shadow-lg">
             <h3 className="mb-2 text-xs font-bold uppercase text-yellow-400">Judge Controls</h3>
             <p className="mb-3 text-xs text-gray-400">Simulate workflow for demo.</p>
             <button 
               onClick={() => { onToggleJudgeMode(); if(window.innerWidth < 1024) onClose(); }}
               className="w-full rounded bg-white/20 py-2 text-xs font-bold hover:bg-white/30"
             >
               ▶ Run Demo Scenario
             </button>
          </div>

          {/* Session Mini-Stats */}
          <div className="mt-auto space-y-4">
             <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex justify-between text-xs mb-1">
                   <span className="text-gray-500">Accuracy Avg</span>
                   <span className="font-bold text-green-600">{Math.round(stats.averageAccuracy)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                   <div className="h-2 rounded-full bg-green-500" style={{ width: `${stats.averageAccuracy}%` }}></div>
                </div>
             </div>

             <button
              onClick={onExport}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Export Transcript
            </button>
            
            <p className="text-[10px] text-center text-gray-400">
               Privacy: Processing happens on-device and via secure ephemeral API calls. No video stored.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
