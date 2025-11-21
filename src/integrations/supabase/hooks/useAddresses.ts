import { useState, useEffect } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setAddresses([]);
      setLoading(false);
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async (address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('addresses')
        .insert({ ...address, user_id: user.id });

      if (error) throw error;
      await fetchAddresses();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const updateAddress = async (id: string, updates: Partial<Address>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAddresses();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAddresses();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return { addresses, loading, addAddress, updateAddress, deleteAddress, refetch: fetchAddresses };
};
