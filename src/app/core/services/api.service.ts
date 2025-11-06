import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Asegúrate de que esta URL apunte a tu backend Python
  private apiUrl = 'http://localhost:8001/api';

  constructor(private http: HttpClient) { }

  // Ejemplo: Método para obtener datos
  getSomeData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/data`);
  }

  // Ejemplo: Método para enviar datos
  postData(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/data`, data);
  }
}