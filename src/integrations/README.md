tsx
"use client"; // This hook is intended for client-side use in Next.js applications.

import { useMediaQuery } from "usehooks-ts"; // Import the useMediaQuery hook from the 'usehooks-ts' library.

export function useMobile() {
  return useMediaQuery("(max-width: 768px)"); // Return the result of the useMediaQuery hook, which is true if the screen width is 768px or less (indicating a mobile device), and false otherwise.
}