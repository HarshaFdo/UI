import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';

export interface AppNotification {
  message: string;
  fileName?: string;
  filePath?: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private socket: Socket;
  private notifications$ = new BehaviorSubject<AppNotification[]>([]);

  constructor() {
    this.socket = io('http://localhost:3002');

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
      // Register user
      this.socket.emit('register', { userId: 'user123' });
    });

    this.socket.on('notification', (data: any) => {
      console.log('Notification received:', data);
      const notification: AppNotification = {
        ...data,
        timestamp: Date.now(),
      };

      const current = this.notifications$.value;
      this.notifications$.next([...current, notification]);

      // Auto remove after 10 seconds
      setTimeout(() => {
        this.removeNotification(notification);
      }, 10000);
    });
  }

  getNotifications() {
    return this.notifications$.asObservable();
  }

  private removeNotification(notification: AppNotification) {
    const current = this.notifications$.value;
    const filtered = current.filter(
      (n) => n.timestamp !== notification.timestamp
    );
    this.notifications$.next(filtered);
  }
}
