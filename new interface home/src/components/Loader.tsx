import React, { useState, useEffect } from 'react';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [percent, setPercent] = useState(0);
  const [scrambleIndex, setScrambleIndex] = useState(0);
  const words = ['DES MOTS.', 'DES VISUELS.', 'LA CRÉATION.', 'L’INTENTION.', 'CONSILIUM BIENVENUE.'];

  useEffect(() => {
    // Percentage ticker
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const step = Math.floor(Math.random() * 8) + 3;
        return Math.min(prev + step, 100);
      });
    }, 70);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Words scramble/rotation
    const wordInterval = setInterval(() => {
      setScrambleIndex((prev) => (prev + 1) % words.length);
    }, 550);

    return () => wordInterval;
  }, []);

  useEffect(() => {
    if (percent === 100) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [percent, onComplete]);

  return (
    <div className="fixed inset-0 bg-[#08080C] z-[100] flex flex-col justify-between p-8 overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)] pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-50" />

      {/* Top row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-amber-500 animate-pulse" />
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#9B9BA8] uppercase">
            AmbiTech Dynamics
          </span>
        </div>
        <button
          onClick={onComplete}
          className="text-xs font-mono tracking-[0.08em] text-[#9B9BA8] hover:text-white transition-colors duration-200 border border-white/10 hover:border-white/30 rounded-full px-4 py-1.5 bg-white/5 active:scale-95 duration-150"
        >
          Passer / Skip [Esc]
        </button>
      </div>

      {/* Center 3D/2D Prism Animation */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-12">
        <div className="relative w-72 h-72 flex items-center justify-center">
          {/* Glowing refracted light beams */}
          <div 
            className="absolute inset-0 opacity-40 transition-all duration-[2000ms] ease-out pointer-events-none"
            style={{
              background: `linear-gradient(${percent * 3.6}deg, transparent 40%, rgba(139,92,246,0.3) 48%, rgba(236,72,153,0.3) 50%, rgba(245,158,11,0.2) 52%, transparent 60%)`,
              filter: 'blur(30px)',
            }}
          />

          {/* Core SVG Geometric Tracing Prism */}
          <svg className="w-48 h-48 drop-shadow-[0_0_35px_rgba(139,92,246,0.25)]" viewBox="0 0 100 100">
            {/* Base white ray entering from left */}
            <path
              d="M 5,50 L 40,50"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeDasharray="100"
              strokeDashoffset={Math.max(100 - percent * 2.5, 0)}
              fill="none"
              className="transition-all duration-300"
            />

            {/* Tracing glass triangle (The Prism) */}
            <polygon
              points="50,15 80,75 20,75"
              stroke="url(#prismGrad)"
              strokeWidth="1.5"
              fill="rgba(28,28,36,0.4)"
              strokeDasharray="300"
              strokeDashoffset={Math.max(300 - percent * 3, 0)}
              className="transition-all duration-500"
            />

            {/* Glowing inner core */}
            <polygon
              points="50,22 75,71 25,71"
              fill="url(#innerCore)"
              className="opacity-20 transition-opacity duration-1000"
              style={{ opacity: percent > 60 ? 0.25 : 0 }}
            />

            {/* Spectrums exiting from right (Refraction) */}
            {percent > 50 && (
              <>
                <path
                  d="M 52,50 Q 64,48 95,20"
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                  fill="none"
                  className="opacity-80 animate-pulse"
                />
                <path
                  d="M 52,50 Q 66,51 95,35"
                  stroke="#EC4899"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M 52,50 Q 68,54 95,50"
                  stroke="#FB7185"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M 52,50 Q 66,57 95,65"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M 52,50 Q 64,60 95,80"
                  stroke="#22D3EE"
                  strokeWidth="1.5"
                  fill="none"
                  className="opacity-90 animate-pulse"
                />
              </>
            )}

            <defs>
              <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="innerCore" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Word Scramble/Ticker */}
        <div className="mt-8 h-8 flex items-center">
          <p className="text-xl font-mono text-[#E7E7EF] font-medium tracking-widest text-center animate-pulse">
            {words[scrambleIndex]}
          </p>
        </div>
      </div>

      {/* Bottom row layout */}
      <div className="flex md:flex-row flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 relative z-10">
        <div>
          <span className="text-[12px] font-mono tracking-wider text-[#9B9BA8]">
            CONSILIUM — SYSTEME CRÉATIF PRISMATIQUE V1.0
          </span>
        </div>
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-[12px] text-[#9B9BA8]">RAYONS CONFLUES :</span>
          <span className="text-5xl md:text-6xl font-semibold tracking-tighter text-white font-mono tabular-nums">
            {percent === 100 ? '100' : percent.toString().padStart(2, '0')}%
          </span>
        </div>
      </div>
    </div>
  );
}
