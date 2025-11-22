export interface Product {
    name: string;
    image_url: string | null;
    shop_id: string;
}

export interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
    products?: Product;
}

export interface Shop {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone?: string;
    created_at: string;
    total_amount: number;
    status: 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
    shop_id: string;
    order_items?: OrderItem[];
    shops?: Shop;
    delivery_address?: string;
    delivery_latitude?: number | string;
    delivery_longitude?: number | string;
    payment_method?: string;
}
