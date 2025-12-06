
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface TranscriptProps {
  messages: Message[];
}

const Transcript: React.FC<TranscriptProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-gray-600">
        <div className="mb-6 rounded-full bg-gray-100 p-6 dark:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200">Waiting for Input</h3>
        <p className="mt-2 max-w-xs text-sm">Use the camera or upload a video to start translating sign language in real-time.</p>
      </div>
    );
  }

  return (
    <div 
      className="flex h-full flex-col space-y-6 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800"
      aria-live="polite"
      role="log"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex w-full ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div className={`flex max-w-[90%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            <div
                className={`relative rounded-3xl p-6 shadow-sm ${
                msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : msg.role === 'assistant'
                    ? 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-700'
                    : 'w-full bg-yellow-50 text-yellow-800 border border-yellow-100 text-center text-sm dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900'
                }`}
            >
                {/* Header Badge */}
                {msg.role !== 'system' && (
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                            {msg.role === 'user' ? 'Signed Input' : 'Translation'}
                        </span>
                        {msg.metadata?.score !== undefined && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                msg.metadata.score > 80 ? 'bg-green-100 text-green-700' : 
                                msg.metadata.score > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {msg.metadata.score}% Accuracy
                            </span>
                        )}
                    </div>
                )}
                
                <p className="text-2xl font-semibold leading-relaxed font-sans">
                    {msg.text}
                </p>
                
                {/* Feedback Section */}
                {msg.metadata?.feedback && (
                     <div className={`mt-4 border-t pt-3 ${msg.role === 'user' ? 'border-blue-500' : 'border-gray-100 dark:border-gray-700'}`}>
                        <div className="flex items-start gap-2">
                             <svg className={`h-4 w-4 mt-0.5 ${msg.role === 'user' ? 'text-blue-300' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                             <p className={`text-xs ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                 AI Feedback: {msg.metadata.feedback}
                             </p>
                        </div>
                     </div>
                )}
            </div>
            
            <span className="mt-2 text-[10px] text-gray-400 font-medium">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default Transcript;
