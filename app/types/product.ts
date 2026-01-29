export interface Product {
  id: string;
  category: string;
  name: string;
  price: string;
  thumbnail: string;
  deliverType: string;
  link: string;
  order: string;
  created_at: string;
}

export const PRODUCT_CATEGORIES = [
  { value: 'tesla', label: '테슬라' },
  { value: 'baby', label: '육아' },
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]['value'];
