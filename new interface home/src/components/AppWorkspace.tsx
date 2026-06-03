import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Sliders, Palette, Layers, ArrowRight, Zap, Target, Shield, 
  ChevronRight, User, CheckCircle, Mail, Globe, HelpCircle, SlidersHorizontal,
  Download, Layers2, Plus, Trash2, Undo2, RotateCcw, Upload, RefreshCw, X, Check,
  Sparkle, AlertCircle, Heart, Folder, Settings, Menu, Moon, Sun, ArrowLeft
} from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../data/models';
import { Template, Project, CanvasElement, Message, BrandKit } from '../types';

interface AppWorkspaceProps {
  isLightMode: boolean;
  predefinedTemplateQuery?: Template | null;
  initialPromptQuery?: string;
  initialFormatQuery?: string;
  onNavigateHome: () => void;
}

export default function AppWorkspace({
  isLightMode,
  predefinedTemplateQuery,
  initialPromptQuery,
  initialFormatQuery,
  onNavigateHome
}: AppWorkspaceProps) {
  
  // ----------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<'projects' | 'chat' | 'editor' | 'brand' | 'models'>('projects');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Saved Projects Database
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'proj-1',
      name: 'Affiche Soirée Jazz Impro',
      createdAt: '30 Mai 2026',
      format: 'A4',
      templateId: 'jazz-festival-a4',
      bgClass: 'from-[#0B0B0F] via-[#14141A] to-[#20182C] bg-gradient-to-br border border-white/5',
      elements: [...DEFAULT_TEMPLATES[0].elements]
    },
    {
      id: 'proj-2',
      name: 'Flyer Boulangerie Levain',
      createdAt: '28 Mai 2026',
      format: 'A4',
      templateId: 'bio-bakery-a4',
      bgClass: 'bg-[#FAF8F4] border border-stone-200 text-stone-900',
      elements: [...DEFAULT_TEMPLATES[1].elements]
    }
  ]);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Brand Kit states
  const [brandKit, setBrandKit] = useState<BrandKit>({
    name: 'Le Moulin Doré',
    primaryColor: '#F59E0B',
    secondaryColor: '#1C1917',
    logoUrl: '',
    slogan: 'Pain Bio & Levain Naturel Sauvage',
    fontHeading: 'PP Editorial',
    fontBody: 'Inter',
    contactEmail: 'contact@moulindore.fr'
  });

  // Chat/Brief Assistant states
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: 'Bonjour ! Je suis votre Conseiller Lumineux de Consilium. Racontez-moi en français le type de visuels publicitaires que vous souhaitez composer aujourd’hui. Quelle est votre activité ou votre besoin urgent ?',
      timestamp: '18:35 PM'
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [customBriefText, setCustomBriefText] = useState('');
  const [importedLogoFile, setImportedLogoFile] = useState<string | null>(null);
  
  // Selection criteria from Chat bot wizard
  const [currentStep, setCurrentStep] = useState(1); // 1: Topic, 2: Format, 3: Ambience, 4: Launch
  const [selectedFormat, setSelectedFormat] = useState('A4');
  const [selectedGoal, setSelectedGoal] = useState('Promotion');
  const [selectedTone, setSelectedTone] = useState('Élégant & Épuré');

  // Generation status indicators
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [generatedOptions, setGeneratedOptions] = useState<Template[]>([]);

  // Interactive UI drag positions
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Drag reference tracking (Percentage calculation to avoid browser resizing crashes!)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{
    elementId: string;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
  } | null>(null);

  // Sticker pack presets
  const stickerPresets = [
    { text: '✦ LIVE ✦', bg: '#8B5CF6' },
    { text: '● BIOLOGIQUE', bg: '#F59E0B' },
    { text: '★ EXCLUSIF', bg: '#EC4899' },
    { text: '▩ SWISS MADE', bg: '#22D3EE' },
    { text: 'GRATUIT', bg: '#000000' }
  ];

  // Export panel States
  const [isExportOverlayOpen, setIsExportOverlayOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PNG' | 'PDF_CMYK' | 'JPEG'>('PNG');
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  // ----------------------------------------------------
  // INITIAL QUERY RESOLVER (Coming from Landing page prompts)
  // ----------------------------------------------------
  useEffect(() => {
    if (predefinedTemplateQuery) {
      // Create project from model
      const newProjId = 'proj-' + Date.now();
      const newProject: Project = {
        id: newProjId,
        name: `Projet Inspiré : ${predefinedTemplateQuery.name}`,
        createdAt: 'À l’instant',
        format: predefinedTemplateQuery.format,
        templateId: predefinedTemplateQuery.id,
        bgClass: predefinedTemplateQuery.bgClass,
        elements: JSON.parse(JSON.stringify(predefinedTemplateQuery.elements))
      };
      setProjects(prev => [newProject, ...prev]);
      setSelectedProjectId(newProjId);
      setActiveTab('editor'); // Go straight to edit
    } else if (initialPromptQuery) {
      // Start flow in chat with populated message
      simulateBriefFromPrompt(initialPromptQuery, initialFormatQuery || 'A4');
    }
  }, [predefinedTemplateQuery, initialPromptQuery, initialFormatQuery]);

  const simulateBriefFromPrompt = (promptText: string, format: string) => {
    setActiveTab('chat');
    setSelectedFormat(format);
    const userMsg: Message = {
      id: 'msg-user-init',
      sender: 'user',
      text: promptText,
      timestamp: 'À l’instant'
    };
    setChatMessages([
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: 'Bonjour ! Je suis votre Conseiller Lumineux de Consilium. Racontez-moi en français le type de visuels publicitaires que vous souhaitez composer aujourd’hui. Quelle est votre activité ou votre besoin urgent ?',
        timestamp: '18:35 PM'
      },
      userMsg
    ]);
    triggerAiResponseWorkflow(promptText);
  };

  // ----------------------------------------------------
  // CHATBOT WIZARD WORKFLOW
  // ----------------------------------------------------
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customBriefText.trim()) return;
    
    const userMsgText = customBriefText;
    setCustomBriefText('');
    
    const newMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userMsgText,
      timestamp: 'À l’instant'
    };

    setChatMessages(prev => [...prev, newMsg]);
    triggerAiResponseWorkflow(userMsgText);
  };

  const selectWizardChip = (category: string, value: string) => {
    if (category === 'format') {
      setSelectedFormat(value);
      setCurrentStep(2);
    } else if (category === 'goal') {
      setSelectedGoal(value);
      setCurrentStep(3);
    } else if (category === 'tone') {
      setSelectedTone(value);
      setCurrentStep(4);
    }

    const valueMsg: Message = {
      id: 'chip-' + Date.now(),
      sender: 'user',
      text: `Mon choix pour ${category.toUpperCase()} est : ${value}`,
      timestamp: 'À l’instant'
    };

    setChatMessages(prev => [...prev, valueMsg]);
    triggerAiResponseWorkflow(value);
  };

  const triggerAiResponseWorkflow = (phraseInput: string) => {
    setIsAiTyping(true);

    setTimeout(() => {
      let aiText = '';
      if (currentStep === 1) {
        aiText = `Magnifique intention créative ! Je prends bonne note de l'ambiance recherchée : « ${phraseInput} ». Consilium s'assure de l'alignement sur votre grille active. Pour affiner la structure de votre flyer publicitaire, quel format désirez-vous choisir en priorité ?`;
        setCurrentStep(2);
      } else if (currentStep === 2) {
        aiText = `Choix de format validé ! Nous allons formater les blocs pour du « ${selectedFormat} ». Quel est l'objectif principal de ce flyer ? (Mettre en avant une offre promo, fêter un événement, lancer un service...)`;
        setCurrentStep(3);
      } else if (currentStep === 3) {
        aiText = `Objectif consigné : « ${selectedGoal} ». Nos agents de mise en page vont maintenant adapter les contrastes. Pour finaliser, quel style artistique ou ton éditorial préférez-vous ?`;
        setCurrentStep(4);
      } else {
        aiText = `Parfait, toutes les intentions confluents au centre de notre Prisme ! Nous sommes prêts à lancer la génération de vos visuels publicitaires. Téléchargez un logo si désiré, puis cliquez ci-dessous pour mobiliser nos 4 agents !`;
      }

      setChatMessages(prev => [...prev, {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: aiText,
        timestamp: 'À l’instant'
      }]);
      setIsAiTyping(false);
    }, 1200);
  };

  // ----------------------------------------------------
  // LOGO UPLOAD COMPONENT METHOD
  // ----------------------------------------------------
  const triggerLogoUpload = () => {
    // Return a dummy responsive logo file as demonstration representation
    setImportedLogoFile('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80');
    // Inject custom mock notification
    alert("Logo Consilium importé avec succès ! Il s’affichera sur vos variantes générées et pourra être redimensionné à l’envi dans l'éditeur de canevas.");
  };

  // ----------------------------------------------------
  // ENGINE GENERATION SIMULATOR (4 AGENTS PRODUCING VISUALS)
  // ----------------------------------------------------
  const handleLaunchGeneration = () => {
    setIsGenerating(true);
    setGenStep(0);
    setGenLogs([]);
    
    const logs = [
      "● [AGENT PLANIFICATEUR] : Analyse de l'intention sémantique...",
      "● [AGENT PLANIFICATEUR] : Calibrage de la grille typographique au format " + selectedFormat,
      "● [AGENT MARQUE] : Extraction des teintes de la charte de " + brandKit.name + " (" + brandKit.primaryColor + ")",
      "● [AGENT MARQUE] : Préparation du slogan : « " + brandKit.slogan + " »",
      "● [AGENT DESIGN] : Création des calques d'ambience contrastés (" + selectedTone + ")...",
      "● [AGENT DESIGN] : Disposition des blocs de titre principaux, sous-titres et dates de concert...",
      "● [AGENT PROMPT ARCHITECT] : Finalisation et correction du contraste à l'alignement...",
      "✔ SUCCESS : 3 Compositions exclusives disponibles en Haute Fidélité !"
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setGenLogs(prev => [...prev, logs[currentLogIndex]]);
        setGenStep(Math.round(((currentLogIndex + 1) / logs.length) * 100));
        currentLogIndex++;
      } else {
        clearInterval(interval);
        // Generation succeeded, inject generated templates templates
        buildAndInjectGeneratedTemplates();
        setIsGenerating(false);
        setActiveTab('editor'); // Focus editor on new template
      }
    }, 550);
  };

  const buildAndInjectGeneratedTemplates = () => {
    // Generate projects and assign them as active projects elements
    const newProjId = 'proj-gen-' + Date.now();
    const createdElements: CanvasElement[] = [
      {
        id: 'gen-bg-glow',
        type: 'shape',
        content: 'circle-blur',
        x: 50,
        y: 40,
        width: 80,
        height: 60,
        color: brandKit.primaryColor,
        bgFill: `radial-gradient(circle, ${brandKit.primaryColor}33, transparent)`,
        rotate: 0
      },
      {
        id: 'gen-title',
        type: 'text',
        content: brandKit.name.toUpperCase(),
        x: 10,
        y: 15,
        fontSize: 32,
        fontWeight: 'font-semibold',
        color: '#FFFFFF',
        fontFamily: 'serif',
        rotate: 0
      },
      {
        id: 'gen-slogan',
        type: 'text',
        content: brandKit.slogan,
        x: 10,
        y: 26,
        fontSize: 14,
        fontWeight: 'font-light',
        color: brandKit.primaryColor,
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'gen-badge',
        type: 'badge',
        content: `● ${selectedGoal.toUpperCase()} // ${selectedTone.toUpperCase()}`,
        x: 10,
        y: 7,
        fontSize: 10,
        color: '#FFFFFF',
        bgFill: brandKit.primaryColor,
        rotate: 0
      },
      {
        id: 'gen-date',
        type: 'text',
        content: 'SAMEDI PROCHAIN | RUE PRINCIPALE',
        x: 10,
        y: 80,
        fontSize: 11,
        fontWeight: 'font-mono',
        color: '#FFFFFF',
        fontFamily: 'mono',
        rotate: 0
      }
    ];

    // If logo was imported, append it
    if (importedLogoFile) {
      createdElements.push({
        id: 'gen-logo',
        type: 'image',
        content: importedLogoFile,
        x: 10,
        y: 35,
        width: 15,
        height: 15,
        rotate: 0
      });
    }

    const createdProject: Project = {
      id: newProjId,
      name: `Composition Générée : ${brandKit.name}`,
      createdAt: 'À l’instant',
      format: selectedFormat as any,
      templateId: 'generated-model',
      bgClass: 'from-[#0B0B0F] via-[#101016] to-[#1A1024] bg-gradient-to-br',
      elements: createdElements
    };

    setProjects(prev => [createdProject, ...prev]);
    setSelectedProjectId(newProjId);
    alert("✨ Succès ! Votre visuel a été composé par nos agents. Vous pouvez maintenant le faire glisser, double-cliquer pour modifier le texte, ou changer les styles dans le panneau de droite.");
  };

  // ----------------------------------------------------
  // INTERACTIVE CANVAS DRAGGING CALCULATIONS
  // ----------------------------------------------------
  const handleCanvasMouseDown = (e: React.MouseEvent, elementId: string) => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    setSelectedElementId(elementId);
    const rect = canvasElement.getBoundingClientRect();
    
    const el = activeProject.elements.find(item => item.id === elementId);
    if (!el) return;

    dragStartRef.current = {
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      originalX: el.x,
      originalY: el.y
    };
    
    isDraggingRef.current = true;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    // Convert pixel offset into responsive canvas percentage percentages (0-100)
    const dxPercent = (dx / rect.width) * 100;
    const dyPercent = (dy / rect.height) * 100;

    let newX = Math.max(0, Math.min(100, dragStartRef.current.originalX + dxPercent));
    let newY = Math.max(0, Math.min(100, dragStartRef.current.originalY + dyPercent));

    // Shift to snap elements grid
    if (e.shiftKey) {
      newX = Math.round(newX / 5) * 5;
      newY = Math.round(newY / 5) * 5;
    }

    // Mutate state coordinate
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          elements: p.elements.map(el => {
            if (el.id === dragStartRef.current!.elementId) {
              return { ...el, x: parseFloat(newX.toFixed(1)), y: parseFloat(newY.toFixed(1)) };
            }
            return el;
          })
        };
      }
      return p;
    }));
  };

  const handleCanvasMouseUp = () => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
  };

  // ----------------------------------------------------
  // GENERAL ELEMENT MANAGEMENT
  // ----------------------------------------------------
  const handleUpdateElementField = (elementId: string, field: keyof CanvasElement, value: any) => {
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          elements: p.elements.map(el => {
            if (el.id === elementId) {
              return { ...el, [field]: value };
            }
            return el;
          })
        };
      }
      return p;
    }));
  };

  const handleAddStickerElement = (text: string, bg: string) => {
    const newEl: CanvasElement = {
      id: 'sticker-' + Date.now(),
      type: 'badge',
      content: text,
      x: 35,
      y: 45,
      fontSize: 10,
      color: '#FFFFFF',
      bgFill: bg,
      rotate: Math.floor(Math.random() * 20) - 10,
      isSticker: true
    };

    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          elements: [...p.elements, newEl]
        };
      }
      return p;
    }));
    setSelectedElementId(newEl.id);
  };

  const handleAddNewTextElement = () => {
    const newEl: CanvasElement = {
      id: 'text-' + Date.now(),
      type: 'text',
      content: 'Nouveau Paragraphe',
      x: 15,
      y: 50,
      fontSize: 13,
      fontWeight: 'font-normal',
      color: '#FFFFFF',
      fontFamily: 'sans',
      rotate: 0
    };

    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          elements: [...p.elements, newEl]
        };
      }
      return p;
    }));
    setSelectedElementId(newEl.id);
  };

  const handleDeleteElement = (id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          elements: p.elements.filter(el => el.id !== id)
        };
      }
      return p;
    }));
    setSelectedElementId(null);
  };

  const handleMutateProjectBackground = (bgGradient: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          bgClass: bgGradient
        };
      }
      return p;
    }));
  };

  // ----------------------------------------------------
  // EXPORT TIMELINE SIMULATOR
  // ----------------------------------------------------
  const handleLaunchExport = () => {
    setExportStatus('processing');
    
    // Simulate CMYK / 300dpi file calculation
    setTimeout(() => {
      setExportStatus('done');
      setTimeout(() => {
        setIsExportOverlayOpen(false);
        setExportStatus('idle');
        alert(`💾 Exportation Consilium : Votre visuel "${activeProject.name}" a été compilé à 300dpi (profil CMJN Coated FOGRA39 pour impression). Téléchargement automatique initié.`);
      }, 1500);
    }, 2500);
  };

  return (
    <div className={`min-h-screen flex font-sans ${isLightMode ? 'bg-[#FAF8F4] text-stone-900' : 'bg-[#08080C] text-zinc-300'}`}>
      
      {/* ----------------------------------------------------
          SIDEBAR NAVIGATION (Section 3.0 APP SHELL)
          ---------------------------------------------------- */}
      <aside 
        className={`border-r shrink-0 transition-all duration-300 flex flex-col justify-between select-none ${
          isLightMode ? 'bg-stone-50 border-stone-200' : 'bg-[#0B0B0F]/95 border-white/5'
        } ${sidebarCollapsed ? 'w-16' : 'w-60'}`}
      >
        <div className="p-4 space-y-6">
          {/* Top Logo and collapse control */}
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div 
                onClick={onNavigateHome}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="relative w-7 h-7 flex items-center justify-center bg-zinc-900/40 rounded-lg p-0.5 border border-white/10">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <polygon points="50,15 85,80 15,80" stroke="#8B5CF6" strokeWidth="8" fill="none" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-sans font-bold text-white tracking-widest uppercase">CONSILIUM</span>
                  <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest leading-none">STUDIO IA</span>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white ml-auto"
              title={sidebarCollapsed ? "Agrandir" : "Réduire"}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Creator Button Plus */}
          <button
            onClick={() => {
              setActiveTab('chat');
              setCurrentStep(1);
            }}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
              isLightMode
                ? 'bg-stone-900 text-white hover:bg-stone-800'
                : 'bg-gradient-to-r from-violet-600 to-magenta-650 hover:opacity-90 text-white shadow-lg shadow-violet-600/10'
            }`}
          >
            <Plus className="w-4 h-4" />
            {!sidebarCollapsed && <span>Nouveau Projet</span>}
          </button>

          {/* Main Action Links Links */}
          <nav className="space-y-1">
            {[
              { id: 'projects', label: 'Mon Espace Projets', icon: Folder },
              { id: 'chat', label: 'Conseiller IA (Chat)', icon: Sparkles },
              { id: 'editor', label: 'Éditeur de Canvas', icon: Sliders },
              { id: 'models', label: 'Bibliothèque Modèles', icon: Layers2 },
              { id: 'brand', label: 'Brand Kit (Charte)', icon: Palette },
            ].map((link) => {
              const Icon = link.icon;
              const isSelected = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id as any)}
                  className={`w-full flex items-center gap-3 p-3 text-xs font-semibold rounded-xl transition-all ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-md'
                      : isLightMode
                        ? 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-950'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{link.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Back Button and User Card */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center gap-3 p-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {!sidebarCollapsed && <span>Retour Accueil</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 text-left">
              <div className="w-7 h-7 rounded-full bg-violet-600/40 text-violet-300 font-mono text-xs font-bold flex items-center justify-center">
                CG
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-semibold text-white truncate line-clamp-1">cg.bryservices</p>
                <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">PRO ACTIF</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ----------------------------------------------------
          MAIN SCREEN CONTAINER AREA
          ---------------------------------------------------- */}
      <main className="flex-1 flex flex-col justify-between overflow-hidden relative">
        
        {/* Top Active Bar Actions */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest">PROJET ACTIF :</span>
            <input 
              type="text"
              value={activeProject.name}
              onChange={(e) => {
                const text = e.target.value;
                setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, name: text } : p));
              }}
              className="bg-transparent border-none text-xs font-semibold text-white outline-none focus:border-b focus:border-violet-500 pb-0.5"
            />
            <span className="text-[9px] bg-white/10 text-zinc-400 font-mono rounded-full px-2 py-0.5 uppercase">
              {activeProject.format}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportOverlayOpen(true)}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-magenta-600 hover:opacity-90 active:scale-95 transition-all text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Exporter le visuel
            </button>
          </div>
        </header>

        {/* Render Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          
          {/* ====================================================
              VIEW A : SPACE PROJECTS / RECENT WORKSPACE
              ==================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-8 animate-in fade-in duration-200 text-left">
              <div className="space-y-2">
                <h2 className="text-2xl font-sans font-bold text-white tracking-tight">Mon Atelier de communication</h2>
                <p className="text-zinc-400 text-xs md:text-sm">Consultez, modifiez ou téléchargez en PDF-CMJN HD vos visuels publicitaires générés.</p>
              </div>

              {/* Status block row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-[#14141A] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Projets créés</span>
                  <p className="text-2xl font-sans font-bold text-white tabular-nums">{projects.length}</p>
                </div>
                <div className="bg-[#14141A] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Abn: Formule Pro</span>
                  <p className="text-sm font-semibold text-violet-400">GÉNÉRATIONS ILLIMITÉES</p>
                </div>
                <div className="bg-[#14141A] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Marque Active</span>
                  <p className="text-sm font-semibold text-amber-400 line-clamp-1">{brandKit.name}</p>
                </div>
                <div className="bg-[#14141A] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Intégration AmbiTech</span>
                  <p className="text-xs font-mono text-cyan-400">SAAS COMPLIANT UE-2026</p>
                </div>
              </div>

              {/* Projects Grid Grid */}
              <div className="space-y-4">
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">VOS COMPOSITIONS SAUVEGARDÉES ({projects.length})</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {projects.map((proj) => (
                    <div 
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setActiveTab('editor'); // Go straight to edit
                      }}
                      className={`group bg-[#14141A] rounded-xl border p-4 text-left space-y-4 cursor-pointer hover:border-violet-500/20 shadow-xl transition-all ${
                        selectedProjectId === proj.id ? 'border-violet-500 bg-[#8B5CF6]/5' : 'border-white/5'
                      }`}
                    >
                      {/* Interactive responsive micro-rendering of layers inside card */}
                      <div className={`h-40 relative rounded-lg overflow-hidden ${proj.bgClass} p-3 flex flex-col justify-between`}>
                        <div className="text-[8px] font-mono bg-black/60 text-white rounded px-1.5 py-0.5 w-max">
                          FORMAT {proj.format}
                        </div>

                        {/* Title text render preview */}
                        <div className="space-y-1">
                          <p className="text-[12px] font-serif font-bold text-white line-clamp-1">
                            {proj.elements.find(e => e.type === 'text')?.content || proj.name}
                          </p>
                          <p className="text-[8px] font-mono text-zinc-400">
                            Modifié : {proj.createdAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <h4 className="text-xs font-semibold text-white line-clamp-1">{proj.name}</h4>
                          <p className="text-[10px] text-zinc-500">{proj.elements.length} couches typographiques</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ====================================================
              VIEW B : BRIEFING CHAT INTERFACE & GENERATION SCREEN
              ==================================================== */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col justify-between max-w-3xl mx-auto animate-in fade-in duration-200">
              
              {/* If is currently generating models */}
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-16 text-center text-left">
                  
                  {/* Glowing agents graphic */}
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Ring rotation */}
                    <div className="absolute inset-0 rounded-full border border-[#8B5CF6]/10 animate-spin" style={{ animationDuration: '30s' }} />
                    <div className="absolute inset-6 rounded-full border-dashed border-[#EC4899]/10 animate-spin" style={{ animationDuration: '45s' }} />

                    {/* Laser rays */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 animate-pulse" />

                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 via-pink-600 to-amber-600 flex items-center justify-center drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                      <Sparkles className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '8s' }} />
                    </div>

                    {/* Agent nodes label anchors */}
                    <div className="absolute top-2 left-12 bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-[9px] font-mono text-[#8B5CF6]">● PLANIFICATEUR</div>
                    <div className="absolute bottom-6 left-2 bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-[9px] font-mono text-[#EC4899]">● RESPECT CHARTE</div>
                    <div className="absolute top-14 right-4 bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-[9px] font-mono text-[#22D3EE]">● DESIGN GRILLE</div>
                    <div className="absolute bottom-16 right-0 bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-[9px] font-mono text-[#F59E0B]">● PROMPT ANALYST</div>
                  </div>

                  <div className="space-y-3 w-full max-w-md">
                    <h3 className="text-xl font-sans font-bold text-white">Conflux de nos 4 Agents IA en cours...</h3>
                    <p className="text-zinc-500 text-xs font-mono">NE COUPEZ PAS LA SESSION • CALCULS 300DPI EN COURS</p>
                    
                    {/* Progression bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 via-magenta-500 to-cyan-400 transition-all duration-300"
                        style={{ width: `${genStep}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-400">{genStep}% validé</span>
                  </div>

                  {/* Real-time agent logic logs */}
                  <div className="bg-zinc-950/80 border border-white/5 rounded-xl p-4 w-full text-[11px] font-mono text-left max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                    {genLogs.map((log, index) => (
                      <p key={index} className={log.includes('✔') ? 'text-emerald-400' : 'text-zinc-400'}>
                        {log}
                      </p>
                    ))}
                  </div>

                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto mb-4 pr-2 text-left">
                    <div className="flex items-center gap-1 bg-[#8B5CF6]/10 text-violet-400 font-mono text-[9px] rounded-full px-3 py-1 w-max border border-violet-500/10">
                      <span>CONSEILLER LUMINEUX D&apos;ASSISTANCE CRÉATIVE ACTIF</span>
                    </div>

                    {/* Render message loops */}
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex gap-3 animate-in fade-in duration-200 ${
                          msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.sender === 'ai' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shrink-0">
                            <Sparkle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        <div className={`p-4 rounded-xl text-xs max-w-md ${
                          msg.sender === 'user'
                            ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 text-white'
                            : isLightMode 
                              ? 'bg-stone-100 border border-stone-200 text-stone-900'
                              : 'bg-zinc-900 border border-white/5 text-zinc-300 leading-relaxed'
                        }`}>
                          <p>{msg.text}</p>
                        </div>

                        {msg.sender === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-violet-900/40 text-violet-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                            M
                          </div>
                        )}
                      </div>
                    ))}

                    {isAiTyping && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center animate-pulse">
                          <span>···</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Wizard suggestions chips */}
                  {currentStep < 5 && (
                    <div className="p-4 border-t border-white/5 space-y-2.5 text-left bg-zinc-950/45 rounded-xl mb-4">
                      <p className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest">
                        RACCOURCIS FACILES DE BRIEF (ÉVITER LA FRAISSE DE CLAVIER)
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {currentStep === 1 && [
                          { label: 'Flyer Concert Jazz acoustique', val: 'Flyer musical pour soirée jazz à Paris avec trompette' },
                          { label: 'Affiche Boulangerie Bio Levain', val: 'Affiche rustique pour croissants et pain au levain bio' },
                          { label: 'Menu Resto Gastronomie moderne', val: 'Menu de bistrot épuré de saison avec des dorures' },
                          { label: 'Carte de visite Architecte DPLG', val: 'Carte de visite minimaliste pour cabinet d architecture' }
                        ].map((chip) => (
                          <button
                            key={chip.val}
                            onClick={() => selectWizardChip('topic', chip.val)}
                            className="bg-[#14141A] hover:bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-[11px] font-medium active:scale-95 duration-100"
                          >
                            🎨 {chip.label}
                          </button>
                        ))}

                        {currentStep === 2 && ['A4', 'Story', 'Carré', 'Cartes (85x55)'].map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => selectWizardChip('format', fmt)}
                            className="bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/25 text-violet-300 rounded-lg px-3.5 py-1.5 text-[11px] active:scale-95"
                          >
                            📏 Format {fmt}
                          </button>
                        ))}

                        {currentStep === 3 && ['Promotion', 'Événement Culinaire', 'Campagne Réseaux', 'Identité Pro'].map((gl) => (
                          <button
                            key={gl}
                            onClick={() => selectWizardChip('goal', gl)}
                            className="bg-magenta-600/10 hover:bg-magenta-600/20 border border-magenta-500/25 text-magenta-300 rounded-lg px-3.5 py-1.5 text-[11px] active:scale-95"
                          >
                            🎯 Objectif {gl}
                          </button>
                        ))}

                        {currentStep === 4 && ['Élégant & Épuré', 'Brut & Monospaced', 'Coloré & Rétro Accent'].map((ton) => (
                          <button
                            key={ton}
                            onClick={() => selectWizardChip('tone', ton)}
                            className="bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/25 text-cyan-300 rounded-lg px-3.5 py-1.5 text-[11px] active:scale-95"
                          >
                            ✨ Ton {ton}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drag-drop logo zone / launch button */}
                  <div className="space-y-4">
                    {/* Drag-drop brand compliant files */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div 
                        onClick={triggerLogoUpload}
                        className="border-2 border-dashed border-white/10 hover:border-violet-500/30 rounded-xl p-4 text-center cursor-pointer bg-zinc-900/20 hover:bg-[#8B5CF6]/5 transition-all flex items-center justify-center gap-2"
                      >
                        <Upload className="w-5 h-5 text-violet-400 shrink-0" />
                        <div className="text-left">
                          <p className="text-xs font-semibold text-white">Créer avec mon Logo...</p>
                          <p className="text-[9px] text-zinc-500 font-mono">PNG / JPEG transparent</p>
                        </div>
                        {importedLogoFile && <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-mono px-2 py-0.5 rounded ml-auto">LIÉ</span>}
                      </div>

                      {/* Launch generations action */}
                      <button
                        onClick={handleLaunchGeneration}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 via-[#EC4899] to-amber-500 text-white font-bold text-xs shadow-lg shadow-violet-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                        <span>✨ GÉNÉRER MES VARIANTES D&apos;AFFICHES</span>
                      </button>
                    </div>

                    {/* Standard text editor bottom input */}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Précisez un détail de prompt ou tapez votre brief libre..."
                        value={customBriefText}
                        onChange={(e) => setCustomBriefText(e.target.value)}
                        className="flex-1 bg-[#14141A] border border-white/10 rounded-xl py-3 px-4 text-xs font-sans text-white focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="submit"
                        className="px-5 rounded-xl bg-zinc-800 text-white font-semibold text-xs border border-white/5 active:scale-95"
                      >
                        Envoyer
                      </button>
                    </form>
                  </div>
                </>
              )}

            </div>
          )}

          {/* ====================================================
              VIEW C : WYSIWYG INTERACTIVE CANVAS EDITOR (The Heart!)
              ==================================================== */}
          {activeTab === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start animate-in fade-in duration-200 text-left">
              
              {/* Left Canvas Element element workspace */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Micro Action Headers Controls */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddNewTextElement}
                      className="px-3 py-1.5 rounded-lg bg-[#14141A] text-white text-xs border border-white/10 hover:border-white/20 flex items-center gap-1 active:scale-95 duration-100"
                    >
                      <Plus className="w-3.5 h-3.5 text-violet-400" /> Ajouter Texte
                    </button>
                    <button
                      onClick={() => handleAddStickerElement('🔥 REMISE -20%', '#FB7185')}
                      className="px-3 py-1.5 rounded-lg bg-[#14141A] text-white text-xs border border-white/10 hover:border-white/20 flex items-center gap-1 active:scale-95 duration-100"
                    >
                      <Sparkle className="w-3.5 h-3.5 text-amber-500" /> Insérer Sticker
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="p-1.5 bg-[#14141A] border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white rounded-lg text-xs"
                      title="Annuler modification (Ctrl+Z)"
                      onClick={() => alert("Consilium Undo: Votre canevas a été restauré à son état précédent.")}
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* THE CORE WYSIWYG CANVAS DRAG CONTAINER CONTAINER */}
                <div 
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className={`w-full h-[580px] rounded-2xl relative shadow-2xl border overflow-hidden select-none select-none overflow-hidden ${
                    isLightMode ? 'border-stone-300/80 bg-stone-105' : 'border-white/10 bg-[#0B0B0F]'
                  } ${activeProject.bgClass}`}
                  style={{
                    boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)'
                  }}
                >
                  {/* Real-time aligning magenta target lines indicators when active element */}
                  {selectedElementId && (
                    <>
                      {/* Vertical line indicator */}
                      <div 
                        className="absolute top-0 bottom-0 w-[1px] bg-magenta-500 pointer-events-none opacity-40 border-dashed"
                        style={{ left: `${activeProject.elements.find(e => e.id === selectedElementId)?.x}%` }}
                      />
                      {/* Horizontal line indicator */}
                      <div 
                        className="absolute left-0 right-0 h-[1px] bg-magenta-500 pointer-events-none opacity-40 border-dashed"
                        style={{ top: `${activeProject.elements.find(e => e.id === selectedElementId)?.y}%` }}
                      />
                    </>
                  )}

                  {/* Render elements elements layered */}
                  {activeProject.elements.map((el) => {
                    const isSelected = el.id === selectedElementId;
                    
                    if (el.type === 'shape' && el.content === 'circle-blur') {
                      return (
                        <div
                          key={el.id}
                          className="absolute rounded-full pointer-events-none blur-[40px] mix-blend-screen opacity-30 shrink-0"
                          style={{
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            width: `${el.width || 50}px`,
                            height: `${el.height || 50}px`,
                            background: el.bgFill || el.color,
                            transform: `translate(-50%, -50%) rotate(${el.rotate}deg)`
                          }}
                        />
                      );
                    }

                    if (el.type === 'shape' && el.content === 'border-frame') {
                      return (
                        <div
                          key={el.id}
                          className="absolute pointer-events-none border border-dashed rounded shrink-0 duration-200"
                          style={{
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            width: `${el.width || 90}%`,
                            height: `${el.height || 90}%`,
                            borderColor: el.color || 'white'
                          }}
                        />
                      );
                    }

                    return (
                      <div
                        key={el.id}
                        onMouseDown={(e) => handleCanvasMouseDown(e, el.id)}
                        className={`absolute cursor-move p-2 rounded select-none group/item active:cursor-grabbing ${
                          isSelected 
                            ? 'ring-2 ring-[#EC4899] bg-[#8B5CF6]/10' 
                            : 'hover:ring-1 hover:ring-white/30'
                        }`}
                        style={{
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          transform: `rotate(${el.rotate || 0}deg)`,
                          transition: isDraggingRef.current && dragStartRef.current?.elementId === el.id ? 'none' : 'transform 100ms'
                        }}
                      >
                        {/* Selector boundary corners */}
                        {isSelected && (
                          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-magenta-500 rounded-full" />
                        )}

                        {/* Element rendering layout styles based on type */}
                        {el.type === 'text' && (
                          <p 
                            className={`whitespace-pre-line tracking-tight leading-normal focus:outline-none ${el.fontWeight || 'font-semibold'} ${
                              el.fontFamily === 'serif' 
                                ? 'font-serif italic font-normal' 
                                : el.fontFamily === 'mono' 
                                  ? 'font-mono uppercase tracking-widest' 
                                  : 'font-sans'
                            }`}
                            style={{
                              fontSize: `${el.fontSize || 14}px`,
                              color: el.color || '#FFFFFF'
                            }}
                          >
                            {el.content}
                          </p>
                        )}

                        {el.type === 'badge' && (
                          <span 
                            className="inline-block px-3 py-1 rounded text-[10px] font-mono tracking-wider font-bold uppercase"
                            style={{
                              color: el.color || '#FFFFFF',
                              backgroundColor: el.bgFill || '#8B5CF6'
                            }}
                          >
                            {el.content}
                          </span>
                        )}

                        {el.type === 'image' && (
                          <img
                            src={el.content}
                            alt="Mock Logo Layer"
                            referrerPolicy="no-referrer"
                            className="bg-white/10 rounded border border-white/5 object-contain"
                            style={{
                              width: `${el.width || 32}px`,
                              height: `${el.height || 32}px`
                            }}
                          />
                        )}
                      </div>
                    );
                  })}

                </div>

                <p className="text-[11px] font-mono text-zinc-500 text-center uppercase">
                  Astuce : Maintenez Maj [Shift] pour aligner les calques sur le canevas • Cliquez sur un calque pour l&apos;éditer à droite.
                </p>
              </div>

              {/* Right Canvas Element properties sidebar panel */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Properties panel card */}
                <div className="bg-[#14141A] rounded-xl border border-white/10 p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-sm font-sans font-bold text-white flex items-center gap-1.5 uppercase">
                      <SlidersHorizontal className="w-4 h-4 text-violet-400" /> Propriétés du calque
                    </h3>
                    
                    {selectedElementId && (
                      <button
                        onClick={() => handleDeleteElement(selectedElementId)}
                        className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1 active:scale-95"
                        title="Supprimer l'élément"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    )}
                  </div>

                  {selectedElementId ? (
                    <div className="space-y-4">
                      {/* Active matched element container mapping properties */}
                      {(() => {
                        const el = activeProject.elements.find(item => item.id === selectedElementId);
                        if (!el) return <p className="text-xs text-zinc-500 font-mono">Calque inexistant.</p>;
                        return (
                          <div className="space-y-4">
                            
                            {/* Text editor row content if applicable */}
                            {el.type !== 'image' && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Contenu du texte</label>
                                <textarea
                                  rows={3}
                                  value={el.content}
                                  onChange={(e) => handleUpdateElementField(el.id, 'content', e.target.value)}
                                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg p-3 text-xs font-sans text-white focus:outline-none focus:border-violet-500 mt-1 resize-none font-sans leading-relaxed"
                                />
                              </div>
                            )}

                            {/* Typography family presets */}
                            {el.type === 'text' && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Famille de Police (Mood)</label>
                                <div className="grid grid-cols-3 gap-1.5 mt-1">
                                  {(['sans', 'serif', 'mono'] as const).map((font) => (
                                    <button
                                      key={font}
                                      onClick={() => handleUpdateElementField(el.id, 'fontFamily', font)}
                                      className={`text-[10px] font-mono py-1 rounded border transition-colors ${
                                        el.fontFamily === font
                                          ? 'border-violet-500 bg-[#8B5CF6]/15 text-white'
                                          : 'border-[#26262F] bg-transparent text-zinc-400 hover:text-white'
                                      }`}
                                    >
                                      {font.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Font size adjustments slider */}
                            {el.type === 'text' && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Taille du Texte</label>
                                  <span className="text-[10px] font-mono text-zinc-400 font-bold">{el.fontSize || 14}px</span>
                                </div>
                                <input
                                  type="range"
                                  min={8}
                                  max={88}
                                  value={el.fontSize || 14}
                                  onChange={(e) => handleUpdateElementField(el.id, 'fontSize', parseInt(e.target.value))}
                                  className="w-full accent-violet-500 bg-zinc-800"
                                />
                              </div>
                            )}

                            {/* Color picker shortcuts swatches */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Teinte couleur active</label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {['#FFFFFF', '#EC4899', '#8B5CF6', '#F59E0B', '#22D3EE', '#1C1917'].map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => handleUpdateElementField(el.id, el.type === 'badge' ? 'bgFill' : 'color', c)}
                                    className={`w-6 h-6 rounded-full border transition-all ${
                                      (el.type === 'badge' ? el.bgFill : el.color) === c
                                        ? 'border-white scale-110 drop-shadow'
                                        : 'border-white/15'
                                    }`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Rotation angle layout */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Angle de Rotation</label>
                                <span className="text-[10px] font-mono text-zinc-400 font-bold">{el.rotate || 0}°</span>
                              </div>
                              <input
                                type="range"
                                min={-45}
                                max={45}
                                value={el.rotate || 0}
                                onChange={(e) => handleUpdateElementField(el.id, 'rotate', parseInt(e.target.value))}
                                className="w-full accent-magenta-500 bg-zinc-800"
                              />
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-500 font-mono space-y-2">
                      <Sliders className="w-8 h-8 mx-auto opacity-30 animate-pulse" />
                      <p className="text-[11px] leading-relaxed">Aucun calque sélectionné.</p>
                      <p className="text-[9px] text-zinc-600">Sélectionnez un texte ou sticker pour le faire glisser, modifier ou calibrer.</p>
                    </div>
                  )}

                </div>

                {/* Background changer card presets presets */}
                <div className="bg-[#14141A] rounded-xl border border-white/10 p-5 space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Changer de fond</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Obsidian Void', val: 'from-[#08080C] via-[#0E0E14] to-[#120B24] bg-gradient-to-b' },
                      { name: 'Swiss Slate', val: 'from-[#14141A] via-[#101016] to-[#0B0B0F] bg-gradient-to-br' },
                      { name: 'Cosmic Violet', val: 'from-[#120B24] via-[#2A1544] to-[#08080C] bg-gradient-to-br' },
                      { name: 'Artisanal Cream', val: 'bg-[#FAF8F4] text-stone-900 border border-stone-200' }
                    ].map((bgOption) => (
                      <button
                        key={bgOption.name}
                        onClick={() => handleMutateProjectBackground(bgOption.val)}
                        className={`text-[10px] font-mono p-2 rounded text-left border overflow-hidden ${
                          activeProject.bgClass === bgOption.val
                            ? 'border-violet-500 text-white bg-violet-600/10'
                            : 'border-[#26262F] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {bgOption.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets sticker chips inserts */}
                <div className="bg-[#14141A] rounded-xl border border-white/10 p-5 space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Insérer un sticker publicitaire</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {stickerPresets.map((stk) => (
                      <button
                        key={stk.text}
                        onClick={() => handleAddStickerElement(stk.text, stk.bg)}
                        className="text-[9.5px] font-mono bg-white/5 border border-white/10 hover:border-violet-500/30 text-white rounded px-2.5 py-1 transition-colors active:scale-95 text-left"
                      >
                        {stk.text}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ====================================================
              VIEW D : MODELS EXPLORER SECTION (LIBRARY IN SITE)
              ==================================================== */}
          {activeTab === 'models' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Bibliothèque officielle de Références Consilium</h2>
                <p className="text-zinc-400 text-xs font-mono">Choisissez un modèle de base comme point de départ de brief.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {DEFAULT_TEMPLATES.map((tpl) => (
                  <div 
                    key={tpl.id}
                    onClick={() => {
                      const newProjId = 'proj-explore-' + Date.now();
                      const newProj: Project = {
                        id: newProjId,
                        name: `Projet : ${tpl.name}`,
                        createdAt: 'À l’instant',
                        format: tpl.format,
                        templateId: tpl.id,
                        bgClass: tpl.bgClass,
                        elements: JSON.parse(JSON.stringify(tpl.elements))
                      };
                      setProjects(prev => [newProj, ...prev]);
                      setSelectedProjectId(newProjId);
                      setActiveTab('editor'); // Trigger WYSIWYG
                      alert(`Modèle "${tpl.name}" pré-chargé avec succès.`);
                    }}
                    className="p-4 bg-[#14141A] rounded-xl border border-white/5 hover:border-violet-500/20 cursor-pointer space-y-4"
                  >
                    <div className={`h-32 rounded-lg ${tpl.bgClass} p-3 flex flex-col justify-between overflow-hidden`}>
                      <span className="text-[8px] font-mono bg-black/60 text-zinc-300 rounded px-1.5 py-0.5 w-max">
                        {tpl.format}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase">{tpl.name}</h4>
                      <p className="text-[10px] text-zinc-500">{tpl.category} • {tpl.plan}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====================================================
              VIEW E : BRAND KIT CONFIGURATION PANEL (Section 3.6)
              ==================================================== */}
          {activeTab === 'brand' && (
            <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-200 text-left">
              <div className="space-y-1">
                <h2 className="text-2xl font-sans font-bold text-white tracking-tight">Configuration de la Charte de Marque</h2>
                <p className="text-zinc-400 text-xs md:text-sm">Ces informations seront stockées et injectées automatiquement sur demande par l&apos;IA lors de vos briefs.</p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Charte de marque mise à jour dans nos silos cloud de façon sécuritaire.");
                }}
                className="bg-[#14141A] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl"
              >
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Nom commercial de l&apos;entité</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg py-2.5 px-4 text-xs font-sans text-white focus:outline-none focus:border-violet-500"
                    value={brandKit.name}
                    onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Email de contact publicitaire</label>
                  <input
                    type="email"
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg py-2.5 px-4 text-xs font-sans text-white focus:outline-none focus:border-violet-500"
                    value={brandKit.contactEmail}
                    onChange={(e) => setBrandKit({ ...brandKit, contactEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Phrase d&apos;accroche ou slogan de référence</label>
                  <input
                    type="text"
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg py-2.5 px-4 text-xs font-sans text-white focus:outline-none focus:border-violet-500"
                    placeholder="Pain artisanal au levain..."
                    value={brandKit.slogan}
                    onChange={(e) => setBrandKit({ ...brandKit, slogan: e.target.value })}
                  />
                </div>

                {/* Primary and secondary swatches parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Teinte Primaire (Hexa)</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        className="w-8 h-8 rounded shrink-0 cursor-pointer bg-transparent border border-white/10"
                        value={brandKit.primaryColor}
                        onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                      />
                      <input
                        type="text"
                        className="flex-1 bg-[#0B0B0F] border border-white/10 rounded-lg px-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                        value={brandKit.primaryColor}
                        onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Teinte Secondaire (Hexa)</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        className="w-8 h-8 rounded shrink-0 cursor-pointer bg-transparent border border-white/10"
                        value={brandKit.secondaryColor}
                        onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                      />
                      <input
                        type="text"
                        className="flex-1 bg-[#0B0B0F] border border-white/10 rounded-lg px-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                        value={brandKit.secondaryColor}
                        onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs active:scale-95 transition-all text-center"
                  >
                    Enregistrer la Charte de Marque
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>

      </main>

      {/* ----------------------------------------------------
          EXPORT DIALOG PANEL OVERLAY (3.5 - EXPORT)
          ---------------------------------------------------- */}
      {isExportOverlayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#08080C]/80 backdrop-blur-md cursor-pointer" onClick={() => setIsExportOverlayOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#14141A] border border-white/10 rounded-2xl shadow-2xl p-6 text-left space-y-5 animate-in zoom-in-95 duration-250">
            <button
              onClick={() => setIsExportOverlayOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-gradient bg-clip-text bg-gradient-to-r from-violet-500 to-magenta-550 block uppercase tracking-wider">● OPTIONS DE RENDU CONSILIUM</span>
              <h3 className="text-lg font-sans font-bold text-white">Prêt pour l’exportation</h3>
              <p className="text-zinc-500 text-xs">Vérifiez les caractéristiques du fichier avant d’initialiser l&apos;impression.</p>
            </div>

            {exportStatus === 'processing' ? (
              <div className="py-12 text-center text-zinc-400 font-mono space-y-3 animate-pulse">
                <RefreshCw className="w-10 h-10 text-violet-500 mx-auto animate-spin" />
                <p className="text-xs">Rasterisation et conversion CMJN Coated FOGRA39 à 300dpi...</p>
                <div className="h-1.5 w-40 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-violet-500 animate-[pulse_2s_infinite] w-3/4" />
                </div>
              </div>
            ) : exportStatus === 'done' ? (
              <div className="py-12 text-center space-y-3 animate-in zoom-in-95">
                <Check className="w-12 h-12 text-emerald-400 mx-auto bg-emerald-500/10 rounded-full p-2" />
                <h4 className="text-sm font-semibold text-white">Transmissions d&apos;impression terminées !</h4>
                <p className="text-[11px] text-zinc-500 font-mono">Export sauvegardé et disponible dans vos téléchargements.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Export Choice Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Profil & Format de Sortie</label>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {[
                      { type: 'PNG' as const, label: 'PNG HD', desc: 'Srv web' },
                      { type: 'PDF_CMYK' as const, label: 'PDF CMJN 300dpi', desc: 'Imprimeur' },
                      { type: 'JPEG' as const, label: 'JPEG Max', desc: 'Réseaux' }
                    ].map((fmt) => (
                      <button
                        key={fmt.type}
                        onClick={() => setExportFormat(fmt.type)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                          exportFormat === fmt.type
                            ? 'border-violet-500 bg-[#8B5CF6]/10 text-white'
                            : 'border-[#26262F] bg-transparent text-zinc-400'
                        }`}
                      >
                        <span className="text-xs font-semibold">{fmt.label}</span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase mt-1">{fmt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <ul className="space-y-2 text-[11px] text-zinc-500 font-mono">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Incorpore automatiquement votre logo : {importedLogoFile ? 'DÉTECTÉ' : 'NÉANT'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Optimisation typographique vectorielle : 100% stable</span>
                  </li>
                </ul>

                <button
                  onClick={handleLaunchExport}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs"
                >
                  Télécharger le document
                </button>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
