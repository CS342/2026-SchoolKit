// Phase 2 generation test — NOT hand-designed like finances. This is the output of
// following PLAYBOOK.md for the prompt: "Create a page to help students returning to
// school after cancer treatment — what might feel different, a plan for going back,
// and point them to our other resources." Grounded on ALL_RESOURCES (resourceRefList)
// with no invented links. Used to judge generation fidelity against the finances bar.
import type { ContentDoc } from '../types';

export const returnToSchoolDoc: ContentDoc = {
  schemaVersion: 1,
  slug: 'return-to-school',
  title: 'Returning to School After Treatment',
  accent: 'primary',
  category: 'School',
  tags: ['school', 'back to school', 'return', 'fatigue', '504 plan', 'friends', 'support', 'transition'],
  shareMessage:
    'Read "Returning to School After Treatment" on SchoolKit — what might feel different, a plan for going back, and who can help.',
  blocks: [
    {
      id: 'hero',
      type: 'hero',
      eyebrow: 'Back to School',
      eyebrowIcon: 'school-outline',
      eyebrowColor: 'sky',
      titleParts: [{ text: 'Returning to ' }, { text: 'School', accent: true }, { text: ' After Treatment' }],
    },
    {
      id: 'intro',
      type: 'callout',
      icon: 'sparkles-outline',
      text:
        "Going back to school is a big step — exciting and a little nerve-wracking at the same time. There's no rush and no single right way to do it. With a few people in your corner and a simple plan, you'll find your rhythm again.",
    },
    {
      id: 'different',
      type: 'accordion',
      heading: 'What Might Feel Different',
      subheading: 'Tap each one to see what helps.',
      items: [
        { id: 'd1', title: 'Energy & focus', icon: 'battery-half-outline', color: 'teal',
          summary: 'You may tire faster than you used to, especially at first.',
          body: "That's normal, and it gets better. Ask about a shorter day, rest breaks, or a lighter schedule to start — the school nurse can help set this up." },
        { id: 'd2', title: 'Catching up on work', icon: 'book-outline', color: 'sky',
          summary: 'Missed schoolwork can feel like a mountain.',
          body: "You don't have to catch up all at once. A 504 plan can give you extra time, tutoring, and adjusted deadlines so the pace works for you." },
        { id: 'd3', title: 'Friends & questions', icon: 'chatbubbles-outline', color: 'coral',
          summary: 'Classmates may not know what to say.',
          body: "You decide how much to share. A simple line — 'I was sick, and I'm doing better now' — is plenty. Your counselor can help set the tone." },
        { id: 'd4', title: 'Looking or feeling different', icon: 'happy-outline', color: 'indigo',
          summary: 'Hair, weight, or a port can make you feel self-conscious.',
          body: 'Wear and do what feels like you. Most classmates notice far less than you fear — and the people who matter will have your back.' },
      ],
    },
    {
      id: 'plan',
      type: 'stepper',
      heading: 'Your Return-to-School Plan',
      subheading: 'A few steps that make the first weeks smoother.',
      steps: [
        { id: 'p1', title: 'Meet with the School Nurse', icon: 'medkit-outline', color: 'sky',
          detail: 'Before your first day back, meet the school nurse. Share what you need — medicines, rest, a place to go if you feel unwell.\n\nThey become your go-to person on campus and can quietly smooth a lot of the day-to-day.' },
        { id: 'p2', title: 'Set Up a 504 Plan', icon: 'document-text-outline', color: 'teal',
          detail: 'A 504 plan puts your accommodations in writing — extra time, a lighter load, excused absences for appointments.\n\nAsk your counselor how to start one. It protects you even on the days you feel fine.' },
        { id: 'p3', title: 'Plan What to Share', icon: 'chatbubbles-outline', color: 'coral',
          detail: "Decide ahead of time how much you want classmates to know — it's completely your call.\n\nHaving a short, comfortable answer ready takes the pressure off in the moment." },
        { id: 'p4', title: 'Ease In Gradually', icon: 'calendar-outline', color: 'amber',
          detail: 'Half days or a few classes at first is a strong start, not a step back.\n\nAdd more as your energy returns. Going at your pace helps you stay in school, not miss more of it.' },
        { id: 'p5', title: 'Line Up Your People', icon: 'people-outline', color: 'indigo',
          detail: 'Pick a teacher, counselor, or friend who checks in with you.\n\nKnowing one person has your back makes a big room feel a lot smaller.' },
      ],
    },
    {
      id: 'affirm',
      type: 'quote',
      text: "You don't have to be exactly who you were before. You get to decide who you are now.",
    },
    {
      id: 'resources',
      type: 'resourceRefList',
      heading: 'Keep These Handy',
      subheading: 'Other SchoolKit guides that pair well with going back.',
      resourceIds: ['13', '14', '12', '17', '15'],
    },
    {
      id: 'note',
      type: 'footnote',
      text:
        "Every student's situation is different. Work with your care team and school to build the plan that's right for you.",
    },
    { id: 'recs', type: 'recommendations' },
  ],
};
