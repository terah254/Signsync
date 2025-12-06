
import React, { useEffect, useRef } from 'react';
import { SessionStats } from '../types';

interface AnalyticsDashboardProps {
  stats: SessionStats;
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ stats, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Clear
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Draw Impact Circle
        const centerX = canvasRef.current.width / 2;
        const centerY = canvasRef.current.height / 2;
        const radius = 80;
        
        // Background Circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 15;
        ctx.strokeStyle = '#e5e7eb'; // gray-200
        ctx.stroke();

        // Active Arc
        const endAngle = (stats.averageAccuracy / 100) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle - Math.PI / 2);
        ctx.lineWidth = 15;
        ctx.strokeStyle = stats.averageAccuracy > 80 ? '#22c55e' : '#facc15'; // green or yellow
        ctx.lineCap = 'round';
        ctx.stroke();

        // Text
        ctx.font = 'bold 30px Inter, sans-serif';
        ctx.fillStyle = '#1f2937'; // gray-800
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(stats.averageAccuracy)}%`, centerX, centerY);
        
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#6b7280'; // gray-500
        ctx.fillText('AVG ACCURACY', centerX, centerY + 25);
      }
    }
  }, [stats]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Analytics</h2>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-800">
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
           <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 p-6 dark:bg-gray-800">
              <canvas ref={canvasRef} width={250} height={250} className="mb-4" />
           </div>

           <div className="space-y-6">
              <div className="rounded-xl border border-gray-100 bg-blue-50 p-4 dark:border-gray-700 dark:bg-blue-900/20">
                 <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">Global Impact</h3>
                 <p className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stats.impactMetric.toLocaleString()}</p>
                 <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Potential conversations bridged</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-xs text-gray-500">Translations</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalTranslations}</p>
                 </div>
                 <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-xs text-gray-500">Languages</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.languagesUsed.length}</p>
                 </div>
              </div>
              
              <div className="rounded-xl bg-gray-900 p-4 text-white dark:bg-black">
                 <p className="text-xs font-mono text-gray-400">MOST USED:</p>
                 <p className="text-lg font-bold">{stats.languagesUsed[0] || 'N/A'}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
