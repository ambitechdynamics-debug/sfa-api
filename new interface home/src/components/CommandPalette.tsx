import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Sliders, Palette, Zap, ArrowRight, X, Layers, CreditCard } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../data/models';
import { Template } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, extraData?: any) => void;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setSearch('');
    }
  }, [isOpen]);

  // Handle escape, arrows, and enter keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, search, selectedIndex]);

  // Key system shortcuts
  const systemActions = [
    {
      id: 'act-new',
      title: 'Créer un Nouveau Projet...',
      category: 'Actions',
      description: 'Lancer le chat intelligent pour rédiger un nouveau brief',
      icon: Sparkles,
      route: 'app',
      extra: { tab: 'chat' }
    },
    {
      id: 'act-editor',
      title: 'Ouvrir l\'Éditeur de Canvas',
      category: 'Actions',
      description: 'Accéder directement à l\'atelier d\'édition visuelle drag-and-drop',
      icon: Sliders,
      route: 'app',
      extra: { tab: 'editor' }
    },
    {
      id: 'act-brand',
      title: 'Configurer mon Brand Kit (Charte)',
      category: 'Configuration',
      description: 'Enregistrer vos logos, polices, couleurs et slogans',
      icon: Palette,
      route: 'app',
      extra: { tab: 'brand' }
    },
    {
      id: 'act-projects',
      title: 'Parcourir mes Projets récents',
      category: 'Navigation',
      description: 'Consulter l\'historique de vos créations sauvegardées',
      icon: Layers,
      route: 'app',
      extra: { tab: 'projects' }
    },
    {
      id: 'act-prices',
      title: 'Consulter les formules d\'abonnements',
      category: 'Navigation',
      description: 'Voir les tarifs Découverte, Pro et Studio',
      icon: CreditCard,
      route: 'prices'
    }
  ];

  // Convert template items to matches too
  const templateItems = DEFAULT_TEMPLATES.map((tpl) => ({
    id: `tpl-${tpl.id}`,
    title: tpl.name,
    category: `Modèles (${tpl.category})`,
    description: `Démarrer un brief inspiré du format ${tpl.format} • ${tpl.plan}`,
    icon: Zap,
    route: 'app',
    extra: { tab: 'chat', predefinedTemplate: tpl }
  }));

  const allItems = [...systemActions, ...templateItems];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item: any) => {
    onNavigate(item.route, item.extra);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 md:px-0">
      {/* Backdrop blur effect */}
      <div
        className="absolute inset-0 bg-[#08080C]/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      {/* Main command layout card */}
      <div className="relative w-full max-w-2xl bg-[#14141A] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-magenta-500 to-cyan-500" />

        {/* Searching field */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5 bg-[#101016]">
          <Search className="w-5 h-5 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher une action, un modèle ou une section... (Ex: Flyer, Brand, Tarifs)"
            className="flex-1 bg-transparent border-none text-[15px] text-white placeholder-zinc-500 outline-none font-sans"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action / Matches items list */}
        <div className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const ItemIcon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#8B5CF6]/15 border-l-4 border-violet-500 text-white'
                        : 'border-l-4 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-zinc-400'
                        }`}
                      >
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-sans font-medium text-white">
                            {item.title}
                          </span>
                          <span className="text-[9px] font-mono uppercase bg-white/10 text-zinc-400 rounded px-1.5 py-0.5 tracking-wider">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[12px] text-zinc-500 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1.5 text-xs text-violet-400 font-mono">
                        <span>Entrée</span>
                        <ArrowRight className="w-3.5 h-3.5 animate-bounce-horizontal" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-2 animate-pulse" />
              <p className="text-[13px] text-zinc-400 font-sans">
                Aucun résultat pour « <span className="text-white italic">{search}</span> »
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Essayez de taper « Flyer », « Brand », ou « Nouveau »
              </p>
            </div>
          )}
        </div>

        {/* Bottom shortcut captions */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-[#101016] text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Naviguer</span>
            <span>⏎ Sélectionner</span>
            <span>⎋ Quitter</span>
          </div>
          <div>
            <span>CONSILIUM INDEXER</span>
          </div>
        </div>
      </div>
    </div>
  );
}
