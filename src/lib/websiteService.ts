import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface WebsiteConfig {
  // Home Page
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroButtonText?: string;
  evalTitle?: string;
  evalSubtitle?: string;
  evalImage?: string;
  statsYears?: string;
  statsSold?: string;
  statsClients?: string;
  statsTransparency?: string;

  // About Page
  aboutTitle?: string;
  aboutText1?: string;
  aboutText2?: string;
  aboutImage?: string;
  aboutYearsCount?: string;

  // Services Page
  servicesTitle?: string;
  servicesSubtitle?: string;

  // Contact Page
  contactTitle?: string;
  contactSubtitle?: string;
  contactAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactScheduleWeek?: string;
  contactScheduleSat?: string;
  contactScheduleSun?: string;

  updatedAt?: string;
}

const CONFIG_DOC_PATH = 'config/website';

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
    console.log('Updating website config with payload:', payload);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.error('Error updating website config:', error);
    throw error;
  }
};
