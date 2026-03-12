export interface UserMinimal {
  id: number;
  username: string;
  avatar?: string;
  name?: string;
}

export interface Notification {
  id: number;
  type: string; // 'follow_request', 'follow_accepted', 'new_message', 'post_from_follow', etc
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  reference_id?: number;
  reference_type?: string; // 'post', 'video', 'message', 'follow_request'
  data?: Record<string, any>;
  from_user?: UserMinimal;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
