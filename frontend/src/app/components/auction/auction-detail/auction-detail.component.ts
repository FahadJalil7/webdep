import { Component, OnInit } from '@angular/core';
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
        </div>

        <div class="info-section">
          <h1>{{ item.name }}</h1>
          <p class="description">{{ item.description }}</p>
          
          <div class="stats-grid">
            <div class="stat">
              <span class="label">Current Bid</span>
              <span class="value highlight">\${{ item.currentBid }}</span>
            </div>
            <div class="stat">
              <span class="label">Est. Value</span>
              <span class="value">\${{ item.value }}</span>
            </div>
            <div class="stat">
              <span class="label">Bids</span>
              <span class="value">{{ item.bidCount }}</span>
            </div>
          </div>

          <div class="bidding-section">
            <h3>Place a Bid</h3>
            <div class="bid-input-group">
                <span class="currency">$</span>
                <input type="number" [(ngModel)]="bidAmount" [min]="item.currentBid + 1" class="bid-input">
                <button class="btn-bid" (click)="placeBid()" [disabled]="!isValidBid()">
                    Place Bid
                </button>
            </div>
            <p *ngIf="message" [class.error]="isError" [class.success]="!isError">{{ message }}</p>
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
      height: 400px;
      background-size: cover;
      background-position: center;
      position: relative;
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
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
      padding-bottom: 30px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .value {
      font-size: 24px;
      font-weight: bold;
    }

    .highlight {
      color: #6C5DD3;
    }

    .bidding-section {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 20px;
    }

    .bidding-section h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
    }

    .bid-input-group {
      display: flex;
      gap: 10px;
      align-items: center;
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
      background: #6C5DD3;
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }

    .btn-bid:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .message {
        margin-top: 10px;
        font-size: 14px;
    }
    .success { color: #4caf50; }
    .error { color: #f44336; }

    .btn-edit {
        margin-top: 20px;
        width: 100%;
        padding: 12px;
        background: transparent;
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        border-radius: 8px;
        cursor: pointer;
    }

    @media (max-width: 768px) {
        .detail-content {
            grid-template-columns: 1fr;
        }
    }
  `]
})
export class AuctionDetailComponent implements OnInit {
    item: AuctionItem | null = null;
    bidAmount: number = 0;
    message: string = '';
    isError: boolean = false;

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

    loadItem(id: number) {
        this.auctionService.getItem(id).subscribe(res => {
            if (res.success) {
                this.item = res.item;
                this.bidAmount = this.item.currentBid + 1; // suggest next bid
            } else {
                this.router.navigate(['/auctions']);
            }
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
