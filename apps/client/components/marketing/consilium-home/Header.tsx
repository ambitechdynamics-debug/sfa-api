import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { ConsiliumPrismLogo } from '@/components/brand/ConsiliumPrismLogo';

interface HeaderProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export default function Header({ onNavigate }: HeaderProps) {
  const [scrollY, setScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Models', id: 'models-section' },
    { label: 'Why Consilium', id: 'why-section' },
    { label: 'Pricing', id: 'pricing-section' },
    { label: 'Teams', id: 'how-it-works-section' },
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
            ? 'bg-[#0B0B0F]/85 backdrop-blur-md border-b border-[#26262F]/80 h-14'
            : 'bg-transparent h-20'
        } flex items-center select-none`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 cursor-pointer group active:scale-95 transition-transform"
          >
            <ConsiliumPrismLogo size={32} />
            <div className="flex flex-col">
              <span className="text-[16px] font-sans font-semibold tracking-tight text-white">
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
                className="text-[13px] font-sans font-medium relative py-1 transition-colors text-zinc-400 hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side interactions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => onNavigate('app', { tab: 'projects' })}
              className="text-[13px] font-sans font-semibold px-2 py-1 hover:opacity-80 transition-opacity text-zinc-200"
            >
              essai gratuit
            </button>

            <button
              onClick={() => onNavigate('app', { tab: 'chat' })}
              className="relative group overflow-hidden px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-magenta-600 to-amber-600 drop-shadow-[0_4px_12px_rgba(139,92,246,0.35)] hover:drop-shadow-[0_4px_16px_rgba(139,92,246,0.5)] transition-all duration-300 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-1">
                Open app <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-violet-600 to-magenta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg border border-[#26262F] text-white"
              aria-label="Open navigation"
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
          </div>

          <div className="space-y-4">
            <div className="grid gap-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('app', { tab: 'projects' });
                }}
                className="py-3 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 text-center text-xs font-semibold"
              >
                essai gratuit
              </button>
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('app', { tab: 'chat' });
              }}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-violet-600 via-magenta-600 to-amber-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
            >
              Open app <ChevronRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] font-mono text-zinc-500 text-center uppercase">
              Consilium by AmbiTech Dynamics • Hosted in the EU
            </p>
          </div>
        </div>
      )}
    </>
  );
}
