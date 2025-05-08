
export type Avatar = {
  id: string;
  name: string;
  description: string;
  imageUrl: string; // This will now be a Firebase Storage download URL
  imagePath?: string; // Optional: Firebase Storage path, e.g., "avatars/userId/filename.png"
};
