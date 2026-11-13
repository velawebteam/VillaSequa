import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './firestoreService';

export type HeaderLinkId = 'home' | 'listing' | 'sell' | 'services' | 'about' | 'contact';

export interface HeaderLinkConfig {
  id: HeaderLinkId;
  label: string;
  path: string;
  visible: boolean;
}

export const DEFAULT_HEADER_LINKS_PT: HeaderLinkConfig[] = [
  { id: 'home', label: 'Início', path: '/', visible: true },
  { id: 'listing', label: 'Imóveis', path: '/listing', visible: true },
  { id: 'sell', label: 'Vender', path: '/sell', visible: true },
  { id: 'services', label: 'Serviços', path: '/services', visible: true },
  { id: 'about', label: 'Sobre Nós', path: '/about', visible: true },
  { id: 'contact', label: 'Contacto', path: '/contact', visible: true },
];

export const DEFAULT_HEADER_LINKS_EN: HeaderLinkConfig[] = [
  { id: 'home', label: 'Home', path: '/', visible: true },
  { id: 'listing', label: 'Properties', path: '/listing', visible: true },
  { id: 'sell', label: 'Sell', path: '/sell', visible: true },
  { id: 'services', label: 'Services', path: '/services', visible: true },
  { id: 'about', label: 'About Us', path: '/about', visible: true },
  { id: 'contact', label: 'Contact', path: '/contact', visible: true },
];

export interface WebsiteConfig {
  // Header Configuration
  headerLinksPt?: HeaderLinkConfig[];
  headerLinksEn?: HeaderLinkConfig[];

  // Footer Configuration
  footerInstagramUrl?: string;
  footerFacebookUrl?: string;
  footerLinkedinUrl?: string;
  footerAddress?: string;
  footerPhone?: string;
  footerEmail?: string;

  // Home Page
  heroTitle?: string;
  heroTitleFont?: string;
  heroSubtitle?: string;
  heroSubtitleFont?: string;
  heroImage?: string;
  heroButtonText?: string;
  heroButtonTextFont?: string;
  evalTitle?: string;
  evalTitleFont?: string;
  evalSubtitle?: string;
  evalSubtitleFont?: string;
  evalImage?: string;
  statsYears?: string;
  statsYearsFont?: string;
  statsSold?: string;
  statsSoldFont?: string;
  statsClients?: string;
  statsClientsFont?: string;
  statsTransparency?: string;
  statsTransparencyFont?: string;

  // About Page
  aboutTitle?: string;
  aboutTitleFont?: string;
  aboutText1?: string;
  aboutText1Font?: string;
  aboutText2?: string;
  aboutText2Font?: string;
  aboutImage?: string;
  aboutYearsCount?: string;
  aboutYearsCountFont?: string;

  // Services Page
  servicesTitle?: string;
  servicesTitleFont?: string;
  servicesSubtitle?: string;
  servicesSubtitleFont?: string;

  // Contact Page
  contactTitle?: string;
  contactTitleFont?: string;
  contactSubtitle?: string;
  contactSubtitleFont?: string;
  contactAddress?: string;
  contactAddressFont?: string;
  contactPhone?: string;
  contactPhoneFont?: string;
  contactEmail?: string;
  contactEmailFont?: string;
  contactScheduleWeek?: string;
  contactScheduleWeekFont?: string;
  contactScheduleSat?: string;
  contactScheduleSatFont?: string;
  contactScheduleSun?: string;
  contactScheduleSunFont?: string;

  updatedAt?: string;
}

const CONFIG_DOC_PATH = 'config/website';

export const getResolvedHeaderLinks = (
  config: WebsiteConfig | undefined,
  lang: 'pt' | 'en'
): HeaderLinkConfig[] => {
  const defaults = lang === 'en' ? DEFAULT_HEADER_LINKS_EN : DEFAULT_HEADER_LINKS_PT;
  const saved = lang === 'en' ? config?.headerLinksEn : config?.headerLinksPt;
  if (!saved || !Array.isArray(saved) || saved.length === 0) {
    return defaults.map(item => ({ ...item }));
  }
  // Ensure any default link missing from an older saved list is preserved
  const existingIds = new Set(saved.map(item => item.id));
  const merged = saved.map(item => ({
    ...item,
    visible: item.visible !== false,
  }));
  defaults.forEach(def => {
    if (!existingIds.has(def.id)) {
      merged.push({ ...def });
    }
  });
  return merged;
};

export const getWebsiteConfig = async (): Promise<WebsiteConfig> => {
  try {
    const docRef = doc(db, CONFIG_DOC_PATH);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as WebsiteConfig;
    }
    return {};
  } catch (error) {
    console.error('Error fetching website config:', error);
    return {};
  }
};

export const updateWebsiteConfig = async (config: WebsiteConfig): Promise<void> => {
  try {
    const docRef = doc(db, CONFIG_DOC_PATH);
    const payload = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CONFIG_DOC_PATH);
  }
};
