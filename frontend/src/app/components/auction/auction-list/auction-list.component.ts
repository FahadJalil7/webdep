import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, AuctionItem } from '../../../services/auction.service';
import { WishlistService } from '../../../services/wishlist.service';
import { AuthService } from '../../../services/auth.service';

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
          <h2 class="logo">Live Auctions</h2>
          
          <div class="actions">
            <select [(ngModel)]="sortBy" (change)="loadItems()" class="sort-select">
              <option value="">Sort By</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="popularity">Popularity</option>
            </select>
            <button *ngIf="isAdmin()" class="btn-primary" (click)="createItem()">+ New Item</button>
            <div class="balance-display" *ngIf="authService.getCurrentUser()">
                Balance: <span class="balance-amount">\${{ authService.getCurrentUser().kogbucks_balance.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="auction-grid">
          <div *ngFor="let item of items" class="auction-card glass-panel" (click)="viewDetail(item.id)">
            <div class="card-image" [style.backgroundImage]="'url(' + item.imageUrl + ')'">
              <div class="type-badge">{{ item.type }}</div>
              <div class="status-badge" [ngClass]="item.status">
                {{ item.status === 'active' ? '● LIVE' : item.status === 'ended' ? 'ENDED' : 'UPCOMING' }}
              </div>
              <button class="btn-fav" (click)="toggleFav($event, item)">
                {{ isFavourite(item.id) ? '❤️' : '🤍' }}
              </button>
            </div>
            <div class="card-details">
              <h3>{{ item.name }}</h3>
              <div class="price-row">
                <div class="price-info">
                  <span class="current-bid">Current: \${{ item.currentBid.toFixed(2) }}</span>
                  <span class="starting-bid">Starting: \${{ item.startingBid.toFixed(2) }}</span>
                </div>
                <span class="value-label">Val: \${{ item.value.toFixed(2) }}</span>
              </div>
              <div class="timer-row">
                <div class="countdown" *ngIf="item.status === 'active'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--theme-blue-40)" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  <span class="time-left">{{ getTimeRemaining(item) }}</span>
                </div>
                <div class="countdown ended-text" *ngIf="item.status === 'ended'">
                  <span>Auction ended</span>
                </div>
                <div class="countdown upcoming-text" *ngIf="item.status === 'upcoming'">
                  <span>Starts {{ getTimeUntilStart(item) }}</span>
                </div>
                <span class="bid-count">{{ item.bidCount }} bids</span>
              </div>
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
      background: var(--accent-gradient);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }



    .balance-display {
        font-size: 14px;
        color: #ddd;
        background: rgba(255,255,255,0.1);
        padding: 8px 12px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
        height: 35px; /* Match select/button height approx */
    }

    .balance-amount {
        color: #4caf50;
        font-weight: bold;
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
      transition: transform 0.3s, box-shadow 0.3s;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .auction-card:hover {
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 12px 40px rgba(41, 128, 185, 0.15);
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

    .status-badge {
        position: absolute;
        bottom: 10px;
        left: 10px;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .status-badge.active {
        background: rgba(34, 197, 94, 0.85);
        color: white;
        animation: pulse-glow 2s ease-in-out infinite;
    }

    .status-badge.ended {
        background: rgba(239, 68, 68, 0.85);
        color: white;
    }

    .status-badge.upcoming {
        background: rgba(234, 179, 8, 0.85);
        color: #1a1a1a;
    }

    @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 4px rgba(34, 197, 94, 0.4); }
        50% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.7); }
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
        align-items: flex-start;
        margin-bottom: 8px;
    }

    .price-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .current-bid {
        font-size: 18px;
        font-weight: bold;
        color: var(--theme-blue-40);
    }

    .starting-bid {
        font-size: 12px;
        color: var(--text-secondary);
    }

    .value-label {
        font-size: 12px;
        color: var(--text-secondary);
    }

    .timer-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .countdown {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
    }

    .time-left {
        color: var(--theme-blue-40);
    }

    .ended-text {
        color: #ef4444;
        font-size: 12px;
    }

    .upcoming-text {
        color: #eab308;
        font-size: 12px;
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
export class AuctionListComponent implements OnInit, OnDestroy {
  items: AuctionItem[] = [];
  sortBy: string = '';
  private timerInterval: any;

  constructor(
    private auctionService: AuctionService,
    private router: Router,
    private wishlistService: WishlistService,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.loadItems();
    // Update countdown every second
    this.timerInterval = setInterval(() => {
      // Trigger change detection by re-checking statuses
      this.items = this.items.map(item => {
        const now = new Date();
        const end = new Date(item.endTime);
        const start = new Date(item.startTime);
        if (end < now) item.status = 'ended';
        else if (start > now) item.status = 'upcoming';
        else item.status = 'active';
        return { ...item };
      });
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
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

  isAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'admin';
  }

  getTimeRemaining(item: AuctionItem): string {
    const now = new Date().getTime();
    const end = new Date(item.endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  }

  getTimeUntilStart(item: AuctionItem): string {
    const now = new Date().getTime();
    const start = new Date(item.startTime).getTime();
    const diff = start - now;

    if (diff <= 0) return 'soon';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  }

  toggleFav(event: Event, item: AuctionItem) {
    event.stopPropagation();
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
    const currentList = (this.wishlistService as any).wishlistSubject?.value || [];
    return !!currentList.find((i: any) => i.id === id);
  }
}
