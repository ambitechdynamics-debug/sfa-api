import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Menu, X, ChevronRight, RefreshCw, Languages } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string, extra?: any) => void;
  onTriggerSearch: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
}

export default function Header({
  currentTab,
  onNavigate,
  onTriggerSearch,
  isLightMode,
  onToggleTheme,
}: HeaderProps) {
  const [scrollY, setScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'FR' | 'EN'>('FR');

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Modèles', id: 'models-section' },
    { label: 'Pourquoi Consilium', id: 'why-section' },
    { label: 'Tarifs', id: 'pricing-section' },
    { label: 'Indépendants & Équipes', id: 'how-it-works-section' },
  ];

  const handleLinkClick = (id: string) => {
    setIsMobileMenuOpen(false);
    onNavigate('landing');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const isScrolled = scrollY > 30;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          isScrolled
            ? isLightMode
              ? 'bg-[#FAF8F4]/80 backdrop-blur-xl border-b border-stone-200/60 h-14'
              : 'bg-[#0B0B0F]/85 backdrop-blur-md border-b border-[#26262F]/80 h-14'
            : 'bg-transparent h-20'
        } flex items-center select-none`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="relative w-8 h-8 flex items-center justify-center bg-zinc-900/50 rounded-lg p-0.5 border border-white/10 group-hover:border-violet-500/30 transition-all duration-300">
              {/* Prism logo representation */}
              <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]" viewBox="0 0 100 100">
                <polygon
                  points="50,15 85,80 15,80"
                  stroke="url(#headerPrismGrad)"
                  strokeWidth="6"
                  fill="none"
                  className="group-hover:rotate-12 transition-transform duration-500 origin-center"
                />
                <circle cx="50" cy="53" r="10" fill="#EC4899" className="animate-ping" style={{ animationDuration: '3s' }} />
                <defs>
                  <linearGradient id="headerPrismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="50%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className={`text-[16px] font-sans font-semibold tracking-tight ${isLightMode ? 'text-stone-900' : 'text-white'}`}>
                CONSILIUM
              </span>
              <span className="text-[7.5px] font-mono tracking-[0.14em] text-[#9B9BA8] uppercase">
                BY AMBITECH
              </span>
            </div>
          </div>

          {/* Desktop Nav Actions */}
          <nav className="hidden md:flex items-center gap-7">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`text-[13px] font-sans font-medium relative py-1 transition-colors ${
                  isLightMode
                    ? 'text-stone-600 hover:text-stone-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side interactions */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Search command bar shortcut */}
            <button
              onClick={onTriggerSearch}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all active:scale-95 ${
                isLightMode
                  ? 'border-stone-200 bg-stone-100/50 hover:bg-stone-200/50 text-stone-600'
                  : 'border-[#26262F] bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <span>⌘K</span>
            </button>

            {/* Language Selection */}
            <button
              onClick={() => setLanguage((prev) => (prev === 'FR' ? 'EN' : 'FR'))}
              className={`flex items-center gap-1 text-[11px] font-mono border rounded-md px-2 py-1 transition-colors ${
                isLightMode
                  ? 'border-stone-200 text-stone-600 hover:bg-stone-100'
                  : 'border-[#26262F] text-zinc-400 hover:bg-white/5'
              }`}
            >
              <Languages className="w-3 h-3" />
              <span>{language}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg border transition-all active:scale-95 ${
                isLightMode
                  ? 'border-stone-200 text-stone-700 hover:bg-stone-100'
                  : 'border-[#26262F] text-zinc-400 hover:bg-white/5'
              }`}
              title="Changer le thème"
            >
              {isLightMode ? '🌙' : '☀️'}
            </button>

            {/* Log in ghost */}
            <button
              onClick={() => onNavigate('app', { tab: 'projects' })}
              className={`text-[13px] font-sans font-semibold px-2 py-1 hover:opacity-80 transition-opacity ${
                isLightMode ? 'text-stone-800' : 'text-zinc-200'
              }`}
            >
              Se connecter
            </button>

            {/* CTA Prism Button */}
            <button
              onClick={() => onNavigate('app', { tab: 'chat' })}
              className="relative group overflow-hidden px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-magenta-600 to-amber-600 drop-shadow-[0_4px_12px_rgba(139,92,246,0.35)] hover:drop-shadow-[0_4px_16px_rgba(139,92,246,0.5)] transition-all duration-300 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-1">
                Ouvrir l&apos;app <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-violet-600 to-magenta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg border text-sm ${isLightMode ? 'border-stone-200' : 'border-[#26262F]'}`}
            >
              {isLightMode ? '🌙' : '☀️'}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg border ${
                isLightMode ? 'border-stone-200' : 'border-[#26262F] text-white'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#08080C] pt-24 px-6 flex flex-col justify-between pb-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-mono tracking-widest text-[#9B9BA8]">NAVIGATION</p>
              <div className="h-0.5 bg-gradient-to-r from-violet-600 to-transparent w-12" />
            </div>
            <nav className="flex flex-col gap-5 text-left">
              {links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className="text-2xl font-sans font-semibold text-white hover:text-violet-400 transition-colors py-1 text-left"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onTriggerSearch();
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm font-mono mt-4"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-violet-400" /> Recherche Commandes
              </span>
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">⌘K</kbd>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLanguage((prev) => (prev === 'FR' ? 'EN' : 'FR'))}
                className="py-3 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 text-center text-xs font-mono"
              >
                Langue: {language}
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('app', { tab: 'projects' });
                }}
                className="py-3 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 text-center text-xs font-semibold"
              >
                Se connecter
              </button>
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('app', { tab: 'chat' });
              }}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-violet-600 via-magenta-600 to-amber-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
            >
              Ouvrir l&apos;app <ChevronRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] font-mono text-zinc-500 text-center uppercase">
              Consilium par AmbiTech Dynamics • Hebergé en UE
            </p>
          </div>
        </div>
      )}
    </>
  );
}
