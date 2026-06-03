/**
 * Consilium TypeScript Types definitions.
 * Built by AmbiTech Dynamics.
 */

export interface BrandKit {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  slogan: string;
  fontHeading: string;
  fontBody: string;
  contactEmail: string;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'badge';
  content: string;
  x: number; // Percentage 0 - 100 for easy responsiveness
  y: number; // Percentage 0 - 100
  fontSize?: number; // Tailwind class size or pixel
  fontWeight?: string;
  color?: string; // Text color or shape fill
  width?: number; // Percentage or px
  height?: number;
  bgFill?: string; // For badges/shapes
  rotate?: number; // Transform rotation degrees
  fontFamily?: 'sans' | 'serif' | 'mono';
  isSticker?: boolean;
}

export interface Template {
  id: string;
  name: string;
  category: 'Flyers' | 'Affiches' | 'Cartes' | 'Réseaux' | 'CV' | 'Menus' | 'Rapports';
  format: 'A4' | 'A3' | 'Carré' | 'Story' | '85x55';
  plan: 'Free' | 'Pro' | 'Studio';
  imageUrl?: string; // Standard preview icon
  elements: CanvasElement[];
  bgClass: string; // Tailwind class starting colors (e.g. bg-radial-gradient)
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  format: 'A4' | 'A3' | 'Carré' | 'Story' | '85x55';
  templateId: string;
  elements: CanvasElement[];
  bgClass: string;
}

export interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  chips?: {
    label: string;
    value: string;
    category: string;
  }[];
  isSelectedAnswer?: string;
}
