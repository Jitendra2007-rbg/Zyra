import { useState, useEffect } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  approved: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export const useShop = () => {
  const { user, userRole } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userRole === 'shop_owner') {
      fetchShop();
    } else {
      setShop(null);
      setLoading(false);
    }
  }, [user, userRole]);

  const fetchShop = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setShop(data);
    } catch (error) {
      console.error('Error fetching shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const createShop = async (shopData: Omit<Shop, 'id' | 'owner_id' | 'is_active' | 'approved' | 'rating' | 'total_reviews' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('shops')
        .insert({ ...shopData, owner_id: user.id })
        .select()
        .single();

      if (error) throw error;
      setShop(data);
      return { error: null, data };
    } catch (error: any) {
      return { error: error.message, data: null };
    }
  };

  const updateShop = async (updates: Partial<Shop>) => {
    if (!user || !shop) return { error: 'No shop found' };

    try {
      const { error } = await supabase
        .from('shops')
        .update(updates)
        .eq('id', shop.id)
        .eq('owner_id', user.id);

      if (error) throw error;
      await fetchShop();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return { shop, loading, createShop, updateShop, refetch: fetchShop };
};
