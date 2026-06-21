import { Property } from '../types';

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Vivenda de Luxo na Quinta do Lago',
    description: 'Uma propriedade deslumbrante situada num dos resorts mais exclusivos da Europa. Com acabamentos de alta qualidade, piscina infinita e vistas para o golfe.',
    price: 4500000,
    location: 'Quinta do Lago, Algarve',
    type: 'Vivenda',
    status: 'Novo',
    bedrooms: 5,
    bathrooms: 6,
    area: 550,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1613977255092-2d611b416d9b?auto=format&fit=crop&q=80&w=1000'
    ],
    features: ['Piscina', 'Jardim', 'Garagem', 'Vista Golfe', 'Domótica'],
    featured: true
  },
  {
    id: '2',
    title: 'Apartamento T2 Moderno em Vilamoura',
    description: 'Apartamento contemporâneo localizado a poucos passos da Marina de Vilamoura. Ideal para investimento ou residência de férias.',
    price: 425000,
    location: 'Vilamoura, Algarve',
    type: 'Apartamento',
    status: 'Novo',
    bedrooms: 2,
    bathrooms: 2,
    area: 95,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000'
    ],
    features: ['Piscina Comum', 'Terraço', 'Cozinha Equipada', 'Estacionamento'],
    featured: true
  },
  {
    id: '3',
    title: 'Penthouse Exclusiva em Portimão',
    description: 'Vistas panorâmicas sobre o rio e o mar. Recentemente renovado com materiais nobres.',
    price: 850000,
    location: 'Portimão, Algarve',
    type: 'Apartamento',
    status: 'Usado',
    bedrooms: 3,
    bathrooms: 3,
    area: 180,
    images: [
      'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&q=80&w=1000'
    ],
    features: ['Jacuzzi', 'Ar Condicionado', 'Lareira', 'Arrecadação'],
    featured: true
  },
  {
    id: '4',
    title: 'Lote de Terreno para Construção em Sagres',
    description: 'Lote de terreno privilegiado com viabilidade para construção de moradia unifamiliar com vista para o Oceano Atlântico.',
    price: 320000,
    location: 'Sagres, Algarve',
    type: 'Terreno',
    status: 'Novo',
    bedrooms: 0,
    bathrooms: 0,
    area: 1200,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000'
    ],
    features: ['Vista Mar', 'Acesso Estrada', 'Zona Calma'],
    featured: false
  },
  {
    id: '5',
    title: 'Moradia Tradicional em Tavira',
    description: 'Moradia cheia de charme no centro histórico de Tavira. Pátio interior e traços arquitetónicos típicos da região.',
    price: 580000,
    location: 'Tavira, Algarve',
    type: 'Vivenda',
    status: 'Usado',
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000'
    ],
    features: ['Pátio', 'Churrasqueira', 'Centro Histórico'],
    featured: false
  },
  {
    id: '6',
    title: 'Espaço Comercial Premium em Loulé',
    description: 'Oportunidade única para negócio em zona de grande movimento. Ampla fachada vidrada.',
    price: 390000,
    location: 'Loulé, Algarve',
    type: 'Comercial',
    status: 'Usado',
    bedrooms: 0,
    bathrooms: 1,
    area: 85,
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000'
    ],
    features: ['Alarme', 'Extração de Fumos', 'Montra'],
    featured: false
  }
];
