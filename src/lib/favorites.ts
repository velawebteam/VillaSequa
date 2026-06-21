const FAVORITES_KEY = 'villassequa_favorites';

export const getFavorites = (): string[] => {
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const toggleFavorite = (propertyId: string): string[] => {
  const favorites = getFavorites();
  const index = favorites.indexOf(propertyId);
  let newFavorites: string[];
  
  if (index === -1) {
    newFavorites = [...favorites, propertyId];
  } else {
    newFavorites = favorites.filter(id => id !== propertyId);
  }
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  return newFavorites;
};

export const isFavorite = (propertyId: string): boolean => {
  return getFavorites().includes(propertyId);
};
