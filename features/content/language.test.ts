// Tests for source-language detection. Run with `npm test`.
import { describe, it, expect } from '@jest/globals';
import { detectLanguage, storedLanguage } from './language';

describe('detectLanguage', () => {
  it('recognizes Spanish source text', () => {
    const es = 'Hablar con los maestros sobre las citas médicas de su hijo puede parecer difícil. ' +
      '¿Por dónde empezar? Es importante mantener una comunicación abierta para que la escuela pueda ayudar.';
    expect(detectLanguage(es)).toBe('es');
  });

  it('recognizes English source text', () => {
    const en = 'Talking to teachers about your child\'s medical appointments can feel hard. ' +
      'Where do you start? It is important to keep communication open so the school can help.';
    expect(detectLanguage(en)).toBe('en');
  });

  it("doesn't guess from too little text or a mix", () => {
    expect(detectLanguage('Hola')).toBeUndefined();
    expect(detectLanguage('')).toBeUndefined();
    const mixed = 'The school can help with the plan. La escuela puede ayudar con el plan para su hijo.';
    expect(detectLanguage(mixed)).toBeUndefined();
  });

  it('stores English as no language', () => {
    expect(storedLanguage('en')).toBeUndefined();
    expect(storedLanguage('es')).toBe('es');
    expect(storedLanguage(undefined)).toBeUndefined();
  });
});
