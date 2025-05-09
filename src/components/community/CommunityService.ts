import type { CommunityPost, Comment } from "@/types/community";
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
            message:
              "Just finished a 20-minute meditation session. Feeling so calm and centered! Highly recommend it for anyone feeling stressed. ✨",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            likes: 0,
            comments: [],
          },
          {
            id: generateId(),
            userName: "MindfulMover",
            message:
              "Hit my 10,000 steps goal today and also managed a quick yoga flow. Physical activity really does wonders for my mood. What's your favorite way to stay active?",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
            likes: 0,
            comments: [],
          },
          {
            id: generateId(),
            userName: "GratitudeSeeker",
            message: "Feeling grateful for small joys today: a warm cup of tea, sunshine, and connecting with a friend. What are you grateful for?",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            likes: 0,
            comments: [],
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

  public getPosts(): CommunityPost[] | null {
    // Return a copy to prevent direct modification and ensure posts are sorted
    try {
      return [...this.posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error("Error getting community posts:", error);
      return null;
    }
  }

  public createPost(post: CommunityPost): CommunityPost | null {
    try {
      this.posts.unshift(post);
      this.savePosts();
      return post;
    } catch (error) {
      console.error("Error creating community post:", error);
      return null;
    }
  }

  public getPostById(id: string): CommunityPost | null {
    try {
      return this.posts.find((post) => post.id === id) ?? null;
    } catch (error) {
      console.error("Error getting community post by ID:", error);
      return null;
    }
  }

  public updatePost(id: string, updatedMessage: string): CommunityPost | null {
    try {
      const postIndex = this.posts.findIndex((post) => post.id === id);
      if (postIndex > -1) {
        this.posts[postIndex].message = updatedMessage;
        this.posts[postIndex].timestamp = new Date().toISOString();
        this.savePosts();
        return this.posts[postIndex];
      }
      return null;
    } catch (error) {
      console.error("Error updating community post:", error);
      return null;
    }
  }

  public deletePost(id: string): boolean | null {
    try {
      const initialLength = this.posts.length;
      this.posts = this.posts.filter((post) => post.id !== id);
      if (this.posts.length < initialLength) {
        this.savePosts();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting community post:", error);
      return null;
    }
  }

  public likePost(id: string): CommunityPost | null {
    try {
      const post = this.getPostById(id);
      if (post) {
        post.likes = (post.likes ?? 0) + 1;
        this.savePosts();
        return post;
      }
      return null;
    } catch (error) {
      console.error("Error liking community post:", error);
      return null;
    }
  }

  public addCommentToPost(id: string, comment: Comment): CommunityPost | null {
    try {
      const post = this.getPostById(id);
      if (post) {
        post.comments.push(comment);
        this.savePosts();
        return post;
      }
      return null;
    } catch (error) {
      console.error("Error adding comment to community post:", error);
      return null;
    }
  }

  public sharePost(id: string): boolean | null {
    try {
      // Simulate sharing by logging the post details, could integrate with social media APIs in a real app
      const post = this.getPostById(id);
      if (post) {
        console.log(`Shared post: ${post.message}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error sharing community post:", error);
      return null;
    }
  }
}

export default CommunityService;
