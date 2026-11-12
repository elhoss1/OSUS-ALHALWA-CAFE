// payment.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
} )
export class PaymentService {

  private apiUrl = 'https://osus-alhalwa.com/backend/wp-json/moyasar-api/v1/create-payment';

  constructor(private http: HttpClient ) {}

  /**
   * @param amount - المبلغ بالريال (سيتم تحويله في الخلفية)
   * @param description - وصف العملية
   */
  createPayment(amount: number, description: string, orderId: number): Observable<any> {
    // ✅ تم حذف callback_url من هنا
    return this.http.post(this.apiUrl, {
      amount: amount,
      order_id: orderId,
      description: description
    } );
  }
}
