import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart';
import { WoocommerceService, Product } from '../../services/woocommerce';
import { debounceTime, distinctUntilChanged, Observable, Subject } from 'rxjs';
import { FavoritesService } from '../../services/favorites';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit {
  cartItemCount: number = 0;
  searchQuery: string = '';
  filteredProducts: Product[] = [];
  loadingSearch: boolean = false;
  noResults: boolean = false;
  isLoggedIn = true;

  favoritesCount$!: Observable<number>;


  private searchSubject = new Subject<string>();

  showLoginModal = false;

  constructor(
    private cartService: CartService,
    private woocommerceService: WoocommerceService,
    private router: Router,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    // 🛒 متابعة عدد عناصر السلة
    this.cartService.cart$.subscribe(() => {
      this.cartItemCount = this.cartService.getItemCount();
      this.favoritesCount$ = this.favoritesService.getFavoritesCount();

    });

    // ⏳ إعداد البحث المؤجل (debounced)
    this.searchSubject.pipe(
      debounceTime(600), // ينتظر 600 مللي ثانية بعد توقف الكتابة
      distinctUntilChanged()
    ).subscribe((query) => {
      this.performSearch(query);
    });
  }

  // 🔍 عند الكتابة في خانة البحث
  onSearchInput(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      this.filteredProducts = [];
      this.noResults = false;
      this.loadingSearch = false;
      return;
    }

    this.loadingSearch = true;
    this.noResults = false;
    this.filteredProducts = [];

    // إرسال النص للـ Subject (عشان نستخدم debounce)
    this.searchSubject.next(query);
  }

  // 📦 تنفيذ البحث فعليًا
  performSearch(query: string): void {
    this.woocommerceService.getProducts({ search: query, per_page: 10 }).subscribe({
      next: (products) => {
        this.filteredProducts = products;
        this.loadingSearch = false;
        this.noResults = products.length === 0;
      },
      error: (err) => {
        console.error('❌ خطأ أثناء البحث:', err);
        this.loadingSearch = false;
        this.noResults = true;
      }
    });
  }

  // 📦 عند اختيار منتج
  selectProduct(product: Product): void {
    this.router.navigate(['/product', product.id]);
    this.clearSearch();
  }

  // 🧹 مسح البحث
  clearSearch(): void {
    this.searchQuery = '';
    this.filteredProducts = [];
    this.noResults = false;
    this.loadingSearch = false;
  }

  // 🔐 التحكم في المودال
  toggleLoginModal() {
    this.showLoginModal = !this.showLoginModal;
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }

  onLoginSuccess() {
    this.showLoginModal = false;
    this.isLoggedIn = false;
    console.log('✅ تم تسجيل الدخول بنجاح!');
  }

  logout() {
    // إزالة التوكن من التخزين المحلي
    localStorage.removeItem('token');
    // إعادة التوجيه للصفحة الرئيسية أو صفحة تسجيل الدخول
    window.location.reload();
  }
}
