import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  culture: string;
  target: string;
  formulation: string;
  unite: string;
  emballage: string;
  "Valable jusqu'au": string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  isInCart: (id: string) => boolean;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
    }
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  };

  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id);
      let newItems;
      
      if (existingItem) {
        newItems = prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [...prevItems, item];
      }
      
      saveCart(newItems);
      return newItems;
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      saveCart(newItems);
      return newItems;
    });
  };

  const isInCart = (id: string) => {
    return cartItems.some(item => item.id === id);
  };

  const clearCart = () => {
    setCartItems([]);
    saveCart([]);
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCart(newItems);
      return newItems;
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        isInCart,
        clearCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 