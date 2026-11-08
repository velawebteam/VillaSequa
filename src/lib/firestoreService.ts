import { Property } from '../types';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  setDoc,
  Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'properties';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'anonymous', // We are using hardcoded login for now
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getPropertiesFromFirestore = async (): Promise<Property[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const properties: Property[] = [];
    querySnapshot.forEach((doc) => {
      properties.push({ id: doc.id, ...doc.data() } as Property);
    });
    return properties;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const addPropertyToFirestore = async (property: Partial<Property>): Promise<Property> => {
  const now = new Date().toISOString();
  const id = Date.now().toString();
  const newProperty: Property = {
    id,
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
    createdAt: now,
    updatedAt: now,
  };

  try {
    // We use setDoc with a manual ID to match the existing logic
    await setDoc(doc(db, COLLECTION_NAME, id), newProperty);
    return newProperty;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};

export const updatePropertyInFirestore = async (id: string, updates: Partial<Property>): Promise<void> => {
  try {
    const propertyRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(propertyRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
};

export const deletePropertyFromFirestore = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};

export const deleteAllPropertiesFromFirestore = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
  }
};

export const seedProperties = async (mockProperties: Property[]): Promise<void> => {
  const existing = await getPropertiesFromFirestore();
  if (existing.length > 0) return;

  console.log("Seeding database with mock properties...");
  const savePromises = mockProperties.map(p => {
    // Ensure ID is string
    const id = String(p.id);
    return setDoc(doc(db, COLLECTION_NAME, id), p);
  });
  await Promise.all(savePromises);
  console.log("Seeding complete.");
};
