export type ContentType = 'video' | 'podcast' | 'article';

// Renamed to avoid conflict with the main Hormone type
export type ContentTargetHormone = 'dopamine' | 'adrenaline' | 'cortisol' | 'serotonin';

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  url: string;
  hormones: ContentTargetHormone[]; // Changed from targetHormones
}
