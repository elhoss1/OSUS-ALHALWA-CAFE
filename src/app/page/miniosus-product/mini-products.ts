import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WoocommerceService, Product } from '../../services/woocommerce';
import { ProductCardComponentMini } from '../product-card copy/product-card';

type CatalogCategoryId = 'all' | 'mini-cake' | 'cake' | 'cheesecake-tart' | 'croissant-bakery' | 'cookies-brownies' | 'chocolate-special';

interface CatalogCategory {
  id: CatalogCategoryId;
  label: string;
  keywords: string[];
  categoryIds?: number[];
}

@Component({
  selector: 'app-cake-products',
  imports: [CommonModule, RouterLink, ProductCardComponentMini],
  templateUrl: './mini-products.html',
  styleUrl: './mini-products.scss'
})
export class MiniOsusProduct implements OnInit {
  products: Product[] = [];
  loading = false;
  selectedCategory: CatalogCategoryId = 'all';

  readonly categories: CatalogCategory[] = [
    { id: 'all', label: 'جميع المنتجات', keywords: [] },
    { id: 'mini-cake', label: 'ميني كيك', keywords: ['ميني', 'mini cake', 'mini-cake'], categoryIds: [44] },
    { id: 'cake', label: 'الكيك وشرائح الكيك', keywords: ['كيك', 'cake', 'شرائح', 'pound cake'], categoryIds: [69] },
    { id: 'cheesecake-tart', label: 'التشيز كيك والتارت', keywords: ['تشيز', 'cheese cake', 'cheesecake', 'تارت', 'tart'] },
    { id: 'croissant-bakery', label: 'الكرواسون والمخبوزات', keywords: ['كرواسون', 'croissant', 'دانش', 'danish', 'مخبوز', 'bakery', 'معجن'] },
    { id: 'cookies-brownies', label: 'الكوكيز والبراونيز', keywords: ['كوكيز', 'cookie', 'براونيز', 'brownie'] },
    { id: 'chocolate-special', label: 'الشوكولاتة والحلويات الخاصة', keywords: ['شوكولات', 'chocolate', 'حلويات خاصة', 'special'] }
  ];

  private readonly MIN_LOADING_MS = 450;
  private requestId = 0;

  constructor(private woocommerceService: WoocommerceService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  selectCategory(category: CatalogCategoryId): void {
    this.selectedCategory = category;
  }

  get filteredProducts(): Product[] {
    if (this.selectedCategory === 'all') return this.products;
    const category = this.categories.find(item => item.id === this.selectedCategory);
    if (!category) return this.products;

    return this.products.filter(product => {
      if (category.categoryIds?.some(id => product.categories?.some(item => item.id === id))) return true;
      const productTerms = (product.categories || [])
        .map(item => `${item.name} ${item.slug}`.toLowerCase());
      const isMiniCake = product.categories.some(item => item.id === 44) ||
        productTerms.some(term => term.includes('mini') || term.includes('ميني'));
      if (category.id === 'cake' && isMiniCake) return false;
      return productTerms.some(term => category.keywords.some(keyword => term.includes(keyword)));
    });
  }

  private loadProducts(): void {
    const currentRequest = ++this.requestId;
    const startedAt = Date.now();
    this.loading = true;
    this.woocommerceService.getProducts({ per_page: 100, status: 'publish' }).subscribe({
      next: products => {
        const wait = Math.max(0, this.MIN_LOADING_MS - (Date.now() - startedAt));
        setTimeout(() => {
          if (currentRequest !== this.requestId) return;
          this.products = products;
          this.loading = false;
        }, wait);
      },
      error: error => {
        console.error('Error loading catalog products:', error);
        if (currentRequest === this.requestId) {
          this.products = [];
          this.loading = false;
        }
      }
    });
  }
}
