import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../services/woocommerce';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites';

@Component({
  selector: 'app-product-mini',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCardComponentMini {
  showToast = false;
  @Input() product!: Product;

  constructor(private cartService: CartService, private favoritesService: FavoritesService) {}

  plainDescription(value: string | undefined): string {
    if (!value) return '';
    return value
      .replace(/<\s*br\s*\/?\s*>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])\s*>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;|&apos;/gi, "'")
      .replace(/&#(\d+);/g, (entity, code: string) => this.decodeCodePoint(entity, Number(code)))
      .replace(/&#x([\da-f]+);/gi, (entity, code: string) => this.decodeCodePoint(entity, parseInt(code, 16)))
      .replace(/\s+/g, ' ')
      .trim();
  }

  private decodeCodePoint(entity: string, code: number): string {
    try { return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity; }
    catch { return entity; }
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartService.addToCart(this.product, 1);
    this.showToast = true;
    setTimeout(() => this.showToast = false, 2600);
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
