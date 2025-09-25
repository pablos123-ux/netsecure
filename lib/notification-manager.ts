// Notification Manager for real-time notifications
// This handles notification counts and real-time updates

import { useState, useEffect } from 'react';

interface NotificationData {
  id: string;
  type: 'activity' | 'alert' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  routerId?: string;
  alertId?: string;
}

class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Map<string, NotificationData> = new Map();
  private lastCheckTime: Date = new Date();
  private listeners: Set<(notifications: NotificationData[]) => void> = new Set();

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Add a notification listener
  addListener(callback: (notifications: NotificationData[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners(): void {
    const notifications = Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    this.listeners.forEach(callback => callback(notifications));
  }

  // Add a new notification
  addNotification(notification: Omit<NotificationData, 'id' | 'read'>): void {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationData = {
      ...notification,
      id,
      read: false
    };

    this.notifications.set(id, newNotification);
    this.notifyListeners();
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notifyListeners();
  }

  // Get unread count
  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.read).length;
  }

  // Get all notifications
  getAllNotifications(): NotificationData[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get recent notifications (last 10)
  getRecentNotifications(): NotificationData[] {
    return this.getAllNotifications().slice(0, 10);
  }

  // Clear old notifications (older than 24 hours)
  clearOldNotifications(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.timestamp < oneDayAgo) {
        this.notifications.delete(id);
      }
    }
    
    this.notifyListeners();
  }

  // Update last check time
  updateLastCheckTime(): void {
    this.lastCheckTime = new Date();
  }

  // Get last check time
  getLastCheckTime(): Date {
    return this.lastCheckTime;
  }
}

export const notificationManager = NotificationManager.getInstance();

// Client-side notification hook
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationManager.addListener((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(notificationManager.getUnreadCount());
    });

    // Initialize with current notifications
    setNotifications(notificationManager.getAllNotifications());
    setUnreadCount(notificationManager.getUnreadCount());

    return unsubscribe;
  }, []);

  const markAsRead = (notificationId: string) => {
    notificationManager.markAsRead(notificationId);
  };

  const markAllAsRead = () => {
    notificationManager.markAllAsRead();
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
