export interface Resource {
  id: string;
  title: string;
  category: string;
  tags: string[];
  icon: string;
  color: string;
  route?: string;
}

export const ALL_RESOURCES: Resource[] = [
  { id: '11', title: "Understanding What Cancer Is and Isn't", category: 'Health', tags: ['cancer', 'understanding', 'myths', 'facts'], icon: 'information-circle', color: '#3B82F6', route: '/understanding-cancer' },
  { id: '12', title: 'Encouraging Positive Peer Support', category: 'Social', tags: ['social', 'peer', 'support', 'kindness', 'empathy', 'inclusion'], icon: 'people', color: '#0EA5E9', route: '/peer-support' },
  { id: '13', title: 'The School Nurse: Your Ally at School', category: 'School', tags: ['school', 'nurse', 'health', 'medicine', 'support', 'back to school'], icon: 'medkit', color: '#E8735A', route: '/school-nurse' },
  { id: '14', title: 'Best Practices for Juggling School and Life', category: 'School', tags: ['school', 'balance', 'life', 'work', 'tips', 'stress', 'organization'], icon: 'timer-outline', color: '#7B68EE', route: '/school-life-balance' },
  { id: '15', title: 'How to Find People Who Understand Your Journey', category: 'Social', tags: ['social', 'friends', 'support', 'survivors', 'connections', 'peer'], icon: 'people-outline', color: '#7B68EE', route: '/finding-support' },
];

export const ALL_RESOURCE_IDS = ALL_RESOURCES.map(r => r.id);

export const RESOURCE_CATEGORIES = ['Emotions', 'School', 'Social', 'Health', 'Family'] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
