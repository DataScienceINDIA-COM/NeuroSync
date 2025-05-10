
export type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  timestamp: string; // ISO string date
};

export type CommunityPostStatus = 'pending_moderation' | 'approved' | 'rejected';

export type ReportReason = "spam" | "harassment" | "hate_speech" | "misinformation" | "nudity_or_sexual_content" | "self_harm" | "impersonation" | "other";

export const reportReasons: { value: ReportReason, label: string }[] = [
  { value: "spam", label: "Spam or Misleading" },
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "hate_speech", label: "Hate Speech or Symbols" },
  { value: "misinformation", label: "False Information" },
  { value: "nudity_or_sexual_content", label: "Nudity or Sexual Content" },
  { value: "self_harm", label: "Self-Harm or Suicide" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other Issue" },
];


export type ReportDetail = {
  reportId: string;
  reporterUserId: string;
  reason: ReportReason;
  comment?: string;
  timestamp: string; // ISO string date
};

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
  reports?: ReportDetail[]; // Array to store report details
};
