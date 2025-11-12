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
  private userId: string;

  constructor() {
    // Initialize userId - unique per tab
    this.userId = sessionStorage.getItem('userId') || this.generateUUID();
    sessionStorage.setItem('userId', this.userId);

    // connect to websocket server
    this.socket = io('http://localhost:3002', {
      reconnection: true, // auto-reconnect - enable
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
      // Register user
      this.socket.emit('register', {
        userId: this.userId,
      });
      console.log(
        `Registered with userId: ${this.userId}`
      );
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

    // Handle reconnects to re-register with same identifiers
    this.socket.on('reconnect', () => {
      console.log('Reconnected, re-registering');
      this.socket.emit('register', {
        userId: this.userId,
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });
  }

  getNotifications() {
    return this.notifications$.asObservable();
  }

  getSessionInfo() {
    return {userId: this.userId };
  }
  public removeNotification(notification: AppNotification) {
    const current = this.notifications$.value;
    const filtered = current.filter(
      (n) => n.timestamp !== notification.timestamp
    );
    this.notifications$.next(filtered);
  }

  private generateUUID(): string {
    try {
      if (crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (error) {
      console.warn('crypto.randomUUID failed, using fallback:', error);
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
