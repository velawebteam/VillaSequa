/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: 'Apartamento' | 'Vivenda' | 'Terreno' | 'Comercial';
  status: 'Novo' | 'Usado' | 'Em Construção';
  commercialStatus: 'disponível' | 'reservado' | 'vendido' | 'arrendado' | 'indisponível';
  publicationStatus: 'publicado' | 'rascunho' | 'nao_publicado';
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  features: string[];
  featured?: boolean;
  visibility: 'visível' | 'oculto';
  category: 'venda' | 'arrendamento' | 'construcao';
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  location?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  interest: 'compra' | 'venda' | 'arrendamento';
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
  type: 'evaluation' | 'contact' | 'info';
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  createdAt: string;
  updatedAt: string;
}

export type View = 'home' | 'listing' | 'detail' | 'about' | 'services' | 'favorites' | 'contact' | 'sell' | 'admin';
