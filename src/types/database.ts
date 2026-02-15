// Database types for XpresaControl

export type OrderStatus = 'cotizado' | 'pendiente' | 'pagado' | 'enviado';

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    updated_at: string;
}

export interface Order {
    id: string;
    temp_id: number;
    previo_number: number | null;
    vendedor_id: string;
    customer_name: string | null;
    customer_email: string | null;
    payment_account: string | null;
    anticipo: number;
    total_amount: number;
    status: OrderStatus;
    image_url: string | null;
    image_back_url: string | null;
    calcetas_color: string | null;
    regalo_detalle: string | null;
    shipping_guide: string | null;
    shipping_carrier: string | null;
    commission_earned: number;
    notes: string | null;
    created_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_name: string;
    size: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

// Form types for creating/updating
export interface CreateOrderInput {
    customer_name?: string;
    customer_email?: string;
    payment_account?: string;
    anticipo?: number;
    total_amount: number;
    status: OrderStatus;
    notes?: string;
}

export interface CreateOrderItemInput {
    order_id: string;
    product_name: string;
    size?: string;
    quantity: number;
    unit_price: number;
}

export interface UpdateOrderInput {
    customer_name?: string;
    customer_email?: string;
    payment_account?: string;
    anticipo?: number;
    total_amount?: number;
    status?: OrderStatus;
    image_url?: string;
    calcetas_color?: string;
    regalo_detalle?: string;
    shipping_guide?: string;
    shipping_carrier?: string;
    notes?: string;
}

// Order with items for display
export interface OrderWithItems extends Order {
    order_items: OrderItem[];
    vendedor?: Profile;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    account: string;
    vendedor_id: string;
    created_at: string;
}

// Database schema type for Supabase client
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'updated_at'>;
                Update: Partial<Profile>;
            };
            orders: {
                Row: Order;
                Insert: CreateOrderInput & { vendedor_id: string };
                Update: UpdateOrderInput;
            };
            order_items: {
                Row: OrderItem;
                Insert: Omit<OrderItem, 'id' | 'subtotal'>;
                Update: Partial<Omit<OrderItem, 'id' | 'subtotal'>>;
            };
            expenses: {
                Row: Expense;
                Insert: Omit<Expense, 'id' | 'created_at'>;
                Update: Partial<Omit<Expense, 'id' | 'created_at'>>;
            };
        };
        Enums: {
            order_status: OrderStatus;
        };
    };
}
