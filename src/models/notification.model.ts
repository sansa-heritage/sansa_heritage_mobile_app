// components/models/notification.model.ts

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  body: string;
  data?: any;
  type: 'order' | 'promotion' | 'general' | 'system' | 'payment';
  read: boolean;
  readAt?: string;
  image?: string;
  action?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    screen?: string;
    params?: any;
    [key: string]: any;
  };
  type?: 'order' | 'promotion' | 'general' | 'system' | 'payment';
  image?: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}
