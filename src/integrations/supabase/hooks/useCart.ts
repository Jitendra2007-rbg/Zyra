import { useState, useEffect } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    shop_id: string;
    shops: {
      name: string;
    };
  };
}

export const useCart = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            image_url,
            shop_id,
            shops (
              name
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product_id: string, quantity: number = 1, size?: string, color?: string) => {
    if (!user) return { error: 'Please login to add items to cart' };

    try {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id,
          quantity,
          size: size || null,
          color: color || null,
        });

      if (error) throw error;
      await fetchCart();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchCart();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const removeFromCart = async (id: string) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchCart();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return { cartItems, loading, addToCart, updateQuantity, removeFromCart, refetch: fetchCart };
};
