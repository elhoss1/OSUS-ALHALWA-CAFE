import { Routes } from '@angular/router';
import { MiniOsusProduct } from './page/miniosus-product/mini-products';

export const routes: Routes = [
    { path: '', component: MiniOsusProduct, pathMatch: 'full', title: "أسس الحلوى كافيه - OSUS ALHALWA CAFÉ | توريد الحلويات والمخبوزات للكوفيهات" },
    { path: 'product/:id', loadComponent: () => import('./page/product-detail/product-detail').then(m => m.ProductDetailComponent), title: 'تفاصيل المنتج | أسس الحلوى كافيه' },
    { path: 'checkoutgomla', redirectTo: 'cart', pathMatch: 'full' },
    { path: 'cart', loadComponent:()=>import('./page/cart/cart').then((m)=>m.CartComponent) , title:"طلب عرض سعر | أسس الحلوى كافيه - OSUS ALHALWA CAFÉ"},
    { path: 'order-success/:reference', loadComponent: () => import('./page/order-success/order-success').then(m => m.OrderSuccessComponent), title: 'تم استلام طلبك | أسس الحلوى كافيه' },
    { path: 'favorites', loadComponent:()=>import('./page/favorites/favorites').then((m)=>m.FavoritesComponent) , title:"المفضلة"},

    { path: '**', redirectTo: ''  },


];
