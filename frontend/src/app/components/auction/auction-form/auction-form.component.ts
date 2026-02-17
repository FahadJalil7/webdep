import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, AuctionItem } from '../../../services/auction.service';

@Component({
  selector: 'app-auction-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="form-container">
      <div class="header">
        <button class="btn-back" (click)="goBack()">Cancel</button>
        <h2>{{ isEditMode ? 'Edit Item' : 'New Auction Item' }}</h2>
      </div>

      <div class="form-content glass-panel">
        <form (ngSubmit)="onSubmit()" #auctionForm="ngForm">
          
          <div class="form-group">
            <label for="name">Item Name</label>
            <input type="text" id="name" name="name" [(ngModel)]="item.name" required class="input-field" placeholder="e.g. Vintage Watch">
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" [(ngModel)]="item.description" required class="input-field" rows="4" placeholder="Describe the item..."></textarea>
          </div>

          <div class="row">
            <div class="form-group half">
                <label for="value">Estimated Value ($)</label>
                <input type="number" id="value" name="value" [(ngModel)]="item.value" required class="input-field" min="0">
            </div>

            <div class="form-group half">
                <label for="startingBid">Starting Bid ($)</label>
                <input type="number" id="startingBid" name="startingBid" [(ngModel)]="item.currentBid" [disabled]="isEditMode" required class="input-field" min="0">
                <small *ngIf="isEditMode" class="hint">Cannot change starting bid after creation</small>
            </div>
          </div>

          <div class="form-group">
            <label for="type">Item Type</label>
            <select id="type" name="type" [(ngModel)]="item.type" required class="input-field">
                <option value="Physical">Physical Item</option>
                <option value="Gift Card">Gift Card</option>
            </select>
          </div>

          <div class="row">
            <div class="form-group half">
                <label for="startTime">Start Time</label>
                <input type="datetime-local" id="startTime" name="startTime" [(ngModel)]="item.startTime" required class="input-field">
            </div>
            <div class="form-group half">
                <label for="endTime">End Time</label>
                <input type="datetime-local" id="endTime" name="endTime" [(ngModel)]="item.endTime" required class="input-field">
            </div>
          </div>

          <div class="form-group">
            <label for="imageUrl">Image URL</label>
            <input type="text" id="imageUrl" name="imageUrl" [(ngModel)]="item.imageUrl" class="input-field" placeholder="https://example.com/image.jpg">
          </div>

          <div class="preview-section" *ngIf="item.imageUrl">
            <label>Image Preview</label>
            <div class="image-preview" [style.backgroundImage]="'url(' + item.imageUrl + ')'"></div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-submit" [disabled]="!auctionForm.form.valid">
                {{ isEditMode ? 'Save Changes' : 'Create Auction' }}
            </button>
          </div>

          <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      color: white;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header h2 {
      margin: 0;
    }

    .btn-back {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
    }

    .glass-panel {
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .row {
        display: flex;
        gap: 20px;
    }

    .half {
        flex: 1;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .input-field {
      width: 100%;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 16px;
      box-sizing: border-box; 
    }

    .input-field:focus {
        outline: none;
        border-color: var(--theme-blue-40);
    }

    textarea.input-field {
        resize: vertical;
    }

    .hint {
        font-size: 12px;
        color: var(--text-secondary);
        display: block;
        margin-top: 5px;
    }

    .image-preview {
        width: 100%;
        height: 200px;
        background-size: cover;
        background-position: center;
        border-radius: 8px;
        border: 1px dashed rgba(255,255,255,0.2);
    }

    .form-actions {
        margin-top: 30px;
    }

    .btn-submit {
        width: 100%;
        padding: 14px;
        background: var(--accent-gradient);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
    }

    .btn-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .error-message {
        color: #f44336;
        text-align: center;
        margin-top: 15px;
    }
  `]
})
export class AuctionFormComponent implements OnInit {
  item: any = {
    name: '',
    description: '',
    value: null,
    currentBid: 0,
    type: 'Physical',
    imageUrl: '',
    startTime: '',
    endTime: ''
  };
  isEditMode: boolean = false;
  errorMessage: string = '';

  constructor(
    private auctionService: AuctionService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.auctionService.getItem(id).subscribe(res => {
        if (res.success) {
          this.item = { ...res.item };
        }
      });
    }
  }

  onSubmit() {
    if (this.isEditMode) {
      this.auctionService.updateItem(this.item.id, this.item).subscribe({
        next: () => this.router.navigate(['/auctions', this.item.id]),
        error: (err) => this.errorMessage = err.message || 'Update failed'
      });
    } else {
      // Map startingBid to currentBid in backend
      const newItem = {
        ...this.item,
        startingBid: this.item.currentBid,
        startTime: new Date(this.item.startTime).toISOString(),
        endTime: new Date(this.item.endTime).toISOString()
      };
      this.auctionService.createItem(newItem).subscribe({
        next: () => this.router.navigate(['/auctions']),
        error: (err) => this.errorMessage = err.message || 'Creation failed'
      });
    }
  }

  goBack() {
    if (this.isEditMode) {
      this.router.navigate(['/auctions', this.item.id]);
    } else {
      this.router.navigate(['/auctions']);
    }
  }
}
