import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>; }): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${path}`, { params }).pipe(
      catchError(this.formatErrors)
    );
  }

  post<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body).pipe(
      catchError(this.formatErrors)
    );
  }

  put<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${path}`, body).pipe(
      catchError(this.formatErrors)
    );
  }

  patch<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${path}`, body).pipe(
      catchError(this.formatErrors)
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`).pipe(
      catchError(this.formatErrors)
    );
  }

  private formatErrors(error: any) {
    return throwError(error.error);
  }
}
