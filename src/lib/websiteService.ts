import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface WebsiteConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroButtonText?: string;
  evalTitle?: string;
  evalSubtitle?: string;
  evalImage?: string;
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
