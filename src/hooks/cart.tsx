import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromStorage = await AsyncStorage.getItem(
        '@GoBarber:cart:products',
      );

      if (productsFromStorage) {
        setProducts(JSON.parse(productsFromStorage));
      }
    }

    loadProducts();
  }, []);

  const setProductsToAsyncStorage = useCallback(() => {
    AsyncStorage.setItem('@GoBarber:cart:products', JSON.stringify(products));
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(el => el.id === product.id);
      if (productIndex > -1) {
        const updatedProducts = [...products];
        updatedProducts[productIndex].quantity += 1;
        setProducts(updatedProducts);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
      setProductsToAsyncStorage();
    },
    [products, setProductsToAsyncStorage],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(el => el.id === id);
      const product = products[productIndex];
      product.quantity += 1;
      const updatedProducts = [...products];
      updatedProducts[productIndex] = product;
      setProducts(updatedProducts);
      setProductsToAsyncStorage();
    },
    [products, setProductsToAsyncStorage],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(el => el.id === id);
      const product = products[productIndex];
      const updatedProducts = [...products];

      if (product.quantity === 1) {
        updatedProducts.splice(productIndex, 1);
      } else {
        product.quantity -= 1;
        updatedProducts[productIndex] = product;
      }
      setProducts(updatedProducts);
      setProductsToAsyncStorage();
    },
    [products, setProductsToAsyncStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
