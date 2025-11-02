import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { NotificationComponent } from './notification/notification.component';
import { ServiceRecordsComponent } from './service-records/service-records.component';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    VehiclesComponent,
    NotificationComponent,
    ServiceRecordsComponent,
    ToolbarModule,
    ButtonModule,
    ToastModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ui';
}
