import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../interface/product.interface';


export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$: Observable<CartItem[]> = this.cartSubject.asObservable();

  constructor() {
    // تحميل السلة من localStorage عند بدء التطبيق
    this.loadCart();
  }

  // إضافة منتج إلى السلة
  addToCart(product: Product, quantity: number = 1, selectedOptions: Record<string, string> = {}): void {
  if (!product || !product.id) {
    console.warn('⚠️ المنتج غير معرف أو لا يحتوي على id:', product);
    return; // نوقف التنفيذ بهدوء بدون كراش
  }

  const optionKey = JSON.stringify(selectedOptions);
  const existingItem = this.cartItems.find(item =>
    item?.product?.id === product.id && JSON.stringify(item.selectedOptions || {}) === optionKey
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.cartItems.push({ product, quantity, selectedOptions });
  }

  this.saveCart();
  this.cartSubject.next(this.cartItems);
}


  // إزالة منتج من السلة
  removeFromCart(productId: number, selectedOptions?: Record<string, string>): void {
    this.cartItems = this.cartItems.filter(item => {
      if (item.product.id !== productId) return true;
      if (!selectedOptions) return false;
      return JSON.stringify(item.selectedOptions || {}) !== JSON.stringify(selectedOptions);
    });
    this.saveCart();
    this.cartSubject.next(this.cartItems);
  }

  // تحديث كمية منتج
  updateQuantity(productId: number, quantity: number, selectedOptions?: Record<string, string>): void {
    const item = this.cartItems.find(item => item.product.id === productId &&
      (!selectedOptions || JSON.stringify(item.selectedOptions || {}) === JSON.stringify(selectedOptions)));

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.saveCart();
        this.cartSubject.next(this.cartItems);
      }
    }
  }

  // الحصول على جميع عناصر السلة
  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  // حساب إجمالي السعر
  getTotal(): number {
    return this.cartItems.reduce((total, item) => {
      const price = parseFloat(item.product.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  }

  // حساب عدد العناصر
  getItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  // إفراغ السلة
  clearCart(): void {
    this.cartItems = [];
    this.saveCart();
    this.cartSubject.next(this.cartItems);
  }

  // حفظ السلة في localStorage
  private saveCart(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('cart', JSON.stringify(this.cartItems));
    }
  }

  // تحميل السلة من localStorage
  private loadCart(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // تأكد إن كل عنصر يحتوي على product.id
        this.cartItems = Array.isArray(parsed)
          ? parsed.filter(item => item?.product && item.product.id)
          : [];
      } catch (error) {
        console.error('❌ خطأ أثناء قراءة السلة من localStorage:', error);
        this.cartItems = [];
      }
    } else {
      this.cartItems = [];
    }

    this.cartSubject.next(this.cartItems);
  }
}


}
