import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Order {
  id: number;
  tableId: number;
  productId: number;
  product?: Product;
  orderedAt: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Waitress Order System</h1>

      <div class="section">
        <h2>Select Table</h2>
        <input [(ngModel)]="tableId" placeholder="Table number" type="number" />
        <button (click)="loadOrders()">Load Table Orders</button>
      </div>

      <div class="section">
        <h2>Products</h2>
        <div class="products">
          <div class="product" *ngFor="let p of products$ | async" (click)="addToCart(p)">
            <strong>{{p.name}}</strong> - ${{p.price.toFixed(2)}}
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Current Orders for Table {{tableId}}</h2>
        <div *ngIf="orders$ | async as orders">
          <div class="order" *ngFor="let o of orders">
            {{o.product?.name}} - ${{o.product?.price.toFixed(2)}}
          </div>
          <hr>
          <strong>Total: ${{total$ | async}}</strong>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { font-family: sans-serif; padding: 1rem; }
    .products { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
    .product { padding: 0.5rem; border: 1px solid #ccc; cursor: pointer; border-radius: 4px; }
    .product:hover { background: #f0f0f0; }
    .order { margin: 0.25rem 0; }
    .section { margin-bottom: 2rem; }
    input { width: 4rem; padding: 0.25rem; }
    button { margin-left: 0.5rem; padding: 0.25rem 0.5rem; }
  `]
})
export class AppComponent {
  products$: Observable<Product[]>;
  orders$: Observable<Order[]>;
  total$: Observable<number>;
  tableId: number = 1;

  private api = '/api';

  constructor(private http: HttpClient) {
    this.products$ = this.http.get<Product[]>(`${this.api}/products`);
    this.orders$ = new Observable();
    this.total$ = of(0);
  }

  loadOrders() {
    this.orders$ = this.http.get<Order[]>(`${this.api}/tables/${this.tableId}`);
    this.total$ = this.http.get<{Total: number}>(`${this.api}/summary/${this.tableId}`).pipe(map(r => r.Total));
  }

  addToCart(product: Product) {
    const order: any = { tableId: this.tableId, productId: product.id };
    this.http.post(`${this.api}/orders`, order).subscribe(() => {
      this.loadOrders();
    });
  }
}
