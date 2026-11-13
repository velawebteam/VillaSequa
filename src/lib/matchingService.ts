import { Lead, Property, PROPERTY_FEATURES } from '../types';

export type SpecCategory = 'type' | 'location' | 'category' | 'bedrooms' | 'maxPrice' | 'feature';

export interface LeadSpec {
  key: string;
  category: SpecCategory;
  label: string;
  value: string;
  rawValue: string | number;
}

export interface PropertyMatchResult {
  property: Property;
  matchedSpecs: LeadSpec[];
  unmatchedSpecs: LeadSpec[];
  matchCount: number;
  totalSpecs: number;
}

export const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const ALGARVE_LOCATIONS = [
  'Quinta do Lago',
  'Vale do Lobo',
  'Vilamoura',
  'Quarteira',
  'Almancil',
  'Loulé',
  'Faro',
  'Tavira',
  'Olhão',
  'Albufeira',
  'Portimão',
  'Lagos',
  'Sagres',
  'Carvoeiro',
  'Lagoa',
  'Silves',
  'Alvor',
  'Monchique',
  'Castro Marim',
  'Vila Real de Santo António',
  'Aljezur',
  'Algarve',
];

const FEATURE_SYNONYMS: Record<string, string[]> = {
  Piscina: ['piscina', 'pool'],
  Jardim: ['jardim', 'garden'],
  Garagem: ['garagem', 'estacionamento', 'garage', 'parking', 'box'],
  'Vista Mar': ['vista mar', 'vista para o mar', 'frente mar', 'sea view'],
  'Vista Golfe': ['vista golfe', 'golfe', 'golf'],
  'Ar Condicionado': ['ar condicionado', 'ar-condicionado', 'ac', 'climatizacao'],
  Lareira: ['lareira', 'fireplace'],
  'Cozinha Equipada': ['cozinha equipada', 'equipada'],
  'Painéis Solares': ['paineis solares', 'painel solar', 'energia solar', 'solar'],
  Domótica: ['domotica', 'casa inteligente', 'smart home'],
  Alarme: ['alarme', 'seguranca'],
  Jacuzzi: ['jacuzzi'],
  Ginásio: ['ginasio', 'gym'],
  'Campo de Ténis': ['campo de tenis', 'tenis', 'padel'],
  Barbecue: ['barbecue', 'churrasqueira', 'bbq'],
  Terraço: ['terraco', 'patio', 'rooftop'],
  Varanda: ['varanda', 'balcao'],
  Arrecadação: ['arrecadacao', 'arrumos'],
  Elevador: ['elevador', 'ascensor'],
  Mobilado: ['mobilado', 'mobilada', 'mobiliado'],
  'Vidros Duplos': ['vidros duplos'],
  'Aquecimento Central': ['aquecimento central', 'aquecimento'],
};

const normalizePropertyType = (rawType: string): string => {
  const norm = normalizeText(rawType);
  if (norm.includes('moradia') || norm.includes('vivenda') || norm.includes('villa') || norm.includes('casa')) {
    return 'Vivenda';
  }
  if (norm.includes('apartamento') || norm.includes('penthouse') || norm.includes('flat')) {
    return 'Apartamento';
  }
  if (norm.includes('terreno') || norm.includes('lote')) {
    return 'Terreno';
  }
  if (norm.includes('comercial') || norm.includes('loja') || norm.includes('escritorio')) {
    return 'Comercial';
  }
  if (norm.includes('nova construcao') || norm.includes('empreendimento') || norm.includes('construcao')) {
    return 'Nova Construção';
  }
  return rawType.trim();
};

const extractCleanMessageAndRef = (
  message: string,
  allProperties: Property[]
): { cleanMessage: string; referencedProperty?: Property } => {
  if (!message) return { cleanMessage: '' };

  let referencedProperty: Property | undefined;
  const idMatch = message.match(/\[Interesse no imóvel:.*?#([^\]]+)\]/i);
  if (idMatch?.[1]) {
    referencedProperty = allProperties.find((p) => p.id === idMatch[1].trim());
  } else {
    const titleMatch = message.match(/\[Interesse:\s*([^\]]+)\]/i);
    if (titleMatch?.[1]) {
      const target = normalizeText(titleMatch[1]);
      referencedProperty = allProperties.find((p) => normalizeText(p.title) === target);
    }
  }

  const cleanMessage = message
    .replace(/\[Assunto:[^\]]*\]/gi, ' ')
    .replace(/\[Interesse no imóvel:[^\]]*\]/gi, ' ')
    .replace(/\[Interesse:[^\]]*\]/gi, ' ')
    .trim();

  return { cleanMessage, referencedProperty };
};

const parseMaxPriceFromText = (text: string): number | undefined => {
  const norm = normalizeText(text);

  // Look for numbers with explicit currency/scale suffixes or budget keywords
  const patterns = [
    /(?:ate|maximo|max|orcamento|budget|valor|preco)\s*(?:de)?\s*€?\s*(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(milhoes|milhao|m|k|mil)?\s*(?:€|eur|euros)?/i,
    /€\s*(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(milhoes|milhao|m|k|mil)?/i,
    /(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(milhoes|milhao|m|k|mil)?\s*(?:€|eur|euros)/i,
    /(\d+(?:[.,]\d+)?)\s*(k|milhoes|milhao)\b/i,
  ];

  for (const regex of patterns) {
    const match = norm.match(regex);
    if (match?.[1]) {
      let numStr = match[1].replace(/\s+/g, '');
      const unit = (match[2] || '').toLowerCase();

      if (unit === 'm' || unit === 'milhao' || unit === 'milhoes') {
        numStr = numStr.replace(',', '.');
        const val = parseFloat(numStr);
        if (!isNaN(val) && val > 0) return Math.round(val * 1_000_000);
      } else if (unit === 'k' || unit === 'mil') {
        numStr = numStr.replace(',', '.');
        const val = parseFloat(numStr);
        if (!isNaN(val) && val > 0) return Math.round(val * 1_000);
      } else {
        // Handle European thousands separator like 500.000
        if (/^\d{1,3}(\.\d{3})+$/.test(numStr)) {
          numStr = numStr.replace(/\./g, '');
        } else {
          numStr = numStr.replace(',', '.');
        }
        const val = parseFloat(numStr);
        if (!isNaN(val) && val >= 200) return Math.round(val);
      }
    }
  }
  return undefined;
};

const parseBedroomsFromText = (text: string): number | undefined => {
  const norm = normalizeText(text);
  const tMatch = norm.match(/\bt([0-9])\b/);
  if (tMatch?.[1]) {
    const num = parseInt(tMatch[1], 10);
    if (!isNaN(num) && num >= 0) return num;
  }
  const qMatch = norm.match(/(\d+)\s*quartos?\b/);
  if (qMatch?.[1]) {
    const num = parseInt(qMatch[1], 10);
    if (!isNaN(num) && num >= 0) return num;
  }
  return undefined;
};

export const extractLeadSpecifications = (
  lead: Lead,
  allProperties: Property[] = []
): LeadSpec[] => {
  const specs: LeadSpec[] = [];
  const addSpec = (spec: LeadSpec) => {
    if (!specs.some((s) => s.key === spec.key)) {
      specs.push(spec);
    }
  };

  const { cleanMessage, referencedProperty } = extractCleanMessageAndRef(
    lead.message || '',
    allProperties
  );
  const normMsg = normalizeText(cleanMessage);

  // 1. Property Type
  if (lead.propertyType && lead.propertyType.trim()) {
    const canonical = normalizePropertyType(lead.propertyType);
    addSpec({
      key: 'type',
      category: 'type',
      label: 'Tipo de Imóvel',
      value: canonical,
      rawValue: canonical,
    });
  } else if (normMsg) {
    if (normMsg.includes('nova construcao') || normMsg.includes('empreendimento')) {
      addSpec({
        key: 'type',
        category: 'type',
        label: 'Tipo de Imóvel',
        value: 'Nova Construção',
        rawValue: 'Nova Construção',
      });
    } else if (normMsg.includes('vivenda') || normMsg.includes('moradia') || normMsg.includes('villa')) {
      addSpec({
        key: 'type',
        category: 'type',
        label: 'Tipo de Imóvel',
        value: 'Vivenda',
        rawValue: 'Vivenda',
      });
    } else if (normMsg.includes('apartamento') || normMsg.includes('penthouse')) {
      addSpec({
        key: 'type',
        category: 'type',
        label: 'Tipo de Imóvel',
        value: 'Apartamento',
        rawValue: 'Apartamento',
      });
    } else if (normMsg.includes('terreno') || normMsg.includes('lote')) {
      addSpec({
        key: 'type',
        category: 'type',
        label: 'Tipo de Imóvel',
        value: 'Terreno',
        rawValue: 'Terreno',
      });
    } else if (normMsg.includes('comercial') || normMsg.includes('loja') || normMsg.includes('escritorio')) {
      addSpec({
        key: 'type',
        category: 'type',
        label: 'Tipo de Imóvel',
        value: 'Comercial',
        rawValue: 'Comercial',
      });
    }
  }

  // 2. Location
  if (lead.location && lead.location.trim()) {
    addSpec({
      key: 'location',
      category: 'location',
      label: 'Localização',
      value: lead.location.trim(),
      rawValue: lead.location.trim(),
    });
  } else if (normMsg) {
    const candidateLocations = new Set<string>(ALGARVE_LOCATIONS);
    allProperties.forEach((p) => {
      p.location.split(',').forEach((part) => {
        const trimmed = part.trim();
        if (trimmed.length >= 3) candidateLocations.add(trimmed);
      });
    });

    // Prefer specific cities over generic "Algarve"
    const sortedCandidates = Array.from(candidateLocations).sort((a, b) => {
      if (normalizeText(a) === 'algarve') return 1;
      if (normalizeText(b) === 'algarve') return -1;
      return b.length - a.length;
    });

    const foundLocation = sortedCandidates.find((loc) =>
      normMsg.includes(normalizeText(loc))
    );
    if (foundLocation) {
      addSpec({
        key: 'location',
        category: 'location',
        label: 'Localização',
        value: foundLocation,
        rawValue: foundLocation,
      });
    }
  }

  // 3. Category / Finalidade
  if (lead.category) {
    const catLabel =
      lead.category === 'venda'
        ? 'Compra'
        : lead.category === 'arrendamento'
        ? 'Arrendamento'
        : 'Nova Construção';
    addSpec({
      key: 'category',
      category: 'category',
      label: 'Finalidade',
      value: catLabel,
      rawValue: lead.category,
    });
  } else if (normMsg) {
    if (normMsg.includes('arrendar') || normMsg.includes('arrendamento') || normMsg.includes('alugar')) {
      addSpec({
        key: 'category',
        category: 'category',
        label: 'Finalidade',
        value: 'Arrendamento',
        rawValue: 'arrendamento',
      });
    } else if (normMsg.includes('comprar') || normMsg.includes('compra') || normMsg.includes('aquisicao')) {
      addSpec({
        key: 'category',
        category: 'category',
        label: 'Finalidade',
        value: 'Compra',
        rawValue: 'venda',
      });
    } else if (normMsg.includes('em construcao') || normMsg.includes('planta')) {
      addSpec({
        key: 'category',
        category: 'category',
        label: 'Finalidade',
        value: 'Nova Construção',
        rawValue: 'construcao',
      });
    }
  }

  // 4. Bedrooms
  const bedrooms =
    lead.bedrooms !== undefined && lead.bedrooms > 0
      ? lead.bedrooms
      : parseBedroomsFromText(cleanMessage);
  if (bedrooms !== undefined && bedrooms > 0) {
    addSpec({
      key: 'bedrooms',
      category: 'bedrooms',
      label: 'Tipologia / Quartos',
      value: `T${bedrooms}+ (${bedrooms}+ Quartos)`,
      rawValue: bedrooms,
    });
  }

  // 5. Max Price
  const maxPrice =
    lead.maxPrice !== undefined && lead.maxPrice > 0
      ? lead.maxPrice
      : parseMaxPriceFromText(cleanMessage);
  if (maxPrice !== undefined && maxPrice > 0) {
    addSpec({
      key: 'maxPrice',
      category: 'maxPrice',
      label: 'Orçamento Máx.',
      value: `Até ${maxPrice.toLocaleString('pt-PT')} €`,
      rawValue: maxPrice,
    });
  }

  // 6. Desired Features
  const explicitFeatures = lead.desiredFeatures || [];
  explicitFeatures.forEach((feat) => {
    addSpec({
      key: `feature:${normalizeText(feat)}`,
      category: 'feature',
      label: 'Comodidade',
      value: feat,
      rawValue: feat,
    });
  });

  if (normMsg) {
    PROPERTY_FEATURES.forEach((feat) => {
      const synonyms = FEATURE_SYNONYMS[feat] || [normalizeText(feat)];
      if (synonyms.some((syn) => normMsg.includes(syn))) {
        addSpec({
          key: `feature:${normalizeText(feat)}`,
          category: 'feature',
          label: 'Comodidade',
          value: feat,
          rawValue: feat,
        });
      }
    });
  }

  // Fallback: if lead only inquired about a specific property without custom specs,
  // derive baseline specs from that inquired property so matching can recommend the 2 best fits
  if (specs.length === 0 && referencedProperty) {
    addSpec({
      key: 'type',
      category: 'type',
      label: 'Tipo de Imóvel',
      value: referencedProperty.type,
      rawValue: referencedProperty.type,
    });
    if (referencedProperty.location) {
      addSpec({
        key: 'location',
        category: 'location',
        label: 'Localização',
        value: referencedProperty.location,
        rawValue: referencedProperty.location,
      });
    }
    if (referencedProperty.bedrooms > 0) {
      addSpec({
        key: 'bedrooms',
        category: 'bedrooms',
        label: 'Tipologia / Quartos',
        value: `T${referencedProperty.bedrooms}+ (${referencedProperty.bedrooms}+ Quartos)`,
        rawValue: referencedProperty.bedrooms,
      });
    }
    if (referencedProperty.category) {
      addSpec({
        key: 'category',
        category: 'category',
        label: 'Finalidade',
        value:
          referencedProperty.category === 'venda'
            ? 'Compra'
            : referencedProperty.category === 'arrendamento'
            ? 'Arrendamento'
            : 'Nova Construção',
        rawValue: referencedProperty.category,
      });
    }
  }

  return specs;
};

export const doesPropertyMatchSpec = (property: Property, spec: LeadSpec): boolean => {
  switch (spec.category) {
    case 'type': {
      const propType = normalizeText(property.type);
      const targetType = normalizeText(String(spec.rawValue));
      return propType === targetType || propType.includes(targetType) || targetType.includes(propType);
    }
    case 'location': {
      const propLoc = normalizeText(property.location);
      const targetLoc = normalizeText(String(spec.rawValue));
      const propCity = propLoc.split(',')[0]?.trim();
      const targetCity = targetLoc.split(',')[0]?.trim();
      return (
        propLoc.includes(targetLoc) ||
        targetLoc.includes(propLoc) ||
        (Boolean(propCity) && targetLoc.includes(propCity)) ||
        (Boolean(targetCity) && propLoc.includes(targetCity))
      );
    }
    case 'category': {
      return property.category === String(spec.rawValue);
    }
    case 'bedrooms': {
      const minBeds = Number(spec.rawValue);
      return property.bedrooms >= minBeds;
    }
    case 'maxPrice': {
      const maxP = Number(spec.rawValue);
      return !property.priceOnRequest && property.price > 0 && property.price <= maxP;
    }
    case 'feature': {
      const featName = String(spec.rawValue);
      const normFeat = normalizeText(featName);
      const synonyms = FEATURE_SYNONYMS[featName] || [normFeat];
      const propFeaturesNorm = property.features.map((f) => normalizeText(f));
      const propDescNorm = normalizeText(property.description || '');

      return (
        propFeaturesNorm.some(
          (pf) =>
            pf.includes(normFeat) ||
            normFeat.includes(pf) ||
            synonyms.some((syn) => pf.includes(syn))
        ) || synonyms.some((syn) => propDescNorm.includes(syn))
      );
    }
    default:
      return false;
  }
};

export const evaluatePropertyMatch = (
  property: Property,
  specs: LeadSpec[]
): PropertyMatchResult => {
  const matchedSpecs: LeadSpec[] = [];
  const unmatchedSpecs: LeadSpec[] = [];

  specs.forEach((spec) => {
    if (doesPropertyMatchSpec(property, spec)) {
      matchedSpecs.push(spec);
    } else {
      unmatchedSpecs.push(spec);
    }
  });

  return {
    property,
    matchedSpecs,
    unmatchedSpecs,
    matchCount: matchedSpecs.length,
    totalSpecs: specs.length,
  };
};

/**
 * Matching rule:
 * Recommend the TOP 2 properties that match the highest number of client specifications.
 */
export const getTopMatchedProperties = (
  properties: Property[],
  specs: LeadSpec[],
  limit = 2
): PropertyMatchResult[] => {
  if (specs.length === 0) return [];

  const eligibleProperties = properties.filter(
    (p) => p.commercialStatus !== 'vendido' && p.commercialStatus !== 'indisponível'
  );

  const bedroomSpec = specs.find((s) => s.category === 'bedrooms');
  const desiredBedrooms = bedroomSpec ? Number(bedroomSpec.rawValue) : null;

  return eligibleProperties
    .map((p) => evaluatePropertyMatch(p, specs))
    .filter((res) => res.matchCount > 0)
    .sort((a, b) => {
      // Primary rule: most matched specifications
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      // Tie-breaker 1: exact bedroom match over higher bedrooms
      if (desiredBedrooms !== null) {
        const aExact = a.property.bedrooms === desiredBedrooms ? 1 : 0;
        const bExact = b.property.bedrooms === desiredBedrooms ? 1 : 0;
        if (bExact !== aExact) return bExact - aExact;
      }
      // Tie-breaker 2: featured property
      const aFeat = a.property.featured ? 1 : 0;
      const bFeat = b.property.featured ? 1 : 0;
      if (bFeat !== aFeat) return bFeat - aFeat;
      // Tie-breaker 3: lower price first
      return a.property.price - b.property.price;
    })
    .slice(0, limit);
};

export const sanitizeWhatsAppPhone = (phone: string): string => {
  let digits = (phone || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  // If 9-digit Portuguese number without country code, prepend 351
  if (digits.length === 9 && (digits.startsWith('9') || digits.startsWith('2'))) {
    digits = `351${digits}`;
  }
  return digits;
};

export const formatWhatsAppUrl = (
  phone: string,
  lead: Lead,
  assignedProperties: Property[]
): string => {
  const digits = sanitizeWhatsAppPhone(phone);
  const propLines = assignedProperties
    .map(
      (p, idx) =>
        `${idx + 1}. *${p.title}* (${p.location}) - ${
          p.priceOnRequest ? 'Sob Consulta' : `${p.price.toLocaleString('pt-PT')} €`
        } [Ref: ${p.reference || p.id}]`
    )
    .join('\n');

  const text = `Olá ${lead.name || 'estimado(a) cliente'},\n\nSelecionámos os 2 imóveis que melhor correspondem às suas especificações:\n\n${propLines}\n\nGostaria de agendar uma visita ou receber mais informações?`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};
