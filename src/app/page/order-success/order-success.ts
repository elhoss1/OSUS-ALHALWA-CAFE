import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-success.html',
  styleUrl: './order-success.scss'
})
export class OrderSuccessComponent implements OnInit {
  reference = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const navigationState = this.router.getCurrentNavigation()?.extras.state as { orderConfirmed?: boolean } | undefined;
    const confirmed = navigationState?.orderConfirmed || history.state?.orderConfirmed;
    if (!confirmed) {
      void this.router.navigateByUrl('/');
      return;
    }
    this.reference = this.route.snapshot.paramMap.get('reference') || '';
  }
}
