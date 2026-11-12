export interface Product {
  id: number;
  sku?: string;
  name: string;
  price: string; // سعر المنتج الحالي (قد يكون سعر البيع)
  regular_price: string; // السعر الأصلي
  sale_price: string; // سعر التخفيض (إذا وجد)
  description: string; // الوصف الكامل (HTML)
  short_description: string; // وصف مختصر (HTML)
  images: Array<{ src: string; alt: string }> | undefined; // مصفوفة صور المنتج
  categories: Array<{ id: number; name: string; slug: string }>; // فئات المنتج
  stock_status: string;
  stock_quantity: number | null; // كمية المخزون
  attributes?: Array<{ id: number; name: string; options: string[]; visible?: boolean }>;
}
