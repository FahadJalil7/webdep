import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, AuctionItem } from '../../../services/auction.service';
import { WishlistService } from '../../../services/wishlist.service';

@Component({
    selector: 'app-auction-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <div class="auction-container">
      <div class="header">
        <div class="header-content">
          <button class="btn-back" (click)="goBack()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h2 class="logo">Auctions</h2>
          
          <div class="actions">
            <select [(ngModel)]="sortBy" (change)="loadItems()" class="sort-select">
              <option value="">Sort By</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="popularity">Popularity</option>
            </select>
            <button class="btn-primary" (click)="createItem()">+ New Item</button>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="auction-grid">
          <div *ngFor="let item of items" class="auction-card glass-panel" (click)="viewDetail(item.id)">
            <div class="card-image" [style.backgroundImage]="'url(' + item.imageUrl + ')'">
              <div class="type-badge">{{ item.type }}</div>
              <button class="btn-fav" (click)="toggleFav($event, item)">
                {{ isFavourite(item.id) ? '❤️' : '🤍' }}
              </button>
            </div>
            <div class="card-details">
              <h3>{{ item.name }}</h3>
              <div class="price-row">
                <span class="current-bid">Bid: \${{ item.currentBid }}</span>
                <span class="value-label">Val: \${{ item.value }}</span>
              </div>
              <p class="bid-count">{{ item.bidCount }} bids</p>
            </div>
          </div>
        </div>

        <div *ngIf="items.length === 0" class="empty-state glass-panel">
            <h3>No auction items found.</h3>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .auction-container {
      min-height: 100vh;
      color: white;
      padding: 20px;
    }

    .header-content {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
    }

    .logo {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #fff, #e0e7ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .actions {
        display: flex;
        gap: 15px;
    }

    .sort-select {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        outline: none;
    }

    .sort-select option {
        background: #1f1f1f;
        color: white;
    }

    .btn-back {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6C5DD3 0%, #8B5CF6 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .content {
      max-width: 1000px;
      margin: 0 auto;
    }

    .auction-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .auction-card {
      padding: 0;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .auction-card:hover {
      transform: translateY(-5px);
       background: rgba(255, 255, 255, 0.08);
    }

    .card-image {
      height: 200px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .type-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.6);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
    }

    .btn-fav {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: background 0.2s;
    }

    .btn-fav:hover {
        background: rgba(255,255,255,0.4);
    }

    .card-details {
      padding: 16px;
    }

    .card-details h3 {
      margin: 0 0 10px 0;
      font-size: 18px;
    }

    .price-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .current-bid {
        font-size: 18px;
        font-weight: bold;
        color: #6C5DD3;
    }

    .value-label {
        font-size: 12px;
        color: var(--text-secondary);
    }

    .bid-count {
        font-size: 12px;
        color: var(--text-secondary);
        margin: 0;
    }

    .empty-state {
        text-align: center;
        padding: 40px;
    }
  `]
})
export class AuctionListComponent implements OnInit {
    items: AuctionItem[] = [];
    sortBy: string = '';

    constructor(
        private auctionService: AuctionService,
        private router: Router,
        private wishlistService: WishlistService
    ) { }

    ngOnInit() {
        this.loadItems();
    }

    loadItems() {
        this.auctionService.getItems(this.sortBy).subscribe(res => {
            if (res.success) {
                this.items = res.items;
            }
        });
    }

    goBack() {
        this.router.navigate(['/home']);
    }

    viewDetail(id: number) {
        this.router.navigate(['/auctions', id]);
    }

    createItem() {
        this.router.navigate(['/auctions/new']);
    }

    toggleFav(event: Event, item: AuctionItem) {
        event.stopPropagation();
        // Assuming WishlistService can handle this structure or we map it
        const wishlistItem = {
            id: item.id,
            name: item.name,
            price: item.currentBid,
            image: item.imageUrl,
            description: item.description
        };

        if (this.isFavourite(item.id)) {
            this.wishlistService.removeFromWishlist(item.id);
        } else {
            this.wishlistService.addToWishlist(wishlistItem);
        }
    }

    isFavourite(id: number): boolean {
        let isFav = false;
        this.wishlistService.wishlist$.subscribe(items => {
            isFav = !!items.find(i => i.id === id);
        }).unsubscribe(); // simple check
        // Note: In a real app with Observables, we'd use a more reactive approach or map
        // For this simple sync-ish check from BehaviorSubject it's okay-ish but suboptimal
        // Better to have a local set of IDs subscribed once.

        // quick fix for the check:
        const currentList = (this.wishlistService as any).wishlistSubject?.value || [];
        return !!currentList.find((i: any) => i.id === id);
    }
}
