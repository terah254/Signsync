
import React, { useState } from 'react';
import { Drill, SignLanguage } from '../types';
import { generateLearningDrill } from '../services/geminiService';

interface LearningHubProps {
  signLanguage: SignLanguage;
  onClose: () => void;
}

const LearningHub: React.FC<LearningHubProps> = ({ signLanguage, onClose }) => {
  const [drill, setDrill] = useState<Drill | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const fetchDrill = async (level: 'Beginner' | 'Intermediate') => {
    setLoading(true);
    setRevealed(false);
    const newDrill = await generateLearningDrill(level, signLanguage);
    setDrill(newDrill);
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-900/40 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-900 dark:border dark:border-indigo-800 border-t-8 border-indigo-500">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Learning Hub</h2>
                <p className="text-indigo-500 font-medium">Master {signLanguage} with AI</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 dark:bg-gray-800">✕</button>
        </div>

        {!drill && !loading && (
          <div className="space-y-4 py-8 text-center">
            <p className="text-gray-500 mb-4">Choose your difficulty level to start a personalized drill.</p>
            <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => fetchDrill('Beginner')}
                  className="px-6 py-3 bg-green-100 text-green-800 rounded-xl font-bold hover:bg-green-200 transition"
                >
                    Beginner
                </button>
                <button 
                  onClick={() => fetchDrill('Intermediate')}
                  className="px-6 py-3 bg-indigo-100 text-indigo-800 rounded-xl font-bold hover:bg-indigo-200 transition"
                >
                    Intermediate
                </button>
            </div>
          </div>
        )}

        {loading && (
            <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Generating drill...</p>
            </div>
        )}

        {drill && !loading && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    {drill.difficulty} Drill
                </span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {drill.question}
                </h3>
                <p className="text-gray-500 text-sm">Perform this sign to the camera (imagined).</p>
            </div>

            {revealed ? (
                 <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl animate-fade-in-up">
                    <h4 className="font-bold text-green-800 dark:text-green-300 mb-1">Answer / Technique:</h4>
                    <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">{drill.expectedSign}</p>
                 </div>
            ) : (
                <button 
                    onClick={() => setRevealed(true)}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition shadow-lg"
                >
                    Show Solution
                </button>
            )}

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                <button onClick={() => setDrill(null)} className="text-gray-500 hover:text-gray-900 text-sm font-medium">
                    ← Back to Menu
                </button>
                <button onClick={() => fetchDrill(drill.difficulty as any)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">
                    Next Drill →
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningHub;
