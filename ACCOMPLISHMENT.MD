# SchoolKit Accomplishment System

The accomplishment system in SchoolKit uses a serendipitous puzzle-piece reveal mechanism. As users explore the app and interact with different features, they unlock hidden pieces that assemble into chapter illustrations. 

Accomplishments are designed to be "invisible" to users before they are earned to keep the app focused on connection and growth rather than gamification. When an event is triggered, a toast notification announces the new puzzle piece.

## Complete Event Triggers & Actions

Below is a complete list of `PieceEvent` types that trigger accomplishment piece unlocks and what specific user actions are required to earn them.

### Chapter 1: First Steps (Newcomer)
*These markers represent the earliest engagements in the app.*
- **onboarding_complete**: Awarded upon finishing the setup/onboarding flow and landing on the app logic for the first time.
- **resource_read_30s**: Awarded for opening any resource or article page and staying on it for at least 30 seconds.
- **tts_played**: Awarded for tapping the Text-to-Speech (read-aloud) button on any resource or story.
- **resource_bookmarked**: Awarded when tapping the bookmark icon on any standard knowledge tree resource or article.
- **profile_tab_visited**: Awarded when navigating to the Profile tab from the bottom tab bar.

### Chapter 2: Explorer (Exploration)
*These events track navigation and interaction breadth across the application.*
- **all_tabs_visited**: Awarded once the user has successfully navigated and triggered view events on all main tabs (e.g. Home, Search, Profile, etc).
- **search_performed**: Awarded when a user types a query into the global or resource search field and submits.
- **peer_support_read_30s**: Awarded specifically when the user stays on the "Encouraging Positive Peer Support" page for at least 30 seconds.
- **cancer_info_read_30s**: Awarded specifically when the user stays on the "Understanding What Cancer Is and Isn't" page for at least 30 seconds.
- **voice_changed**: Awarded when the user modifies their preferred Text-to-Speech voice via Onboarding or Profile settings.
- **about_opened**: Awarded when navigating to the About page (usually found via the Profile tab).

### Chapter 3: Curious Mind (Content Depth)
*These events validate a deeper dive into content consumption and library building.*
- **resources_10pct**: Awarded once the user has fully viewed at least 10% of the core library (2 resources).
- **resources_50pct**: Awarded once the user has fully viewed at least 50% of the core library (6 resources).
- **resources_100pct**: Awarded once the user has fully viewed every core resource in the database (12 total).
- **resources_5_bookmarked**: Awarded once the user has bookmarked a combined total of 5 resources.
- **resources_3_downloaded**: Awarded once the user has tapped the download button to offline-save 3 distinct resources.

### Chapter 4: Story Keeper (Community)
*These events validate peer connection, reading stories, and giving back to the community.*
- **story_read_30s**: Awarded when reading a community-generated story for at least 30 seconds.
- **stories_3_bookmarked**: Awarded when 3 distinct community stories have been bookmarked.
- **story_created**: Awarded when the user creates and submits their own story to the platform.
- **story_commented**: Awarded when the user leaves an encouraging comment on someone else's story.

---

### Internal Note for Developers
- Pieces are mapped inside `constants/accomplishments.ts`.
- Hooks tracking these items fire `trackEvent(eventName)` from `AccomplishmentContext.tsx`.
