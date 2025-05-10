
export type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  timestamp: string; // ISO string date
};

export type CommunityPostStatus = 'pending_moderation' | 'approved' | 'rejected';

export type CommunityPost = {
  id: string;
  userId: string; 
  userName: string;
  userAvatar?: string; 
  message: string;
  timestamp: string; 
  likes: number;
  comments: Comment[];
  shares: number; // Added for general share count if needed
  // Optional detailed tracking:
  likedBy: string[]; // Array of user IDs who liked the post
  commentCount: number; // Total number of comments
  shareCount: number; // Total number of shares
  edited: boolean; // Flag if the post has been edited
  deleted: boolean; // Flag if the post has been (soft) deleted
  status: CommunityPostStatus; // Moderation status
  moderationReason?: string; // Reason if rejected
};

