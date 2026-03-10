import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, AuctionEvent, AuctionItem } from '../../../services/auction.service';
import { AuthService } from '../../../services/auth.service';
import { WishlistService } from '../../../services/wishlist.service';

@Component({
  selector: 'app-auction-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="detail-container" *ngIf="auction">
      <button class="btn-back" (click)="goBack()">
        ← Back to Auctions
      </button>

      <div class="auction-header glass-panel">
        <div class="header-info">
            <h1>{{ auction.title }}</h1>
            <div class="status-badge" [ngClass]="auction.status">
              {{ auction.status === 'active' ? '● LIVE' : auction.status === 'ended' ? 'ENDED' : 'UPCOMING' }}
            </div>
        </div>

        <div class="time-frame-section">
            <div class="time-details">
              <div class="time-item">
                <span class="time-label">Starts</span>
                <span class="time-value">{{ formatDate(auction.startTime) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">Ends</span>
                <span class="time-value">{{ formatDate(auction.endTime) }}</span>
              </div>
            </div>
            <div class="countdown-display" *ngIf="auction.status === 'active'">
              <span class="countdown-label">Time Remaining:</span>
              <span class="countdown-value">{{ countdownText }}</span>
            </div>
            <div class="countdown-display ended" *ngIf="auction.status === 'ended'">
              <span class="countdown-label">Status:</span>
              <span class="countdown-value">Auction has ended</span>
            </div>
            <div class="countdown-display upcoming" *ngIf="auction.status === 'upcoming'">
              <span class="countdown-label">Status:</span>
              <span class="countdown-value">Starts in {{ countdownText }}</span>
            </div>
        </div>

        <div class="admin-actions" *ngIf="isAdmin()">
            <button class="btn-edit" (click)="editAuction()">Edit Auction Details</button>
        </div>
      </div>

      <div class="items-section">
        <h2>Items in this Auction</h2>
        
        <div *ngIf="globalMessage" class="global-message" [ngClass]="{'success-msg': !isError, 'error-msg': isError}">
            {{ globalMessage }}
        </div>

        <div class="items-grid">
            <div class="item-card glass-panel" *ngFor="let item of auction.items">
                <div class="item-image" [style.backgroundImage]="'url(' + item.imageUrl + ')'">
                    <div class="type-badge">{{ item.type }}</div>
                    <button class="btn-fav" (click)="toggleFav($event, item)" *ngIf="!isAdmin()">
                        {{ isFavourite(item.id) ? '❤️' : '🤍' }}
                    </button>
                </div>
                <div class="item-info">
                    <h3>{{ item.name }}</h3>
                    <p class="description">{{ item.description }}</p>
                    
                    <div class="stats-grid">
                        <div class="stat">
                            <span class="label">Value</span>
                            <span class="value">\${{ item.value.toFixed(2) }}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Starting</span>
                            <span class="value">\${{ item.startingBid.toFixed(2) }}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Current</span>
                            <span class="value highlight">\${{ item.currentBid.toFixed(2) }}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Bids</span>
                            <span class="value">{{ item.bidCount }}</span>
                        </div>
                    </div>

                    <!-- Bidding area -->
                    <div class="bidding-area" *ngIf="auction.status === 'active' && !isAdmin()">
                        <div class="balance-info" *ngIf="authService.getCurrentUser()">
                            Avail: \${{ (authService.getCurrentUser()?.kogbucks_balance - (authService.getCurrentUser()?.kogbucks_on_hold || 0)).toFixed(2) }}
                        </div>
                        <button class="btn-bid" (click)="placeBid(item)" [disabled]="!isValidBid(item)">
                            Bid \${{ (authService.getCurrentUser()?.kogbucks_balance - (authService.getCurrentUser()?.kogbucks_on_hold || 0)).toFixed(2) }}
                        </button>
                    </div>

                    <div class="status-notice ended" *ngIf="auction.status === 'ended'">
                        Bidding Closed
                    </div>
                </div>
            </div>
            <div *ngIf="!auction.items || auction.items.length === 0" class="empty-items text-center">
                This auction has no items yet.
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-container { padding: 20px; max-width: 1000px; margin: 0 auto; color: white; min-height: 100vh; }
    .btn-back { background: none; border: none; color: var(--text-secondary); font-size: 16px; cursor: pointer; margin-bottom: 20px; }
    .glass-panel { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 25px; margin-bottom: 30px; }
    
    .auction-header { display: flex; flex-direction: column; gap: 20px; }
    .header-info { display: flex; justify-content: space-between; align-items: center; }
    h1 { margin: 0; font-size: 28px; }
    .status-badge { padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; }
    .status-badge.active { background: rgba(34, 197, 94, 0.9); color: white; animation: pulse-glow 2s ease-in-out infinite; }
    .status-badge.ended { background: rgba(239, 68, 68, 0.9); color: white; }
    .status-badge.upcoming { background: rgba(234, 179, 8, 0.9); color: #1a1a1a; }
    
    @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 4px rgba(34, 197, 94, 0.4); } 50% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.7); } }
    
    .time-frame-section { display: flex; justify-content: space-between; align-items: center; background: rgba(41, 128, 185, 0.08); padding: 15px; border-radius: 8px; flex-wrap: wrap; gap: 15px; }
    .time-details { display: flex; gap: 40px; }
    .time-item { display: flex; flex-direction: column; gap: 4px; }
    .time-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; }
    .time-value { font-size: 14px; font-weight: 500; }
    
    .countdown-display { display: flex; align-items: center; gap: 10px; background: rgba(41, 128, 185, 0.15); padding: 8px 14px; border-radius: 8px; }
    .countdown-display.ended { background: rgba(239, 68, 68, 0.15); }
    .countdown-display.upcoming { background: rgba(234, 179, 8, 0.15); }
    .countdown-label { font-size: 12px; color: var(--text-secondary); }
    .countdown-value { font-size: 16px; font-weight: 700; color: var(--theme-blue-40); tabular-nums; }
    
    .admin-actions .btn-edit { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
    
    .items-section h2 { margin-bottom: 20px; font-size: 22px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    
    .item-card { padding: 0; display: flex; flex-direction: column; overflow: hidden; }
    .item-image { height: 180px; background-size: cover; background-position: center; position: relative; }
    .type-badge { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    
    .btn-fav { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: background 0.2s; }
    .btn-fav:hover { background: rgba(255,255,255,0.4); }

    .item-info { padding: 15px; display: flex; flex-direction: column; flex-grow: 1; }
    .item-info h3 { margin: 0 0 5px 0; font-size: 18px; }
    .description { color: var(--text-secondary); font-size: 13px; line-height: 1.4; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .stat { display: flex; flex-direction: column; gap: 3px; }
    .stat .label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; }
    .stat .value { font-size: 14px; font-weight: bold; }
    .stat .highlight { color: var(--theme-blue-40); font-size: 15px; }
    
    .bidding-area { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
    .balance-info { font-size: 12px; color: #4caf50; }
    .btn-bid { padding: 8px 16px; background: var(--accent-gradient); border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer; }
    .btn-bid:disabled { opacity: 0.5; cursor: not-allowed; }
    .status-notice { text-align: center; padding: 10px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: auto; background: rgba(255,255,255,0.05); }
    .status-notice.ended { color: #ef4444; }
    
    .global-message { padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; }
    .success-msg { background: rgba(34, 197, 94, 0.2); color: #4caf50; border: 1px solid rgba(34, 197, 94, 0.3); }
    .error-msg { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
    .text-center { text-align: center; padding: 40px; color: var(--text-secondary); }
  `]
})
export class AuctionDetailComponent implements OnInit, OnDestroy {
  auction: AuctionEvent | null = null;
  globalMessage: string = '';
  isError: boolean = false;
  countdownText: string = '';
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auctionService: AuctionService,
    public authService: AuthService,
    private wishlistService: WishlistService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadAuction(id);
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadAuction(id: number) {
    this.auctionService.getAuction(id).subscribe(res => {
      if (res.success) {
        this.auction = res.auction;
        this.updateCountdown();
        this.startCountdown();
      } else {
        this.router.navigate(['/auctions']);
      }
    });
  }

  startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    if (!this.auction) return;
    const now = new Date().getTime();
    const end = new Date(this.auction.endTime).getTime();
    const start = new Date(this.auction.startTime).getTime();
    
    let target = this.auction.status === 'upcoming' ? start : end;
    let diff = target - now;

    if (diff <= 0) {
      if (this.auction.status === 'upcoming') {
          this.auction.status = 'active';
          this.updateCountdown(); // re-evaluate
          return;
      } else {
          this.countdownText = 'Ended';
          this.auction.status = 'ended';
          if (this.timerInterval) clearInterval(this.timerInterval);
          return;
      }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    this.countdownText = parts.join(' ');
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  }

  goBack() {
    this.router.navigate(['/auctions']);
  }

  isValidBid(item: AuctionItem): boolean {
    const user = this.authService.getCurrentUser();
    return user ? (user.kogbucks_balance - (user.kogbucks_on_hold || 0)) > item.currentBid : false;
  }

  placeBid(item: AuctionItem) {
    if (!this.isValidBid(item)) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.globalMessage = 'You must be logged in to bid.';
      this.isError = true;
      return;
    }

    const bidAmount = currentUser.kogbucks_balance - (currentUser.kogbucks_on_hold || 0);

    this.auctionService.placeBid(item.id, bidAmount, currentUser.id).subscribe({
      next: (res) => {
        if (res.success) {
          // Update the specific item in the list
          const idx = this.auction!.items!.findIndex(i => i.id === item.id);
          if (idx !== -1) {
              this.auction!.items![idx] = res.item;
          }
          this.globalMessage = `Bid placed successfully on ${item.name}!`;
          this.isError = false;
          if (res.newBalance !== undefined) {
            this.authService.updateUserBalance(res.newBalance, res.newOnHold);
          }
        }
      },
      error: (err) => {
        this.globalMessage = err.error.message || 'Failed to place bid.';
        this.isError = true;
      }
    });

    // Clear message after 5s
    setTimeout(() => this.globalMessage = '', 5000);
  }

  editAuction() {
    if (this.auction) {
      this.router.navigate(['/auctions', this.auction.id, 'edit']);
    }
  }

  isAdmin() {
    return this.authService.getCurrentUser()?.role === 'admin';
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
