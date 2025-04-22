import React, { createContext, useContext, useState } from 'react';

interface FavoritesContextType {
  refreshFavorites: number;
  triggerRefresh: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [refreshFavorites, setRefreshFavorites] = useState(0);

  const triggerRefresh = () => {
    console.log('Déclenchement de la mise à jour des favoris');
    setRefreshFavorites(prev => prev + 1);
  };

  return (
    <FavoritesContext.Provider value={{ refreshFavorites, triggerRefresh }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
} 