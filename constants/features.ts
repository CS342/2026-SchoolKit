// constants/features.ts
// Feature flags for hiding user-facing features without deleting their code.

// Puzzles / accomplishments and the Knowledge Tree are hidden pending a team
// discussion about whether to keep them. Progress is still tracked in the
// background (AccomplishmentContext), so flipping these back on loses nothing.
export const SHOW_PUZZLES = false;
export const SHOW_KNOWLEDGE_TREE = false;
