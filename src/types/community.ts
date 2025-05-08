
export type CommunityPost = {
  id: string;
  userName: string;
  userAvatar?: string; // Optional: URL to user's avatar image
  message: string;
  timestamp: string; // ISO string date
};
