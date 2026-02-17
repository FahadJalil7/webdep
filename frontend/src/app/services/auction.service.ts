import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuctionItem {
    id: number;
    name: string;
    description: string;
    value: number;
    startingBid: number;
    currentBid: number;
    bids: any[];
    type: 'Physical' | 'Gift Card';
    imageUrl: string;
    bidCount: number;
    startTime: string;
    endTime: string;
    status: 'active' | 'ended' | 'upcoming';
}

@Injectable({
    providedIn: 'root'
})
export class AuctionService {
    private apiUrl = 'http://localhost:3000/api/auction-items';

    constructor(private http: HttpClient) { }

    getItems(sortBy?: string): Observable<{ success: boolean; items: AuctionItem[] }> {
        let params = new HttpParams();
        if (sortBy) {
            params = params.set('sortBy', sortBy);
        }
        return this.http.get<{ success: boolean; items: AuctionItem[] }>(this.apiUrl, { params });
    }

    getItem(id: number): Observable<{ success: boolean; item: AuctionItem }> {
        return this.http.get<{ success: boolean; item: AuctionItem }>(`${this.apiUrl}/${id}`);
    }

    createItem(item: any): Observable<{ success: boolean; item: AuctionItem }> {
        return this.http.post<{ success: boolean; item: AuctionItem }>(this.apiUrl, item);
    }

    updateItem(id: number, item: any): Observable<{ success: boolean; item: AuctionItem }> {
        return this.http.put<{ success: boolean; item: AuctionItem }>(`${this.apiUrl}/${id}`, item);
    }

    placeBid(id: number, amount: number, userId: number): Observable<{ success: boolean; item: AuctionItem; message: string; newBalance: number }> {
        return this.http.post<{ success: boolean; item: AuctionItem; message: string; newBalance: number }>(
            `${this.apiUrl}/${id}/bid`,
            { amount, userId }
        );
    }
}
