
import type { CommunityPost, Comment } from "@/types/community";
import { generateId } from "@/lib/utils";
import { parseISO } from "date-fns";

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
          })).sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
        } catch (error) {
          console.error("Failed to parse community posts from localStorage", error);
          this.posts = this.getDefaultPosts(); // Fallback to default if parsing fails
        }
      } else {
        this.posts = this.getDefaultPosts();
      }
      this.savePosts(); // Save defaults if no posts were stored or if parsing failed and defaults were loaded
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
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        likes: 12,
        comments: [],
        shares: 2,
        likedBy: [],
        commentCount: 0,
        shareCount: 2,
        edited: false,
        deleted: false,
      },
      {
        id: generateId(),
        userId: "system_user_2",
        userName: "MindfulMover",
        userAvatar: `https://picsum.photos/seed/${generateId()}/40/40`,
        message:
          "Hit my 10,000 steps goal today and also managed a quick yoga flow. Physical activity really does wonders for my mood. What's your favorite way to stay active?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        likes: 25,
        comments: [],
        shares: 5,
        likedBy: [],
        commentCount: 0,
        shareCount: 5,
        edited: false,
        deleted: false,
      },
      {
        id: generateId(),
        userId: "system_user_3",
        userName: "GratitudeSeeker",
        userAvatar: `https://picsum.photos/seed/${generateId()}/40/40`,
        message: "Feeling grateful for small joys today: a warm cup of tea, sunshine, and connecting with a friend. What are you grateful for?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        likes: 30,
        comments: [],
        shares: 7,
        likedBy: [],
        commentCount: 0,
        shareCount: 7,
        edited: false,
        deleted: false,
      }
    ].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }

  private savePosts(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(COMMUNITY_POSTS_STORAGE_KEY, JSON.stringify(this.posts));
    }
  }

  public getPosts(): CommunityPost[] {
    return [...this.posts].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }

  public createPost(postData: Omit<CommunityPost, 'likes' | 'comments' | 'shares' | 'likedBy' | 'commentCount' | 'shareCount' | 'edited' | 'deleted'>): CommunityPost {
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
    };
    this.posts.unshift(newPost); // Add to the beginning
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
      this.posts[postIndex].message = updatedMessage;
      this.posts[postIndex].timestamp = new Date().toISOString(); // Update timestamp on edit
      this.posts[postIndex].edited = true;
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
    if (post) {
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

  public async addCommentToPost(postId: string, comment: Comment): Promise<CommunityPost | null> {
    const post = this.getPostById(postId);
    if (post) {
      post.comments.push(comment);
      post.commentCount = post.comments.length;
      this.savePosts();
      return post;
    }
    return null;
  }

  public async sharePost(id: string): Promise<CommunityPost | null> {
    const post = this.getPostById(id);
    if (post) {
        post.shares = (post.shares ?? 0) + 1;
        post.shareCount = post.shares; // Assuming shareCount is just total shares
        this.savePosts();
        console.log(`Simulated share for post: ${post.message}`);
        return post;
    }
    return null;
  }
}

export default CommunityService;
