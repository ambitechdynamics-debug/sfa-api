import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Sliders, Palette, Layers, ArrowRight, Zap, Target, Shield, ChevronRight, 
  User, CheckCircle, Mail, Globe, HelpCircle, ChevronRightSquare, MessageSquare, Flame 
} from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../data/models';
import { Template } from '../types';

interface LandingPageProps {
  onNavigate: (tab: string, extra?: any) => void;
  isLightMode: boolean;
}

export default function LandingPage({ onNavigate, isLightMode }: LandingPageProps) {
  // Hero typewriter effect variables
  const ghostTexts = [
    "Flyer chic pour une soirée Jazz acoustique...",
    "Affiche minimaliste pour un vernissage d'art contemporain...",
    "Story intrigante de lancement d'une collection d'accessoires de mode...",
    "Menu moderne pour un bistrot vegan avec des couleurs chaleureuses...",
    "Carte de visite épurée pour un architecte d'intérieur parisien..."
  ];
  
  const [ghostIndex, setGhostIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Chips and interactive content selections
  const [selectedFormat, setSelectedFormat] = useState('A4');
  const [selectedModelCategory, setSelectedModelCategory] = useState<string>('Tous');
  const [selectedPlanPeriod, setSelectedPlanPeriod] = useState<'mensuel' | 'annuel'>('annuel');

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'demo', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Auto-scrambling typewriter
  useEffect(() => {
    if (isInputFocused) return; // Stop typewriter when user clicks/focuses

    let timer: NodeJS.Timeout;
    const currentFullText = ghostTexts[ghostIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setTypedText((prev) => prev.slice(0, -1));
      }, 35);
    } else {
      timer = setTimeout(() => {
        setTypedText((prev) => currentFullText.slice(0, prev.length + 1));
      }, 65);
    }

    // Handle switching states
    if (!isDeleting && typedText === currentFullText) {
      timer = setTimeout(() => setIsDeleting(true), 1500); // Wait on full sentence
    } else if (isDeleting && typedText === '') {
      setIsDeleting(false);
      setGhostIndex((prev) => (prev + 1) % ghostTexts.length);
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, ghostIndex, isInputFocused]);

  // Handle CTA Action from prompt input in hero
  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrompt = userInput.trim() || typedText || "Flyer Jazz minimaliste";
    onNavigate('app', { tab: 'chat', initialPrompt: finalPrompt, initialFormat: selectedFormat });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter models
  const modelCategories = ['Tous', 'Flyers', 'Affiches', 'Cartes', 'Réseaux', 'Menus'];
  const filteredTemplates = selectedModelCategory === 'Tous'
    ? DEFAULT_TEMPLATES
    : DEFAULT_TEMPLATES.filter((t) => t.category === selectedModelCategory);

  // Model selection integration triggers direct brief setup inside SaaS app
  const selectModelForApp = (template: Template) => {
    onNavigate('app', { tab: 'chat', predefinedTemplate: template });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Contact submit simulation
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.name) return;
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactForm({ name: '', email: '', subject: 'demo', message: '' });
    }, 4000);
  };

  return (
    <div className={`overflow-x-hidden ${isLightMode ? 'bg-[#FAF8F4] text-stone-900' : 'bg-[#0B0B0F] text-zinc-300'}`}>
      
      {/* ====================================
          2.0 HERO SECTION
          ==================================== */}
      <section className="relative min-h-screen pt-24 pb-16 flex flex-col justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />
        
        {/* Dynamic decorative backdrop grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40" />

        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text / UX interaction block */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-violet-500/10 to-transparent rounded-full border border-violet-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
              <span className="text-[11px] font-mono tracking-[0.15em] text-violet-400 font-bold uppercase">
                ● CONSILIUM IA v1.8 — AMBITECH
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-sans font-bold tracking-tight text-white leading-[1.05]">
              L&apos;application qui compose vos <span className="font-serif italic font-normal text-amber-100">visuels</span>, guidée par l&apos;
              <span className="bg-gradient-to-r from-violet-400 via-magenta-400 to-amber-400 bg-clip-text text-transparent bg-[size:200%_auto] animate-pulse">
                IA
              </span>
            </h1>

            <p className="text-[15px] md:text-[17px] text-zinc-400 max-w-xl leading-relaxed">
              Décrivez votre projet, déposez votre charte. Nos agents experts façonnent, structurent et assemblent de somptueux flyers d’un goût exquis. Sans Photoshop, sans courbe d&apos;apprentissage.
            </p>

            {/* Interactive Search-Chat Prompt Tool */}
            <form 
              onSubmit={handleHeroSubmit}
              className="bg-[#14141A] rounded-2xl border border-white/10 p-5 shadow-2xl space-y-4 max-w-2xl relative group-focus-within:border-violet-500/30 transition-all duration-300"
            >
              <div className="absolute top-0 right-12 translate-y-[-50%] bg-[#8B5CF6]/20 border border-violet-500/20 text-violet-400 font-mono text-[9px] rounded px-2 py-0.5 uppercase tracking-widest">
                Écriture naturelle libre
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 mt-1">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 space-y-1 relative">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Votre intention créative</label>
                  <div className="relative">
                    <textarea
                      rows={2}
                      className="w-full bg-transparent border-none text-[15px] font-sans text-white focus:outline-none resize-none mt-1"
                      placeholder={isInputFocused ? "Décrivez votre besoin créatif..." : ""}
                      value={userInput}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => {
                        if (!userInput) setIsInputFocused(false);
                      }}
                      onChange={(e) => setUserInput(e.target.value)}
                    />
                    {!userInput && !isInputFocused && (
                      <div className="absolute top-1 left-0 pointer-events-none text-[15px] font-sans text-zinc-500 italic max-w-md">
                        {typedText}
                        <span className="w-[1.5px] h-4 bg-violet-500 inline-block animate-pulse ml-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Format select chips chips */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">FORMATS :</span>
                {['A4', 'Story', 'Carré', 'Cartes'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`text-[11px] font-mono px-3 py-1 rounded-md transition-all active:scale-95 ${
                      selectedFormat === fmt
                        ? 'bg-gradient-to-r from-violet-600 to-magenta-600 text-white shadow-md'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Submit triggers layout action */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9.5px] font-mono text-zinc-500 hidden md:block">
                  → Le brief sera injecté directement dans l&apos;App.
                </span>
                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-2.5 rounded-full bg-white text-[#0B0B0F] font-semibold text-xs hover:bg-[#E7E7EF] active:scale-95 duration-200 shadow-lg shadow-white/5 flex items-center justify-center gap-1.5 ml-auto"
                >
                  Démarrer le projet <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>

            {/* Micro reassuring features */}
            <div className="flex items-center gap-6 text-[11px] font-mono text-zinc-500">
              <span>✓ AUCUNE CARTE E-BLEUE REQUISE</span>
              <span>•</span>
              <span>✓ EXPORT IMPRIMABLE HD</span>
              <span>•</span>
              <span>✓ SAAS HÉBERGÉ EN FRANCE</span>
            </div>
          </div>

          {/* Right Live-Composed Live Preview Animation */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            
            {/* Spinning decorative orbit light circle */}
            <div className="absolute w-80 h-80 rounded-full border border-violet-500/10 animate-spin" style={{ animationDuration: '40s' }} />
            <div className="absolute w-96 h-96 rounded-full border-dashed border-magenta-500/10 animate-spin" style={{ animationDuration: '60s' }} />

            {/* Container for the 3 layered compose previews */}
            <div className="w-full max-w-sm space-y-4 relative z-10">
              
              {/* Dynamic live simulation composite card */}
              <div className="bg-[#14141A] rounded-2xl border border-white/10 p-4 shadow-2xl relative overflow-hidden flex flex-col group hover:border-violet-500/20 transition-all">
                <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8.5px] font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/10 animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-violet-400" /> SIMULATION DE COMPOSITION IA
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-mono">1</div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">ÉTAPE: TRACE VECTORIEL ET GRILLE</span>
                </div>

                {/* Swiss template preview mock, illustrating layout tracing blueprint -> block fill -> typography flash! */}
                <div className="bg-[#0B0B0F] rounded-lg p-4 border border-zinc-900 h-48 flex flex-col justify-between relative overflow-hidden group-hover:scale-[1.01] transition-transform duration-500">
                  
                  {/* Decorative drafting grid lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.06)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-[14px] font-bold tracking-tight text-white font-serif italic animate-pulse">L&apos;horizon Paris</div>
                      <div className="text-[8px] font-mono text-zinc-500">ALIGNEMENT HORIZONTAL: CORRESPONDANCE DE CHARTE</div>
                    </div>
                    <div className="text-[8px] font-mono border border-cyan-500 text-cyan-400 px-1 py-0.5 uppercase tracking-wide">
                      A4 IMPRIMABLE
                    </div>
                  </div>

                  <div className="relative bg-violet-500/10 border border-violet-500/20 h-10 rounded flex items-center justify-center text-[10px] text-violet-300 font-mono italic animate-pulse">
                    [Placement Automatique Logo Charte]
                  </div>

                  <div className="flex items-end justify-between border-t border-zinc-800 pt-2">
                    <div className="space-y-0.5">
                      <div className="w-24 h-2 rounded bg-zinc-800 animate-pulse" />
                      <div className="w-16 h-1.5 rounded bg-zinc-900" />
                    </div>
                    <div className="w-3.5 h-3.5 bg-zinc-800 rounded-full" />
                  </div>
                </div>

                {/* Processing step captions */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Temps écoulé : 1,2s</span>
                  <span className="text-[#EC4899]">Polices appliquées... 100%</span>
                </div>
              </div>

              {/* Fast entry button */}
              <button
                onClick={() => onNavigate('app')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-xs font-semibold group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Consulter tous les modèles interactifs
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
              </button>

            </div>

          </div>

        </div>
      </section>

      {/* ====================================
          2.1 CLIENT MARQUEE BANNER
          ==================================== */}
      <section className="bg-zinc-950/60 border-y border-white/5 py-8 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto px-4 text-center mb-4">
          <p className="text-[10px] font-mono tracking-[0.18em] text-zinc-500 uppercase">
            Ils créent des designs somptueux avec les outils Consilium
          </p>
        </div>
        
        {/* Infinite scrolling marquee mock with cool local animation */}
        <div className="flex gap-12 items-center justify-center overflow-x-auto py-2 scrollbar-none opacity-50 hover:opacity-80 transition-opacity">
          {['Ambitech Dynamics', 'Lumen Studio', 'Paris Artisan', 'Avenir Media', 'Noria Digital', 'Studio Brut', 'Maison Levain'].map((logo, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 whitespace-nowrap px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
              <span>▩</span>
              <span>{logo}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================
          2.2 WHY CONSILIUM (BENTO GRID)
          ==================================== */}
      <section id="why-section" className="py-24 max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Section Header */}
        <div className="text-left max-w-3xl space-y-4 mb-16">
          <p className="text-xs font-mono text-violet-400 tracking-[0.15em] font-bold uppercase">
            ● UN STUDIO CONVERSATIONNEL D&apos;EXCELLENCE
          </p>
          <h2 className="text-3xl md:text-5xl font-sans font-semibold text-white tracking-tight">
            Moins de tâtonnements, <br />un <span className="font-serif italic font-normal text-amber-100">rendu impeccable</span>.
          </h2>
          <p className="text-zinc-400 font-sans text-sm md:text-base">
            Consilium n&apos;est pas une banque d&apos;images froides ni un créateur automatique bâclé. C&apos;est un studio piloté par des agents coordonnés qu&apos;on ajuste par le dialogue.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Bento Card 1: Chat interface representation */}
          <div className="md:col-span-8 bg-[#14141A] rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col justify-between hover:border-violet-500/20 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/5 rounded-full blur-[80px]" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center p-1 border border-violet-500/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-sans font-semibold text-white">IA Conversationnelle & Dialogue Structuré</h3>
              <p className="text-zinc-400 text-xs md:text-sm max-w-xl leading-relaxed">
                Décrivez simplement votre besoin en français. Le Conseiller Lumineux de Consilium clarifie vos objectifs (public ciblé, format, ton) au moyen de questions épurées, puis passe le relais aux agents de mise en page. Vous ne ferez plus jamais face à la terreur de la page blanche.
              </p>
            </div>

            {/* Micro chat conversation preview simulation */}
            <div className="mt-8 bg-[#0B0B0F]/90 rounded-xl p-4 border border-zinc-900 text-xs font-sans space-y-3 max-w-lg">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] text-white">🤖</span>
                <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg p-2.5 max-w-xs">
                  Bonjour ! Je vois que vous désirez créer un flyer pour votre <span className="text-amber-300">boulangerie artisanale</span>. Souhaitez-vous mettre en avant un produit phare (ex: croissants) ou une formule petit-déjeuner ?
                </div>
              </div>
              <div className="flex gap-2.5 justify-end">
                <div className="bg-violet-500/20 text-violet-200 rounded-lg p-2.5 max-w-xs border border-violet-500/30">
                  Le pain au levain bio ! Et je veux une ambiance très rustique, élégante et épurée.
                </div>
                <span className="w-5 h-5 rounded-full bg-violet-900 flex items-center justify-center text-[10px] text-white">👤</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: 12000 models */}
          <div className="md:col-span-4 bg-[#14141A] rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col justify-between hover:border-magenta-500/20 transition-all relative">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-magenta-500/10 text-magenta-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-sans font-semibold text-white">Précision Suisse</h3>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                Des compositions impeccablement alignées sur une grille typographique exigeante, prêtes pour l&apos;imprimerie ou le partage instantané.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex items-baseline gap-2 font-mono">
              <span className="text-4xl font-bold text-white tabular-nums">12 480</span>
              <span className="text-xs text-[#9B9BA8]">COMPOSITIONS STRUCTURÉES</span>
            </div>
          </div>

          {/* Bento Card 3: Brand space */}
          <div className="md:col-span-6 bg-[#14141A] rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col justify-between hover:border-cyan-500/20 transition-all group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-sans font-semibold text-white">Respect strict de la Charte de Marque</h3>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                Déposez vos palettes, configurez vos coordonnées et importez vos logos une seule fois. Nos agents IA analysent ces éléments et s&apos;assurent que chaque création déclinée respecte rigoureusement vos codes de marque.
              </p>
            </div>

            {/* Palette swatch simulator */}
            <div className="flex gap-2.5 mt-6">
              {['#8B5CF6', '#EC4899', '#F59E0B', '#22D3EE', '#0B0B0F'].map((color) => (
                <div key={color} className="flex-1 flex flex-col gap-1">
                  <div className="h-10 rounded-md border border-white/10" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-zinc-500 font-mono text-center">{color}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Card 4: Security */}
          <div className="md:col-span-6 bg-[#14141A] rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col justify-between hover:border-amber-500/20 transition-all">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-sans font-semibold text-white">Cloud Souverain & Chiffrement Européen</h3>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                Chez Consilium, vos projets de communication restent confidentiels. Vos logos et sauvegardes sont stockés en sécurité sur nos partitions cloud chiffrées en France (RGPD). Aucun visuel n&apos;est utilisé publiquement sans accord.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase bg-[#0B0B0F] p-2 rounded-lg border border-white/5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              <span>Conforme Règlement EU 2016/679</span>
            </div>
          </div>

        </div>

      </section>

      {/* ====================================
          2.3 BIBLIOTHÈQUE DE MODÈLES INTERACTIFS
          ==================================== */}
      <section id="models-section" className="py-24 bg-zinc-950/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          {/* Title Area */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4 text-left">
              <p className="text-xs font-mono text-violet-400 tracking-[0.15em] font-bold uppercase">
                ● BIBLIOTHÈQUE OFFICIELLE
              </p>
              <h2 className="text-3xl md:text-5xl font-sans font-semibold text-white tracking-tight">
                Recherchez par <span className="font-serif italic font-normal text-amber-100">usage</span>
              </h2>
              <p className="text-zinc-400 text-xs md:text-sm max-w-xl">
                Parcourez nos compositions de référence de haute qualité. Cliquez sur l&apos;un d&apos;eux pour l&apos;utiliser instantanément comme base de brief pour l&apos;IA.
              </p>
            </div>

            {/* Categorization Swatches Swatches */}
            <div className="flex flex-wrap gap-2">
              {modelCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedModelCategory(cat)}
                  className={`text-xs font-mono px-4 py-1.5 rounded-full border transition-all active:scale-95 ${
                    selectedModelCategory === cat
                      ? 'border-violet-500 bg-violet-500/10 text-white font-medium'
                      : 'border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Model cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => (
              <div 
                key={tpl.id}
                onClick={() => selectModelForApp(tpl)}
                className="group bg-[#14141A] rounded-xl border border-white/10 hover:border-violet-500/30 overflow-hidden shadow-xl hover:shadow-2xl transition-all text-left flex flex-col justify-between cursor-pointer h-80"
              >
                {/* SVG model render preview */}
                <div className={`h-48 relative ${tpl.bgClass} flex flex-col justify-between p-4 overflow-hidden`}>
                  {/* Category format badge */}
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] font-mono uppercase bg-white/15 text-white px-2 py-0.5 rounded tracking-widest leading-none border border-white/10">
                      {tpl.format}
                    </span>
                    <span className={`text-[9px] font-mono uppercase rounded px-1.5 py-0.5 ${
                      tpl.plan === 'Free' ? 'bg-zinc-800 text-zinc-400' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                    }`}>
                      {tpl.plan}
                    </span>
                  </div>

                  {/* Visual mockup helper */}
                  <div className="space-y-1 z-10">
                    <p className="text-[14px] font-serif tracking-tight font-semibold line-clamp-1 opacity-90">
                      {tpl.elements.find(e => e.type === 'text')?.content || tpl.name}
                    </p>
                    <p className="text-[9px] font-mono opacity-60">
                      Modèle pré-configuré {tpl.category}
                    </p>
                  </div>

                  {/* Gradient bottom fog */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Footer text of card */}
                <div className="p-4 bg-[#101016] flex-1 flex flex-col justify-between border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        {tpl.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Format initial : {tpl.format} • {tpl.elements.length} couches éditables
                      </p>
                    </div>
                  </div>

                  {/* Trigger call */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-violet-400 font-mono group-hover:text-white transition-colors">
                    <span>DÉMARRER AVEC L&apos;IA</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick link button to App */}
          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigate('app')}
              className="inline-flex items-center justify-center gap-2 text-xs font-mono text-zinc-400 hover:text-white hover:underline group"
            >
              <span>Accéder directement à l&apos;ensemble de la bibliothèque créative</span>
              <ArrowRight className="w-4 h-4 text-violet-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </section>

      {/* ====================================
          2.4 SEGMENTS (POUR QUI ?)
          ==================================== */}
      <section id="how-it-works-section" className="py-24 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Indépendants / Createurs card */}
          <div className="bg-[#14141A] rounded-2xl border border-white/10 p-8 flex flex-col justify-between text-left space-y-6 hover:border-violet-500/20 transition-all">
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-widest text-violet-400 uppercase bg-[#0B0B0F] px-2.5 py-1 rounded inline-block border border-white/5">
                CRÉATEURS & INDÉPENDANTS
              </span>
              <h3 className="text-2xl font-sans font-semibold text-white">Pour ceux qui veulent de beaux visuels, vite.</h3>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                Idéal pour les commerçants de quartier, restaurateurs, coachs, créateurs de contenus et indépendants sans budget agence. Expliquez votre idée, nos agents composent plusieurs propositions uniques en moins de deux minutes.
              </p>
              
              <ul className="space-y-2.5 text-xs text-zinc-400 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Discussion naturelle guided en français</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Éditeur de canevas simple pour ajuster sans peiner</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Exports PDF, WebP et PNG HD conformes</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('app', { tab: 'chat' })}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#E7E7EF] active:scale-95 duration-200"
            >
              Faire mon premier essai maintenant
            </button>
          </div>

          {/* Teams / Corporate card */}
          <div className="bg-[#14141A] rounded-2xl border border-white/10 p-8 flex flex-col justify-between text-left space-y-6 hover:border-magenta-500/20 transition-all">
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-widest text-[#EC4899] uppercase bg-[#0B0B0F] px-2.5 py-1 rounded inline-block border border-white/5">
                ENTREPRISES & MULTI-MARQUES
              </span>
              <h3 className="text-2xl font-sans font-semibold text-white">Pour les équipes marketing engagées.</h3>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                Gérez simultanément de nombreuses identités de marque, stockez les logos et slogans séparément et collaborez en temps réel. Les agentsIA respectent scrupuleusement les exigences strictes de la charte de l&apos;équipe.
              </p>
              
              <ul className="space-y-2.5 text-xs text-zinc-400 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#EC4899] shrink-0" />
                  <span>Silos d&apos;identités de marque séparés pour vos marques</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#EC4899] shrink-0" />
                  <span>Déclinaisons multiples automatiques d&apos;un brief</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#EC4899] shrink-0" />
                  <span>Exports CMJN 300dpi de qualité d&apos;imprimerie</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                const element = document.getElementById('contact-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-magenta-600 to-amber-600 text-white font-semibold text-xs active:scale-95 duration-200"
            >
              Demander une démonstration d&apos;équipe
            </button>
          </div>

        </div>
      </section>

      {/* ====================================
          2.5 HOW IT WORKS (3 STEPS & AGENTS DESIGN)
          ==================================== */}
      <section className="py-24 bg-zinc-950/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-12">
          
          <div className="text-left max-w-2xl space-y-3 mb-12">
            <p className="text-xs font-mono text-violet-400 tracking-[0.15em] font-bold uppercase">
              ● FONCTIONNEMENT
            </p>
            <h2 className="text-3xl md:text-5xl font-sans font-semibold text-white tracking-tight">
              Trois étapes. <span className="font-serif italic font-normal text-amber-100">Pas plus</span>.
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm">
              Voici comment la métaphore mécanique de notre prisme se matérialise pour structurer vos chefs-d&apos;œuvre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            
            {/* Step 1 */}
            <div className="space-y-4">
              <span className="text-4xl md:text-5xl font-mono font-bold text-zinc-700 block">01</span>
              <h3 className="text-lg font-sans font-semibold text-white">Préparez l&apos;intention créative</h3>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                Décrivez votre visuel dans l&apos;atelier de chat. Notre IA structure ces informations, vous propose des mots clés d&apos;inspiration et pré-renseigne les polices et formats.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <span className="text-4xl md:text-5xl font-mono font-bold text-zinc-700 block text-violet-500">02</span>
              <h3 className="text-lg font-sans font-semibold text-white">Les Agents IA se mobilisent</h3>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                Quatre agents collaboratifs (le Planificateur de structure, l&apos;analyste de Charte, le Prompt Designer et l&apos;Architecte d&apos;alignement) travaillent de concert pour modeler des propositions harmonieuses.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <span className="text-4xl md:text-5xl font-mono font-bold text-zinc-700 block text-cyan-400">03</span>
              <h3 className="text-lg font-sans font-semibold text-white">Édition libre & Export HD</h3>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                Sélectionnez une composition, rectifiez les phrases et déplacez les badges dans l&apos;éditeur de canevas avant de télécharger au format PDF d&apos;impression CMJN.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================
          2.6 TARIFS (PRICING CHOP WITH MORPHING)
          ==================================== */}
      <section id="pricing-section" className="py-24 max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <p className="text-xs font-mono text-violet-400 tracking-[0.15em] font-bold uppercase">
            ● TARIFS
          </p>
          <h2 className="text-3xl md:text-5xl font-sans font-semibold text-white tracking-tight">
            Plans simples. Sans <span className="font-serif italic font-normal text-amber-100">frais cachés</span>.
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm max-w-md mx-auto">
            Conserver une traçabilité claire de vos impressions et travaux sur vos différentes marques.
          </p>

          {/* Toggle morphing periodizer */}
          <div className="inline-flex items-center gap-1.5 bg-[#14141A] border border-white/5 p-1 rounded-full mt-4">
            <button
              onClick={() => setSelectedPlanPeriod('mensuel')}
              className={`text-xs font-mono px-4 py-1.5 rounded-full transition-all ${
                selectedPlanPeriod === 'mensuel'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setSelectedPlanPeriod('annuel')}
              className={`text-xs font-mono px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                selectedPlanPeriod === 'annuel'
                  ? 'bg-gradient-to-r from-violet-600 to-magenta-600 text-white font-semibold shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Annuel <span className="bg-white/10 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">−20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-6">
          
          {/* Plan 1 */}
          <div className="bg-[#14141A] rounded-2xl border border-white/10 p-6 flex flex-col justify-between text-left space-y-6">
            <div className="space-y-3">
              <h4 className="text-lg font-sans font-semibold text-white">Découverte</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Pour essayer le moteur Consilium, idéal pour tester la création de votre tout premier flyer de boutique.
              </p>
              <div className="py-4 border-y border-white/5 flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-bold text-white tracking-tighter">0€</span>
                <span className="text-zinc-500 text-xs uppercase">/ gratuit standard</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-400 pt-2">
                <li>• 3 générations par mois de test</li>
                <li>• 1 Kit de marque standard</li>
                <li>• Format d&apos;export standard PNG</li>
                <li>• Support d&apos;équipe communautaire</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('app', { tab: 'chat' })}
              className="w-full py-2.5 rounded-lg bg-zinc-800 text-white font-semibold text-xs hover:bg-zinc-700"
            >
              Lancer gratuitement
            </button>
          </div>

          {/* Plan 2: Recommended */}
          <div className="bg-[#14141A] rounded-2xl border border-[#8B5CF6] p-6 flex flex-col justify-between text-left space-y-6 relative">
            <div className="absolute top-0 right-1/2 translate-y-[-50%] translate-x-[50%] bg-gradient-to-r from-violet-600 to-magenta-600 text-white text-[9px] font-mono tracking-widest font-bold uppercase rounded-full px-4 py-1 border border-violet-400/30">
              ● RECOMMANDÉ PAR LA COMMUNAUTÉ
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-sans font-semibold text-white">Formule Pro</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Le choix indéniable des commerçants et professionnels autonomes désireux d&apos;alimenter leur marque.
              </p>
              <div className="py-4 border-y border-white/5 flex items-baseline gap-1 font-mono">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-magenta-400 tracking-tighter">
                  {selectedPlanPeriod === 'annuel' ? '10€' : '15€'}
                </span>
                <span className="text-zinc-500 text-xs uppercase">/ par mois</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-400 pt-2">
                <li className="text-violet-400 font-semibold">• Générations illimitées d&apos;images</li>
                <li>• 5 Kits de marques distinctes</li>
                <li>• Export PDF CMJN haute définition</li>
                <li>• Pas de filigranes ni restrictions</li>
                <li>• Support premium garanti (24h)</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('app', { tab: 'chat' })}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 via-magenta-600 to-amber-600 text-white font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              Essayer gratuitement pendant 14 jours
            </button>
          </div>

          {/* Plan 3 */}
          <div className="bg-[#14141A] rounded-2xl border border-white/10 p-6 flex flex-col justify-between text-left space-y-6">
            <div className="space-y-3">
              <h4 className="text-lg font-sans font-semibold text-white">Studio Équipes</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Pour les agences de communication, franchises, et équipes marketing d&apos;envergure.
              </p>
              <div className="py-4 border-y border-white/5 flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-bold text-white tracking-tighter">
                  {selectedPlanPeriod === 'annuel' ? '26€' : '35€'}
                </span>
                <span className="text-zinc-500 text-xs uppercase">/ par mois</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-400 pt-2">
                <li>• Tout l&apos;écosystème Pro compris</li>
                <li>• Nombre de marques illimitées</li>
                <li>• Gestion des collaborateurs & validation</li>
                <li>• API Consilium dédiée pour connexions</li>
                <li>• Manager d&apos;onboarding attitré</li>
              </ul>
            </div>
            <button
              onClick={() => {
                const element = document.getElementById('contact-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full py-2.5 rounded-lg bg-zinc-800 text-white font-semibold text-xs hover:bg-zinc-700"
            >
              Contacter le support commercial
            </button>
          </div>

        </div>

      </section>

      {/* ====================================
          2.7 TÉMOIGNAGES (AVIS)
          ==================================== */}
      <section className="py-24 bg-zinc-950/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-12">
          
          <div className="text-left max-w-2xl space-y-3">
            <p className="text-xs font-mono text-violet-400 tracking-[0.15em] font-bold uppercase">
              ● RETOUR EXPÉRIENCES
            </p>
            <h2 className="text-3xl md:text-5xl font-sans font-semibold text-white tracking-tight">
              Des retours <span className="font-serif italic font-normal text-amber-100">hautement élogieux</span>.
            </h2>
          </div>

          {/* Testimonial grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            <div className="bg-[#14141A] rounded-xl border border-white/5 p-6 space-y-4">
              <p className="font-serif italic text-zinc-300 text-base leading-relaxed">
                « Les baguettes de notre boulangerie ont enfin des visuels publicitaires à la hauteur de leur craquant ! En 3 phrases de brief, Consilium propose un flyer A4 rustique d&apos;une beauté pure. »
              </p>
              <div>
                <p className="text-xs font-mono font-bold text-white uppercase">Léa Martin</p>
                <p className="text-[10px] text-zinc-500 uppercase">Artisane boulangère, Le Moulin Doré</p>
              </div>
            </div>

            <div className="bg-[#14141A] rounded-xl border border-white/5 p-6 space-y-4">
              <p className="font-serif italic text-zinc-300 text-base leading-relaxed">
                « Un standard à la Suisse. Les grilles d&apos;alignement typographique sont d&apos;une rigueur exceptionnelle. Consilium a remplacé les templates canva fatigués au profit d&apos;une identité tranchante. »
              </p>
              <div>
                <p className="text-xs font-mono font-bold text-white uppercase">Karim Benali</p>
                <p className="text-[10px] text-zinc-500 uppercase">Directeur Artistique, Lumen Studio</p>
              </div>
            </div>

            <div className="bg-[#14141A] rounded-xl border border-white/5 p-6 space-y-4">
              <p className="font-serif italic text-zinc-300 text-base leading-relaxed">
                « J&apos;avais peur que l&apos;IA ne produise des caricatures, mais l&apos;intégration des logos et couleurs en brand kit fonctionne impeccablement bien. Je recommande la formule Pro de Consilium. »
              </p>
              <div>
                <p className="text-xs font-mono font-bold text-white uppercase">Émilie Rousseau</p>
                <p className="text-[10px] text-zinc-500 uppercase">Consultante en communication indépendante</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================
          2.8 CONTACT FORM (WITH ANIMATED SUCCESS CHECKBOX)
          ==================================== */}
      <section id="contact-section" className="py-24 max-w-4xl mx-auto px-4">
        
        <div className="bg-[#14141A] rounded-2xl border border-white/10 p-8 text-left space-y-6 relative shadow-2xl overflow-hidden">
          
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3">
            <p className="text-xs font-mono text-violet-400 tracking-[0.14em] uppercase block">● PARLONS DE VOS PROJETS</p>
            <h3 className="text-2xl md:text-3.5xl font-sans font-bold text-white leading-tight">Une interrogation ? Une demande de démo ?</h3>
            <p className="text-zinc-400 text-xs md:text-sm">
              L&apos;équipe d&apos;ingénieurs d&apos;AmbiTech Dynamics est à votre écoute pour configurer votre solution au sein de votre régie publicitaire.
            </p>
          </div>

          {contactSuccess ? (
            <div className="border border-emerald-500/20 bg-emerald-500/10 rounded-xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-white font-sans">Message transmis avec succès !</h4>
              <p className="text-zinc-400 text-xs font-mono max-w-md mx-auto">
                Un expert de la cellule AmbiTech Dynamics ou Consilium se manifestera par email sous 24h ouvrées. Merci pour votre intérêt.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Votre nom complet</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Camille Giraud"
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg py-2.5 px-4 text-xs font-sans text-white focus:outline-none focus:border-violet-500"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Votre Email Professionnel</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: camille@e-boulangerie.fr"
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg py-2.5 px-4 text-xs font-sans text-white focus:outline-none focus:border-violet-500"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Sujet de la demande</label>
                <select
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg py-2.5 px-4 text-xs font-sans text-white focus:outline-none focus:border-violet-500"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                >
                  <option value="demo">Démonstration de la formule d&apos;équipe Studio</option>
                  <option value="api">Intégration technique API Enterprise</option>
                  <option value="support">Question d&apos;ordre général / Presse</option>
                  <option value="custom">Autre demande sur nos serveurs</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider text-[#9B9BA8] uppercase block">Détails de votre intention créative</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Expliquez-nous brièvement le type de visuels que vous gérez ou les challenges de votre équipe marketing..."
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg py-2.5 px-4 text-xs font-sans text-white focus:outline-none focus:border-violet-500 resize-none"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors active:scale-95 duration-150 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Envoyer la demande sécurisée
              </button>

            </form>
          )}

        </div>

      </section>

      {/* ====================================
          2.9 FINAL CALL TO ACTION (CTA)
          ==================================== */}
      <section className="py-28 relative overflow-hidden bg-[radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.12),transparent_60%)] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8 relative z-10">
          
          <div className="inline-flex p-3 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/25 animate-bounce mb-2">
            <Zap className="w-6 h-6" />
          </div>

          <h2 className="text-3xl md:text-6xl font-sans font-bold text-white tracking-tight leading-[1.05]">
            Votre prochain visuel est à <br /><span className="bg-gradient-to-r from-violet-400 via-magenta-400 to-amber-400 bg-clip-text text-transparent italic font-serif">une phrase d&apos;ici</span>.
          </h2>

          <p className="text-zinc-400 text-xs md:text-sm max-w-lg mx-auto">
            Esssayez notre Conseiller Lumineux gratuitement. Découvrez une vitesse de composition sans précédent de vos flyers déclinables.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                onNavigate('app', { tab: 'chat' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-[#E7E7EF] active:scale-95 duration-200 shadow-xl flex items-center justify-center gap-1.5"
            >
              Créer mon premier flyer <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('pricing-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#14141A] text-zinc-300 font-semibold text-xs border border-white/10 hover:border-white/25 active:scale-95 duration-200"
            >
              Voir les plans de prix
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}
