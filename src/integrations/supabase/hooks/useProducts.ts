import { useState, useEffect } from 'react';
import { supabase } from '../client';

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category: string;
  image_url: string | null;
  images: string[];
  stock_quantity: number;
  is_active: boolean;
  rating: number;
  total_reviews: number;
  sizes: string[];
  colors: string[];
  created_at: string;
  updated_at: string;
  shops?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'shops' | 'rating' | 'total_reviews'>) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();
  
  return { data, error };
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  return { error };
};

export const useProducts = (shopId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          shops (
            id,
            name,
            logo_url
          )
        `)
        .eq('is_active', true);

      if (shopId) {
        query = query.eq('shop_id', shopId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, refetch: fetchProducts };
};
