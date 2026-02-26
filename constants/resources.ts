export interface Resource {
  id: string;
  title: string;
  category: string;
  tags: string[];
  icon: string;
  color: string;
  route?: string;
  /** True for design-editor pages that only appear in the Design Generated tab */
  designOnly?: boolean;
}

export const ALL_RESOURCES: Resource[] = [
  { id: '11', title: "Understanding What Cancer Is and Isn't", category: 'Health', tags: ['cancer', 'understanding', 'myths', 'facts'], icon: 'bulb', color: '#F59E0B', route: '/understanding-cancer' },
  { id: '12', title: 'Encouraging Positive Peer Support', category: 'Social', tags: ['social', 'peer', 'support', 'kindness', 'empathy', 'inclusion'], icon: 'people', color: '#06B6D4', route: '/peer-support' },
  { id: '13', title: 'The School Nurse: Your Ally at School', category: 'School', tags: ['school', 'nurse', 'health', 'medicine', 'support', 'back to school'], icon: 'medkit', color: '#EF4444', route: '/school-nurse' },
  { id: '14', title: 'Best Practices for Juggling School and Life', category: 'School', tags: ['school', 'balance', 'life', 'work', 'tips', 'stress', 'organization'], icon: 'trophy', color: '#F97316', route: '/school-life-balance' },
  { id: '15', title: 'How to Find People Who Understand Your Journey', category: 'Social', tags: ['social', 'friends', 'support', 'survivors', 'connections', 'peer'], icon: 'compass', color: '#10B981', route: '/finding-support' },
];

export const ALL_RESOURCE_IDS = ALL_RESOURCES.map(r => r.id);

export const RESOURCE_CATEGORIES = ['School', 'Social', 'Health', 'Family', 'Emotions'] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
