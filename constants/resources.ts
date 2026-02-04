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
  { id: '1', title: 'What you might experience', category: 'Health', tags: ['health', 'treatment'], icon: 'medical', color: '#7B68EE' },
  { id: '2', title: 'Friends and social life', category: 'Social', tags: ['social', 'friends'], icon: 'people', color: '#0EA5E9' },
  { id: '3', title: 'Dealing with feelings', category: 'Emotions', tags: ['emotions', 'feelings'], icon: 'heart', color: '#66D9A6' },
  { id: '4', title: 'Keeping up with school during treatment', category: 'School', tags: ['school', 'academics'], icon: 'school', color: '#EF4444' },
  { id: '5', title: 'Getting back to school after treatment', category: 'School', tags: ['school', 'transition'], icon: 'return-down-back', color: '#7B68EE' },
  { id: '6', title: 'Coping with stress and emotions', category: 'Emotions', tags: ['emotions', 'stress'], icon: 'sunny', color: '#0EA5E9' },
  { id: '7', title: 'Supporting my child during treatment', category: 'Family', tags: ['family', 'support'], icon: 'heart-circle', color: '#66D9A6' },
  { id: '8', title: 'Becoming a strong advocate for my child', category: 'Family', tags: ['advocacy', 'family'], icon: 'megaphone', color: '#EF4444' },
  { id: '9', title: 'Collaborating with the school team', category: 'School', tags: ['school', 'collaboration'], icon: 'people-circle', color: '#7B68EE' },
  { id: '10', title: 'Working with healthcare providers', category: 'Health', tags: ['health', 'medical'], icon: 'medical', color: '#0EA5E9' },
  { id: '11', title: "Understanding What Cancer Is and Isn't", category: 'Health', tags: ['cancer', 'understanding', 'myths', 'facts'], icon: 'information-circle', color: '#3B82F6', route: '/understanding-cancer' },
];

export const ALL_RESOURCE_IDS = ALL_RESOURCES.map(r => r.id);

export const RESOURCE_CATEGORIES = ['Emotions', 'School', 'Social', 'Health', 'Family'] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
