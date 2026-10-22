// The curated icons for content blocks: what the editor's icon picker offers and what the
// AI is told it may use. Names are AppIcon names (components/ui/AppIcon.tsx): Ionicons,
// or `mci:` + a Material Community Icons name for more specific symbols. Any other name
// still renders (with a neutral fallback if unknown), but these are the vetted ones.
// Pure: no React Native imports, safe for the AI prompt and tests.

/** Ionicons (outline) covering the SchoolKit content domain. */
export const IONICON_SET = [
  'heart-outline', 'happy-outline', 'sparkles-outline', 'sunny-outline', 'star-outline', 'ribbon-outline',
  'medkit-outline', 'fitness-outline', 'body-outline', 'bandage-outline', 'thermometer-outline', 'pulse-outline',
  'battery-half-outline', 'bed-outline', 'nutrition-outline', 'water-outline',
  'school-outline', 'book-outline', 'library-outline', 'pencil-outline', 'document-text-outline', 'reader-outline',
  'people-outline', 'people-circle-outline', 'person-outline', 'chatbubbles-outline', 'chatbox-ellipses-outline', 'hand-left-outline',
  'wallet-outline', 'cash-outline', 'card-outline', 'calculator-outline', 'gift-outline', 'receipt-outline', 'pricetag-outline',
  'home-outline', 'car-outline', 'airplane-outline', 'bus-outline', 'location-outline', 'map-outline',
  'calendar-outline', 'time-outline', 'hourglass-outline', 'alarm-outline', 'checkmark-circle-outline', 'shield-checkmark-outline',
  'call-outline', 'mail-outline', 'globe-outline', 'link-outline', 'search-outline', 'information-circle-outline',
  'bulb-outline', 'compass-outline', 'flag-outline', 'trophy-outline', 'leaf-outline', 'balloon-outline',
  'musical-notes-outline', 'game-controller-outline', 'football-outline', 'brush-outline', 'camera-outline', 'headset-outline',
];

/** Material Community Icons — more specific symbols (home with a heart, stethoscope…). */
export const MCI_ICON_SET = [
  'mci:home-heart', 'mci:hand-heart', 'mci:account-heart', 'mci:heart-pulse', 'mci:head-heart', 'mci:book-heart',
  'mci:stethoscope', 'mci:hospital-box', 'mci:thermometer', 'mci:bandage', 'mci:meditation', 'mci:emoticon-happy',
  'mci:account-school', 'mci:school-outline', 'mci:book-open-page-variant', 'mci:lightbulb-on', 'mci:chat-question', 'mci:forum',
  'mci:account-group', 'mci:account-voice', 'mci:human-greeting-variant', 'mci:scale-balance', 'mci:piggy-bank', 'mci:cash-multiple',
  'mci:calendar-heart', 'mci:map-marker-path', 'mci:star-shooting', 'mci:party-popper',
];

export const ICON_SET = [...IONICON_SET, ...MCI_ICON_SET];
