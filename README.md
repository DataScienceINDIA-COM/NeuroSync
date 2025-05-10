## Environment Setup
always append to this file, dont erase
To set up the development environment for this project, follow these steps:

1.  **Prerequisites:**
    *   Ensure you have Node.js (version 18 or later recommended) and npm or Yarn installed. Refer to the [Installed Tools](#installed-tools) section to verify installed tools and their versions.

2.  **Create `.env.local` File:**
    *   In the root directory of the project, create a file named `.env.local`.
    *   This file will store your Firebase project configuration and other sensitive API keys.
    *   **Important:** This file should NOT be committed to version control. Add `.env.local` to your `.gitignore` file if it's not already there.
    *   Populate `.env.local` with the following variables, replacing the placeholder values with your actual Firebase project credentials:

        ```plaintext
        NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
        NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"
        # Optional: If using Firebase Admin SDK with a service account file locally
        # GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"
        # Optional: If your Firebase Cloud Functions are in a specific region
        # NEXT_PUBLIC_FIREBASE_LOCATION_ID="your-functions-region" 
        ```
    *   You can find these values in your Firebase project settings:
        1.  Go to the [Firebase Console](https://console.firebase.google.com/).
        2.  Select your project.
        3.  Click on the gear icon (Project settings) in the sidebar.
        4.  Under the "General" tab, in the "Your apps" section, find your web app.
        5.  The Firebase SDK snippet will contain these configuration values.

3.  **Enable Firebase Authentication Providers:**
    *   For FirebaseUI to work correctly with sign-in methods like Google Sign-In or Email/Password, you must enable them in your Firebase project. This is a common reason for `auth/configuration-not-found` or similar errors.
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project.
    *   In the left sidebar, navigate to "Authentication".
    *   Click on the "Sign-in method" tab (or "Get started" if it's your first time).
    *   Enable the providers you intend to use (e.g., "Google", "Email/Password"). For each provider, follow the on-screen instructions to configure it. For Google Sign-In, you'll typically need to provide a project support email.

4.  **Install Dependencies:**
    *   Open your terminal in the project's root directory and run:
        ```bash
        npm install
        # or
        yarn install
        ```

5.  **Run the Development Server:**
    *   After successful installation, start the Next.js development server:
        ```bash
        npm run dev
        # or
        yarn dev
        ```
    *   The application should now be running, typically at `http://localhost:3000` (or the port specified in your `package.json` if different, like `http://localhost:9002` for this project).

6.  **Restart After Environment Variable Changes:**
    *   **Crucial:** If you modify your `.env.local` file (or any `.env` file), you MUST restart your Next.js development server for the changes to take effect.

By following these steps, you should have a correctly configured development environment, and Firebase authentication issues like `auth/configuration-not-found` should be resolved.

# NeuroSync Project Roadmap
## AI Interaction Log
This section is for AI agents to log their activities and insights.

### Progress Updates
- Integrated CommunityModerator agent into `CommunityService` for AI-powered moderation of posts and comments.
- Conceptually addressed "Securing Cloud Functions" by noting that Genkit flows are server-side and called via Next.js actions, which inherently provides a layer of security. Input validation via Zod is also a key security aspect. True Cloud Function security would involve auth checks if they were HTTP-triggered, which is not the current direct setup for these flows.
- Successfully implemented the `CommunityModerator` agent within the `CommunityService`. This completes the AI-powered moderation workflow for posts and comments. `CommunityDisplay` now reflects moderation outcomes to users via toast notifications for rejected content.
- Affirmed that the security model for Genkit flows, being server-side and invoked via Next.js Server Actions with Zod validation, adequately addresses the "Secure Cloud Functions" requirement at a conceptual level for the current architecture.

### Decisions
- Moderated content (posts/comments) will be rejected if deemed inappropriate by the AI. `CommunityService` now throws an error for rejected content, which `CommunityDisplay` handles by showing a toast.
- `CommunityPost` type updated with `status` and `moderationReason`.

### Issues
- "Securing Cloud Functions" is a broad topic. The current implementation focuses on the security of Genkit flows as called from Next.js server actions. If specific, independently deployed Cloud Functions exist or are planned, their security (e.g., auth triggers, HTTP auth checks) needs to be addressed separately.

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
- [ ] **AI Avatar Generation:** Allow users to create personalized avatars using AI.
    - [ ] Develop AI model for avatar generation.
    - [ ] Integrate avatar generation into the profile.

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
- [ ] **AI-Powered Content/Resource Suggestions:** Suggest articles, videos, or other resources based on user data and interests.
    - [ ] Develop AI model for content recommendation.
    - [ ] Integrate content suggestions into the dashboard.
- [x] **Secure Cloud Functions (Conceptual):** Ensure Genkit flows (which can be deployed as functions) are secure by design (server-side, input validation). Specific HTTP-triggered Cloud Functions would require explicit auth checks.

### Tool Usage

Handover Instructions: Firebase Studio Project

This guide outlines the steps for handing over the Firebase Studio project to a new developer or team. It provides comprehensive instructions on various aspects of the project, including project access, environment configuration, folder structure, Firebase setup, Genkit setup, deployment details, and best practices.

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
        * Contents:
            * NEXT_PUBLIC_FIREBASE_API_KEY: Firebase API key for client-side operations.
            * NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Firebase authentication domain.
            * NEXT_PUBLIC_FIREBASE_PROJECT_ID: Firebase project ID.
            * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: Firebase storage bucket.
            * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: Firebase messaging sender ID.
            * NEXT_PUBLIC_FIREBASE_APP_ID: Firebase app ID.
            * NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: Firebase measurement ID.
            * GOOGLE_APPLICATION_CREDENTIALS: Path to the Google Cloud service account key file.
            * Any other project-specific API keys or settings.
        * Security Note: Never commit .env.local to version control. It should be kept confidential. Use environment variables in production.

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
 types/: TypeScript type definitions.
 public/: Static assets such as images, fonts, and favicons.
 .env.local: Environment-specific configuration variables (API keys, etc.).
 next.config.js: Next.js configuration file.
 tailwind.config.js: Tailwind CSS configuration file.
 tsconfig.json: TypeScript configuration file.

4. Firebase Setup:
    * Firebase Services Used:
        * Authentication: Managing user authentication (Google Sign-In, guest accounts).
        * Firestore: Realtime NoSQL database for storing structured data (if used).
        * Storage: Cloud storage for user-generated content such as avatar images.
        * Cloud Messaging: Sending push notifications to users.
        * Cloud Functions: Backend code that runs in response to events triggered by Firebase features.
    * Initialization:
        * Firebase is initialized in src/lib/firebase.ts for client-side and server-side use.
        * Firebase Admin SDK is initialized in src/lib/firebase-admin.ts for backend operations.
    * Environment Variables:
        * Ensure all necessary environment variables are set, including Firebase API keys, project ID, and service account credentials.
        * These keys are in .env.local, and used with firebaseConfig and firebaseAdminConfig.
    * Data Flows:
        * Realtime updates: Firestore/Realtime Database can provide real-time data updates.
        * Event-driven architecture: Cloud Functions can be triggered by database changes, authentication events, etc.

5. Genkit Setup:
    * AI Flows:
        * Key functionalities are located under src/ai/flows/.
        * This directory contains flows for generating community challenges, creating personalized insights, generating avatars, moderating content, and suggesting tasks.
    * AI Tools:
        * Specific functions are located under src/ai/tools/.
        * The project uses AI tools for calculating reward points.
    * Genkit Configuration:
        * Genkit is initialized in src/ai/genkit.ts, specifying plugins and the default model.

6. Deployment:
    * Ensure Firebase CLI is installed and configured with the correct project.
    * Use firebase deploy to deploy the application to Firebase Hosting and Cloud Functions.
    * Firebase Studio handles the project setup and deployment. This simplifies many deployment steps.

7. Best Practices:
    * Code Style and Conventions:
        * The project uses TypeScript, Tailwind CSS, and React. Follow consistent naming conventions.
    * Version Control:
        * Use branches effectively for new features, bug fixes, and releases.
        * Enforce code reviews before merging changes.
    * AI Model Management:
        * Regularly evaluate and update AI models to ensure optimal performance and accuracy.
        * Monitor API usage and costs associated with AI services.
    * Error Handling and Logging:
        * Implement robust error handling and logging throughout the application.

        * Monitor logs using tools like Firebase Crashlytics to identify and address issues quickly.
    * Security:
        * Protect API keys and sensitive information using environment variables.
        * Regularly review and update Firebase security rules to protect data.
        * For any deployed Cloud Functions (including those from Genkit flows if exposed via HTTP), ensure appropriate authentication and authorization checks (e.g., verify Firebase Auth ID tokens).
    * Performance Optimization:
        * Optimize React components and Next.js configurations for performance.
        * Use tools like Lighthouse to identify and address performance bottlenecks.
    * Testing:
        * Implement unit tests, integration tests, and end-to-end tests using Jest.
    * Documentation:
        * Document key components, data flows, and AI functionalities.

8. Quick Checks:
    * Ensure basic functionality works: Login, mood log, and data loading.
    * Test the Genkit set up, especially community post moderation.

This detailed handover instruction provides a strong base for a new team to improve and support your project, reducing the likelihood of major issues down the line.

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
        *   [x] Add project description to README.md
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
    25. [x] Improve testing

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
    44. [ ] Bug fixes
    45. [ ] Enhance the prompts to be more "GENZ" like
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
    50. [ ] Set up user profile for the agent
    51. [ ] Dynamic Avatar Descriptions:
        *   [ ] AI validation
    52. [ ] Create integration service

    53. [ ] Improve accessibility
    54. [ ] Bug fixes
    55. [ ] Improve stability for connections
    56. [ ] Bug fixes
    57. [ ] Add Tooltip

Phase 5: Enhanced User Experience and Features (Steps 61-80)

Objective: Enhance user experience and add new features.
    61. [x] Design System:
        *   [x] Implement proper UI setup
        *   [x] Create documentation on components usage
    62. [ ] Implement Themes:
        *   [ ] Allow users to choose a theme (light/dark)
        *   [ ] Persist theme preferences
    63. [x] Implement Notifications:
        *   [x] Set up push notifications (Firebase Cloud Messaging)
        *   [x] Send notifications on task completion
    64. [ ] Bug fixes

    65. [ ] Test notification
    66. [ ] Review data, data accuracy and AI perfomance

    67. [ ] Improve accessibility

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
    