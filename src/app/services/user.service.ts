import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// تعريف الأنواع
export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: number;
  date: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  total: number;
  shippingAddress: string;
}

export interface Address {
  id: number;
  title: string;
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  street: string;
  buildingNumber: string;
  isDefault: boolean;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthdate: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  [x: string]: any;
  // BehaviorSubjects لتتبع التغييرات
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private addressesSubject = new BehaviorSubject<Address[]>([]);

  // Observables للاشتراك
  public userData$ = this.userDataSubject.asObservable();
  public orders$ = this.ordersSubject.asObservable();
  public addresses$ = this.addressesSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  // تهيئة البيانات التجريبية
  private initializeMockData(): void {
    // بيانات المستخدم التجريبية
    const mockUserData: UserData = {
      id: 1,
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      phone: '0501234567',
      birthdate: '1990-01-01'
    };

    // الطلبات التجريبية
    const mockOrders: Order[] = [
      {
        id: 1001,
        date: new Date('2025-01-15'),
        status: 'delivered',
        items: [
          {
            id: 1,
            name: 'كيك الشوكولاتة',
            price: 45,
            quantity: 2,
            image: '/assets/images/chocolate-cake.jpg'
          },
          {
            id: 2,
            name: 'كب كيك الفانيليا',
            price: 25,
            quantity: 3,
            image: '/assets/images/vanilla-cupcake.jpg'
          }
        ],
        total: 165,
        shippingAddress: 'الرياض، العليا، شارع الملك فهد'
      },
      {
        id: 1002,
        date: new Date('2025-01-20'),
        status: 'processing',
        items: [
          {
            id: 3,
            name: 'دونات بالشوكولاتة',
            price: 15,
            quantity: 6,
            image: '/assets/images/chocolate-donut.jpg'
          }
        ],
        total: 90,
        shippingAddress: 'الرياض، العليا، شارع الملك فهد'
      }
    ];

    // العناوين التجريبية
    const mockAddresses: Address[] = [
      {
        id: 1,
        title: 'المنزل',
        recipientName: 'أحمد محمد',
        phone: '0501234567',
        city: 'الرياض',
        district: 'العليا',
        street: 'شارع الملك فهد',
        buildingNumber: '1234',
        isDefault: true
      },
      {
        id: 2,
        title: 'العمل',
        recipientName: 'أحمد محمد',
        phone: '0501234567',
        city: 'الرياض',
        district: 'الملز',
        street: 'شارع العروبة',
        buildingNumber: '5678',
        isDefault: false
      }
    ];

    this.userDataSubject.next(mockUserData);
    this.ordersSubject.next(mockOrders);
    this.addressesSubject.next(mockAddresses);
  }

  // الحصول على بيانات المستخدم
  getUserData(): Observable<UserData | null> {
    return this.userData$;
  }

  // تحديث بيانات المستخدم
  updateUserData(userData: Partial<UserData>): Observable<boolean> {
    const currentData = this.userDataSubject.value;
    if (currentData) {
      const updatedData = { ...currentData, ...userData };
      this.userDataSubject.next(updatedData);
      
      // محاكاة استدعاء API
      return of(true).pipe(delay(500));
    }
    return of(false);
  }

  // الحصول على جميع الطلبات
  getOrders(): Observable<Order[]> {
    return this.orders$;
  }

  // الحصول على طلب محدد
  getOrderById(orderId: number): Observable<Order | undefined> {
    const orders = this.ordersSubject.value;
    const order = orders.find(o => o.id === orderId);
    return of(order).pipe(delay(300));
  }

  // الحصول على عدد الطلبات قيد التنفيذ
  getPendingOrdersCount(): number {
    const orders = this.ordersSubject.value;
    return orders.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    ).length;
  }

  // إضافة طلب جديد
  addOrder(order: Omit<Order, 'id'>): Observable<Order> {
    const orders = this.ordersSubject.value;
    const newOrder: Order = {
      ...order,
      id: Math.max(...orders.map(o => o.id), 1000) + 1
    };
    
    this.ordersSubject.next([newOrder, ...orders]);
    
    // محاكاة استدعاء API
    return of(newOrder).pipe(delay(500));
  }

  // الحصول على جميع العناوين
  getAddresses(): Observable<Address[]> {
    return this.addresses$;
  }

  // الحصول على العنوان الافتراضي
  getDefaultAddress(): Observable<Address | undefined> {
    const addresses = this.addressesSubject.value;
    const defaultAddress = addresses.find(a => a.isDefault);
    return of(defaultAddress);
  }

  // إضافة عنوان جديد
  addAddress(address: Omit<Address, 'id'>): Observable<Address> {
    const addresses = this.addressesSubject.value;
    const newAddress: Address = {
      ...address,
      id: Math.max(...addresses.map(a => a.id), 0) + 1
    };

    // إذا كان العنوان الجديد افتراضياً، إزالة الافتراضي من العناوين الأخرى
    if (newAddress.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }

    this.addressesSubject.next([...addresses, newAddress]);
    
    // محاكاة استدعاء API
    return of(newAddress).pipe(delay(500));
  }

  // تحديث عنوان
  updateAddress(addressId: number, updates: Partial<Address>): Observable<boolean> {
    const addresses = this.addressesSubject.value;
    const index = addresses.findIndex(a => a.id === addressId);
    
    if (index !== -1) {
      addresses[index] = { ...addresses[index], ...updates };
      
      // إذا تم تعيينه كافتراضي، إزالة الافتراضي من العناوين الأخرى
      if (updates.isDefault) {
        addresses.forEach((addr, i) => {
          if (i !== index) addr.isDefault = false;
        });
      }
      
      this.addressesSubject.next([...addresses]);
      
      // محاكاة استدعاء API
      return of(true).pipe(delay(500));
    }
    
    return of(false);
  }

  // حذف عنوان
  deleteAddress(addressId: number): Observable<boolean> {
    const addresses = this.addressesSubject.value;
    const index = addresses.findIndex(a => a.id === addressId);
    
    if (index !== -1) {
      const wasDefault = addresses[index].isDefault;
      addresses.splice(index, 1);
      
      // إذا كان العنوان المحذوف افتراضياً، جعل أول عنوان افتراضياً
      if (wasDefault && addresses.length > 0) {
        addresses[0].isDefault = true;
      }
      
      this.addressesSubject.next([...addresses]);
      
      // محاكاة استدعاء API
      return of(true).pipe(delay(500));
    }
    
    return of(false);
  }

  // تعيين عنوان كافتراضي
  setDefaultAddress(addressId: number): Observable<boolean> {
    const addresses = this.addressesSubject.value;
    
    addresses.forEach(addr => {
      addr.isDefault = addr.id === addressId;
    });
    
    this.addressesSubject.next([...addresses]);
    
    // محاكاة استدعاء API
    return of(true).pipe(delay(500));
  }

  logout(): void {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      this['router'].navigate(['/']);
    }
  }

  // مسح جميع البيانات (عند تسجيل الخروج)
  clearUserData(): void {
    this.userDataSubject.next(null);
    this.ordersSubject.next([]);
    this.addressesSubject.next([]);
  }
}

