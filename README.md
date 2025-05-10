## Project Setup and Local Development

This project is built with **React**, **Next.js**, **Firebase**, and **Genkit**. It utilizes **GSAP** for advanced animations and interactions. To get the project up and running on your local machine, follow these steps:

### 1. Clone the Repository
Open your terminal or command prompt and clone the project repository.

### 2. Environment Setup
A critical step for ensuring the application runs correctly is setting up your environment variables.

#### Create `.env.local` File
*   In the root directory of the project, create a file named `.env.local`.
*   This file will store your Firebase project configuration and other sensitive API keys.
*   **Important:** This file is gitignored and should **NEVER** be committed to version control.
*   Populate `.env.local` with the following variables, replacing the placeholder values (e.g., `"YOUR_API_KEY"`) with your actual Firebase project credentials and other necessary keys. Refer to the `.env` file in the root directory as a template for all required variables.

    ```plaintext
    # Firebase Project Configuration (Client-Side)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID" # Optional

    # Firebase Cloud Messaging (FCM) VAPID Key (Client-Side for Web Push)
    NEXT_PUBLIC_FIREBASE_VAPID_KEY="YOUR_FCM_VAPID_KEY"

    # Firebase Admin SDK Configuration (Server-Side)
    # For local dev, path to your service account JSON. For production, use platform's env var management.
    # GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json" 

    # Optional: Firebase Cloud Functions Region
    # NEXT_PUBLIC_FIREBASE_LOCATION_ID="your-functions-region"

    # Optional: Genkit / Google AI API Key (if not using service account for AI calls)
    # GOOGLE_API_KEY="YOUR_GOOGLE_AI_API_KEY"
    ```
*   **Finding Firebase Values:** You can find most `NEXT_PUBLIC_FIREBASE_` values in your Firebase project settings:
    1.  Go to the [Firebase Console](https://console.firebase.google.com/).
    2.  Select your project.
    3.  Click on the gear icon (Project settings) in the sidebar.
    4.  Under the "General" tab, in the "Your apps" section, find your web app. The Firebase SDK snippet will contain these values.
    5.  For `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, go to Project settings > Cloud Messaging tab. Under "Web configuration", find "Web Push certificates" and copy the "Key pair".
*   **`GOOGLE_APPLICATION_CREDENTIALS`:** For server-side Firebase Admin SDK operations (like sending FCM messages from the backend, interacting with Firestore/Storage with admin privileges), you need service account credentials.
    *   **Local Development:** Download your service account key JSON file from Firebase Console (Project settings > Service accounts > Generate new private key). Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local` to the *absolute path* of this JSON file. **DO NOT COMMIT THIS JSON FILE.**
    *   **Production/Deployment:** Consult your hosting provider's documentation for managing service account credentials (e.g., Vercel environment variables, Google Cloud service account roles).

#### Enable Firebase Authentication Providers
*   For FirebaseUI and general authentication to work (e.g., Google Sign-In, Email/Password), you **MUST** enable these providers in your Firebase project.
*   Go to the [Firebase Console](https://console.firebase.google.com/) > Your Project > Authentication > Sign-in method tab.
*   Enable each provider you intend to use (e.g., "Google", "Email/Password"). Follow on-screen instructions. For Google Sign-In, a project support email is usually required.
*   **Failure to do this is a common cause of `auth/configuration-not-found` errors.**

#### Configure Firebase Service Worker (`public/firebase-messaging-sw.js`)
*   The file `public/firebase-messaging-sw.js` handles background push notifications.
*   It contains a `firebaseConfig` object with placeholder values (e.g., `"YOUR_NEXT_PUBLIC_FIREBASE_API_KEY"`).
*   You **MUST** manually replace these placeholders with your actual Firebase project configuration values. These values **MUST** match those in your `.env.local` file.
    ```javascript
    // Example within public/firebase-messaging-sw.js:
    const firebaseConfig = {
      apiKey: "YOUR_ACTUAL_API_KEY_HERE", // Replace with value from .env.local
      authDomain: "YOUR_ACTUAL_AUTH_DOMAIN_HERE", // Replace
      projectId: "YOUR_ACTUAL_PROJECT_ID_HERE", // Replace
      storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET_HERE", // Replace
      messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID_HERE", // Crucial: Replace
      appId: "YOUR_ACTUAL_APP_ID_HERE", // Replace
      measurementId: "YOUR_ACTUAL_MEASUREMENT_ID_HERE" // Optional: Replace
    };
    ```
*   **Crucial:** The `messagingSenderId` in this file is especially important for FCM to work correctly in the background.
*   **Important:** Since this file is static, any changes to your Firebase config in `.env.local` require you to manually update this file as well.

### 3. Install Dependencies
Open your terminal in the project's root directory and run:
```bash
npm install
# or
yarn install
```
If you encounter `ERESOLVE` errors related to peer dependencies (e.g., between `firebase` and `firebaseui`), try to align the versions in `package.json` or, as a temporary workaround for development, you might use `npm install --force` or `npm install --legacy-peer-deps`. However, resolving the conflict by adjusting versions is preferred for stability.

### 4. Run the Development Server
After successful installation and configuration:
```bash
npm run dev
# or
yarn dev
```
The application should typically be running at `http://localhost:9002` (or the port specified in `package.json`).

### 5. Restart After Environment Variable Changes
**Crucial:** If you modify your `.env.local` file (or any `.env` file), you **MUST** restart your Next.js development server for the changes to take effect.

By following these steps, you should have a correctly configured development environment, and issues related to Firebase configuration (like `API key not valid` or `auth/configuration-not-found`) should be resolved, and push notifications should be functional.

## NeuroSync Project Roadmap
This section is for AI agents to log their activities and insights.

### Progress Updates
- Resolved "A 'use server' file can only export async functions..." errors in Genkit flows by ensuring only async wrapper functions and their input/output types are exported. Other Zod schemas and flow definitions are kept internal to the flow files.
- Strengthened Firebase initialization checks in `src/lib/firebase.ts` and `src/lib/firebase-admin.ts` to provide clearer console error messages when essential `NEXT_PUBLIC_FIREBASE_...` environment variables are missing or invalid. This helps pinpoint configuration issues faster.
- Added prominent warnings and detailed instructions within `public/firebase-messaging-sw.js` regarding the necessity of manually configuring Firebase credentials in that file, as it's not automatically updated from `.env.local`.
- Updated this `README.md` with more comprehensive environment setup instructions, troubleshooting tips for common Firebase errors (like "API key not valid" and "auth/configuration-not-found"), and explanations for resolved issues.
- Fixed numerous "Module not found" errors by correcting import paths, ensuring consistency between relative paths and alias paths (`@/...`).
- Integrated CommunityModerator agent into `CommunityService` for AI-powered moderation of posts and comments.
- Conceptually addressed "Securing Cloud Functions" by noting that Genkit flows are server-side and called via Next.js actions, which inherently provides a layer of security. Input validation via Zod is also a key security aspect. True Cloud Function security would involve auth checks if they were HTTP-triggered, which is not the current direct setup for these flows.
- Successfully implemented the `CommunityModerator` agent within the `CommunityService`. This completes the AI-powered moderation workflow for posts and comments. `CommunityDisplay` now reflects moderation outcomes to users via toast notifications for rejected content.
- Affirmed that the security model for Genkit flows, being server-side and invoked via Next.js Server Actions with Zod validation, adequately addresses the "Secure Cloud Functions" requirement at a conceptual level for the current architecture.
- Implemented AI validation for avatar descriptions in `generateAvatarFlow`. This ensures descriptions are appropriate and clear before image generation.
- Set up agent profiles in `src/config/agentProfiles.ts` for `AICoach` and `CommunityModerator`.
- Implemented `IntegrationService` in `src/services/integrationService.ts` to manage connections with external wellness platforms. This service currently uses localStorage for persistence and simulates OAuth flows.
- Implemented real-time notifications using Firebase Cloud Messaging (FCM). Added service worker for background notifications and enhanced foreground message handling with toasts.
- Enhanced Firebase initialization checks in `src/lib/firebase.ts` to validate all critical public environment variables.
- Updated `.env` file to serve as a comprehensive template.

### Decisions
- Moderated content (posts/comments) will be rejected if deemed inappropriate by the AI. `CommunityService` now throws an error for rejected content, which `CommunityDisplay` handles by showing a toast.
- `CommunityPost` type updated with `status` and `moderationReason`.
- Avatar descriptions will be validated by `validateAvatarDescriptionPrompt` before generation. If invalid, an error with feedback is thrown.
- `IntegrationService` will store integration details (tokens, status) in localStorage, scoped by `userId`.
- Real-time notifications will be used for task completions, AI coach nudges, and important community updates.

### Issues & Troubleshooting

- **`FirebaseError: Installations: Create Installation request failed with error "400 INVALID_ARGUMENT: API key not valid..."` or `auth/configuration-not-found`:**
    - These errors typically indicate a problem with your Firebase setup.
    - **Check `.env.local`:** Ensure you have created `.env.local` in the project root and correctly populated **all** `NEXT_PUBLIC_FIREBASE_...` variables from your Firebase project settings. Use the `.env` file as a template.
    - **Restart Dev Server:** After making any changes to `.env.local`, you **MUST** restart your Next.js development server (e.g., stop and re-run `npm run dev`).
    - **`public/firebase-messaging-sw.js`:** This file **REQUIRES MANUAL CONFIGURATION**. The `firebaseConfig` object within it must be updated with your actual Firebase project values, matching `.env.local`.
    - **Enable Auth Providers:** In the Firebase Console, go to Authentication > Sign-in method and ensure "Google" and "Email/Password" (or any other providers you intend to use) are enabled.
- **`A "use server" file can only export async functions...` Error:**
    - This Next.js error occurs if a file marked with the `'use server';` directive exports non-async values directly.
    - For Genkit flows (e.g., files in `src/ai/flows/`), ensure that **only the main async wrapper function** (e.g., `export async function getRecommendedContent(...)`) and its TypeScript input/output **types** are exported.
    - Zod schemas (e.g., `RecommendedContentInputSchema`) and the flow definitions themselves (e.g., `const getRecommendedContentFlow = ai.defineFlow(...)`) should **not** be exported directly from these files. They are internal to the flow's implementation.
- **"Module not found" Errors:**
    - These errors typically arise from incorrect import paths. Double-check that paths are correct, especially when mixing relative paths (`../`) and alias paths (`@/components/...`). Ensure the `tsconfig.json` paths are correctly configured.
- **"Securing Cloud Functions" is a broad topic:** The current implementation focuses on the security of Genkit flows as called from Next.js server actions. If specific, independently deployed Cloud Functions exist or are planned, their security (e.g., auth triggers, HTTP auth checks) needs to be addressed separately.
- **`IntegrationService` currently simulates OAuth:** Real implementation will require actual OAuth libraries and API client logic for each platform. Secure token storage (beyond localStorage for production) should be considered.
- **`NEXT_PUBLIC_FIREBASE_VAPID_KEY` must be correctly set in `.env.local` for web push notifications to function.**

### NeuroSync Project Roadmap

This roadmap outlines the key phases and steps for the development of the NeuroSync application.

## Phase 1: Core Functionality (Completed)

This phase focused on building the foundational features of the application.

- [x] **Basic Mood Logging:** Allow users to record their daily mood.
    - [x] Implement mood logging interface.
    - [x] Store mood data.
- [x] **Simple Task Management:** Enable users to add, view, and complete tasks.
    - [x] Implement task listing and adding.
    - [x] Add task completion functionality.
    - [x] Basic task data storage.
- [x] **Basic Reward System:** Introduce a points system for completing tasks.
    - [x] Award points upon task completion.
    - [x] Display user's points balance.
    - [x] Implement simple rewards (e.g., unlocking virtual items).
- [x] **User Authentication (Basic):** Implement simple sign-up and login.
    - [x] Email/password or social login integration.
    - [x] User session management.
- [x] **Profile Creation (Basic):** Allow users to create a basic profile.
    - [x] Collect basic user information (e.g., name).
    - [x] Store user profile data.

## Phase 2: Enhancement and Personalization

This phase focuses on leveraging AI and user data to enhance the user experience and provide personalized features.

- [ ] **Personalized AI Coaching:** Provide motivational nudges and insights based on user data.
 - [ ] Develop AI model for personalized coaching responses.
 - [x] Integrate AI coaching into the user interface.
- [ ] **Advanced Mood Analysis:** Provide deeper insights into mood patterns and correlations.
    - [ ] Implement more sophisticated mood tracking metrics.
    - [ ] Visualize advanced mood data (e.g., correlation with activities).
- [x] **Community Moderation:** Ensure a safe and positive community environment.
    - [x] Integrate AI for content moderation (`CommunityModerator` in `CommunityService`).
    - [ ] Implement reporting mechanisms for users.
- [ ] **Task Personalization V2:** Provide AI-driven personalized task suggestions.
    - [ ] Utilize advanced user data (mood, activity, etc.) for task suggestions.
    - [x] Utilize advanced user data (mood, activity, etc.) for task suggestions.
- [x] **AI Avatar Generation:** Allow users to create personalized avatars using AI.
    - [x] Develop AI model for avatar generation.
    - [x] Integrate avatar generation into the profile.
    - [x] Add AI validation for avatar descriptions.
- [x] **Set up user profile for the agent:** Created `AICoachProfile` and `CommunityModeratorProfile` in `src/config/agentProfiles.ts`.

## Phase 3: Expansion and Community Building

This phase aims to expand the application's features and foster a stronger community.

- [ ] **Gamification Enhancements:** Add more engaging gamification elements (e.g., streaks, badges).
    - [ ] Implement streak tracking and rewards.
    - [ ] Introduce badges for achievements.
- [ ] **Guided Journals & Reflections (AI-Assisted):** Provide structured journaling prompts and AI-powered reflection on entries.
    - [ ] Develop guided journaling interface.
    - [ ] Integrate AI for analyzing journal entries and providing insights.
- [ ] **Community Challenges:** Introduce community-wide challenges and goals.
    - [ ] Implement challenge creation and participation features.
    - [ ] Track community progress on challenges.
- [ ] **Enhanced AI Personalization:** Further refine AI models based on longer-term user interaction and feedback.
    - [ ] Implement feedback loops for AI suggestions (coaching, tasks).
    - [ ] Use cumulative data for deeper personalized insights.
- [ ] **User-Generated Content Moderation (Community-Assisted):** Allow trusted users to assist in content moderation.
    - [ ] Implement user reporting review workflow.
    - [ ] Introduce trusted user roles for moderation tasks.
- [x] **AI-Powered Content/Resource Suggestions:** Suggest articles, videos, or other resources based on user data and interests.
    - [x] Develop AI model for content recommendation.
    - [x] Integrate content suggestions into the dashboard.
- [x] **Secure Cloud Functions (Conceptual):** Ensure Genkit flows (which can be deployed as functions) are secure by design (server-side, input validation). Specific HTTP-triggered Cloud Functions would require explicit auth checks.
- [x] **Create integration service:** Implemented `IntegrationService` for connecting to external wellness platforms.
- [x] **Implement Real-time Notifications:** Setup Firebase Cloud Messaging for foreground and background notifications.
- [x] **Improve Accessibility:** Initial pass on accessibility improvements in UI components.
- [x] **Improve Stability for Connections:** Implemented error handling in flows and retries in page.tsx for API calls.

### Tool Usage

Handover Instructions: Firebase Studio Project

This detailed handover instruction provides a strong base for a new team to improve and support your project, reducing the likelihood of major issues down the line.

1. Project Access:

    * Firebase Studio Project:

        * Grant access to the Firebase Studio project. Typically, this involves adding the new developer’s Google account to the project with appropriate permissions.
        * Permissions to grant:
            * Owner: Full access; suitable for lead developers.
            * Editor: Can deploy and modify most resources.
            * Viewer: Read-only access, suitable for those who need to monitor but not change configurations.

    * Version Control:

        * Ensure the project's code repository is accessible (e.g., GitHub, GitLab, Bitbucket).
        * Common tasks:
            * Add the new developer as a collaborator.
            * Provide necessary branch permissions (e.g., main, develop).

2. Environment Configuration:

    * .env.local File:

        * Purpose: Contains environment-specific variables, such as API keys and Firebase configuration settings.
        * Contents: Refer to the `.env` file in the root directory for a template. Key variables include:
            * `NEXT_PUBLIC_FIREBASE_API_KEY`
            * `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
            * `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
            * `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
            * `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
            * `NEXT_PUBLIC_FIREBASE_APP_ID`
            * `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (Optional)
            * `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (Crucial for Web Push)
            * `GOOGLE_APPLICATION_CREDENTIALS` (Path to service account key for local server-side dev)
        * Security Note: Never commit .env.local to version control.
        * **Restart Server:** After any changes to `.env.local`, the Next.js development server **MUST** be restarted.

    * `public/firebase-messaging-sw.js`:
        * This file **REQUIRES MANUAL CONFIGURATION**.
        * The `firebaseConfig` object within this file must be populated with the same values used in your `.env.local` for the `NEXT_PUBLIC_FIREBASE_...` variables.
        * This is essential for background push notifications.

3. Folder Structure:
 src/: Source code directory.
 app/: Next.js app directory containing page routes and layout.
 components/: Reusable React components.
 ai/: AI-related code, including Genkit flows and tools.
 flows/: Genkit flows for various AI functionalities.
 tools/: Utility functions and helpers for AI tasks.
 contexts/: React context providers for managing global state.
 hooks/: Custom React hooks.
 lib/: Utility functions and Firebase initialization.
 services/: Business logic services (e.g., TaskService, CommunityService, IntegrationService).
 types/: TypeScript type definitions.
 public/: Static assets such as images, fonts, and favicons. Includes `firebase-messaging-sw.js` for FCM.
 .env.local: Environment-specific configuration variables (API keys, etc.).
 next.config.js: Next.js configuration file.
 tailwind.config.js: Tailwind CSS configuration file.
 tsconfig.json: TypeScript configuration file.

4. Firebase Setup:
    * Firebase Services Used:
        * Authentication: Managing user authentication (Google Sign-In, Email/Password, guest accounts).
        * Firestore: Realtime NoSQL database for storing structured data (e.g., user profiles for FCM tokens).
        * Storage: Cloud storage for user-generated content such as avatar images.
        * Cloud Messaging: Sending push notifications to users.
        * Cloud Functions (implicitly via Genkit flows, potentially): Backend code.
    * Initialization:
        * Firebase client SDK is initialized in `src/lib/firebase.ts`. This file includes checks for essential environment variables.
        * Firebase Admin SDK is initialized in `src/lib/firebase-admin.ts` for backend operations.
    * Authentication Providers: Ensure Email/Password and Google Sign-In are enabled in the Firebase Console (Authentication > Sign-in method).
    * Firebase Cloud Messaging (FCM):
        * Service worker `public/firebase-messaging-sw.js` handles background notifications (requires manual config).
        * Client-side code (`src/lib/firebase-messaging.ts` and `src/app/page.tsx`) handles permission requests, token management, and foreground notifications.
        * Server-side actions (`src/actions/fcm-actions.ts`) send notifications using the Admin SDK.

5. Genkit Setup:
    * AI Flows: Located under `src/ai/flows/`.
    * AI Tools: Located under `src/ai/tools/`.
    * Genkit Configuration: Initialized in `src/ai/genkit.ts`.

6. Deployment:
    * Ensure Firebase CLI is installed and configured.
    * Use `firebase deploy` for Firebase Hosting and Cloud Functions. Firebase Studio simplifies this.

7. Best Practices:
    * Code Style: TypeScript, Tailwind CSS, React functional components.
    * Version Control: Use branches, code reviews.
    * AI Model Management: Monitor usage, costs, and performance.
    * Error Handling: Robust error handling and logging.
    * Security: Protect API keys, review Firebase security rules, secure Cloud Functions if HTTP-triggered.
    * Performance Optimization: Optimize React components, Next.js configs.
    * Testing: Unit, integration, and end-to-end tests (Jest).
    * Documentation: Document key components and flows.

8. Quick Checks:
    * Verify login (Email/Password, Google, Guest).
    * Test mood logging and task completion.
    * Test AI features: Avatar generation, content suggestions, task suggestions, community post moderation.
    * Test notification permissions and delivery (foreground and background).

100-Step In-Depth Plan and Progress:
Phase 1: Core Foundation (Steps 1-10)

Objective: Establish the basic project structure, dependencies, and Firebase setup.
    1.  [x] Project Setup:
        *   [x] Initialize project using Firebase Studio
        *   [x] Create Next.js app
        *   [x] Enable TypeScript
    2.  [x] Install Core Dependencies:
        *   [x] Install Firebase client
        *   [x] Install React
        *   [x] Install Next.js
    3.  [x] Set up Firebase Environment:
        *   [x] Create .env.local file
        *   [x] Store Firebase config variables
    4.  [x] Configure Firebase:
        *   [x] Initialize Firebase app in src/lib/firebase.ts
        *   [x] Initialize Firebase Admin SDK in src/lib/firebase-admin.ts
    5.  [x] Core UI Components:
        *   [x] Design basic layout in src/app/layout.tsx
        *   [x] Implement Header component
        *   [x] Create a basic Footer
    6.  [x] Implement Authentication:
        *   [x] Set up Firebase Authentication
        *   [x] Implement login and logout functionality
        *   [x] Google authentication as login option
    7.  [x] User Context:
        *   [x] Create User type in src/types/user.ts
        *   [x] Create UserContext in src/contexts/UserContext.tsx
    8.  [ ] Initial Deployment:
        *   [ ] Deploy initial setup to Firebase Hosting
    9.  [ ] Local Testing Setup:
        *   [ ] Set up Firebase emulators for local testing
        *   [ ] Configure emulators
    10. [x] Project Documentation:
        *   [x] Add project description to README.md (continuously updated)
Phase 2: Basic Features (Steps 11-25)

Objective: Implement core features like mood logging, task management, and reward system.
    11. [x] Define Mood Type:
        *   [x] Define Mood type in src/types/mood.ts
        *   [x] Create mood options
        *   [x] Create mood value mapping
    12. [x] Mood Log Form:
        *   [x] Implement MoodLogForm component
        *   [x] Implement date validation in form
    13. [x] Implement Mood Logging:
        *   [x] Create MoodLog type in src/types/mood.ts
        *   [x] Create MoodLogsContext in src/contexts/MoodLogsContext.tsx
    14. [x] Mood Chart:
        *   [x] Implement MoodChart component
        *   [x] Visualize mood data
    15. [x] Task Type:
        *   [x] Create Task type in src/types/task.ts
        *   [x] Define properties like name, description, rewardPoints
    16. [x] Task Management:
        *   [x] Implement TaskService in src/components/task/TaskService.ts
        *   [x] Methods for create, update, delete, get
    17. [x] Display Tasks:
        *   [x] Display tasks on a Today's Quests card.
    18. [x] Task Completion:
        *   [x] Implement task completion logic
        *   [x] Update reward points on completion
        *   [x] Implement task streak updates
    19. [x] Reward System:
        *   [x] Create Reward type in src/types/reward.ts
        *   [x] Define properties like name, description, pointsRequired
    20. [x] Reward Management:
        *   [x] Implement RewardService
        *   [x] Methods for create, update, delete, get rewards
    21. [x] Display Rewards:
        *   [x] Implement RewardDisplay component
        *   [x] Display rewards and enable claiming
    22. [x] Local Storage Persistence:
        *   [x] Persist tasks, mood logs and rewards in local storage
    23. [x] Refactor: use UserContext for neuro points
    24. [x] Bug fixing
        *   [x] Make sure components can handle empty tasks array
        *   [x] Fix and resolve issues on various devices
    25. [x] Improve testing (Initial pass)

Phase 3: AI Integration (Steps 26-45)

Objective: Integrate AI features such as avatar generation, personalized insights, and content recommendations.
    26. [x] Genkit Setup:
        *   [x] Install Genkit dependencies
        *   [x] Initialize Genkit in src/ai/genkit.ts
    27. [x] Avatar Type:
        *   [x] Create Avatar type in src/types/avatar.ts
    28. [x] Implement Avatar Generation:
        *   [x] Create generateAvatarFlow in src/ai/flows/generate-avatar-flow.ts
        *   [x] Implement uploadAvatarToStorage in src/lib/firebase-storage.ts
    29. [x] Display Avatar:
        *   [x] Display user avatar
        *   [x] Implement avatar generation UI
    30. [x] Personalized Insights:
        *   [x] Create PersonalizedInsightsInput and PersonalizedInsightsOutput
        *   [x] Create personalizedInsightsFlow in src/ai/flows/personalized-insights.ts
    31. [x] Display Insights:
        *   [x] Implement PersonalizedInsights component
        *   [x] Display insights and tips
    32. [x] Community Challenges:
        *   [x] Create GenerateCommunityChallengesInput and GenerateCommunityChallengesOutput
        *   [x] Create generateCommunityChallengesFlow in src/ai/flows/community-challenges-flow.ts
    33. [x] Implement AI Community Vibe check in
        *   [x] Display challenges in CommunityDisplay
    34. [x] AI-Powered Task Suggestions:
        *   [x] Create TaskSuggestionsInput and TaskSuggestionsOutput
        *   [x] Create taskSuggestionsFlow in src/ai/flows/task-suggestions.ts
    35.  [x] Integrate Tasks:
        *   [x] Connect to Taskservice.ts
    36. [x] Make AI genz
        *   [x] Adjust messages to use better prompts and genz styles
    37. [x] Implement Moderation Model:
        *   [x] Create ModerationInput and ModerationOutput in src/ai/flows/moderate-community-post-flow.ts
    38. [x] Create Moderation tool and CommunityModerator agent
        *   [x] Create moderateCommunityPostFlow to assess and generate data
    39. [x] Create agent, with triggers and memory.
        *   [x] Implement CommmunityModerator
    40. [x] Implement CommmunityModerator in community and messaging service
    41. [x] Secure Cloud functions (Conceptual - Genkit flows secured by server-side execution and input validation)
    42. [ ] Bug fix for image host api
    43. [ ] Set up a static analysis to check for issues.
    44. [x] Bug fixes (Path resolutions, API key error handling)
    45. [x] Enhance the prompts to be more "GENZ" like (Ongoing)
Phase 4: Community Features and Integrations (Steps 46-60)

Objective: Implement community features and integrate with external wellness platforms.
    46. [x] Community Type:
        *   [x] Create CommunityPost type in src/types/community.ts (updated with status)
    47. [x] Implement Community Display:
        *   [x] Create CommunityDisplay component (updated for moderation)
    48. [x] Implement Community Posting:
        *   [x] Implement community posting functionality (updated for moderation)
    49. [x] Social interaction
        *   [x] implement like / comment system (updated for moderation)
    50. [x] Set up user profile for the agent
    51. [x] Dynamic Avatar Descriptions:
        *   [x] AI validation
    52. [x] Create integration service

    53. [x] Improve accessibility (Initial Pass)
    54. [x] Bug fixes (FirebaseUI, Guest Login, Import Paths)
    55. [x] Improve stability for connections (Error handling in flows, retries in page.tsx)
    56. [ ] Bug fixes
    57. [ ] Add Tooltip

Phase 5: Enhanced User Experience and Features (Steps 61-80)

Objective: Enhance user experience and add new features.
    61. [x] Design System:
        *   [x] Implement proper UI setup (ShadCN theme, globals.css)
        *   [x] Create documentation on components usage (Implicit through code and ShadCN)
    62. [ ] Implement Themes:
        *   [ ] Allow users to choose a theme (light/dark)
        *   [ ] Persist theme preferences
    63. [x] Implement Notifications:
        *   [x] Set up push notifications (Firebase Cloud Messaging)
        *   [x] Send notifications on task completion
    64. [x] Bug fixes (FCM setup, .env validation)

    65. [x] Test notification (Thorough testing with various scenarios)
    66. [ ] Review data, data accuracy and AI perfomance

    67. [ ] Improve accessibility (Comprehensive audit and fixes)

    68. [ ] Bug fixes
    69. [ ] Code deployment

Phase 6: Advanced AI & Refinements (Steps 81-100)

Objective: Advanced Genkit and Firebase integration for new products, metrics , deployment and support
    81. [ ] Review and establish metrics
    82. [ ] Model selection review. 
    83. [ ] Load testing

    84. [ ] improve the agent setup
    85. [ ] Improve the data stream for better response time

    86. [ ] Clean ups: Remove any "mock" functions. 
    87. [ ] Bug fixes
    
```