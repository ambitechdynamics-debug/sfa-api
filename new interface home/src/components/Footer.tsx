import React from 'react';
import { HelpCircle, Shield, FileText, Compass, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string, extra?: any) => void;
  isLightMode: boolean;
}

export default function Footer({ onNavigate, isLightMode }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'PRODUIT',
      links: [
        { label: 'Modèles IA', action: 'models-section', type: 'scroll' },
        { label: 'Tarifs transparents', action: 'pricing-section', type: 'scroll' },
        { label: 'Cas d’usage', action: 'why-section', type: 'scroll' },
        { label: 'Ouvrir l’atelier', action: 'app', type: 'navigate', extra: { tab: 'chat' } },
        { label: 'Brand Kit manager', action: 'app', type: 'navigate', extra: { tab: 'brand' } },
      ],
    },
    {
      title: 'ENTREPRISE',
      links: [
        { label: 'À propos Consilium', action: 'why-section', type: 'scroll' },
        { label: 'AmbiTech Dynamics', action: 'https://ai.studio/build', type: 'external' },
        { label: 'Hébergement en UE', action: 'why-section', type: 'scroll' },
        { label: 'Contact', action: 'contact-section', type: 'scroll' },
      ],
    },
    {
      title: 'RESSOURCES',
      links: [
        { label: 'Rapports techniques', action: 'why-section', type: 'scroll' },
        { label: 'Guide de Prompting', action: 'app', type: 'navigate', extra: { tab: 'chat' } },
        { label: 'Mentions légales', action: 'legal-modal', type: 'custom' },
        { label: 'Confidentialité RGPD', action: 'privacy-modal', type: 'custom' },
      ],
    },
  ];

  const handleLinkClick = (link: any) => {
    if (link.type === 'scroll') {
      const element = document.getElementById(link.action);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (link.type === 'navigate') {
      onNavigate(link.action, link.extra);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.type === 'external') {
      window.open(link.action, '_blank', 'noopener,noreferrer');
    } else if (link.type === 'custom') {
      alert(`Consilium info: Nos documents de ${link.label} sont conformes au RGPD et certifiés par AmbiTech Dynamics en mai 2026.`);
    }
  };

  return (
    <footer
      className={`border-t relative overflow-hidden transition-colors ${
        isLightMode
          ? 'bg-[#FAF8F4] border-stone-200 text-stone-900'
          : 'bg-[#0B0B0F] border-white/5 text-zinc-400'
      }`}
    >
      {/* Decorative spectrum glow watermark */}
      <div className="absolute right-0 bottom-0 w-80 h-80 bg-gradient-to-r from-violet-600/10 via-magenta-600/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 relative z-10">
        
        {/* Main Columns Grid Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Logo brand and bio column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xl font-sans font-bold tracking-tight ${isLightMode ? 'text-stone-900' : 'text-white'}`}>
                CONSILIUM
              </span>
              <span className="text-[10px] font-mono uppercase bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded">
                PRO IA
              </span>
            </div>
            
            <p className="text-zinc-500 text-xs font-sans leading-relaxed max-w-sm">
              L&apos;expérience applicative haut de gamme de création visuelle et de briefs marketing.
              Propulsé par la métaphore créative du Prisme d&apos;AmbiTech Dynamics.
            </p>

            <div className="pt-2 text-[11px] text-zinc-500 font-mono tracking-wider space-y-1">
              <span className="block">● SERVEUR SÉCURISÉ EN FRANCE</span>
              <span className="block">● CONFORMITÉ RGPD EU-2026</span>
            </div>
          </div>

          {/* Render category links */}
          {footerLinks.map((cat) => (
            <div key={cat.title} className="space-y-3">
              <p className={`text-[10px] font-mono font-bold tracking-widest ${isLightMode ? 'text-stone-500' : 'text-zinc-500'}`}>
                {cat.title}
              </p>
              <ul className="space-y-2 text-xs">
                {cat.links.map((link, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleLinkClick(link)}
                      className={`font-sans hover:underline focus:outline-none text-left flex items-center gap-0.5 ${
                        isLightMode
                          ? 'text-stone-600 hover:text-stone-950'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {link.label}
                      {link.type === 'external' && <ExternalLink className="w-2.5 h-2.5" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Separator line */}
        <div className={`h-[1px] w-full my-8 ${isLightMode ? 'bg-stone-200' : 'bg-white/5'}`} />

        {/* Bottom credits */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-2 text-center md:text-left">
            <span>© {currentYear} Consilium, Inc. Tous droits réservés.</span>
            <span className="hidden md:inline">•</span>
            <span>Spécification AmbiTech Dynamics ⚡</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hover:text-violet-400 transition-colors cursor-pointer">Serveurs stables (99.9%)</span>
            <span>•</span>
            <span className="text-white hover:text-violet-400 cursor-pointer" onClick={() => onNavigate('app')}>
              Accéder à l&apos;Atelier →
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
