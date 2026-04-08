export type NotificationStatus = 'read' | 'unread';

export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'inquiry' | 'appointment' | 'review' | 'favorite' | 'system' | 'general';
  status: NotificationStatus;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  createdAt: string;
  updatedAt: string;
}
