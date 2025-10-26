import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AppNotification,
  NotificationService,
} from '../services/notification.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
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
    this.notifications = this.notifications.filter((n) => n !== notification);
  }
}
