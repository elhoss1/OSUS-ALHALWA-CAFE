import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '../../services/cart';
import { QUOTE_CONFIG } from '../../config/quote-config';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './quote.scss'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  businessName = '';
  contactName = '';
  phone = '';
  city = '';
  supplyFrequency = '';
  notes = '';
  privacyConsent = false;
  statusMessage = '';
  statusType: 'success' | 'error' | 'info' = 'info';
  sending = false;

  constructor(private cartService: CartService, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadCart();
    this.cartService.cart$.subscribe(() => this.loadCart());
  }

  loadCart(): void {
    this.cartItems = this.cartService.getCartItems();
  }

  updateQuantity(productId: number, event: Event, selectedOptions?: Record<string, string>): void {
    const input = event.target as HTMLInputElement;
    const quantity = Math.floor(Number(input.value));
    if (Number.isFinite(quantity) && quantity > 0) this.cartService.updateQuantity(productId, quantity, selectedOptions);
  }

  removeItem(productId: number, selectedOptions?: Record<string, string>): void {
    this.cartService.removeFromCart(productId, selectedOptions);
  }

  submitQuote(): void {
    this.statusMessage = '';
    if (!this.cartItems.length) return this.showStatus('أضف منتجًا واحدًا على الأقل إلى قائمة التسعير.', 'error');
    if (!this.businessName.trim() || !this.contactName.trim() || !this.isValidPhone()) {
      return this.showStatus('يرجى إدخال اسم المنشأة واسم مسؤول المشتريات ورقم جوال صحيح.', 'error');
    }
    if (!this.privacyConsent) return this.showStatus('يرجى الموافقة على استخدام بيانات التواصل لمتابعة طلب التوريد.', 'error');

    const reference = this.createReference();
    const request = {
      reference,
      createdAt: new Date().toISOString(),
      privacyConsent: this.privacyConsent,
      customer: {
        businessName: this.businessName.trim(),
        contactName: this.contactName.trim(),
        phone: this.phone.trim(),
        city: this.city.trim(),
        supplyFrequency: this.supplyFrequency,
        notes: this.notes.trim()
      },
      items: this.cartItems.map(({ product, quantity, selectedOptions }) => ({
        productId: product.id,
        sku: (product as CartItem['product'] & { sku?: string }).sku || '',
        name: product.name,
        categories: product.categories?.map(category => category.name) || [],
        selectedOptions: selectedOptions || {},
        quantity
      }))
    };

    if (QUOTE_CONFIG.requestEndpoint.trim()) {
      this.sending = true;
      this.http.post<{ reference?: string }>(QUOTE_CONFIG.requestEndpoint, request).subscribe({
        next: response => {
          this.sending = false;
          this.cartService.clearCart();
          const confirmedReference = response?.reference || reference;
          void this.router.navigate(['/order-success', encodeURIComponent(confirmedReference)], {
            state: { orderConfirmed: true }
          });
        },
        error: (error) => {
          this.sending = false;
          const apiMessage = typeof error?.error?.message === 'string' ? error.error.message : '';
          if (error?.status === 404) {
            this.showStatus('نقطة استقبال طلبات التوريد غير موجودة في WordPress (404). لم يُسجل الطلب؛ فعّل Snippet طلبات التوريد في Code Snippets وتأكد من أن الطلبات تُرسل إلى الموقع نفسه.', 'error');
          } else if (error?.status === 0) {
            this.showStatus('تعذر الاتصال بووردبريس. قد يكون السبب CORS أو انقطاع الخادم؛ لم يُسجل الطلب. تحقق من السماح لنطاق واجهة المتجر في إعدادات Snippet.', 'error');
          } else {
            this.showStatus(`${apiMessage || `تعذر إرسال الطلب (HTTP ${error?.status || 'غير معروف'}).`} لم يتم تسجيله؛ تحقق من إعداد WordPress ثم أعد المحاولة.`, 'error');
          }
        }
      });
      return;
    }

    const whatsapp = QUOTE_CONFIG.salesWhatsapp.replace(/\D/g, '');
    if (!whatsapp) {
      return this.showStatus('نموذج الطلب جاهز، لكن قناة استقبال طلبات المبيعات لم تُضبط بعد؛ لم يتم إرسال أو حفظ بياناتك.', 'error');
    }
    const message = this.formatWhatsAppRequest(request);
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    this.showStatus(`تم تجهيز طلب ${reference} في واتساب. أرسل الرسالة في المحادثة ليتسلمها فريق التوريد. لم تُحذف قائمتك. إذا لم تفتح النافذة، اسمح بالنوافذ المنبثقة وأعد المحاولة.`, 'info');
  }

  isValidPhone(): boolean {
    const digits = this.phone.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  }

  private formatWhatsAppRequest(request: any): string {
    const lines = [
      `طلب عرض سعر توريد رقم: ${request.reference}`,
      `المنشأة: ${request.customer.businessName}`,
      `مسؤول المشتريات: ${request.customer.contactName}`,
      `الجوال: ${request.customer.phone}`,
      `مدينة التوريد: ${request.customer.city || 'غير محددة'}`,
      `دورية التوريد: ${request.customer.supplyFrequency || 'حسب الاحتياج'}`,
      'الأصناف والكميات:',
      ...request.items.map((item: { name: string; sku: string; quantity: number; selectedOptions: Record<string, string> }) => {
        const options = Object.entries(item.selectedOptions || {}).map(([name, value]) => `${name}: ${value}`).join('، ');
        return `- ${item.name}${item.sku ? ` (SKU: ${item.sku})` : ''}${options ? ` — ${options}` : ''} × ${item.quantity}`;
      })
    ];
    if (request.customer.notes) lines.push(`ملاحظات: ${request.customer.notes}`);
    lines.push('يرجى مراجعة الطلب وتأكيد التوفر والتسعير ومتطلبات التسليم.');
    return lines.join('\n');
  }

  private createReference(): string {
    const date = new Date();
    const day = `${date.getFullYear()}${`${date.getMonth() + 1}`.padStart(2, '0')}${`${date.getDate()}`.padStart(2, '0')}`;
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `MS-${day}-${token}`;
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
    this.statusMessage = message;
    this.statusType = type;
  }
}
