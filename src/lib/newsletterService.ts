import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { NewsletterTemplate } from '../types';
import { handleFirestoreError, OperationType } from './firestoreService';

const TEMPLATES_COLLECTION = 'newsletter_templates';
const SENT_COLLECTION = 'sent_newsletters';

export const getTemplates = async (): Promise<NewsletterTemplate[]> => {
  try {
    const q = query(collection(db, TEMPLATES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NewsletterTemplate));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TEMPLATES_COLLECTION);
    return [];
  }
};

export const addTemplate = async (template: Omit<NewsletterTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date().toISOString();
  try {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...template,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, ...template, createdAt: now, updatedAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TEMPLATES_COLLECTION);
    throw error;
  }
};

export const updateTemplate = async (id: string, template: Partial<NewsletterTemplate>) => {
  const now = new Date().toISOString();
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
      ...template,
      updatedAt: now
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${TEMPLATES_COLLECTION}/${id}`);
    throw error;
  }
};

export const deleteTemplate = async (id: string) => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TEMPLATES_COLLECTION}/${id}`);
    throw error;
  }
};

// Log sent newsletters
export const logSentNewsletter = async (data: {
  templateId: string;
  propertyIds: string[];
  recipientEmails: string[];
}) => {
  const now = new Date().toISOString();
  try {
    await addDoc(collection(db, SENT_COLLECTION), {
      ...data,
      sentAt: now
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SENT_COLLECTION);
    throw error;
  }
};
