import { useState, useEffect } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export interface Order {
  id: string;
  user_id: string;
  shop_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  qr_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    size: string | null;
    color: string | null;
    products: {
      id: string;
      name: string;
      image_url: string;
    };
  }[];
  shops: {
    name: string;
  };
}

export const useOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            size,
            color,
            products (
              id,
              name,
              image_url
            )
          ),
          shops (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, refetch: fetchOrders };
};
