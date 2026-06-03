import { Template } from '../types';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'jazz-festival-a4',
    name: 'Soirée Live Jazz Modern',
    category: 'Flyers',
    format: 'A4',
    plan: 'Free',
    bgClass: 'from-[#0B0B0F] via-[#14141A] to-[#20182C] bg-gradient-to-br border border-white/5',
    elements: [
      {
        id: 'jazz-bg-glow',
        type: 'shape',
        content: 'circle-blur',
        x: 50,
        y: 35,
        width: 80,
        height: 80,
        color: '#EC4899',
        bgFill: 'linear-gradient(to right, #8B5CF6, #EC4899)',
        rotate: 0
      },
      {
        id: 'jazz-title-main',
        type: 'text',
        content: 'JAZZ & LIGHTS',
        x: 10,
        y: 12,
        fontSize: 32,
        fontWeight: 'font-semibold',
        color: '#FFFFFF',
        fontFamily: 'serif',
        rotate: 0
      },
      {
        id: 'jazz-subtitle',
        type: 'text',
        content: 'CONSILIUM ORCHESTRA',
        x: 10,
        y: 22,
        fontSize: 14,
        fontWeight: 'font-medium',
        color: '#EC4899',
        fontFamily: 'mono',
        rotate: 0
      },
      {
        id: 'jazz-badge-live',
        type: 'badge',
        content: '● EN DIRECT / EUROPA',
        x: 10,
        y: 5,
        fontSize: 10,
        color: '#FFFFFF',
        bgFill: '#8B5CF6',
        rotate: 0
      },
      {
        id: 'jazz-description',
        type: 'text',
        content: 'Une expérience d\'improvisation libre et de sons synthétiques de haute fidélité.',
        x: 10,
        y: 72,
        fontSize: 12,
        fontWeight: 'font-light',
        color: '#E7E7EF',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'jazz-dates',
        type: 'text',
        content: 'SAMEDI 13 JUIN | À PARTIR DE 20:30',
        x: 10,
        y: 82,
        fontSize: 11,
        fontWeight: 'font-medium',
        color: '#22D3EE',
        fontFamily: 'mono',
        rotate: 0
      },
      {
        id: 'jazz-location',
        type: 'text',
        content: 'AMBIENT DOME, PARIS 06',
        x: 10,
        y: 88,
        fontSize: 10,
        fontWeight: 'font-light',
        color: '#9B9BA8',
        fontFamily: 'sans',
        rotate: 0
      }
    ]
  },
  {
    id: 'bio-bakery-a4',
    name: 'Le Moulin Doré - Artisanal',
    category: 'Flyers',
    format: 'A4',
    plan: 'Pro',
    bgClass: 'bg-[#FAF8F4] border border-stone-200 text-stone-900',
    elements: [
      {
        id: 'bakery-accent-line',
        type: 'shape',
        content: 'border-frame',
        x: 5,
        y: 5,
        width: 90,
        height: 90,
        color: '#84623F',
        bgFill: 'transparent',
        rotate: 0
      },
      {
        id: 'bakery-title',
        type: 'text',
        content: 'LE MOULIN DORÉ',
        x: 12,
        y: 12,
        fontSize: 28,
        fontWeight: 'font-bold',
        color: '#1C1917',
        fontFamily: 'serif',
        rotate: 0
      },
      {
        id: 'bakery-slogan',
        type: 'text',
        content: 'Pain Bio & Levain Naturel Sauvage',
        x: 12,
        y: 22,
        fontSize: 13,
        fontWeight: 'font-light',
        color: '#78716C',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'bakery-badge',
        type: 'badge',
        content: '100% ARTISANAL',
        x: 12,
        y: 30,
        fontSize: 11,
        color: '#FFFFFF',
        bgFill: '#F59E0B',
        rotate: -3
      },
      {
        id: 'bakery-promo-desc',
        type: 'text',
        content: 'Chaque matin, découvrez nos baguettes anciennes façonnées main avec de la farine de meule certifiée.',
        x: 12,
        y: 65,
        fontSize: 12,
        fontWeight: 'font-light',
        color: '#44403C',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'bakery-footer',
        type: 'text',
        content: 'RUE DE L\'ODEON — PARIS',
        x: 12,
        y: 82,
        fontSize: 10,
        fontWeight: 'font-medium',
        color: '#78716C',
        fontFamily: 'mono',
        rotate: 0
      }
    ]
  },
  {
    id: 'ai-con-story',
    name: 'Cosmic AI Build Summit',
    category: 'Réseaux',
    format: 'Story',
    plan: 'Studio',
    bgClass: 'from-[#08080C] via-[#0E0E14] to-[#120B24] bg-gradient-to-b border border-cyan-500/10',
    elements: [
      {
        id: 'ai-glow',
        type: 'shape',
        content: 'circle-blur',
        x: 50,
        y: 50,
        width: 100,
        height: 60,
        color: '#22D3EE',
        bgFill: 'linear-gradient(to right, #22D3EE, #8B5CF6)',
        rotate: 15
      },
      {
        id: 'ai-kicker',
        type: 'text',
        content: 'AMBITECH LABS PRESENTE',
        x: 15,
        y: 10,
        fontSize: 11,
        fontWeight: 'font-medium',
        color: '#22D3EE',
        fontFamily: 'mono',
        rotate: 0
      },
      {
        id: 'ai-title',
        type: 'text',
        content: 'CONSILIUM',
        x: 15,
        y: 18,
        fontSize: 34,
        fontWeight: 'font-bold',
        color: '#FFFFFF',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'ai-title-sub',
        type: 'text',
        content: 'STUDIO EXP',
        x: 15,
        y: 28,
        fontSize: 22,
        fontWeight: 'font-semibold',
        color: '#EC4899',
        fontFamily: 'serif',
        rotate: 0
      },
      {
        id: 'ai-badge',
        type: 'badge',
        content: 'SWISS TECH STANDARD',
        x: 15,
        y: 38,
        fontSize: 9,
        color: '#0B0B0F',
        bgFill: '#FFFFFF',
        rotate: 0
      },
      {
        id: 'ai-prompt-block',
        type: 'text',
        content: '» PROMPT: compose-in --theme=cosmic --gradient=ambient',
        x: 15,
        y: 75,
        fontSize: 11,
        fontWeight: 'font-medium',
        color: '#9B9BA8',
        fontFamily: 'mono',
        rotate: 0
      },
      {
        id: 'ai-date',
        type: 'text',
        content: '30 MAI 2026 // LIVE STREAM',
        x: 15,
        y: 84,
        fontSize: 13,
        fontWeight: 'font-bold',
        color: '#FFFFFF',
        fontFamily: 'mono',
        rotate: 0
      }
    ]
  },
  {
    id: 'gourmet-menu-a3',
    name: 'Menu Gastro - L\'Horizon',
    category: 'Menus',
    format: 'A3',
    plan: 'Pro',
    bgClass: 'bg-[#121214] text-stone-100 border border-amber-500/10',
    elements: [
      {
        id: 'menu-logo',
        type: 'badge',
        content: '✦ L\'HORIZON ✦',
        x: 50,
        y: 8,
        fontSize: 12,
        color: '#F59E0B',
        bgFill: 'transparent',
        rotate: 0
      },
      {
        id: 'menu-title-main',
        type: 'text',
        content: 'MENU DÉGUSTATION',
        x: 15,
        y: 18,
        fontSize: 24,
        fontWeight: 'font-semibold',
        color: '#FFFFFF',
        fontFamily: 'serif',
        rotate: 0
      },
      {
        id: 'menu-item-1',
        type: 'text',
        content: 'Le Saint-Pierre poêlé, émulsion d\'agrumes et carottes glacées rôties au thym sauvage ....... 38€',
        x: 15,
        y: 32,
        fontSize: 11,
        fontWeight: 'font-light',
        color: '#E7E7EF',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'menu-item-2',
        type: 'text',
        content: 'Filet de canard de Challans rôti, réduction de mûres sauvages et mousseline de céleri ....... 42€',
        x: 15,
        y: 44,
        fontSize: 11,
        fontWeight: 'font-light',
        color: '#E7E7EF',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'menu-item-3',
        type: 'text',
        content: 'Guanaja au levain croquant, sorbet cardamome noire, sel de Guérande fumé ............... 16€',
        x: 15,
        y: 56,
        fontSize: 11,
        fontWeight: 'font-light',
        color: '#E7E7EF',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'menu-footnote',
        type: 'text',
        content: 'Tous nos desserts sont faits maison. Menu disponible uniquement pour l\'ensemble de la table.',
        x: 15,
        y: 82,
        fontSize: 9,
        fontWeight: 'font-light',
        color: '#9B9BA8',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'menu-accent-circle',
        type: 'shape',
        content: 'ring',
        x: 50,
        y: 50,
        width: 140,
        height: 140,
        color: '#F59E0B',
        bgFill: 'transparent',
        rotate: 0
      }
    ]
  },
  {
    id: 'minimal-business-card',
    name: 'Carte Architecte - Studio Brut',
    category: 'Cartes',
    format: '85x55',
    plan: 'Free',
    bgClass: 'bg-[#FFFFFF] text-black border border-stone-300',
    elements: [
      {
        id: 'studio-logo',
        type: 'text',
        content: '▩ STUDIO BRUT',
        x: 10,
        y: 15,
        fontSize: 14,
        fontWeight: 'font-bold',
        color: '#000000',
        fontFamily: 'mono',
        rotate: 0
      },
      {
        id: 'studio-subtitle',
        type: 'text',
        content: 'ARCHITECTURE & CONCEPTION',
        x: 10,
        y: 28,
        fontSize: 9,
        fontWeight: 'font-semibold',
        color: '#7C7267',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'studio-name',
        type: 'text',
        content: 'Marc-Antoine Giraud',
        x: 10,
        y: 55,
        fontSize: 16,
        fontWeight: 'font-medium',
        color: '#000000',
        fontFamily: 'serif',
        rotate: 0
      },
      {
        id: 'studio-role',
        type: 'text',
        content: 'Architecte DPLG / Associé principal',
        x: 10,
        y: 65,
        fontSize: 10,
        fontWeight: 'font-light',
        color: '#555555',
        fontFamily: 'sans',
        rotate: 0
      },
      {
        id: 'studio-phone',
        type: 'text',
        content: '+33 (0)1 42 80 90 10  |  ma.giraud@studiobrut.fr',
        x: 10,
        y: 82,
        fontSize: 9,
        fontWeight: 'font-medium',
        color: '#000000',
        fontFamily: 'mono',
        rotate: 0
      }
    ]
  }
];
