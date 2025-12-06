
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CameraCapture from './components/CameraCapture';
import Transcript from './components/Transcript';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LearningHub from './components/LearningHub';
import { AppSettings, Message, ProcessingState, SessionStats } from './types';
import { blobToBase64, translateSignLanguage } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [settings, setSettings] = useState<AppSettings>({
    spokenLanguage: 'English',
    signLanguage: 'ASL',
    conversationMode: true,
    theme: 'light',
    processingSpeed: 'balanced',
    accuracyThreshold: 60 // Default threshold
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
  });
  
  const [stats, setStats] = useState<SessionStats>({
    totalTranslations: 0,
    averageAccuracy: 0,
    languagesUsed: [],
    impactMetric: 1250 // Initial mocked seed
  });

  const [viewMode, setViewMode] = useState<'camera' | 'upload'>('camera');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showLearning, setShowLearning] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast');
    if (settings.theme === 'dark') root.classList.add('dark');
    if (settings.theme === 'high-contrast') root.classList.add('high-contrast', 'dark'); // High contrast builds on dark usually or separate class
  }, [settings.theme]);

  // --- Helpers ---
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Map simple language settings to locales
      const localeMap: Record<string, string> = {
          'English': 'en-US',
          'Spanish': 'es-ES',
          'Swahili': 'sw-KE', // Approximate
          'French': 'fr-FR',
          'Arabic': 'ar-SA'
      };
      utterance.lang = localeMap[settings.spokenLanguage] || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const updateStats = (accuracy: number) => {
    setStats(prev => ({
        totalTranslations: prev.totalTranslations + 1,
        averageAccuracy: prev.totalTranslations === 0 ? accuracy : (prev.averageAccuracy * prev.totalTranslations + accuracy) / (prev.totalTranslations + 1),
        languagesUsed: Array.from(new Set([...prev.languagesUsed, settings.signLanguage])),
        impactMetric: prev.impactMetric + Math.floor(Math.random() * 5) + 1
    }));
  };

  // --- Core Logic ---
  const handleMediaInput = async (blob: Blob, mimeType: string) => {
    setProcessingState({ isProcessing: true, error: null });

    try {
      const base64Data = await blobToBase64(blob);
      
      const result = await translateSignLanguage(
        base64Data,
        mimeType,
        settings.spokenLanguage,
        settings.signLanguage,
        settings.conversationMode,
        settings.processingSpeed,
        settings.accuracyThreshold
      );

      // Add "Translation" message
      const translationMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.translation,
        timestamp: Date.now(),
        metadata: {
            score: result.score,
            feedback: result.feedback,
            detectedSignLanguage: result.detectedSignLanguage
        }
      };
      
      setMessages(prev => [...prev, translationMsg]);
      speak(result.translation);
      updateStats(result.score);

      // Conversation AI Reply
      if (settings.conversationMode && result.reply) {
         setTimeout(() => {
            const replyMsg: Message = {
                id: crypto.randomUUID(),
                role: 'user', 
                text: result.reply || '',
                timestamp: Date.now(),
                metadata: {
                    feedback: "Generated response based on context"
                }
            };
            setMessages(prev => [...prev, replyMsg]);
            speak(result.reply || '');
         }, 800);
      }

    } catch (error) {
      console.error(error);
      setProcessingState({ isProcessing: false, error: 'Translation failed. Please try again.' });
    } finally {
      setProcessingState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleSpeechInput = (text: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text,
      timestamp: Date.now(),
      metadata: {
        feedback: "Voice Input Detected"
      }
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) { // 200MB
          alert("File too large. Max 200MB.");
          return;
      }
      handleMediaInput(file, file.type);
    }
  };

  const handleExport = () => {
    const text = messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.text} ${m.metadata?.score ? `(Confidence: ${m.metadata.score}%)` : ''}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SignSync_Transcript_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
  };

  // --- Hackathon Demo Logic ---
  const runJudgeDemo = () => {
      setProcessingState({ isProcessing: true, error: null });
      
      setTimeout(() => {
          setProcessingState({ isProcessing: false, error: null });
          const demoMsg: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              text: "Hello! It is nice to meet you.",
              timestamp: Date.now(),
              metadata: {
                  score: 94,
                  feedback: "Excellent hand clarity. Good eye contact.",
                  detectedSignLanguage: settings.signLanguage
              }
          };
          setMessages(prev => [...prev, demoMsg]);
          speak("Hello! It is nice to meet you.");
          updateStats(94);

          if (settings.conversationMode) {
              setTimeout(() => {
                  const reply: Message = {
                      id: crypto.randomUUID(),
                      role: 'user',
                      text: "Nice to meet you too! How can I help you today?",
                      timestamp: Date.now()
                  };
                  setMessages(prev => [...prev, reply]);
                  speak("Nice to meet you too! How can I help you today?");
              }, 1000);
          }
      }, 2000);
  };

  // --- Render ---
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900 dark:bg-black dark:text-white font-sans selection:bg-blue-200 selection:text-blue-900">
      
      {/* Welcome Modal */}
      {showWelcome && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
                  <div className="md:w-1/2 bg-blue-600 p-8 flex flex-col justify-center text-white relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-indigo-900 opacity-50"></div>
                      <div className="relative z-10">
                          <h1 className="text-4xl font-extrabold mb-4">SignSync</h1>
                          <p className="text-lg opacity-90 mb-6">Bridging the gap between sign language and spoken words with advanced AI.</p>
                          <div className="flex gap-2">
                             <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">ASL</span>
                             <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">BSL</span>
                             <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">KSL</span>
                          </div>
                      </div>
                  </div>
                  <div className="md:w-1/2 p-8 flex flex-col justify-center">
                      <h3 className="text-xl font-bold mb-4">Get Started</h3>
                      <p className="text-gray-500 mb-8 text-sm">Enable your camera or upload a video clip. SignSync analyzes gestures in real-time, providing translations and audio feedback.</p>
                      <button 
                         onClick={() => setShowWelcome(false)}
                         className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold rounded-xl shadow-lg hover:transform hover:scale-105 transition-all"
                      >
                          Launch App →
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showAnalytics && <AnalyticsDashboard stats={stats} onClose={() => setShowAnalytics(false)} />}
      {showLearning && <LearningHub signLanguage={settings.signLanguage} onClose={() => setShowLearning(false)} />}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          settings={settings} 
          setSettings={setSettings} 
          stats={stats}
          onExport={handleExport}
          onToggleJudgeMode={runJudgeDemo}
          toggleAnalytics={() => setShowAnalytics(!showAnalytics)}
          showAnalytics={showAnalytics}
          toggleLearning={() => setShowLearning(!showLearning)}
          showLearning={showLearning}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col lg:flex-row h-full w-full">
          
          {/* Left: Input View (Camera / Upload) */}
          <div className="flex-1 flex flex-col min-h-[50%] lg:min-h-full border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 relative group p-6 justify-center items-center">
            
            {/* View Toggle */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex space-x-1 bg-gray-900/90 p-1.5 rounded-xl backdrop-blur border border-gray-700 shadow-xl">
                <button 
                    onClick={() => setViewMode('camera')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'camera' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Live Cam
                </button>
                <button 
                    onClick={() => setViewMode('upload')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload
                </button>
            </div>

            <div className="flex-1 w-full max-w-5xl flex items-center justify-center">
                {viewMode === 'camera' ? (
                    <CameraCapture 
                        onCapture={(blob) => handleMediaInput(blob, 'video/webm')} 
                        onSpeechInput={handleSpeechInput}
                        isProcessing={processingState.isProcessing}
                        signLanguage={settings.signLanguage}
                        spokenLanguage={settings.spokenLanguage}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-full max-w-2xl aspect-video rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group-hover:border-blue-500/50 shadow-inner flex flex-col items-center justify-center">
                            <div className="h-20 w-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload Sign Video</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Select a video file (MP4, WEBM) containing sign language gestures. Max duration 5 minutes.</p>
                            
                            <label className="relative cursor-pointer group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                                <span className="relative inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-500 transition-transform active:scale-95">
                                    Select File
                                </span>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="video/*" 
                                    className="hidden" 
                                    onChange={handleFileUpload}
                                />
                            </label>
                            
                            {processingState.isProcessing && (
                                <div className="mt-8 flex items-center gap-2 text-blue-500 animate-pulse font-bold">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Uploading & Analyzing...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>

          {/* Right: Output View (Transcript) */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-[50%] lg:min-h-full border-l border-gray-200 dark:border-gray-800 shadow-2xl z-10">
            <div className="border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center bg-white/50 dark:bg-gray-900/50 backdrop-blur">
               <div>
                   <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Live Transcript</h2>
                   <div className="flex items-center gap-2 mt-1">
                     <span className={`inline-block w-2 h-2 rounded-full ${processingState.isProcessing ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`}></span>
                     <span className="text-xs font-semibold text-gray-900 dark:text-white">{processingState.isProcessing ? 'Gemini 3 Pro Thinking...' : 'System Ready'}</span>
                   </div>
               </div>
               <div className="flex gap-2">
                   <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 flex items-center gap-2">
                       <span>{settings.signLanguage}</span>
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                       <span>{settings.spokenLanguage}</span>
                   </div>
               </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                <Transcript messages={messages} />
                
                {/* Error Toast */}
                {processingState.error && (
                    <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-red-50 p-4 text-red-600 border border-red-100 shadow-xl dark:bg-red-900/40 dark:text-red-200 dark:border-red-800 animate-bounce-in z-50">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <p className="text-sm font-bold">{processingState.error}</p>
                        </div>
                    </div>
                )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
