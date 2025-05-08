
import React from 'react';

// It's generally better to use a dedicated icon library like lucide-react
// if complex icons are needed, or ensure these SVGs are optimized.
// For this exercise, keeping the provided SVGs.

interface IconProps {
  name: 'dopamine' | 'adrenaline' | 'cortisol' | 'serotonin' | 'task' | 'reward' | 'community' | 'content' | 'avatar';
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className }) => {
  const iconStyle = {
    width: size,
    height: size,
  };

  // Placeholder SVGs - replace with actual meaningful icons
  switch (name) {
    case 'dopamine': // Example: Brain or Up Arrow
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
          <path d="M12 2a5 5 0 0 0-5 5c0 2.34.85 4.48 2.24 6.09.92 1.07 2.76 3.31 2.76 3.31s1.84-2.24 2.76-3.31C16.15 11.48 17 9.34 17 7a5 5 0 0 0-5-5z"/><path d="M12 7a2 2 0 1 0 0 4 2 2 0 1 0 0-4z"/>
        </svg>
      );
    case 'adrenaline': // Example: Lightning Bolt
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      );
    case 'cortisol': // Example: Downward graph or stress icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
          <path d="M18 10H6L3 18h18l-3-8Z"/><path d="M12 6V2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/>
        </svg>
      );
    case 'serotonin': // Example: Smile or sun
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
         <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/>
        </svg>
      );
      case 'task': // Checkmark list
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
            <path d="M9 18l-3.5-3.5a2.49 2.49 0 0 1 0-3.5L9 7.5"/><path d="M12.5 3H20a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2.5"/>
          </svg>
        );
        case 'reward': // Gift icon
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
            <path d="M20 12v10H4V12"/><path d="M2 7h20v5H2V7Z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"/>
          </svg>
        );
        case 'community': // Users icon
          return(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          );
          case 'content': // Book or play icon
            return (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
            );
            case 'avatar': // User icon
              return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
                  <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
              );
    default: // Default fallback icon (e.g., a simple circle)
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} className={className}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

export default Icon;
