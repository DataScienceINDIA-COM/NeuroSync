
import type { CommunityPost, Comment, CommunityPostStatus, ReportDetail } from "@/types/community";
import { generateId } from "@/lib/utils";
import { parseISO } from "date-fns";
import { moderateCommunityPost } from "@/ai/flows/moderate-community-post-flow";

const COMMUNITY_POSTS_STORAGE_KEY = "communityPosts";

class CommunityService {
  private posts: CommunityPost[] = [];

  constructor() {
    this.loadPosts();
  }

  private loadPosts(): void {
    if (typeof window !== "undefined") {
      const storedPosts = localStorage.getItem(COMMUNITY_POSTS_STORAGE_KEY);
      if (storedPosts) {
        try {
          const parsedPosts = JSON.parse(storedPosts) as CommunityPost[];
          // Ensure all posts have the necessary fields
          this.posts = parsedPosts.map(post => ({
            ...post,
            likes: post.likes ?? 0,
            comments: post.comments ?? [],
            shares: post.shares ?? 0,
            likedBy: post.likedBy ?? [],
            commentCount: post.commentCount ?? post.comments?.length ?? 0,
            shareCount: post.shareCount ?? 0,
            edited: post.edited ?? false,
            deleted: post.deleted ?? false,
            status: post.status ?? 'approved', // Default to approved for older posts
            reports: post.reports ?? [], // Initialize reports array
          })).sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
        } catch (error) {
          console.error("Failed to parse community posts from localStorage", error);
          this.posts = this.getDefaultPosts(); 
        }
      } else {
        this.posts = this.getDefaultPosts();
      }
      this.savePosts(); 
    }
  }

  private getDefaultPosts(): CommunityPost[] {
    return [
      {
        id: generateId(),
        userId: "system_user_1",
        userName: "WellnessExplorer",
        userAvatar: `https://picsum.photos/seed/${generateId()}/40/40`,
        message:
          "Just finished a 20-minute meditation session. Feeling so calm and centered! Highly recommend it for anyone feeling stressed. ✨",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 
        likes: 12,
        comments: [],
        shares: 2,
        likedBy: [],
        commentCount: 0,
        shareCount: 2,
        edited: false,
        deleted: false,
        status: 'approved',
        reports: [],
      },
      {
        id: generateId(),
        userId: "system_user_2",
        userName: "MindfulMover",
        userAvatar: `https://picsum.photos/seed/${generateId()}/40/40`,
        message:
          "Hit my 10,000 steps goal today and also managed a quick yoga flow. Physical activity really does wonders for my mood. What's your favorite way to stay active?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), 
        likes: 25,
        comments: [],
        shares: 5,
        likedBy: [],
        commentCount: 0,
        shareCount: 5,
        edited: false,
        deleted: false,
        status: 'approved',
        reports: [],
      },
      {
        id: generateId(),
        userId: "system_user_3",
        userName: "GratitudeSeeker",
        userAvatar: `https://picsum.photos/seed/${generateId()}/40/40`,
        message: "Feeling grateful for small joys today: a warm cup of tea, sunshine, and connecting with a friend. What are you grateful for?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
        likes: 30,
        comments: [],
        shares: 7,
        likedBy: [],
        commentCount: 0,
        shareCount: 7,
        edited: false,
        deleted: false,
        status: 'approved',
        reports: [],
      }
    ].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }

  private savePosts(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(COMMUNITY_POSTS_STORAGE_KEY, JSON.stringify(this.posts));
    }
  }

  public getPosts(showAllForAdmin = false): CommunityPost[] {
    // Filter out rejected posts for regular users
    const visiblePosts = this.posts.filter(post => showAllForAdmin || post.status === 'approved' || post.status === 'pending_moderation');
    return [...visiblePosts].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }

  public async createPost(postData: Omit<CommunityPost, 'likes' | 'comments' | 'shares' | 'likedBy' | 'commentCount' | 'shareCount' | 'edited' | 'deleted' | 'status' | 'moderationReason' | 'reports'>): Promise<CommunityPost> {
    const moderationResult = await moderateCommunityPost({ postContent: postData.message });

    let postStatus: CommunityPostStatus = 'approved';
    let moderationReason: string | undefined = undefined;

    if (!moderationResult.isAppropriate) {
      postStatus = 'rejected';
      moderationReason = moderationResult.reason || "Content deemed inappropriate by AI moderator.";
      console.warn(`Post by ${postData.userName} rejected: ${moderationReason}`);
      throw new Error(`Post rejected: ${moderationReason}`);
    }
    
    const newPost: CommunityPost = {
      ...postData,
      likes: 0,
      comments: [],
      shares: 0,
      likedBy: [],
      commentCount: 0,
      shareCount: 0,
      edited: false,
      deleted: false,
      status: postStatus,
      moderationReason: moderationReason,
      reports: [],
    };

    this.posts.unshift(newPost); 
    this.posts.sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
    this.savePosts();
    return newPost;
  }

  public getPostById(id: string): CommunityPost | undefined {
    return this.posts.find((post) => post.id === id);
  }

  public async updatePost(id: string, updatedMessage: string, userId: string): Promise<CommunityPost | null> {
    const postIndex = this.posts.findIndex((post) => post.id === id);
    if (postIndex > -1 && this.posts[postIndex].userId === userId) {
      const moderationResult = await moderateCommunityPost({ postContent: updatedMessage });
      if (!moderationResult.isAppropriate) {
        this.posts[postIndex].status = 'rejected';
        this.posts[postIndex].moderationReason = moderationResult.reason || "Edited content deemed inappropriate.";
        this.savePosts();
        throw new Error(`Update rejected: ${this.posts[postIndex].moderationReason}`);
      }

      this.posts[postIndex].message = updatedMessage;
      this.posts[postIndex].timestamp = new Date().toISOString(); 
      this.posts[postIndex].edited = true;
      this.posts[postIndex].status = 'approved'; 
      this.posts[postIndex].moderationReason = undefined;
      this.savePosts();
      return this.posts[postIndex];
    }
    return null;
  }

  public async deletePost(id: string): Promise<boolean> {
    const initialLength = this.posts.length;
    this.posts = this.posts.filter((post) => post.id !== id);
    if (this.posts.length < initialLength) {
      this.savePosts();
      return true;
    }
    return false;
  }

  public async likePost(postId: string, userId: string): Promise<CommunityPost | null> {
    const post = this.getPostById(postId);
    if (post && post.status === 'approved') { 
      const alreadyLiked = post.likedBy.includes(userId);
      if (alreadyLiked) {
        post.likes = Math.max(0, post.likes - 1);
        post.likedBy = post.likedBy.filter(uid => uid !== userId);
      } else {
        post.likes += 1;
        post.likedBy.push(userId);
      }
      this.savePosts();
      return post;
    }
    return null;
  }

  public async addCommentToPost(postId: string, commentData: Omit<Comment, 'id'>): Promise<CommunityPost | null> {
    const post = this.getPostById(postId);
    if (post && post.status === 'approved') { 
      const moderationResult = await moderateCommunityPost({ postContent: commentData.comment });
      if (!moderationResult.isAppropriate) {
        console.warn(`Comment by ${commentData.userName} on post ${postId} rejected: ${moderationResult.reason}`);
        throw new Error(`Comment rejected: ${moderationResult.reason || "Comment deemed inappropriate."}`);
      }

      const newComment: Comment = {
        id: generateId(),
        ...commentData,
      };
      post.comments.push(newComment);
      post.commentCount = post.comments.length;
      this.savePosts();
      return post;
    }
    return null;
  }

  public async sharePost(id: string): Promise<CommunityPost | null> {
    const post = this.getPostById(id);
    if (post && post.status === 'approved') { 
        post.shares = (post.shares ?? 0) + 1;
        post.shareCount = post.shares; 
        this.savePosts();
        console.log(`Simulated share for post: ${post.message}`);
        return post;
    }
    return null;
  }

  public async reportPost(postId: string, reportDetails: Omit<ReportDetail, 'reportId' | 'timestamp'>): Promise<CommunityPost | null> {
    const post = this.getPostById(postId);
    if (post) {
      const newReport: ReportDetail = {
        ...reportDetails,
        reportId: generateId(),
        timestamp: new Date().toISOString(),
      };
      if (!post.reports) {
        post.reports = [];
      }
      post.reports.push(newReport);
      // Optional: Change post status to 'pending_moderation' if it receives a certain number of reports
      // if (post.reports.length >= 3 && post.status === 'approved') {
      //   post.status = 'pending_moderation';
      //   post.moderationReason = (post.moderationReason ? post.moderationReason + "; " : "") + "Post under review due to multiple reports.";
      // }
      this.savePosts();
      return post;
    }
    return null;
  }
}

export default CommunityService;
