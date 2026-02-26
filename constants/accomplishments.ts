// constants/accomplishments.ts
// Internal definitions for the puzzle-based accomplishment system.
// Conditions are NEVER shown to users — pieces appear as serendipitous surprises.

export type PieceEvent =
  | 'onboarding_complete'
  | 'resource_read_30s'
  | 'tts_played'
  | 'resource_bookmarked'
  | 'profile_tab_visited'
  | 'all_tabs_visited'
  | 'search_performed'
  | 'peer_support_read_30s'
  | 'cancer_info_read_30s'
  | 'voice_changed'
  | 'about_opened'
  | 'resources_10pct'
  | 'resources_50pct'
  | 'resources_100pct'
  | 'resources_5_bookmarked'
  | 'resources_3_downloaded'
  | 'story_read_30s'
  | 'stories_3_bookmarked'
  | 'story_created'
  | 'story_commented';

export type EdgeType = 'tab' | 'blank' | 'flat';

export interface PieceEdges {
  top: EdgeType;
  right: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
}

export interface PieceDefinition {
  id: string;
  chapterId: string;
  event: PieceEvent;
  gridPosition: { row: number; col: number };
  edges: PieceEdges;
  name: string;
  description: string;
}

export interface ChapterDefinition {
  id: string;
  title: string;
  subtitle: string;
  gradientColors: readonly [string, string];
  pieceCount: number;
  gridRows: number;
  gridCols: number;
  activeCells: Array<{ row: number; col: number }>;
  pieces: PieceDefinition[];
  introText: string;
}

// Resource thresholds (12 total resources in constants/resources.ts)
export const TOTAL_RESOURCE_COUNT = 12;
export const RESOURCES_10PCT_THRESHOLD = 2;   // ceil(12 * 0.1) = 2
export const RESOURCES_50PCT_THRESHOLD = 6;   // ceil(12 * 0.5) = 6
export const RESOURCES_100PCT_THRESHOLD = 12;

export const CHAPTERS: ChapterDefinition[] = [
  // ─── Chapter 1: First Steps ──────────────────────────────────────────────────
  // 3×3 cross grid: center + N/E/S/W
  // Gradient: warm amber
  {
    id: 'chapter_1',
    title: 'First Steps',
    subtitle: 'Newcomer',
    gradientColors: ['#F59E0B', '#FBBF24'],
    pieceCount: 5,
    gridRows: 3,
    gridCols: 3,
    activeCells: [
      { row: 0, col: 1 }, // North
      { row: 1, col: 0 }, // West
      { row: 1, col: 1 }, // Center
      { row: 1, col: 2 }, // East
      { row: 2, col: 1 }, // South
    ],
    introText: 'Every journey begins somewhere. These pieces mark your earliest moments in SchoolKit — the quiet ones that nobody sees but you. They\'re yours.',
    pieces: [
      {
        id: 'ch1_p1',
        chapterId: 'chapter_1',
        event: 'onboarding_complete',
        gridPosition: { row: 1, col: 1 }, // center
        edges: { top: 'tab', right: 'tab', bottom: 'tab', left: 'tab' },
        name: 'Finished setting up',
        description: 'You took your first step — and that\'s everything. Welcome to SchoolKit.',
      },
      {
        id: 'ch1_p2',
        chapterId: 'chapter_1',
        event: 'resource_read_30s',
        gridPosition: { row: 0, col: 1 }, // north — bottom connects to center's top tab
        edges: { top: 'flat', right: 'flat', bottom: 'blank', left: 'flat' },
        name: 'Read a full resource page',
        description: 'You sat with something new. Curiosity is a kind of courage.',
      },
      {
        id: 'ch1_p3',
        chapterId: 'chapter_1',
        event: 'tts_played',
        gridPosition: { row: 1, col: 2 }, // east — left connects to center's right tab
        edges: { top: 'flat', right: 'flat', bottom: 'flat', left: 'blank' },
        name: 'Listened to a resource',
        description: 'You let the words come to you. Sometimes listening is the bravest thing.',
      },
      {
        id: 'ch1_p4',
        chapterId: 'chapter_1',
        event: 'resource_bookmarked',
        gridPosition: { row: 2, col: 1 }, // south — top connects to center's bottom tab
        edges: { top: 'blank', right: 'flat', bottom: 'flat', left: 'flat' },
        name: 'Saved a resource for later',
        description: 'You saved something that mattered. Your instincts are good.',
      },
      {
        id: 'ch1_p5',
        chapterId: 'chapter_1',
        event: 'profile_tab_visited',
        gridPosition: { row: 1, col: 0 }, // west — right connects to center's left tab
        edges: { top: 'flat', right: 'blank', bottom: 'flat', left: 'flat' },
        name: 'Visited your profile',
        description: 'You looked at yourself. That takes something.',
      },
    ],
  },

  // ─── Chapter 2: Explorer ─────────────────────────────────────────────────────
  // 2×3 rectangular grid
  // Gradient: teal/cyan
  {
    id: 'chapter_2',
    title: 'Explorer',
    subtitle: 'Exploration',
    gradientColors: ['#0EA5E9', '#38BDF8'],
    pieceCount: 6,
    gridRows: 2,
    gridCols: 3,
    activeCells: [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
      { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    ],
    introText: 'The more you explore, the more you find. This chapter celebrates every corner you\'ve wandered into, every search you\'ve made, every door you\'ve opened.',
    pieces: [
      {
        id: 'ch2_p1',
        chapterId: 'chapter_2',
        event: 'all_tabs_visited',
        gridPosition: { row: 0, col: 0 },
        // right→tab (ch2_p2 left←blank), bottom→tab (ch2_p4 top←blank)
        edges: { top: 'flat', right: 'tab', bottom: 'tab', left: 'flat' },
        name: 'Explored every section',
        description: 'You explored every corner. There\'s nothing holding you back.',
      },
      {
        id: 'ch2_p2',
        chapterId: 'chapter_2',
        event: 'search_performed',
        gridPosition: { row: 0, col: 1 },
        // left←blank (ch2_p1 right→tab), right→tab (ch2_p3 left←blank), bottom→blank (ch2_p5 top←tab)
        edges: { top: 'flat', right: 'tab', bottom: 'blank', left: 'blank' },
        name: 'Searched for something',
        description: 'You went looking for answers. That\'s where it always starts.',
      },
      {
        id: 'ch2_p3',
        chapterId: 'chapter_2',
        event: 'peer_support_read_30s',
        gridPosition: { row: 0, col: 2 },
        // left←blank (ch2_p2 right→tab), bottom→tab (ch2_p6 top←blank)
        edges: { top: 'flat', right: 'flat', bottom: 'tab', left: 'blank' },
        name: 'Spent time on peer support',
        description: 'You stayed long enough to learn. That\'s what support looks like.',
      },
      {
        id: 'ch2_p4',
        chapterId: 'chapter_2',
        event: 'cancer_info_read_30s',
        gridPosition: { row: 1, col: 0 },
        // top←blank (ch2_p1 bottom→tab), right→blank (ch2_p5 left←tab)
        edges: { top: 'blank', right: 'blank', bottom: 'flat', left: 'flat' },
        name: 'Learned about cancer',
        description: 'You faced the hard stuff. That\'s no small thing.',
      },
      {
        id: 'ch2_p5',
        chapterId: 'chapter_2',
        event: 'voice_changed',
        gridPosition: { row: 1, col: 1 },
        // top←tab (ch2_p2 bottom→blank), left←tab (ch2_p4 right→blank), right→tab (ch2_p6 left←blank)
        edges: { top: 'tab', right: 'tab', bottom: 'flat', left: 'tab' },
        name: 'Chose your reading voice',
        description: 'You found a voice that feels right. You deserve to be heard.',
      },
      {
        id: 'ch2_p6',
        chapterId: 'chapter_2',
        event: 'about_opened',
        gridPosition: { row: 1, col: 2 },
        // top←blank (ch2_p3 bottom→tab), left←blank (ch2_p5 right→tab)
        edges: { top: 'blank', right: 'flat', bottom: 'flat', left: 'blank' },
        name: 'Opened the About page',
        description: 'You wanted to know more. Curiosity is always welcome here.',
      },
    ],
  },

  // ─── Chapter 3: Mind Hunter ───────────────────────────────────────────────────
  // 3×3 cross grid (same shape as chapter 1, different color + meaning)
  // Gradient: purple
  {
    id: 'chapter_3',
    title: 'Curious Mind',
    subtitle: 'Content Depth',
    gradientColors: ['#7B68EE', '#9B6EE8'],
    pieceCount: 5,
    gridRows: 3,
    gridCols: 3,
    activeCells: [
      { row: 0, col: 1 },
      { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
      { row: 2, col: 1 },
    ],
    introText: 'You\'ve gone deep. This chapter belongs to those who don\'t just skim the surface — who stay, who read, who come back. That depth changes things.',
    pieces: [
      {
        id: 'ch3_p1',
        chapterId: 'chapter_3',
        event: 'resources_10pct',
        gridPosition: { row: 1, col: 1 }, // center
        edges: { top: 'tab', right: 'tab', bottom: 'tab', left: 'tab' },
        name: 'Opened 10% of resources',
        description: 'You\'ve opened the door to real knowledge. Keep going.',
      },
      {
        id: 'ch3_p2',
        chapterId: 'chapter_3',
        event: 'resources_50pct',
        gridPosition: { row: 0, col: 1 }, // north
        edges: { top: 'flat', right: 'flat', bottom: 'blank', left: 'flat' },
        name: 'Read half the library',
        description: 'Halfway through the library. You\'re building something real.',
      },
      {
        id: 'ch3_p3',
        chapterId: 'chapter_3',
        event: 'resources_100pct',
        gridPosition: { row: 1, col: 2 }, // east
        edges: { top: 'flat', right: 'flat', bottom: 'flat', left: 'blank' },
        name: 'Read every resource',
        description: 'You read it all. Every single page. That\'s remarkable.',
      },
      {
        id: 'ch3_p4',
        chapterId: 'chapter_3',
        event: 'resources_5_bookmarked',
        gridPosition: { row: 2, col: 1 }, // south
        edges: { top: 'blank', right: 'flat', bottom: 'flat', left: 'flat' },
        name: 'Bookmarked 5 resources',
        description: 'You\'ve gathered a collection of things that matter to you.',
      },
      {
        id: 'ch3_p5',
        chapterId: 'chapter_3',
        event: 'resources_3_downloaded',
        gridPosition: { row: 1, col: 0 }, // west
        edges: { top: 'flat', right: 'blank', bottom: 'flat', left: 'flat' },
        name: 'Downloaded 3 resources',
        description: 'You took things with you. This knowledge is yours to keep.',
      },
    ],
  },

  // ─── Chapter 4: Story Keeper ─────────────────────────────────────────────────
  // 2×2 square grid
  // Gradient: rose/pink
  {
    id: 'chapter_4',
    title: 'Story Keeper',
    subtitle: 'Community',
    gradientColors: ['#EC4899', '#F472B6'],
    pieceCount: 4,
    gridRows: 2,
    gridCols: 2,
    activeCells: [
      { row: 0, col: 0 }, { row: 0, col: 1 },
      { row: 1, col: 0 }, { row: 1, col: 1 },
    ],
    introText: 'Stories are how we find each other. This chapter is for the moments you connected — when you listened, when you shared, when you showed up for the community.',
    pieces: [
      {
        id: 'ch4_p1',
        chapterId: 'chapter_4',
        event: 'story_read_30s',
        gridPosition: { row: 0, col: 0 },
        // right→tab (ch4_p2 left←blank), bottom→tab (ch4_p3 top←blank)
        edges: { top: 'flat', right: 'tab', bottom: 'tab', left: 'flat' },
        name: 'Read a full community story',
        description: 'You sat with someone else\'s story. That\'s a gift of attention.',
      },
      {
        id: 'ch4_p2',
        chapterId: 'chapter_4',
        event: 'stories_3_bookmarked',
        gridPosition: { row: 0, col: 1 },
        // left←blank (ch4_p1 right→tab), bottom→blank (ch4_p4 top←tab)
        edges: { top: 'flat', right: 'flat', bottom: 'blank', left: 'blank' },
        name: 'Bookmarked 3 stories',
        description: 'Three stories saved. You\'re building a community in your heart.',
      },
      {
        id: 'ch4_p3',
        chapterId: 'chapter_4',
        event: 'story_created',
        gridPosition: { row: 1, col: 0 },
        // top←blank (ch4_p1 bottom→tab), right→tab (ch4_p4 left←blank)
        edges: { top: 'blank', right: 'tab', bottom: 'flat', left: 'flat' },
        name: 'Shared your own story',
        description: 'You shared your own voice. That\'s an act of trust.',
      },
      {
        id: 'ch4_p4',
        chapterId: 'chapter_4',
        event: 'story_commented',
        gridPosition: { row: 1, col: 1 },
        // top←tab (ch4_p2 bottom→blank), left←blank (ch4_p3 right→tab)
        edges: { top: 'tab', right: 'flat', bottom: 'flat', left: 'blank' },
        name: 'Left a comment on a story',
        description: 'You reached out to another. Connection is what makes this real.',
      },
    ],
  },
];

// Lookup maps for fast access
export const CHAPTER_BY_ID: Record<string, ChapterDefinition> = Object.fromEntries(
  CHAPTERS.map(c => [c.id, c])
);

export const PIECE_BY_ID: Record<string, PieceDefinition> = Object.fromEntries(
  CHAPTERS.flatMap(c => c.pieces).map(p => [p.id, p])
);

export const PIECES_BY_EVENT: Partial<Record<PieceEvent, PieceDefinition[]>> = {};
for (const chapter of CHAPTERS) {
  for (const piece of chapter.pieces) {
    if (!PIECES_BY_EVENT[piece.event]) PIECES_BY_EVENT[piece.event] = [];
    PIECES_BY_EVENT[piece.event]!.push(piece);
  }
}

export const TOTAL_PIECES = CHAPTERS.reduce((sum, c) => sum + c.pieceCount, 0);
