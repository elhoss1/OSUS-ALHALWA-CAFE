// src/app/services/breadcrumb.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<Breadcrumb[]>([]);
  public breadcrumbs$: Observable<Breadcrumb[]> = this.breadcrumbsSubject.asObservable();

  constructor() { }

  // دالة لتحديث شريط التنقل
  setBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    this.breadcrumbsSubject.next(breadcrumbs);
  }
}
