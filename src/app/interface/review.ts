// أضف هذه الواجهات مع الواجهات الموجودة
export interface Review {
  id: number;
  date_created: string;
  review: string; // نص التقييم
  rating: number; // التقييم من 1 إلى 5
  name: string;   // اسم المقيّم
  email: string;
  product_id: number;
  status: 'approved' | 'hold'; // حالة التقييم
}

export interface CreateReview {
  product_id: number;
  review: string;
  reviewer: string;
  reviewer_email: string;
  rating: number;
}
