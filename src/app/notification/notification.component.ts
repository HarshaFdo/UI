import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AppNotification,
  NotificationService,
} from '../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  notifications: AppNotification[] = [];

  constructor(private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.notificationService.getNotifications().subscribe((notifications) => {
      this.notifications = notifications;
    });
  }

  removeNotification(notification: AppNotification) {
    this.notificationService.removeNotification(notification)
  }

  downloadFile(fileName: string) {
  window.open(`http://localhost:3003/vehicle/download/${fileName}`, '_blank');
}
}
