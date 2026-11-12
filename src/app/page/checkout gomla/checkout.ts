import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../services/cart';
import { WoocommerceService } from '../../services/woocommerce';
import { ChangeDetectorRef } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';


interface SavedAddress {
  first_name: string;
  email: string;
  phone: string;
  city: string;
  address_1: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  total: number = 0;
  submitting: boolean = false;
  shipping: number = 15; // تصحيح الاسم
  selectedArea: string | null = null;
  savedAddresses: SavedAddress[] = [];
  selectedAddressIndex: string = '-1';
  orderWarningMessage: string | null = null;
  discountAmount: number = 0; // لضمان عدم ظهور error
  orderPlaced = false;

@ViewChild('orderSuccessSection') orderSuccessSection!: ElementRef;

  northRiyadhAreas: string[] = [
    'حي الفلاح','حي الوادي','حي الندى','حي الربيع','حي النفل','حي الغدير','حي الصحافة','حي العقيق',
    'حي حطين','حي الملقا','حي الياسمين','حي النرجس','حي العارض','حي القيروان','حي بنبان','حي الواحة',
    'حي صلاح الدين','حي الورود','حي الملك فهد','حي المرسلات','حي النزهة','حي المغرزات','حي الازدهار',
    'حي التعاون','حي المصيف','حي المروج'
  ];

  orderData = {
    payment_method: 'cod',
    payment_method_title: 'الدفع عند الاستلام',
    set_paid: false,
    billing: {
      first_name: '',
      last_name: '',
      address_1: '',
      address_2: '',
      city: 'الرياض',
      state: 'منطقة الرياض',
      postcode: '',
      country: 'SA',
      email: '',
      phone: ''
    },
    shipping: {
      first_name: '',
      last_name: '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'SA'
    },
    line_items: [] as any[],
    customer_note: ''
  };
shiping: any;

  constructor(
    private cartService: CartService,
    private woocommerceService: WoocommerceService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadSavedAddresses();
  }

  get isNorthRiyadh(): boolean {
    return this.orderData.billing.city === 'شمال الرياض';
  }

  loadSavedAddresses(): void {
    const data = localStorage.getItem('customerAddresses');
    if (data) {
      this.savedAddresses = JSON.parse(data);
      if (this.savedAddresses.length > 0) {
        this.selectedAddressIndex = '0';
        setTimeout(() => this.applyAddress(this.savedAddresses[0]), 0);
      } else {
        this.selectedAddressIndex = '-1';
        this.clearBillingForm();
      }
    } else {
      this.selectedAddressIndex = '-1';
      this.clearBillingForm();
    }
  }

  onAddressSelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const index = parseInt(selectElement.value, 10);
    this.selectedAddressIndex = selectElement.value;
    if (index === -1) this.clearBillingForm();
    else this.applyAddress(this.savedAddresses[index]);
  }

  applyAddress(address: SavedAddress): void {
  this.orderData.billing.first_name = address.first_name;
  this.orderData.billing.email = address.email;
  this.orderData.billing.phone = address.phone;
  this.orderData.billing.city = address.city;
  this.orderData.billing.address_1 = address.address_1;

    Promise.resolve().then(() => {
      this.cdr.detectChanges();
    });

  }

  clearBillingForm(): void {
    this.orderData.billing.first_name = '';
    this.orderData.billing.email = '';
    this.orderData.billing.phone = '';
    this.orderData.billing.city = 'الرياض';
    this.orderData.billing.address_1 = '';
    this.selectedArea = null;
  }

  saveOrUpdateAddress(): void {
    const currentAddress: SavedAddress = {
      first_name: this.orderData.billing.first_name,
      email: this.orderData.billing.email,
      phone: this.orderData.billing.phone,
      city: this.orderData.billing.city,
      address_1: this.orderData.billing.address_1,
    };

    const existingIndex = this.savedAddresses.findIndex(
      addr => addr.first_name === currentAddress.first_name && addr.address_1 === currentAddress.address_1
    );

    if (existingIndex > -1) this.savedAddresses[existingIndex] = currentAddress;
    else this.savedAddresses.unshift(currentAddress);

    localStorage.setItem('customerAddresses', JSON.stringify(this.savedAddresses));
  }

  loadCart(): void {
    this.cartItems = this.cartService.getCartItems();
    this.total = this.cartService.getTotal();
    this.orderData.line_items = this.cartItems.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));
  }



  updateOrderWarning(): void {
    const city = this.orderData.billing.city?.trim();
    if (!city) {
      this.orderWarningMessage = null;
      return;
    }

  }

  validateForm(): boolean {
    return !!(
      this.orderData.billing.first_name?.trim() &&
      this.orderData.billing.phone?.trim() &&
      this.orderData.billing.email?.trim() &&
      this.orderData.billing.address_1?.trim() &&
      this.orderData.billing.city?.trim() &&
      this.orderData.billing.state?.trim()
    );
  }

  canSubmitOrder(): boolean {
    return this.validateForm();
  }

  submitOrder(form: any): void {
      if (!form.valid) {
        alert('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.');
        return;
      }

      this.submitting = true;

    let finalAddress = this.orderData.billing.address_1;
    if (this.isNorthRiyadh && this.selectedArea) {
      finalAddress = `الحي: ${this.selectedArea}, ${this.orderData.billing.address_1}`;
    }

    const finalOrderData = {
      ...this.orderData,
      billing: { ...this.orderData.billing, address_1: finalAddress },
      shipping: { ...this.orderData.billing, address_1: finalAddress },
      shipping_lines: [{ method_id: 'flat_rate', method_title: 'الشحن الثابت', total: this.shipping.toString() }]
    };

    this.woocommerceService.createOrder(finalOrderData).subscribe({
      next: (order) => {
        this.saveOrUpdateAddress();
        // alert("نقدر لكم زيارتكم لموقع أسس الحلوى للحلويات . سيتم التواصل معكم قريبا ، وتقديم السعر المناسب لكم ، لمنتجات متميزة .");
        this.submitting = false;
        this.orderPlaced = true;
        this.cartService.clearCart();

        // 👇 الانتقال للجزء المطلوب
        setTimeout(() => {
          this.orderSuccessSection.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 0);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Error creating order:', err);
        alert('❌ حدث خطأ أثناء إنشاء الطلب. يرجى مراجعة البيانات والمحاولة مرة أخرى.');
      }
    });
  }

  getItemTotal(item: CartItem): number {
    return (parseFloat(item.product.price) || 0) * item.quantity;
  }


  clearCart(): void {
  this.cartItems = [];
  localStorage.removeItem('cart');
}

}
