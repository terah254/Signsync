
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SpokenLanguage } from '../types';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onSpeechInput: (text: string) => void;
  isProcessing: boolean;
  signLanguage: string;
  spokenLanguage: SpokenLanguage;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  onCapture, 
  onSpeechInput, 
  isProcessing, 
  signLanguage, 
  spokenLanguage 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lightingStatus, setLightingStatus] = useState<'good' | 'poor'>('good');
  
  // Self-timer state
  const [timerDelay, setTimerDelay] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const MAX_DURATION = 300; // 5 minutes

  // Brightness check loop
  useEffect(() => {
    if (!isStreaming || !videoRef.current) return;
    
    const checkBrightness = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 100, 100);
            const imageData = ctx.getImageData(0, 0, 100, 100);
            let colorSum = 0;
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                const avg = Math.floor((r + g + b) / 3);
                colorSum += avg;
            }
            const brightness = Math.floor(colorSum / (100 * 100));
            setLightingStatus(brightness < 50 ? 'poor' : 'good');
        }
    };

    const interval = setInterval(checkBrightness, 2000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied. Please check permissions.");
      setIsStreaming(false);
    }
  }, []);

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Manual start only.
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Actual recording logic (called immediately or after countdown)
  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;

    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    
    const chunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      stopCameraStream(); // Shutdown camera instantly when recording stops
      onCapture(blob);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingDuration(0);
  };

  // Button handler with timer logic
  const handleStartButton = () => {
      if (timerDelay === 0) {
          startRecording();
      } else {
          // Start countdown
          setCountdown(timerDelay);
          let count = timerDelay;
          const interval = setInterval(() => {
              count -= 1;
              if (count > 0) {
                  setCountdown(count);
              } else {
                  clearInterval(interval);
                  setCountdown(null);
                  startRecording();
              }
          }, 1000);
      }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // MediaRecorder.onstop will handle camera shutdown
    }
  };

  const toggleTimerDelay = () => {
      setTimerDelay(prev => prev === 0 ? 3 : prev === 3 ? 10 : 0);
  };

  const toggleSpeechRecognition = () => {
    if (isListening) return; 

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech recognition not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    const langMap: Record<string, string> = {
        'English': 'en-US',
        'Spanish': 'es-ES',
        'Swahili': 'sw-KE',
        'French': 'fr-FR',
        'Arabic': 'ar-SA'
    };
    recognition.lang = langMap[spokenLanguage] || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        setIsListening(true);
        setError(null);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setError("Microphone error. Please try again.");
    };

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
            onSpeechInput(transcript);
        }
    };

    recognition.start();
  };

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingDuration((prev) => Math.min(prev + 1, MAX_DURATION));
      }, 1000);
    } else {
        setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && recordingDuration >= MAX_DURATION) {
      stopRecording();
    }
  }, [recordingDuration, isRecording]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const progressPercentage = (recordingDuration / MAX_DURATION) * 100;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4">
      
      {/* 1. Camera Frame Viewport */}
      <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-gray-800 ring-4 ring-gray-900/50 flex flex-col justify-center">
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover transition-opacity duration-500 ${isStreaming ? 'opacity-100' : 'opacity-0'}`} 
        />

        {/* --- Overlays Inside Frame --- */}

        {/* Countdown Overlay */}
        {countdown !== null && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="animate-[ping_1s_ease-in-out_infinite] text-9xl font-black text-white drop-shadow-2xl">
                    {countdown}
                </div>
            </div>
        )}

        {/* AR Guide Overlay */}
        {isStreaming && countdown === null && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="border-2 border-white/20 w-3/4 h-3/4 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-xl"></div>
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">{signLanguage} Active</p>
                    </div>
                </div>
            </div>
        )}

        {/* Lighting Warning */}
        {isStreaming && lightingStatus === 'poor' && !isProcessing && countdown === null && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="rounded-full bg-yellow-500/90 px-4 py-1 text-center text-xs font-bold text-black shadow-lg backdrop-blur">
                    ⚠️ Low Light Detected
                </div>
            </div>
        )}

        {/* Processing State Overlay */}
        {isProcessing && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                 <div className="relative h-20 w-20 mb-4">
                     <div className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-20"></div>
                     <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gray-900 border border-gray-700 shadow-xl">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
                     </div>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-1">Analyzing...</h3>
                 <p className="text-sm text-blue-300">Gemini 3 Pro Vision</p>
            </div>
        )}

        {/* Inactive / Activate State Overlay */}
        {!isStreaming && !isProcessing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/95 text-white p-6">
                {error ? (
                    <div className="mb-4 text-center">
                        <span className="text-3xl mb-2 block">🚫</span>
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📷</div>
                        <h3 className="text-lg font-bold mb-1">Camera Offline</h3>
                        <p className="text-gray-400 text-sm mb-6">Start a new session to record.</p>
                    </div>
                )}
                
                <button
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-xl transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 border-2 border-blue-400/30"
                >
                    <div className="flex items-center gap-2 text-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Turn Camera On
                    </div>
                    <span className="text-xs text-blue-200 font-medium tracking-wide bg-blue-700/50 px-2 py-0.5 rounded-full">
                        Max Duration: 5:00
                    </span>
                </button>
            </div>
        )}
      </div>

      {/* 2. Control Deck - Separated from Video */}
      <div className="mt-6 w-full max-w-md">
          <div className="relative bg-white dark:bg-gray-900/50 rounded-2xl p-4 flex items-center justify-between border border-gray-200 dark:border-gray-800 shadow-xl backdrop-blur-md overflow-hidden">
              
              {/* Progress Bar (Top) */}
              <div className="absolute top-0 left-0 h-1 bg-gray-100 dark:bg-gray-800 w-full">
                  <div 
                    className="h-full bg-red-500 transition-all duration-1000 ease-linear" 
                    style={{ width: `${progressPercentage}%` }}
                  />
              </div>

              <div className="flex flex-col z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</span>
                  <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : isListening ? 'bg-blue-500 animate-bounce' : isStreaming ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                          {isRecording ? 'Recording' : isListening ? 'Listening' : isStreaming ? 'Ready' : 'Standby'}
                      </span>
                  </div>
              </div>

              {/* Record Button Group */}
              <div className="relative z-10 flex items-center gap-3">
                  
                  {/* Timer Button */}
                  <button
                    onClick={toggleTimerDelay}
                    disabled={isRecording || isProcessing || countdown !== null}
                    className={`
                        flex h-10 w-10 items-center justify-center rounded-full transition-all shadow-md relative
                        ${timerDelay > 0
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500'
                        }
                        ${(isRecording || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title="Self Timer"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {timerDelay > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white">
                              {timerDelay}
                          </span>
                      )}
                  </button>

                  {/* Mic Button */}
                   <button
                    onClick={toggleSpeechRecognition}
                    disabled={isRecording || isProcessing || countdown !== null}
                    className={`
                        flex h-10 w-10 items-center justify-center rounded-full transition-all shadow-md
                        ${isListening 
                            ? 'bg-blue-600 text-white ring-2 ring-blue-200 dark:ring-blue-900' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }
                        ${(isRecording || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title="Speak Command"
                  >
                      {isListening ? (
                         <div className="flex gap-0.5 h-3 items-center">
                             <div className="w-0.5 bg-white h-3 animate-[soundwave_0.5s_ease-in-out_infinite]"></div>
                             <div className="w-0.5 bg-white h-4 animate-[soundwave_0.5s_ease-in-out_infinite_0.1s]"></div>
                             <div className="w-0.5 bg-white h-2 animate-[soundwave_0.5s_ease-in-out_infinite_0.2s]"></div>
                         </div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                  </button>

                  {/* Streaming Controls */}
                  {isStreaming && !isProcessing ? (
                      <div className="flex items-center gap-2">
                          <button
                              onClick={isRecording ? stopRecording : handleStartButton}
                              disabled={countdown !== null}
                              className={`
                                group relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 shadow-lg
                                ${isRecording 
                                    ? 'bg-white text-red-600 ring-2 ring-red-100 dark:bg-gray-800 dark:text-red-500 dark:ring-red-900/30' 
                                    : countdown !== null 
                                      ? 'bg-orange-500 text-white cursor-wait'
                                      : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-red-500/30 hover:-translate-y-0.5'
                                }
                              `}
                          >
                              <div className={`
                                    h-2.5 w-2.5 rounded-sm transition-all duration-300
                                    ${isRecording ? 'bg-red-600 dark:bg-red-500 animate-pulse' : 'bg-white rounded-full'}
                              `} />
                              <span className="text-xs font-bold tracking-wide uppercase">
                                  {isRecording ? 'STOP' : countdown !== null ? `WAIT (${countdown})` : timerDelay > 0 ? 'START TIMER' : 'START RECORDING'}
                              </span>
                          </button>
                          
                          {/* Cancel Button (only when streaming but not recording) */}
                          {!isRecording && countdown === null && (
                            <button 
                                onClick={stopCameraStream}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                                title="Turn Off Camera"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                          )}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center opacity-30 px-4">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Preview Inactive</span>
                      </div>
                  )}
              </div>

              <div className="flex flex-col items-end w-16 z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Timer</span>
                  <span className={`text-lg font-mono font-bold ${isRecording ? 'text-red-500' : 'text-gray-300'}`}>
                      {formatTime(recordingDuration)}
                  </span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default CameraCapture;
