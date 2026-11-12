import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../services/woocommerce';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites';

@Component({
  selector: 'app-product-fav',
  imports: [CommonModule , RouterLink],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss'] // صححت هنا
})

export class ProductCardComponentMini {
  showToast = false;
  @Input() product!: Product;
  selectedProduct: any = null;


  constructor(private cartService: CartService, private favoritesService: FavoritesService) {}


  openQuickView(product: any) {
    this.selectedProduct = product;
    document.body.style.overflow = 'hidden'; // لمنع التمرير
  }

  closeQuickView() {
    this.selectedProduct = null;
    document.body.style.overflow = 'auto';
  }



  addToCart(): void {
    if (this.product.stock_status === 'instock') {
      this.cartService.addToCart(this.product, 1);
      // alert('تم إضافة المنتج إلى السلة بنجاح!');


      this.showToast = true;

    // اخفاء الرسالة بعد 3 ثواني
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
    }
  }


   isFavorite(): boolean {
    return this.favoritesService.isFavorite(this.product.id);
  }


  toggleFavorite(): void {
    if (this.isFavorite()) {
      this.favoritesService.removeFromFavorites(this.product.id);
    } else {
      this.favoritesService.addToFavorites(this.product);
    }
  }

}
