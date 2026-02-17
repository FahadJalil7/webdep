import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, AuctionItem } from '../../../services/auction.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-auction-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="detail-container" *ngIf="item">
      <button class="btn-back" (click)="goBack()">
        ← Back to Auctions
      </button>

      <div class="detail-content glass-panel">
        <div class="image-section" [style.backgroundImage]="'url(' + item.imageUrl + ')'">
            <div class="type-badge">{{ item.type }}</div>
            <div class="status-badge" [ngClass]="item.status">
              {{ item.status === 'active' ? '● LIVE' : item.status === 'ended' ? 'ENDED' : 'UPCOMING' }}
            </div>
        </div>

        <div class="info-section">
          <h1>{{ item.name }}</h1>
          <p class="description">{{ item.description }}</p>
          
          <div class="stats-grid">
            <div class="stat">
              <span class="label">Starting Bid</span>
              <span class="value">\${{ item.startingBid.toFixed(2) }}</span>
            </div>
            <div class="stat">
              <span class="label">Current Bid</span>
              <span class="value highlight">\${{ item.currentBid.toFixed(2) }}</span>
            </div>
            <div class="stat">
              <span class="label">Est. Value</span>
              <span class="value">\${{ item.value.toFixed(2) }}</span>
            </div>
            <div class="stat">
              <span class="label">Bids</span>
              <span class="value">{{ item.bidCount }}</span>
            </div>
          </div>

          <!-- Time Frame Section -->
          <div class="time-frame-section">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              Auction Time Frame
            </h3>
            <div class="time-details">
              <div class="time-item">
                <span class="time-label">Start</span>
                <span class="time-value">{{ formatDate(item.startTime) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">End</span>
                <span class="time-value">{{ formatDate(item.endTime) }}</span>
              </div>
            </div>
            <div class="countdown-display" *ngIf="item.status === 'active'">
              <span class="countdown-label">Time Remaining</span>
              <span class="countdown-value">{{ countdownText }}</span>
            </div>
            <div class="countdown-display ended" *ngIf="item.status === 'ended'">
              <span class="countdown-label">Status</span>
              <span class="countdown-value">Auction has ended</span>
            </div>
            <div class="countdown-display upcoming" *ngIf="item.status === 'upcoming'">
              <span class="countdown-label">Status</span>
              <span class="countdown-value">Auction starts soon</span>
            </div>
          </div>

          <!-- Bidding Section - only for active auctions -->
          <div class="bidding-section" *ngIf="item.status === 'active'">
            <div class="bid-header">
                <h3>Place a Bid</h3>
                <div class="balance-display" *ngIf="authService.getCurrentUser()">
                    Balance: <span class="balance-amount">\${{ authService.getCurrentUser().kogbucks_balance.toFixed(2) }}</span>
                </div>
            </div>
            <div class="bid-input-group">
                <span class="currency">$</span>
                <input type="number" [(ngModel)]="bidAmount" [min]="item.currentBid + 1" class="bid-input">
                <button class="btn-bid" (click)="placeBid()" [disabled]="!isValidBid()">
                    Place Bid
                </button>
            </div>
            <p *ngIf="message" [class.error]="isError" [class.success]="!isError">{{ message }}</p>
          </div>

          <div class="bidding-section ended-notice" *ngIf="item.status === 'ended'">
            <h3>🔒 Bidding Closed</h3>
            <p class="ended-message">This auction has ended. No more bids can be placed.</p>
          </div>

          <div class="bidding-section upcoming-notice" *ngIf="item.status === 'upcoming'">
            <h3>⏳ Bidding Not Yet Open</h3>
            <p class="upcoming-message">This auction has not started yet. Check back soon!</p>
          </div>

          <div class="admin-actions" *ngIf="isAdmin()">
            <button class="btn-edit" (click)="editItem()">Edit Item</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
      color: white;
      min-height: 100vh;
    }

    .btn-back {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 16px;
      cursor: pointer;
      margin-bottom: 20px;
    }

    .detail-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      overflow: hidden;
      padding: 0;
    }

    .image-section {
      height: 100%;
      min-height: 400px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .type-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        background: rgba(0,0,0,0.6);
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
    }

    .status-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
    }

    .status-badge.active {
        background: rgba(34, 197, 94, 0.9);
        color: white;
        animation: pulse-glow 2s ease-in-out infinite;
    }

    .status-badge.ended {
        background: rgba(239, 68, 68, 0.9);
        color: white;
    }

    .status-badge.upcoming {
        background: rgba(234, 179, 8, 0.9);
        color: #1a1a1a;
    }

    @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 4px rgba(34, 197, 94, 0.4); }
        50% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.7); }
    }

    .info-section {
      padding: 30px;
    }

    h1 {
      margin-top: 0;
      font-size: 32px;
      margin-bottom: 10px;
    }

    .description {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .label {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .value {
      font-size: 22px;
      font-weight: bold;
    }

    .highlight {
      color: #6C5DD3;
    }

    /* Time Frame Section */
    .time-frame-section {
      background: rgba(139, 92, 246, 0.08);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 24px;
    }

    .time-frame-section h3 {
      margin: 0 0 14px 0;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #c4b5fd;
    }

    .time-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    .time-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .time-label {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .time-value {
      font-size: 14px;
      font-weight: 500;
    }

    .countdown-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(139, 92, 246, 0.15);
      padding: 10px 14px;
      border-radius: 8px;
    }

    .countdown-display.ended {
      background: rgba(239, 68, 68, 0.15);
    }

    .countdown-display.upcoming {
      background: rgba(234, 179, 8, 0.15);
    }

    .countdown-label {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .countdown-value {
      font-size: 18px;
      font-weight: 700;
      color: #8B5CF6;
      font-variant-numeric: tabular-nums;
    }

    .countdown-display.ended .countdown-value {
      color: #ef4444;
      font-size: 14px;
    }

    .countdown-display.upcoming .countdown-value {
      color: #eab308;
      font-size: 14px;
    }

    /* Bidding Section */
    .bidding-section {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .bidding-section h3 {
      margin: 0;
      font-size: 18px;
    }

    .bid-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .balance-display {
        font-size: 14px;
        color: #ddd;
        background: rgba(0,0,0,0.2);
        padding: 4px 8px;
        border-radius: 4px;
    }

    .balance-amount {
        color: #4caf50;
        font-weight: bold;
    }

    .bid-input-group {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .currency {
      font-size: 18px;
      color: var(--text-secondary);
    }

    .bid-input {
      flex: 1;
      padding: 12px;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: white;
      font-size: 18px;
    }

    .btn-bid {
      padding: 12px 24px;
      background: linear-gradient(135deg, #6C5DD3 0%, #8B5CF6 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-bid:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(108, 93, 211, 0.4);
    }

    .btn-bid:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .success { color: #4caf50; margin-top: 10px; }
    .error { color: #f44336; margin-top: 10px; }

    .ended-notice, .upcoming-notice {
      border: 1px solid rgba(255,255,255,0.1);
    }

    .ended-message {
      color: #ef4444;
      margin: 0;
      font-size: 14px;
    }

    .upcoming-message {
      color: #eab308;
      margin: 0;
      font-size: 14px;
    }

    .btn-edit {
        width: 100%;
        padding: 12px;
        background: transparent;
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-edit:hover {
        background: rgba(255,255,255,0.05);
    }

    @media (max-width: 768px) {
        .detail-content {
            grid-template-columns: 1fr;
        }
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
  `]
})
export class AuctionDetailComponent implements OnInit, OnDestroy {
  item: AuctionItem | null = null;
  bidAmount: number = 0;
  message: string = '';
  isError: boolean = false;
  countdownText: string = '';
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auctionService: AuctionService,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadItem(id);
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadItem(id: number) {
    this.auctionService.getItem(id).subscribe(res => {
      if (res.success) {
        this.item = res.item;
        this.bidAmount = this.item.currentBid + 1;
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
    if (!this.item) return;
    const now = new Date().getTime();
    const end = new Date(this.item.endTime).getTime();
    const diff = end - now;

    if (diff <= 0) {
      this.countdownText = 'Ended';
      this.item.status = 'ended';
      if (this.timerInterval) clearInterval(this.timerInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      this.countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      this.countdownText = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      this.countdownText = `${minutes}m ${seconds}s`;
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  goBack() {
    this.router.navigate(['/auctions']);
  }

  isValidBid(): boolean {
    return this.item ? this.bidAmount > this.item.currentBid : false;
  }

  placeBid() {
    if (!this.item || !this.isValidBid()) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.message = 'You must be logged in to bid.';
      this.isError = true;
      return;
    }

    this.auctionService.placeBid(this.item.id, this.bidAmount, currentUser.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.item = res.item;
          this.message = 'Bid placed successfully!';
          this.isError = false;
          this.bidAmount = this.item.currentBid + 1;
          if (res.newBalance !== undefined) {
            this.authService.updateUserBalance(res.newBalance);
          }
        }
      },
      error: (err) => {
        this.message = err.error.message || 'Failed to place bid.';
        this.isError = true;
      }
    });
  }

  editItem() {
    if (this.item) {
      this.router.navigate(['/auctions', this.item.id, 'edit']);
    }
  }

  isAdmin() {
    return this.authService.getCurrentUser()?.role === 'admin';
  }
}
