import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

@Injectable({
  providedIn: 'root'
} )
export class AuthService {
  private apiUrl = 'https://osus-alhalwa.com/backend/wp-json';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient ) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // تسجيل الدخول
  login(username: string, password: string): Observable<any> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/jwt-auth/v1/token`, {
      username,
      password
    } ).pipe(
      map(response => {
        // حفظ التوكن
        if (response && response.token) {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userEmail', response.user_email);
            localStorage.setItem('userName', response.user_display_name);
          }

          // إنشاء كائن المستخدم
          const user: User = {
            id: 0,
            username: response.user_nicename,
            email: response.user_email,
            first_name: '',
            last_name: '',
            role: 'customer'
          };

          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
        }
        return response;
      })
    );
  }

  // تسجيل الخروج
  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  // التحقق من تسجيل الدخول
  isLoggedIn(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !!localStorage.getItem('authToken');
    }
    return false;
  }

  // الحصول على التوكن
  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  // الحصول على المستخدم المحفوظ
  private getStoredUser(): User | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  // الحصول على Headers مع التوكن
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // تسجيل مستخدم جديد (اختياري)
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/wp/v2/users/register`, {
      username,
      email,
      password
    } );
  }

  // **دالة نسيت كلمة المرور الجديدة**
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/custom/v2/users/forgot-password`, {
      user_login: email
    } );
  }

  resetPassword(username: string, key: string, newPassword: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/custom/v2/users/reset-password`, {
    user_login: username,
    key: key,
    password: newPassword
  });
}
}
