import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../services/woocommerce'; // افتراض أن مسار Product صحيح

// تعريف واجهة المنتج بناءً على الكود المرفق
// يجب أن تكون هذه الواجهة موجودة في مكان ما، لكن لغرض الخدمة سنفترض وجودها
// export interface Product {
//   id: number;
//   name: string;
//   price: string;
//   regular_price: string;
//   sale_price: string;
//   images: { src: string }[];
//   stock_status: 'instock' | 'outofstock';
//   // إضافة خصائص أخرى قد تحتاجها
// }

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favorites: Product[] = [];
  private favoritesSubject: BehaviorSubject<Product[]> = new BehaviorSubject(this.favorites);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // تحميل المفضلة من التخزين المحلي عند بدء الخدمة، فقط إذا كنا في المتصفح
    if (this.isBrowser) {
      this.loadFavorites();
    }
  }

  /**
   * تحميل قائمة المفضلة من التخزين المحلي (localStorage).
   */
  private loadFavorites(): void {
    if (this.isBrowser) {
      const storedFavorites = localStorage.getItem('favorites');
      if (storedFavorites) {
        this.favorites = JSON.parse(storedFavorites);
        this.favoritesSubject.next(this.favorites);
      }
    }
  }

  /**
   * حفظ قائمة المفضلة في التخزين المحلي (localStorage).
   */
  private saveFavorites(): void {
    // يتم الحفظ في localStorage فقط إذا كنا في المتصفح
    if (this.isBrowser) {
      localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }
    // يتم تحديث الـ Subject دائمًا لإعلام المكونات بالتغيير
    this.favoritesSubject.next(this.favorites);
  }

  /**
   * الحصول على قائمة المفضلة كمراقب (Observable).
   * @returns Observable<Product[]>
   */
  getFavorites(): Observable<Product[]> {
    return this.favoritesSubject.asObservable();
  }

  /**
   * إضافة منتج إلى قائمة المفضلة.
   * @param product المنتج المراد إضافته.
   */
  addToFavorites(product: Product): void {
    if (!this.isFavorite(product.id)) {
      this.favorites.push(product);
      this.saveFavorites();
    }
  }

  /**
   * إزالة منتج من قائمة المفضلة.
   * @param productId معرّف المنتج المراد إزالته.
   */
  removeFromFavorites(productId: number): void {
    this.favorites = this.favorites.filter(p => p.id !== productId);
    this.saveFavorites();
  }

  /**
   * التحقق مما إذا كان المنتج موجودًا في قائمة المفضلة.
   * @param productId معرّف المنتج.
   * @returns boolean
   */
  isFavorite(productId: number): boolean {
    return this.favorites.some(p => p.id === productId);
  }

  /**
   * الحصول على عدد المنتجات المفضلة.
   * @returns Observable<number>
   */
  getFavoritesCount(): Observable<number> {
    return this.favoritesSubject.asObservable().pipe(
      map(favorites => favorites.length)
    );
  }
}
