export interface Notification {
  _id: string;
  staffId?: { _id: string; username: string };
  userId?: { _id: string; username: string };
  type: string;
  message: string;
  transferId?: { _id: string };
  isRead: boolean;
  createdAt: Date;
}

export interface OrderNotification {
  _id: string;
  staffId?: { _id: string; username: string };
  userId?: { _id: string; username: string };
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
