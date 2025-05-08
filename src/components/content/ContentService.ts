import type { Content, ContentType, ContentTargetHormone } from '@/types/content';
import { generateId } from '@/lib/utils';

const CONTENT_STORAGE_KEY = 'moodBalanceContentList';

class ContentService {
  private contentItems: Content[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadContent();
    }
  }

  private loadContent(): void {
    // This check is redundant if constructor already checks for window, but good for safety in methods
    if (typeof window === 'undefined') {
        this.contentItems = this.getDefaultContent(); // Provide default content for SSR or if window is not available
        return;
    }

    const storedContent = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (storedContent) {
      try {
        const parsedContent = JSON.parse(storedContent);
        if (Array.isArray(parsedContent) && parsedContent.length > 0) {
            this.contentItems = parsedContent;
        } else {
            this.contentItems = this.getDefaultContent();
            this.saveContent();
        }
      } catch (error) {
        console.error('Failed to parse content from localStorage', error);
        this.contentItems = this.getDefaultContent(); // Fallback to default
        this.saveContent(); // Save defaults if parsing fails
      }
    } else {
      // Initialize with default content if none are stored
      this.contentItems = this.getDefaultContent();
      this.saveContent();
    }
  }

  private getDefaultContent(): Content[] {
    return [
      {
        id: generateId(),
        type: 'article' as ContentType,
        title: 'Understanding Dopamine: The Motivation Molecule',
        description: 'Learn about dopamine and how it affects your motivation and pleasure seeking behaviors.',
        url: 'https://www.psychologytoday.com/us/basics/dopamine', // Example placeholder URL
        hormones: ['dopamine'] as ContentTargetHormone[],
      },
      {
        id: generateId(),
        type: 'video' as ContentType,
        title: '10-Minute Guided Meditation for Stress Relief',
        description: 'A short guided meditation session to help you relax, reduce cortisol, and boost serotonin.',
        url: 'https://www.youtube.com/watch?v=O-6f5wQXSu8', // Example placeholder URL
        hormones: ['cortisol', 'serotonin'] as ContentTargetHormone[],
      },
      {
        id: generateId(),
        type: 'podcast' as ContentType,
        title: 'The Science of Energy & Focus with Dr. Andrew Huberman',
        description: 'Explore lifestyle tips and scientific insights on how to boost your energy and focus.',
        url: 'https://hubermanlab.com/the-science-of-setting-and-achieving-goals/', // Example placeholder URL
        hormones: ['adrenaline', 'dopamine'] as ContentTargetHormone[],
      },
      {
        id: generateId(),
        type: 'article' as ContentType,
        title: 'Serotonin: Functions, Normal Range, Side Effects, and More',
        description: 'Explore how serotonin impacts your mood, sleep, digestion, and overall well-being.',
        url: 'https://www.healthline.com/health/mental-health/serotonin', // Example placeholder URL
        hormones: ['serotonin'] as ContentTargetHormone[],
      },
       {
        id: generateId(),
        type: 'video' as ContentType,
        title: 'How to Manage Adrenaline for Better Performance',
        description: 'Understand adrenaline spikes and learn techniques to manage them effectively in high-pressure situations.',
        url: 'https://www.youtube.com/watch?v=exampleadrenaline', // Example placeholder URL
        hormones: ['adrenaline'] as ContentTargetHormone[],
      }
    ];
  }

  private saveContent(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(this.contentItems));
    }
  }

  public getContent(): Content[] {
    // Ensure content is loaded if accessed before constructor finishes async ops (though current constructor is sync)
    if (this.contentItems.length === 0 && typeof window !== 'undefined') {
        this.loadContent();
    }
    return [...this.contentItems]; // Return a copy
  }

  public addContent(contentData: Omit<Content, 'id'>): Content {
    const newContent: Content = {
      id: generateId(),
      ...contentData,
    };
    this.contentItems.push(newContent);
    this.saveContent();
    return newContent;
  }

  // Placeholder for future methods like updateContent, deleteContent
  // public updateContent(id: string, updatedData: Partial<Omit<Content, 'id'>>): Content | null { ... }
  // public deleteContent(id: string): boolean { ... }
}

export default ContentService;
