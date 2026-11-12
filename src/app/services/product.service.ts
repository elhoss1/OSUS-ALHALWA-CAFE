import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Product } from '../interface/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // **تنبيه: يجب استبدال هذه القيم في بيئة الإنتاج بمتغيرات بيئة أو استخدام خادم وسيط (Proxy Server) لأسباب أمنية.**
  private apiUrl = 'https://osus-alhalwa.com/backend/wp-json/wc/v3';
  private consumerKey = 'ck_1a2a7e1c3401902ed5216a743170e150e4b85ef7';
  private consumerSecret = 'cs_0077910305f833dd9abc9ec1334e44407b9ef853';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    // استخدام Basic Authentication كما هو موضح في الكود المرفق
    const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);
    return new HttpHeaders({
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    });
  }

  getProduct(id: number): Observable<Product> {
    // نقطة النهاية لجلب تفاصيل منتج واحد من WooCommerce
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`, {
      headers: this.getAuthHeaders()
    });
  }





getProductsByCategory(categoryId: number, excludeProductId: number): Observable<Product[]> {
  return this.http.get<Product[]>(`${this.apiUrl}/products`, {
    // إضافة المصادقة هنا
    headers: this.getAuthHeaders( ),

    // إبقاء البارامترات كما هي
    params: {
      category: categoryId.toString(),
      per_page: '5',
      exclude: excludeProductId.toString()
    }
  });
}

}
