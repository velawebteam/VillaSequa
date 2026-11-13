import { Property } from '../types';
import { mockProperties } from '../data/mockProperties';

const STORAGE_KEY = 'imobiliaria_properties_v2';
const HISTORY_KEY = 'imobiliaria_import_history_v1';

export interface ImportHistory {
  date: string;
  count: number;
  status: 'success' | 'error';
  message: string;
}

export const getImportHistory = (): ImportHistory[] => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const saveImportHistory = (history: ImportHistory): void => {
  const current = getImportHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify([history, ...current].slice(0, 50)));
};
export const getProperties = (): Property[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: ensure new fields exist
      return parsed.map((p: any) => ({
        ...p,
        commercialStatus: p.commercialStatus || 'disponível',
        publicationStatus: p.publicationStatus || 'publicado',
        visibility: p.visibility || 'visível',
        category: p.category || 'venda',
        reference: p.reference || `REF-${p.id || Date.now()}`,
        energyRate: p.energyRate,
        priceOnRequest: p.priceOnRequest || false,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
        createdBy: p.createdBy || 'admin'
      }));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProperties));
      return mockProperties;
    }
  } catch (e) {
    console.error('Failed to load properties from localStorage', e);
  }
  return mockProperties;
};

export const saveProperties = (properties: Property[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  } catch (e) {
    console.error('Failed to save properties to localStorage', e);
  }
};

export const addProperty = (property: Partial<Property>): Property => {
  const properties = getProperties();
  const now = new Date().toISOString();
  const newProperty: Property = {
    id: Date.now().toString(),
    title: property.title || 'Novo Imóvel',
    description: property.description || '',
    price: property.price || 0,
    location: property.location || '',
    type: property.type || 'Vivenda',
    status: property.status || 'Novo',
    commercialStatus: property.commercialStatus || 'disponível',
    publicationStatus: property.publicationStatus || 'publicado',
    visibility: property.visibility || 'visível',
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    area: property.area || 0,
    images: property.images || [],
    features: property.features || [],
    featured: property.featured || false,
    category: property.category || 'venda',
    reference: property.reference || `REF-${Date.now()}`,
    energyRate: property.energyRate,
    priceOnRequest: property.priceOnRequest || false,
    createdAt: now,
    updatedAt: now,
    createdBy: property.createdBy || 'admin'
  };
  const updated = [newProperty, ...properties];
  saveProperties(updated);
  return newProperty;
};

export const deleteProperty = (id: string): Property[] => {
  const properties = getProperties();
  const updated = properties.filter(p => String(p.id) !== String(id));
  saveProperties(updated);
  return updated;
};

export const deleteAllProperties = (): Property[] => {
  saveProperties([]);
  return [];
};

export const toggleFeaturedProperty = (id: string): Property[] => {
  const properties = getProperties();
  const updated = properties.map(p => {
    if (String(p.id) === String(id)) {
      return { ...p, featured: !p.featured };
    }
    return p;
  });
  saveProperties(updated);
  return updated;
};

// Export properties to XML string
export const exportPropertiesToXml = (properties: Property[]): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<properties>\n';
  properties.forEach(p => {
    xml += `  <property>\n`;
    xml += `    <id>${p.id}</id>\n`;
    xml += `    <title><![CDATA[${p.title}]]></title>\n`;
    xml += `    <description><![CDATA[${p.description}]]></description>\n`;
    xml += `    <price>${p.price}</price>\n`;
    xml += `    <location><![CDATA[${p.location}]]></location>\n`;
    xml += `    <type>${p.type}</type>\n`;
    xml += `    <status>${p.status}</status>\n`;
    xml += `    <bedrooms>${p.bedrooms}</bedrooms>\n`;
    xml += `    <bathrooms>${p.bathrooms}</bathrooms>\n`;
    xml += `    <area>${p.area}</area>\n`;
    xml += `    <featured>${p.featured ? 'true' : 'false'}</featured>\n`;
    xml += `    <visibility>${p.visibility}</visibility>\n`;
    xml += `    <category>${p.category}</category>\n`;
    xml += `    <reference>${p.reference}</reference>\n`;
    if (p.energyRate) xml += `    <energyRate>${p.energyRate}</energyRate>\n`;
    xml += `    <priceOnRequest>${p.priceOnRequest ? 'true' : 'false'}</priceOnRequest>\n`;
    xml += `    <images>\n`;
    p.images.forEach(img => {
      xml += `      <image><![CDATA[${img}]]></image>\n`;
    });
    xml += `    </images>\n`;
    xml += `    <features>\n`;
    p.features.forEach(f => {
      xml += `      <feature><![CDATA[${f}]]></feature>\n`;
    });
    xml += `    </features>\n`;
    xml += `  </property>\n`;
  });
  xml += `</properties>`;
  return xml;
};

export interface RealEstatePortal {
  id: string;
  name: string;
  market: string;
  format: string;
  description: string;
}

export const REAL_ESTATE_PORTALS: RealEstatePortal[] = [
  { id: 'idealista', name: 'Idealista', market: 'Portugal & Espanha', format: 'Idealista XML', description: 'Portal líder na Península Ibérica' },
  { id: 'imovirtual', name: 'Imovirtual', market: 'Portugal', format: 'OLX/Imovirtual XML', description: 'Grande alcance no mercado residencial nacional' },
  { id: 'casasapo', name: 'Casa Sapo', market: 'Portugal', format: 'Casa Sapo XML', description: 'Portal imobiliário de referência em Portugal' },
  { id: 'supercasa', name: 'Supercasa', market: 'Portugal', format: 'Supercasa XML', description: 'Integração direta com rede de portais portugueses' },
  { id: 'olx', name: 'OLX Imóveis', market: 'Portugal', format: 'OLX Feed XML', description: 'Classificados de elevado tráfego nacional' },
  { id: 'bpi_expresso', name: 'BPI Expresso Imobiliário', market: 'Portugal', format: 'Expresso XML', description: 'Portal associado ao Banco BPI e Expresso' },
  { id: 'kyero', name: 'Kyero', market: 'Internacional / Algarve', format: 'Kyero v3 XML', description: 'Compradores internacionais no Algarve e Portugal' },
  { id: 'green_acres', name: 'Green-Acres', market: 'Europa', format: 'Green-Acres XML', description: 'Foco em investidores franceses, belgas e europeus' },
  { id: 'properstar', name: 'Properstar / ListGlobally', market: 'Rede Global', format: 'ListGlobally XML', description: 'Sindicação para mais de 100 portais internacionais' },
  { id: 'rightmove', name: 'Rightmove Overseas', market: 'Reino Unido', format: 'Rightmove BLM/XML', description: 'Maior portal imobiliário do mercado britânico' },
  { id: 'zoopla', name: 'Zoopla Overseas', market: 'Reino Unido', format: 'Zoopla XML', description: 'Alcance direto a compradores do Reino Unido' },
  { id: 'aplaceinthesun', name: 'A Place in the Sun', market: 'Reino Unido & Irlanda', format: 'APITS XML', description: 'Especializado em segunda habitação e Algarve' },
  { id: 'jamesedition', name: 'JamesEdition', market: 'Luxo Global', format: 'Luxury XML', description: 'Marketplace internacional de propriedades de luxo' },
  { id: 'luxuryestate', name: 'LuxuryEstate', market: 'Luxo Internacional', format: 'LuxuryEstate XML', description: 'Imóveis premium e de alto rendimento' },
  { id: 'thinkspain', name: 'ThinkSpain & Portugal', market: 'Internacional', format: 'Kyero/Standard XML', description: 'Compradores internacionais e expatriados' }
];

export const exportPropertiesForPortalsXml = (
  properties: Property[],
  portalIds: string[],
  exportedBy?: string
): string => {
  const selectedPortalObjs = REAL_ESTATE_PORTALS.filter(portal => portalIds.includes(portal.id));
  const generatedAt = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<feed>\n';
  xml += `  <metadata>\n`;
  xml += `    <generatedAt>${generatedAt}</generatedAt>\n`;
  if (exportedBy) {
    xml += `    <consultant><![CDATA[${exportedBy}]]></consultant>\n`;
  }
  xml += `    <propertyCount>${properties.length}</propertyCount>\n`;
  xml += `    <targetPortals>\n`;
  selectedPortalObjs.forEach(portal => {
    xml += `      <portal id="${portal.id}" format="${portal.format}"><![CDATA[${portal.name}]]></portal>\n`;
  });
  xml += `    </targetPortals>\n`;
  xml += `  </metadata>\n`;
  xml += `  <properties>\n`;
  properties.forEach(p => {
    xml += `    <property>\n`;
    xml += `      <id>${p.id}</id>\n`;
    xml += `      <reference>${p.reference}</reference>\n`;
    xml += `      <title><![CDATA[${p.title}]]></title>\n`;
    xml += `      <description><![CDATA[${p.description}]]></description>\n`;
    xml += `      <price>${p.price}</price>\n`;
    xml += `      <priceOnRequest>${p.priceOnRequest ? 'true' : 'false'}</priceOnRequest>\n`;
    xml += `      <location><![CDATA[${p.location}]]></location>\n`;
    xml += `      <type>${p.type}</type>\n`;
    xml += `      <category>${p.category}</category>\n`;
    xml += `      <status>${p.status}</status>\n`;
    if (p.commercialStatus) xml += `      <commercialStatus>${p.commercialStatus}</commercialStatus>\n`;
    xml += `      <bedrooms>${p.bedrooms}</bedrooms>\n`;
    xml += `      <bathrooms>${p.bathrooms}</bathrooms>\n`;
    xml += `      <area>${p.area}</area>\n`;
    if (p.grossArea) xml += `      <grossArea>${p.grossArea}</grossArea>\n`;
    if (p.landArea) xml += `      <landArea>${p.landArea}</landArea>\n`;
    if (p.energyRate) xml += `      <energyRate>${p.energyRate}</energyRate>\n`;
    xml += `      <featured>${p.featured ? 'true' : 'false'}</featured>\n`;
    xml += `      <visibility>${p.visibility}</visibility>\n`;
    if (p.coordinates && (p.coordinates.lat || p.coordinates.lng)) {
      xml += `      <coordinates><lat>${p.coordinates.lat}</lat><lng>${p.coordinates.lng}</lng></coordinates>\n`;
    }
    if (p.videoUrl) xml += `      <videoUrl><![CDATA[${p.videoUrl}]]></videoUrl>\n`;
    xml += `      <images>\n`;
    p.images.forEach(img => {
      xml += `        <image><![CDATA[${img}]]></image>\n`;
    });
    xml += `      </images>\n`;
    xml += `      <features>\n`;
    p.features.forEach(f => {
      xml += `        <feature><![CDATA[${f}]]></feature>\n`;
    });
    xml += `      </features>\n`;
    xml += `    </property>\n`;
  });
  xml += `  </properties>\n`;
  xml += `</feed>`;
  return xml;
};

// XML CRM Parser helper
export const parsePropertiesXml = (xmlText: string): Property[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const nodes = xmlDoc.querySelectorAll('property, imovel, item, listing');
  const parsedProperties: Property[] = [];
  const now = new Date().toISOString();

  nodes.forEach((node, index) => {
    const getText = (tag: string) => node.querySelector(tag)?.textContent || '';
    const getNum = (tag: string, defaultVal = 0) => {
      const val = parseFloat(getText(tag));
      return isNaN(val) ? defaultVal : val;
    };

    const title = getText('title') || getText('titulo') || `Imóvel CRM ${index + 1}`;
    const description = getText('description') || getText('descricao') || 'Imóvel importado do CRM.';
    const price = getNum('price') || getNum('preco') || 250000;
    const location = getText('location') || getText('localizacao') || 'Algarve';
    
    let type: Property['type'] = 'Vivenda';
    const rawType = (getText('type') || getText('tipo')).toLowerCase();
    if (rawType.includes('apartamento') || rawType.includes('apartment')) type = 'Apartamento';
    else if (rawType.includes('terreno') || rawType.includes('land')) type = 'Terreno';
    else if (rawType.includes('comercial') || rawType.includes('store')) type = 'Comercial';

    let status: Property['status'] = 'Novo';
    const rawStatus = (getText('status') || getText('estado')).toLowerCase();
    if (rawStatus.includes('usado')) status = 'Usado';
    else if (rawStatus.includes('construcao')) status = 'Em Construção';

    const bedrooms = getNum('bedrooms') || getNum('quartos') || 2;
    const bathrooms = getNum('bathrooms') || getNum('wc') || 2;
    const area = getNum('area') || getNum('superficie') || 120;

    const imageNodes = node.querySelectorAll('image, foto, img');
    const images: string[] = [];
    imageNodes.forEach(img => {
      if (img.textContent) images.push(img.textContent.trim());
    });
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000');
    }

    const featNodes = node.querySelectorAll('feature, caracteristica, item');
    const features: string[] = [];
    featNodes.forEach(f => {
      if (f.textContent && f.textContent.length < 30) features.push(f.textContent.trim());
    });
    if (features.length === 0) {
      features.push('Piscina', 'Terraço', 'Estacionamento');
    }

    const featured = getText('featured') === 'true' || getText('destaque') === '1' || index < 3;
    const visibility = (getText('visibility') || getText('visibilidade')) === 'oculto' ? 'oculto' : 'visível';

    parsedProperties.push({
      id: getText('id') || `crm_${Date.now()}_${index}`,
      title,
      description,
      price,
      location,
      type,
      status,
      commercialStatus: 'disponível',
      publicationStatus: 'publicado',
      visibility,
      bedrooms,
      bathrooms,
      area,
      images,
      features,
      featured,
      category: (getText('category') || getText('categoria')) as Property['category'] || (rawStatus.includes('construcao') ? 'construcao' : 'venda'),
      reference: getText('reference') || getText('referencia') || `CRM-${index + 1}`,
      energyRate: (getText('energyRate') || getText('energy_rate') || getText('classe_energetica')) as Property['energyRate'],
      priceOnRequest: getText('priceOnRequest') === 'true',
      createdAt: now,
      updatedAt: now,
      createdBy: 'admin'
    });
  });

  saveProperties(parsedProperties);
  saveImportHistory({
    date: new Date().toISOString(),
    count: parsedProperties.length,
    status: 'success',
    message: 'Importação bem sucedida via XML'
  });
  return parsedProperties;
};
