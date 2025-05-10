
import React from 'react';
import type { Avatar as AvatarType } from '@/types/avatar';
import Image from 'next/image';
import { UserCircle2 } from 'lucide-react';

interface AvatarProps {
  avatar: AvatarType | null;
  size?: number;
}

const AvatarDisplay: React.FC<AvatarProps> = ({ avatar, size = 80 }) => {
  const placeholderImageUrl = `https://picsum.photos/${size}/${size}`; // Default placeholder

  return (
    <div 
      className="relative rounded-full overflow-hidden shadow-lg border-2 border-primary"
      style={{ width: size, height: size }}
      data-ai-hint="profile picture"
      role="img"
      aria-label={avatar?.name || "User Avatar"}
    >
      {avatar?.imageUrl && avatar.imageUrl !== "/icon.ico" ? (
        <Image
          src={avatar.imageUrl}
          alt={avatar.name || "User Avatar"} // Alt text is crucial for accessibility
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.onerror = null; // prevent looping
            target.src = placeholderImageUrl;
            target.alt = "Placeholder image"; // Update alt text for placeholder
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted" aria-label="Default user avatar icon">
          <UserCircle2 className="text-muted-foreground" style={{ width: size * 0.6, height: size * 0.6 }} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

export default AvatarDisplay;
