import { generateId } from './defaults';
import { createRect, createText } from './defaults';
import type {
  InteractiveComponentObject,
  FlipCardConfig,
  BottomSheetConfig,
  ExpandableConfig,
  EntranceConfig,
  CarouselConfig,
  TabsConfig,
  QuizConfig,
  StaticDesignObject,
} from '../types/document';

function createInteractiveBase(
  overrides: Partial<InteractiveComponentObject>,
): InteractiveComponentObject {
  return {
    id: generateId(),
    type: 'interactive',
    name: 'Interactive',
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    interactionType: 'flip-card',
    interactionConfig: {} as any,
    groups: [],
    childIds: [],
    children: [],
    ...overrides,
  };
}

export function createFlipCard(cx: number, cy: number): InteractiveComponentObject {
  const w = 320;
  const h = 220;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const frontBg = createRect({
    name: 'Front Background',
    x: 0, y: 0, width: w, height: h,
    fill: '#7B68EE', cornerRadius: 16, stroke: '', strokeWidth: 0,
  });
  const frontTitle = createText({
    name: 'Front Title',
    x: 20, y: 40, width: w - 40, height: 40,
    text: 'Front Side', fontSize: 28, fontStyle: 'bold', fill: '#FFFFFF', align: 'center',
  });
  const frontHint = createText({
    name: 'Tap to Flip',
    x: 20, y: h - 50, width: w - 40, height: 24,
    text: 'Tap to flip', fontSize: 14, fill: 'rgba(255,255,255,0.7)', align: 'center',
  });

  const backBg = createRect({
    name: 'Back Background',
    x: 0, y: 0, width: w, height: h,
    fill: '#E8E0FF', cornerRadius: 16, stroke: '', strokeWidth: 0,
  });
  const backTitle = createText({
    name: 'Back Title',
    x: 20, y: 30, width: w - 40, height: 32,
    text: 'Back Side', fontSize: 24, fontStyle: 'bold', fill: '#4A3A8A', align: 'center',
  });
  const backBody = createText({
    name: 'Back Body',
    x: 20, y: 70, width: w - 40, height: 80,
    text: 'Add your content here. This side is revealed when the card is flipped.',
    fontSize: 15, fill: '#5B4B9B', align: 'center',
  });

  const frontChildren: StaticDesignObject[] = [frontBg, frontTitle, frontHint];
  const backChildren: StaticDesignObject[] = [backBg, backTitle, backBody];
  const allChildren = [...frontChildren, ...backChildren];

  const config: FlipCardConfig = {
    flipDuration: 500,
    flipDirection: 'horizontal',
    defaultSide: 'front',
  };

  return createInteractiveBase({
    name: 'Flip Card',
    x, y, width: w, height: h,
    interactionType: 'flip-card',
    interactionConfig: config,
    groups: [
      { role: 'front', label: 'Front', objectIds: frontChildren.map((c) => c.id) },
      { role: 'back', label: 'Back', objectIds: backChildren.map((c) => c.id) },
    ],
    childIds: allChildren.map((c) => c.id),
    children: allChildren,
  });
}

export function createBottomSheet(cx: number, cy: number): InteractiveComponentObject {
  const w = 320;
  const h = 400;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const triggerBg = createRect({
    name: 'Button Background',
    x: w / 2 - 80, y: 10, width: 160, height: 44,
    fill: '#0EA5E9', cornerRadius: 22, stroke: '', strokeWidth: 0,
  });
  const triggerText = createText({
    name: 'Button Label',
    x: w / 2 - 80, y: 20, width: 160, height: 24,
    text: 'Open Sheet', fontSize: 16, fontStyle: 'bold', fill: '#FFFFFF', align: 'center',
  });

  const sheetBg = createRect({
    name: 'Sheet Background',
    x: 0, y: 0, width: w, height: 280,
    fill: '#FFFFFF', cornerRadius: 16, stroke: '#E5E7EB', strokeWidth: 1,
  });
  const dragHandle = createRect({
    name: 'Drag Handle',
    x: w / 2 - 20, y: 8, width: 40, height: 4,
    fill: '#D1D5DB', cornerRadius: 2, stroke: '', strokeWidth: 0,
  });
  const sheetTitle = createText({
    name: 'Sheet Title',
    x: 20, y: 28, width: w - 40, height: 28,
    text: 'Sheet Title', fontSize: 20, fontStyle: 'bold', fill: '#111111', align: 'left',
  });
  const sheetBody = createText({
    name: 'Sheet Body',
    x: 20, y: 64, width: w - 40, height: 80,
    text: 'This is the bottom sheet content. Users can swipe down to dismiss.',
    fontSize: 15, fill: '#6B7280', align: 'left',
  });

  const triggerChildren: StaticDesignObject[] = [triggerBg, triggerText];
  const contentChildren: StaticDesignObject[] = [sheetBg, dragHandle, sheetTitle, sheetBody];
  const allChildren = [...triggerChildren, ...contentChildren];

  const config: BottomSheetConfig = {
    sheetHeightPercent: 60,
    backdropOpacity: 0.4,
    slideDuration: 300,
    dismissOnBackdropTap: true,
  };

  return createInteractiveBase({
    name: 'Bottom Sheet',
    x, y, width: w, height: h,
    interactionType: 'bottom-sheet',
    interactionConfig: config,
    groups: [
      { role: 'trigger', label: 'Trigger', objectIds: triggerChildren.map((c) => c.id) },
      { role: 'content', label: 'Content', objectIds: contentChildren.map((c) => c.id) },
    ],
    childIds: allChildren.map((c) => c.id),
    children: allChildren,
  });
}

export function createExpandable(cx: number, cy: number): InteractiveComponentObject {
  const w = 320;
  const h = 200;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const headerBg = createRect({
    name: 'Header Background',
    x: 0, y: 0, width: w, height: 52,
    fill: '#F3F4F6', cornerRadius: 12, stroke: '#E5E7EB', strokeWidth: 1,
  });
  const headerTitle = createText({
    name: 'Header Title',
    x: 16, y: 14, width: w - 60, height: 24,
    text: 'Expandable Section', fontSize: 16, fontStyle: 'bold', fill: '#111111', align: 'left',
  });
  const chevron = createText({
    name: 'Chevron',
    x: w - 36, y: 14, width: 24, height: 24,
    text: '▼', fontSize: 14, fill: '#9CA3AF', align: 'center',
  });

  const bodyBg = createRect({
    name: 'Body Background',
    x: 0, y: 0, width: w, height: 120,
    fill: '#FFFFFF', cornerRadius: 12, stroke: '#E5E7EB', strokeWidth: 1,
  });
  const bodyText = createText({
    name: 'Body Text',
    x: 16, y: 12, width: w - 32, height: 80,
    text: 'This content is revealed when the section is expanded. Tap the header to toggle.',
    fontSize: 15, fill: '#6B7280', align: 'left',
  });

  const headerChildren: StaticDesignObject[] = [headerBg, headerTitle, chevron];
  const bodyChildren: StaticDesignObject[] = [bodyBg, bodyText];
  const allChildren = [...headerChildren, ...bodyChildren];

  const config: ExpandableConfig = {
    defaultExpanded: false,
    expandDuration: 300,
    easing: 'ease-in-out',
  };

  return createInteractiveBase({
    name: 'Expandable',
    x, y, width: w, height: h,
    interactionType: 'expandable',
    interactionConfig: config,
    groups: [
      { role: 'header', label: 'Header', objectIds: headerChildren.map((c) => c.id) },
      { role: 'body', label: 'Body', objectIds: bodyChildren.map((c) => c.id) },
    ],
    childIds: allChildren.map((c) => c.id),
    children: allChildren,
  });
}

export function createEntrance(cx: number, cy: number): InteractiveComponentObject {
  const w = 360;
  const h = 300;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const cards: StaticDesignObject[] = [];
  const colors = ['#7B68EE', '#0EA5E9', '#22C55E'];
  const titles = ['Card One', 'Card Two', 'Card Three'];

  for (let i = 0; i < 3; i++) {
    const cardBg = createRect({
      name: `Card ${i + 1} Background`,
      x: 0, y: i * 90, width: w, height: 80,
      fill: colors[i], cornerRadius: 12, stroke: '', strokeWidth: 0,
    });
    const cardTitle = createText({
      name: `Card ${i + 1} Title`,
      x: 20, y: i * 90 + 28, width: w - 40, height: 24,
      text: titles[i], fontSize: 18, fontStyle: 'bold', fill: '#FFFFFF', align: 'left',
    });
    cards.push(cardBg, cardTitle);
  }

  const config: EntranceConfig = {
    animation: 'slide-up',
    duration: 500,
    staggerDelay: 100,
    trigger: 'on-load',
  };

  return createInteractiveBase({
    name: 'Entrance Animation',
    x, y, width: w, height: h,
    interactionType: 'entrance',
    interactionConfig: config,
    groups: [
      { role: 'content', label: 'Content', objectIds: cards.map((c) => c.id) },
    ],
    childIds: cards.map((c) => c.id),
    children: cards,
  });
}

// ─── New interactive components ─────────────────────────────

export function createCarousel(cx: number, cy: number): InteractiveComponentObject {
  const w = 340;
  const h = 240;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const slideColors = ['#7B68EE', '#0EA5E9', '#22C55E'];
  const slideTitles = ['Slide One', 'Slide Two', 'Slide Three'];

  const allChildren: StaticDesignObject[] = [];
  const groups: { role: string; label: string; objectIds: string[] }[] = [];

  for (let i = 0; i < 3; i++) {
    const bg = createRect({
      name: `Slide ${i + 1} Background`,
      x: 0, y: 0, width: w, height: h,
      fill: slideColors[i], cornerRadius: 16, stroke: '', strokeWidth: 0,
    });
    const title = createText({
      name: `Slide ${i + 1} Title`,
      x: 20, y: h / 2 - 20, width: w - 40, height: 40,
      text: slideTitles[i], fontSize: 24, fontStyle: 'bold', fill: '#FFFFFF', align: 'center',
    });
    const slideChildren = [bg, title];
    allChildren.push(...slideChildren);
    groups.push({
      role: `slide-${i}`,
      label: `Slide ${i + 1}`,
      objectIds: slideChildren.map((c) => c.id),
    });
  }

  const config: CarouselConfig = {
    autoPlay: false,
    autoPlayInterval: 3000,
    showDots: true,
    showArrows: true,
    transitionDuration: 300,
  };

  return createInteractiveBase({
    name: 'Carousel',
    x, y, width: w, height: h,
    interactionType: 'carousel',
    interactionConfig: config,
    groups,
    childIds: allChildren.map((c) => c.id),
    children: allChildren,
  });
}

export function createTabs(cx: number, cy: number): InteractiveComponentObject {
  const w = 340;
  const h = 280;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const tabLabels = ['Tab One', 'Tab Two', 'Tab Three'];
  const tabColors = ['#F0EBFF', '#E0F2FE', '#ECFDF5'];

  const allChildren: StaticDesignObject[] = [];
  const groups: { role: string; label: string; objectIds: string[] }[] = [];

  for (let i = 0; i < 3; i++) {
    const bg = createRect({
      name: `Tab ${i + 1} Content Background`,
      x: 0, y: 44, width: w, height: h - 44,
      fill: tabColors[i], cornerRadius: 12, stroke: '#E8E8F0', strokeWidth: 1,
    });
    const tabHeader = createRect({
      name: `Tab ${i + 1} Header`,
      x: i * (w / 3), y: 0, width: w / 3, height: 40,
      fill: i === 0 ? '#7B68EE' : '#F3F4F6', cornerRadius: 8, stroke: '', strokeWidth: 0,
    });
    const tabLabel = createText({
      name: `Tab ${i + 1} Label`,
      x: i * (w / 3), y: 10, width: w / 3, height: 20,
      text: tabLabels[i], fontSize: 14, fontStyle: 'bold',
      fill: i === 0 ? '#FFFFFF' : '#6B7280', align: 'center',
    });
    const contentText = createText({
      name: `Tab ${i + 1} Content`,
      x: 20, y: 64, width: w - 40, height: 80,
      text: `Content for ${tabLabels[i]}. Add your material here.`,
      fontSize: 15, fill: '#6B7280', align: 'left',
    });
    const tabChildren = [bg, tabHeader, tabLabel, contentText];
    allChildren.push(...tabChildren);
    groups.push({
      role: `tab-${i}`,
      label: tabLabels[i],
      objectIds: tabChildren.map((c) => c.id),
    });
  }

  const config: TabsConfig = {
    defaultTab: 0,
    tabPosition: 'top',
    tabStyle: 'underline',
  };

  return createInteractiveBase({
    name: 'Tabs',
    x, y, width: w, height: h,
    interactionType: 'tabs',
    interactionConfig: config,
    groups,
    childIds: allChildren.map((c) => c.id),
    children: allChildren,
  });
}

export function createQuiz(cx: number, cy: number): InteractiveComponentObject {
  const w = 340;
  const h = 320;
  const x = cx - w / 2;
  const y = cy - h / 2;

  // Question group
  const questionBg = createRect({
    name: 'Question Background',
    x: 0, y: 0, width: w, height: h,
    fill: '#FBF9FF', cornerRadius: 16, stroke: '#E8E0F0', strokeWidth: 1,
  });
  const questionTitle = createText({
    name: 'Question Text',
    x: 20, y: 20, width: w - 40, height: 40,
    text: 'What is the answer?', fontSize: 20, fontStyle: 'bold', fill: '#2D2D44', align: 'left',
  });

  const optionLabels = ['Option A', 'Option B', 'Option C', 'Option D'];
  const questionChildren: StaticDesignObject[] = [questionBg, questionTitle];

  for (let i = 0; i < 4; i++) {
    const optBg = createRect({
      name: `Option ${i + 1} Background`,
      x: 20, y: 80 + i * 52, width: w - 40, height: 44,
      fill: '#FFFFFF', cornerRadius: 12, stroke: '#E8E8F0', strokeWidth: 1,
    });
    const optText = createText({
      name: `Option ${i + 1} Label`,
      x: 36, y: 90 + i * 52, width: w - 72, height: 24,
      text: optionLabels[i], fontSize: 15, fill: '#2D2D44', align: 'left',
    });
    questionChildren.push(optBg, optText);
  }

  // Feedback group
  const feedbackBg = createRect({
    name: 'Feedback Background',
    x: 0, y: 0, width: w, height: 160,
    fill: '#ECFDF5', cornerRadius: 16, stroke: '#22C55E', strokeWidth: 1,
  });
  const feedbackTitle = createText({
    name: 'Feedback Title',
    x: 20, y: 30, width: w - 40, height: 32,
    text: 'Correct!', fontSize: 24, fontStyle: 'bold', fill: '#22C55E', align: 'center',
  });
  const feedbackBody = createText({
    name: 'Feedback Body',
    x: 20, y: 70, width: w - 40, height: 60,
    text: 'Great job! You selected the right answer.',
    fontSize: 15, fill: '#6B7280', align: 'center',
  });

  const feedbackChildren: StaticDesignObject[] = [feedbackBg, feedbackTitle, feedbackBody];
  const allChildren = [...questionChildren, ...feedbackChildren];

  const config: QuizConfig = {
    questionText: 'What is the answer?',
    options: optionLabels,
    correctIndex: 0,
    showFeedback: true,
    feedbackCorrect: 'Great job! You selected the right answer.',
    feedbackIncorrect: 'Not quite. Try again!',
  };

  return createInteractiveBase({
    name: 'Quiz',
    x, y, width: w, height: h,
    interactionType: 'quiz',
    interactionConfig: config,
    groups: [
      { role: 'question', label: 'Question', objectIds: questionChildren.map((c) => c.id) },
      { role: 'feedback', label: 'Feedback', objectIds: feedbackChildren.map((c) => c.id) },
    ],
    childIds: allChildren.map((c) => c.id),
    children: allChildren,
  });
}
