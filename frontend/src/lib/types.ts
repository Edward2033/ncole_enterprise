export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  price: number;
  inventory_qty: number | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  image_url: string | null;
  position: number | null;
}

export interface ProductMetadata {
  short?: string;
  paper_sizes?: string[];
  gsm?: string[];
  finish?: string[];
  sided?: string[];
  customizable?: boolean;
  unit?: string;
  [key: string]: unknown;
}

export interface Product {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  price: number;
  sku: string | null;
  inventory_qty: number | null;
  images: string[] | null;
  status: string;
  has_variants: boolean;
  vendor: string | null;
  product_type: string | null;
  tags: string[] | null;
  metadata: ProductMetadata | null;
  variants?: ProductVariant[];
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  image_url: string | null;
}

export interface CartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  name: string;
  variant_title?: string;
  sku?: string;
  price: number;
  image?: string;
  options?: Record<string, string>;
}
