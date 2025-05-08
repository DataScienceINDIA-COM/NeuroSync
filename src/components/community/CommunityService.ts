import type { CommunityPost } from "@/types/community";
import { generateId } from "@/lib/utils";

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
          this.posts = JSON.parse(storedPosts);
        } catch (error) {
          console.error("Failed to parse community posts from localStorage", error);
          this.posts = [];
        }
      } else {
        // Initialize with some default posts if none are stored
        this.posts = [
          {
            id: generateId(),
            userName: "WellnessExplorer",
            message: "Just finished a 20-minute meditation session. Feeling so calm and centered! Highly recommend it for anyone feeling stressed. ✨",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          },
          {
            id: generateId(),
            userName: "MindfulMover",
            message: "Hit my 10,000 steps goal today and also managed a quick yoga flow. Physical activity really does wonders for my mood. What's your favorite way to stay active?",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          },
          {
            id: generateId(),
            userName: "GratitudeSeeker",
            message: "Feeling grateful for small joys today: a warm cup of tea, sunshine, and connecting with a friend. What are you grateful for?",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          }
        ];
        this.savePosts();
      }
    }
  }

  private savePosts(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(COMMUNITY_POSTS_STORAGE_KEY, JSON.stringify(this.posts));
    }
  }

  public getPosts(): CommunityPost[] {
    // Return a copy to prevent direct modification and ensure posts are sorted
    return [...this.posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public createPost(post: CommunityPost): CommunityPost {
    this.posts.unshift(post); // Add to the beginning for chronological display (newest first)
    this.savePosts();
    return post;
  }

  public getPostById(id: string): CommunityPost | undefined {
    return this.posts.find(post => post.id === id);
  }

  public updatePost(id: string, updatedMessage: string): CommunityPost | null {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex > -1) {
      this.posts[postIndex].message = updatedMessage;
      this.posts[postIndex].timestamp = new Date().toISOString(); // Update timestamp on edit
      this.savePosts();
      return this.posts[postIndex];
    }
    return null;
  }

  public deletePost(id: string): boolean {
    const initialLength = this.posts.length;
    this.posts = this.posts.filter(post => post.id !== id);
    if (this.posts.length < initialLength) {
      this.savePosts();
      return true;
    }
    return false;
  }
}

export default CommunityService;
