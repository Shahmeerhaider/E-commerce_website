import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart as apiGetCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
} from '../services/api';

const CartContext = createContext();

// Map a DB cart item (with populated product) to a flat local item
const mapDbItem = (item) => ({
  _id: item.product?._id || item.product,
  name: item.product?.name,
  images: item.product?.images,
  price: item.price,
  discountPrice: item.product?.discountPrice || 0,
  stock: item.product?.stock,
  seller: item.product?.seller,
  quantity: item.quantity,
  cartItemId: item._id,  // subdocument _id used for update/remove API calls
});

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Reload cart whenever auth state changes
  useEffect(() => {
    if (user) {
      // Logged in: migrate guest cart then load from DB
      const migrateAndLoad = async () => {
        const guestItems = JSON.parse(localStorage.getItem('guestCart') || '[]');
        for (const item of guestItems) {
          try {
            await apiAddToCart({ productId: item._id, quantity: item.quantity });
          } catch { /* skip unavailable products */ }
        }
        if (guestItems.length > 0) localStorage.removeItem('guestCart');
        const res = await apiGetCart();
        setCartItems((res.data.items || []).map(mapDbItem));
      };
      migrateAndLoad().catch(console.error);
    } else {
      // Not logged in: use localStorage guest cart
      setCartItems(JSON.parse(localStorage.getItem('guestCart') || '[]'));
    }
  }, [user]);

  // Keep guest cart in localStorage and update count
  useEffect(() => {
    if (!user) localStorage.setItem('guestCart', JSON.stringify(cartItems));
    setCartCount(cartItems.reduce((a, i) => a + i.quantity, 0));
  }, [cartItems, user]);

  const addItem = useCallback(async (product, qty = 1) => {
    if (user) {
      await apiAddToCart({ productId: product._id, quantity: qty });
      const res = await apiGetCart();
      setCartItems((res.data.items || []).map(mapDbItem));
    } else {
      setCartItems(prev => {
        const exists = prev.find(i => i._id === product._id);
        if (exists) return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + qty } : i);
        return [...prev, { ...product, quantity: qty }];
      });
    }
  }, [user]);

  const removeItem = useCallback(async (productId) => {
    if (user) {
      const item = cartItems.find(i => i._id === productId);
      if (item?.cartItemId) await apiRemoveFromCart(item.cartItemId);
    }
    setCartItems(prev => prev.filter(i => i._id !== productId));
  }, [user, cartItems]);

  const updateQty = useCallback(async (productId, qty) => {
    if (user) {
      const item = cartItems.find(i => i._id === productId);
      if (item?.cartItemId) await apiUpdateCartItem(item.cartItemId, { quantity: qty });
    }
    setCartItems(prev => prev.map(i => i._id === productId ? { ...i, quantity: qty } : i));
  }, [user, cartItems]);

  const clearItems = useCallback(async () => {
    if (user) await apiClearCart();
    setCartItems([]);
  }, [user]);

  const total = cartItems.reduce((a, i) => a + (i.discountPrice || i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, cartCount, addItem, removeItem, updateQty, clearItems, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
