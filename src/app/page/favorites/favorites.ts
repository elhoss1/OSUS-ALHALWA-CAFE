import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites';
import { Product } from '../../services/woocommerce';
import { ProductCardComponentMini } from "../product-card/product-card";


@Component({
  selector: 'app-favorites',
  imports: [CommonModule, RouterLink, ProductCardComponentMini],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss'
})
export class FavoritesComponent implements OnInit {
  favorites$!: Observable<Product[]>;

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.favorites$ = this.favoritesService.getFavorites();
  }

  /**
   * إزالة منتج من قائمة المفضلة.
   * @param productId معرّف المنتج المراد إزالته.
   */
  removeFromFavorites(productId: number): void {
    this.favoritesService.removeFromFavorites(productId);
  }

  /**
   * دالة مساعدة لتتبع العناصر في ngFor.
   * @param index الفهرس.
   * @param item المنتج.
   * @returns معرّف المنتج.
   */
  trackByProductId(index: number, item: Product): number {
    return item.id;
  }
}
