import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product } from '../../services/woocommerce';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  error = false;
  quantity = 1;
  selectedSize = '';
  added = false;
  formError = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => this.productService.getProduct(Number(params.get('id'))))
    ).subscribe({
      next: product => {
        this.product = product;
        this.selectedSize = '';
        this.loading = false;
        this.error = false;
        this.title.setTitle(`${product.name} | ميني أسس الحلوى`);
        this.meta.updateTag({ name: 'description', content: this.plainText(product.short_description || product.description).slice(0, 155) || `اطلب عرض سعر توريد ${product.name} من ميني أسس الحلوى.` });
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  addToQuote(): void {
    if (!this.product) return;
    if (this.sizeOptions.length && !this.selectedSize) {
      this.formError = 'يرجى اختيار الحجم المطلوب.';
      return;
    }
    this.formError = '';
    const options = this.selectedSize ? { [this.sizeAttribute?.name || 'الحجم']: this.selectedSize } : {};
    this.cartService.addToCart(this.product, this.quantity, options);
    this.added = true;
  }

  get sizeAttribute(): { id: number; name: string; options: string[]; visible?: boolean } | undefined {
    return this.product?.attributes?.find(attribute => /حجم|size/i.test(attribute.name) && attribute.options?.length > 0);
  }

  get sizeOptions(): string[] {
    return this.sizeAttribute?.options || [];
  }

  plainText(html: string): string {
    return (html || '')
      .replace(/<\s*br\s*\/?\s*>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])\s*>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'")
      .replace(/&#(\d+);/g, (entity, value: string) => this.decodeCodePoint(entity, Number(value)))
      .replace(/&#x([\da-f]+);/gi, (entity, value: string) => this.decodeCodePoint(entity, parseInt(value, 16)))
      .replace(/\s+/g, ' ').trim();
  }

  private decodeCodePoint(entity: string, code: number): string {
    try { return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity; }
    catch { return entity; }
  }
}
