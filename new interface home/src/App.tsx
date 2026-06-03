/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Loader from './components/Loader';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import AppWorkspace from './components/AppWorkspace';
import CommandPalette from './components/CommandPalette';
import Footer from './components/Footer';
import { Template } from './types';

export default function App() {
  // Global View/Route States
  const [isLoaderOpen, setIsLoaderOpen] = useState(true);
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Theme state switcher: Default Obsidian Dark (false) vs Cream Light (true)
  const [isLightMode, setIsLightMode] = useState(false);

  // Prefilled parameters bridged from landing page onto the SaaS wizard
  const [predefinedTemplate, setPredefinedTemplate] = useState<Template | null>(null);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [initialFormat, setInitialFormat] = useState('A4');

  // Trigger keyboard listener shortcut Cmd+K/Ctrl+K to open Command Palette globally
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Check for Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Handle cross view navigations and transport data payloads
  const handleNavigate = (view: string, extraData?: any) => {
    if (view === 'app') {
      setCurrentView('app');
      // Resolve optional payloads
      if (extraData?.predefinedTemplate) {
        setPredefinedTemplate(extraData.predefinedTemplate);
        setInitialPrompt('');
      } else if (extraData?.initialPrompt) {
        setInitialPrompt(extraData.initialPrompt);
        setInitialFormat(extraData.initialFormat || 'A4');
        setPredefinedTemplate(null);
      } else {
        setPredefinedTemplate(null);
        setInitialPrompt('');
      }
    } else {
      setCurrentView('landing');
    }
  };

  const handleToggleTheme = () => {
    setIsLightMode((prev) => !prev);
  };

  // If loader is active, render it
  if (isLoaderOpen) {
    return <Loader onComplete={() => setIsLoaderOpen(false)} />;
  }

  return (
    <div className={`min-h-screen ${isLightMode ? 'bg-[#FAF8F4] text-stone-900' : 'bg-[#0B0B0F] text-zinc-300'}`}>
      
      {/* Header element rendered on Landing / App shell has its own sidebar layout */}
      <Header 
        currentTab={currentView}
        onNavigate={handleNavigate}
        onTriggerSearch={() => setIsCommandPaletteOpen(true)}
        isLightMode={isLightMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Primary content router workspace */}
      <main className="pt-20">
        {currentView === 'landing' ? (
          <LandingPage 
            onNavigate={handleNavigate}
            isLightMode={isLightMode}
          />
        ) : (
          <AppWorkspace 
            isLightMode={isLightMode}
            predefinedTemplateQuery={predefinedTemplate}
            initialPromptQuery={initialPrompt}
            initialFormatQuery={initialFormat}
            onNavigateHome={() => setCurrentView('landing')}
          />
        )}
      </main>

      {/* Global Command Palette search bar overlay */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Global marketing Footer */}
      {currentView === 'landing' && (
        <Footer 
          onNavigate={handleNavigate}
          isLightMode={isLightMode}
        />
      )}

    </div>
  );
}
