/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  priceOnRequest?: boolean;
  location: string;
  type: 'Apartamento' | 'Vivenda' | 'Terreno' | 'Comercial' | 'Nova Construção';
  status: 'Novo' | 'Usado' | 'Em Construção';
  commercialStatus: 'disponível' | 'reservado' | 'vendido' | 'arrendado' | 'indisponível';
  publicationStatus: 'publicado' | 'rascunho' | 'nao_publicado';
  bedrooms: number;
  bathrooms: number;
  area: number;
  grossArea?: number;
  landArea?: number;
  videoUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  images: string[];
  features: string[];
  featured?: boolean;
  visibility: 'visível' | 'oculto';
  category: 'venda' | 'arrendamento' | 'construcao';
  reference: string;
  energyRate?: 'A+' | 'A' | 'B' | 'B-' | 'C' | 'D' | 'E' | 'F' | 'Exento';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const FONTS = [
  { id: 'font-sans', name: 'Inter' },
  { id: 'font-serif', name: 'Cormorant Garamond' },
  { id: 'font-playfair', name: 'Playfair Display' },
  { id: 'font-montserrat', name: 'Montserrat' },
  { id: 'font-lora', name: 'Lora' },
  { id: 'font-bodoni', name: 'Bodoni Moda' }
] as const;

export const ENERGY_RATES = ['A+', 'A', 'B', 'B-', 'C', 'D', 'E', 'F', 'Exento'] as const;

export const PROPERTY_FEATURES = [
  'Piscina',
  'Jardim',
  'Garagem',
  'Vista Mar',
  'Vista Golfe',
  'Ar Condicionado',
  'Lareira',
  'Cozinha Equipada',
  'Painéis Solares',
  'Domótica',
  'Alarme',
  'Jacuzzi',
  'Ginásio',
  'Campo de Ténis',
  'Barbecue',
  'Terraço',
  'Varanda',
  'Arrecadação',
  'Elevador',
  'Mobilado',
  'Vidros Duplos',
  'Aquecimento Central'
] as const;

export interface SearchFilters {
  location?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  reference?: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  interest: 'compra' | 'venda' | 'arrendamento';
  createdBy?: string;
  transferFrom?: string;
  transferTo?: string;
  transferStatus?: 'pending' | 'accepted' | 'rejected' | '';
  transferNote?: string;
  transferAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  location?: string;
  propertyType?: string;
  category?: 'venda' | 'arrendamento' | 'construcao' | '';
  bedrooms?: number;
  maxPrice?: number;
  desiredFeatures?: string[];
  matchedPropertyIds?: string[];
  matchedAt?: string;
  type: 'evaluation' | 'contact' | 'info' | 'newsletter' | 'match';
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  content: string; // HTML template
  createdAt: string;
  updatedAt: string;
}

export type View = 'home' | 'listing' | 'detail' | 'about' | 'services' | 'favorites' | 'contact' | 'sell' | 'admin';
