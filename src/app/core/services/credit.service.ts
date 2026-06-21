import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // mismo path relativo que chat.service.ts

export interface CreditBalance {
  credit_balance: number;
}

export interface CreditTransaction {
  id: number;
  amount: number;
  transaction_type: string;
  conversation_id: number | null;
  video_job_id: number | null;
  reference_id: number | null;
  balance_after: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreditService {
  private readonly apiUrl = `${environment.apiUrl}/credits`;

  constructor(private http: HttpClient) {}

  getBalance(): Observable<CreditBalance> {
    return this.http.get<CreditBalance>(`${this.apiUrl}/balance`);
  }

  getHistory(limit: number = 20): Observable<CreditTransaction[]> {
    return this.http.get<CreditTransaction[]>(`${this.apiUrl}/history`, {
      params: { limit: limit.toString() }
    });
  }
}
