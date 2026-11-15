export const SECURITY_QUESTIONS = [
  'Jak se jmenoval váš první mazlíček?',
  'V jakém městě jste se narodili?',
  'Jaká je přezdívka vašeho nejlepšího přítele nebo sourozence?',
  'Jaký byl název vaší první školy nebo školky?',
  'Jaká je vaše oblíbená kniha nebo pohádka z dětství?',
];

/** `security_question` value meaning "the user wrote their own question" (text is in `security_question_text`). */
export const CUSTOM_QUESTION = 100;
export const CUSTOM_QUESTION_MIN = 5;
export const CUSTOM_QUESTION_MAX = 200;

/** Text of a stored question — predefined by index, or the user's own. */
export function questionLabel(index: number | null | undefined, customText?: string | null): string | null {
  if (index == null) return null;
  if (index === CUSTOM_QUESTION) return customText?.trim() || null;
  return SECURITY_QUESTIONS[index] ?? null;
}

/**
 * Validates a question choice from a form. Returns the values to store, or an error message.
 */
export function parseQuestionChoice(index: unknown, customText: unknown):
  { ok: true; security_question: number; security_question_text: string | null } | { ok: false; message: string } {
  if (index === CUSTOM_QUESTION) {
    const text = typeof customText === 'string' ? customText.trim().replace(/\s+/g, ' ') : '';
    if (text.length < CUSTOM_QUESTION_MIN) return { ok: false, message: 'Napište prosím vlastní otázku (alespoň 5 znaků).' };
    if (text.length > CUSTOM_QUESTION_MAX) return { ok: false, message: `Otázka může mít nejvýše ${CUSTOM_QUESTION_MAX} znaků.` };
    return { ok: true, security_question: CUSTOM_QUESTION, security_question_text: text };
  }
  if (typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < SECURITY_QUESTIONS.length) {
    return { ok: true, security_question: index, security_question_text: null };
  }
  return { ok: false, message: 'Vyberte bezpečnostní otázku.' };
}
