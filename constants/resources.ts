import type { Audience } from '../features/content/audience';

export interface Resource {
  id: string;
  title: string;
  abbr: string;           // ≤ 2-word label shown in leaf circle on the tree
  shortDescription: string;
  category: string;
  tags: string[];
  icon: string;
  color: string;
  route?: string;
  /** True for design-editor pages that only appear in the Design Generated tab */
  designOnly?: boolean;
  /** Who this is for (see features/content/audience.ts). Missing = everyone. */
  audience?: Audience;
  /** Backed by a published editor page. Set when such a page replaces a built-in guide
   *  (same id, so bookmarks keep working) — it stays listed even while built-ins are hidden. */
  fromContentPage?: boolean;
}

export const ALL_RESOURCES: Resource[] = [
  { id: '11', abbr: 'About Cancer', shortDescription: 'Busting common myths and learning the real facts about cancer.', title: "Understanding What Cancer Is and Isn't", category: 'Health', tags: ['cancer', 'understanding', 'myths', 'facts'], icon: 'bulb', color: '#F59E0B', route: '/understanding-cancer' },
  { id: '12', abbr: 'Peer Support', shortDescription: 'Helping classmates create a welcoming and inclusive environment.', title: 'Encouraging Positive Peer Support', category: 'Social', tags: ['social', 'peer', 'support', 'kindness', 'empathy', 'inclusion'], icon: 'people', color: '#06B6D4', route: '/peer-support' },
  { id: '13', abbr: 'School Nurse', shortDescription: 'The school nurse is your ally.', title: 'The School Nurse: Your Ally at School', category: 'School', tags: ['school', 'nurse', 'health', 'medicine', 'support', 'back to school'], icon: 'medkit', color: '#EF4444', route: '/school-nurse' },
  { id: '14', abbr: 'Juggling Life', shortDescription: 'Best practices for juggling school and life.', title: 'Best Practices for Juggling School and Life', category: 'School', tags: ['school', 'balance', 'life', 'work', 'tips', 'stress', 'organization'], icon: 'trophy', color: '#F97316', route: '/school-life-balance' },
  { id: '15', abbr: 'Find People', shortDescription: 'How to find people who understand your journey.', title: 'How to Find People Who Understand Your Journey', category: 'Social', tags: ['social', 'friends', 'support', 'survivors', 'connections', 'peer'], icon: 'compass', color: '#10B981', route: '/finding-support' },
  { id: '17', abbr: 'Symptoms', shortDescription: 'Practical guidance for understanding and managing treatment-related symptoms.', title: 'Tips for Managing Symptoms', category: 'Health', tags: ['health', 'symptoms', 'cancer', 'treatment', 'managing', 'body', 'side effects'], icon: 'body-outline', color: '#6366F1', route: '/managing-symptoms' },
  { id: '18', abbr: 'Finances', shortDescription: 'Where the costs come from, who can help, and organizations that offer real financial support.', title: 'Navigating the Finances of Childhood Cancer', category: 'Family', tags: ['finances', 'money', 'costs', 'insurance', 'grants', 'family', 'support'], icon: 'wallet', color: '#3C9A8D', route: '/page/finances-childhood-cancer' },
];

export const ALL_RESOURCE_IDS = ALL_RESOURCES.map(r => r.id);

/**
 * Temporary switch: when false, the hardcoded ALL_RESOURCES above are left out of every
 * list (For You, library, tree, recommendations, topic picker) so only editor-authored
 * pages show. Their routes still open, and saved/downloaded copies still appear.
 */
export const SHOW_HARDCODED_RESOURCES = false;

/** Temporarily hidden from every list, same rules as above. Lowercased titles (DB pages have no stable id here). */
export const HIDDEN_RESOURCE_TITLES = new Set<string>([
  "feeling sick? here's what to do",
]);

export const RESOURCE_CATEGORIES = ['School', 'Social', 'Health', 'Family'] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
