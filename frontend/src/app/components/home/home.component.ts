import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="home-container">
      <div class="glass-panel welcome-card">
        <h1>Login Successful</h1>
        <p>Welcome, <strong>{{ authService.getCurrentUser()?.name }}</strong>!</p>
        <p class="role-badge">Role: {{ authService.getCurrentUser()?.role }}</p>
        
        <button class="btn-primary" (click)="logout()">Logout</button>
      </div>
    </div>
  `,
    styles: [`
    .home-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: white;
    }
    .welcome-card {
      padding: 40px;
      text-align: center;
      min-width: 300px;
    }
    h1 { margin-bottom: 20px; }
    .role-badge {
      display: inline-block;
      padding: 5px 10px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      margin: 10px 0 30px;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 1px;
    }
  `]
})
export class HomeComponent {
    constructor(public authService: AuthService, private router: Router) { }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
