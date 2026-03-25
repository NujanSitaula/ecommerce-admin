export type UserRole = "admin" | "editor" | "viewer" | string;

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: SessionUser;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  sale_price?: number;
  currency?: string;
  sku?: string;
  status?: "draft" | "active" | "archived";
  stock?: number;
  quantity?: number;
  unit?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  shipping_class?: string;
  meta_title?: string;
  meta_description?: string;
  category_id?: number;
  type?: string;
  featured?: boolean;
  thumbnail_url?: string;
  original_url?: string;
  gallery?: string[];
  tags?: string[];
  variants?: ProductVariant[];
  seo?: {
    seo_title?: string | null;
    seo_description?: string | null;
    seo_keywords?: string | null;
    canonical_url?: string | null;
    meta_robots?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image_url?: string | null;
    og_type?: string | null;
    og_url_override?: string | null;
    twitter_title?: string | null;
    twitter_description?: string | null;
    twitter_image_url?: string | null;
    twitter_card_type?: string | null;
    seo_status?: "red" | "yellow" | "green" | null;
    seo_score?: number | null;
  } | null;
  // New Etsy features
  inventory_type?: "in_stock" | "made_to_order" | "both";
  production_time_days?: number;
  min_quantity?: number;
  max_quantity?: number;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  cost_of_goods?: number;
  materials_required?: Record<string, unknown>[];
  available_quantity?: number;
  is_low_stock?: boolean;
  personalization_options?: ProductPersonalizationOption[];
  materials?: ProductMaterial[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku?: string;
  attributes: Record<string, string>; // e.g., { size: "L", color: "Red" }
  price?: number;
  sale_price?: number;
  quantity: number;
  image_url?: string;
}

export interface Paginated<T> {
  data: T[];
  total?: number;
  page?: number;
  perPage?: number;
}

export interface TaxRate {
  id: number;
  country_id?: number | null;
  state_id?: number | null;
  name: string;
  tax_type: "vat" | "sales_tax" | "gst" | "hst" | "pst" | "qst";
  rate: number;
  shipping_taxable: boolean;
  is_default: boolean;
  is_active: boolean;
  country?: { id: number; name: string; iso2?: string } | null;
  state?: { id: number; name: string; code?: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: "free_shipping" | "percent" | "flat";
  value?: number;
  max_discount_amount?: number | null;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  min_cart_total?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  redemptions_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminState {
  id: number;
  name: string;
  code?: string | null;
  is_active: boolean;
  country_id: number;
}

export interface AdminCountry {
  id: number;
  name: string;
  iso2?: string;
  iso3?: string;
  phone_code?: string;
  is_active: boolean;
  states_count?: number;
  states?: AdminState[];
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  parent_id?: number | null;
  children_count?: number;
}

export interface StoreSettings {
  name?: string;
  supportEmail?: string;
  currency?: string;
  paymentProvider?: string;
  shippingFrom?: string;
  taxRate?: number;
  notes?: string;
  invoiceLogo?: string;
  invoiceCompanyName?: string;
  invoiceAddress?: string;
  invoiceEmail?: string;
  invoicePhone?: string;
  additional?: Record<string, unknown>;
}

export interface Media {
  id: number;
  user_id?: number;
  name: string;
  file_name: string;
  mime_type: string;
  file_type: "image" | "video" | "document";
  file_size: number;
  path: string;
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  alt_text?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name?: string;
    email: string;
  };
}

export interface MediaListParams {
  type?: "image" | "video" | "document";
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  variant_id?: number;
  type: "sale" | "purchase" | "adjustment" | "return" | "damage" | "production";
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  order_id?: number;
  user_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  variant?: ProductVariant;
  order?: unknown;
  user?: SessionUser;
}

export interface ProductPersonalizationOption {
  id: number;
  product_id: number;
  name: string;
  type: "text" | "number" | "select" | "color" | "file_upload" | "checkbox";
  required: boolean;
  options?: string[];
  max_length?: number;
  price_adjustment?: number;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderPersonalization {
  id: number;
  order_item_id: number;
  personalization_option_id: number;
  value: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  personalization_option?: ProductPersonalizationOption;
}

export interface Material {
  id: number;
  name: string;
  description?: string;
  unit: string;
  current_stock: number;
  low_stock_threshold: number;
  cost_per_unit: number;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductMaterial {
  id: number;
  product_id: number;
  material_id: number;
  quantity_required: number;
  created_at: string;
  updated_at: string;
  material?: Material;
  product?: Product;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number;
  variant_id?: number;
  product_name: string;
  product_slug: string;
  quantity: number;
  price: number;
  subtotal: number;
  is_made_to_order?: boolean;
  production_status?: "pending" | "in_progress" | "completed" | "cancelled";
  production_started_at?: string;
  production_completed_at?: string;
  estimated_completion_date?: string;
  variant?: ProductVariant;
  product?: {
    id: number;
    name: string;
    slug: string;
    thumbnail_url?: string;
  };
  personalizations?: OrderPersonalization[];
}

export interface Order {
  id: number;
  user_id?: number;
  guest_email?: string;
  guest_name?: string;
  stripe_payment_intent_id?: string;
  delivery_date: string;
  gift_wrapped: boolean;
  delivery_instructions?: string;
  leave_at_door: boolean;
  subtotal: number;
  shipping_fee: number;
  discount_amount?: number;
  shipping_discount?: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  updated_at: string;
  address?: {
    id: number;
    title?: string;
    name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    postal_code: string;
    country?: string;
    state?: string;
  };
  contact_number?: {
    id: number;
    title?: string;
    phone: string;
  };
  payment_method?: {
    id: number;
    brand: string;
    last4: string;
    cardholder_name?: string;
  };
  coupon?: {
    id: number;
    code: string;
    type: string;
    value: number;
  };
  user?: {
    id: number;
    name?: string;
    email: string;
  };
  items: OrderItem[];
  cancelled_at?: string;
  cancellation_reason?: string;
  transactions?: Transaction[];
  modifications?: OrderModification[];
}

export interface Transaction {
  id: number;
  order_id?: number;
  type: "payment" | "refund" | "refund_request" | "adjustment" | "order_modification";
  status: "pending" | "approved" | "completed" | "rejected" | "failed";
  amount: number;
  currency: string;
  stripe_payment_intent_id?: string;
  stripe_refund_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  approved_by?: {
    id: number;
    name: string;
    email: string;
  };
  approved_at?: string;
  processed_at?: string;
  created_by?: {
    id: number;
    name: string;
    email: string;
  };
  order?: {
    id: number;
    total: number;
    status: string;
  };
  created_at: string;
  updated_at: string;
}

// Reviews (customer feedback + admin moderation)
export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export interface ReviewModerationProduct {
  id?: string;
  name?: string;
  slug?: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;

  rating: number;
  title: string | null;
  description: string;
  author: string;
  author_email?: string | null;

  status: ReviewStatus;
  is_verified_purchase: boolean;

  product?: ReviewModerationProduct;
  moderated_by?: {
    id?: string | null;
    name?: string | null;
  } | null;
  moderated_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface OrderModification {
  id: number;
  order_id: number;
  transaction_id?: number;
  modification_type: "item_added" | "item_removed";
  order_item_id?: number;
  product_id?: number;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
  product?: {
    id: number;
    name: string;
  };
  created_by?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

// Admin User Management
export interface AdminUser {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  country?: string;
  role?: string;
  created_at?: string;
  orders_count?: number;
  total_spent?: number;
}

export interface ActivityEvent {
  type: "order" | "search" | "cart_placeholder";
  date: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchHistoryItem {
  id: number;
  query: string;
  searched_at: string;
}

// Dashboard
export interface DashboardStats {
  total_revenue_today: number;
  total_revenue_month: number;
  total_orders: number;
  pending_orders: number;
  cancelled_refunded_orders: number;
  total_customers: number;
  low_stock_count: number;
  revenue_trend: { date: string; revenue: number }[];
  orders_trend: { date: string; count: number }[];
  top_products: {
    product_id: number;
    product_name: string;
    quantity_sold: number;
  }[];
  top_categories: {
    category_id: number;
    category_name: string;
    order_count: number;
  }[];
}

export interface UserDetail extends AdminUser {
  stats: {
    orders_count: number;
    total_spent: number;
    transactions_count: number;
    search_count: number;
  };
  recent_orders: Order[];
  recent_transactions: Transaction[];
  search_history: SearchHistoryItem[];
  activity_timeline: ActivityEvent[];
}

// Blog
export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

export interface AdminPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: unknown;
  featured_image?: string | null;
  is_published: boolean;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  author?: {
    id: number;
    name?: string;
    email: string;
  } | null;
  tags?: BlogTag[];
  created_at?: string;
  updated_at?: string;
}

