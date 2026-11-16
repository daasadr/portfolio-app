import { tr, type L10n, type Locale } from '@/lib/i18n';

/** Stored by index — never reorder, only append. */
export const SECURITY_QUESTIONS: L10n[] = [
  { cs: 'Jak se jmenoval váš první mazlíček?', en: 'What was the name of your first pet?' },
  { cs: 'V jakém městě jste se narodili?', en: 'In which town or city were you born?' },
  { cs: 'Jaká je přezdívka vašeho nejlepšího přítele nebo sourozence?', en: 'What is the nickname of your best friend or sibling?' },
  { cs: 'Jaký byl název vaší první školy nebo školky?', en: 'What was the name of your first school or nursery?' },
  { cs: 'Jaká je vaše oblíbená kniha nebo pohádka z dětství?', en: 'What is your favourite childhood book or fairy tale?' },
];

/** `security_question` value meaning "the user wrote their own question" (text is in `security_question_text`). */
export const CUSTOM_QUESTION = 100;
export const CUSTOM_QUESTION_MIN = 5;
export const CUSTOM_QUESTION_MAX = 200;

/** Text of a stored question — predefined by index, or the user's own. */
export function questionLabel(index: number | null | undefined, customText: string | null | undefined, locale: Locale): string | null {
  if (index == null) return null;
  if (index === CUSTOM_QUESTION) return customText?.trim() || null;
  const q = SECURITY_QUESTIONS[index];
  return q ? tr(locale, q) : null;
}

/**
 * Validates a question choice from a form. Returns the values to store, or an error message.
 */
export function parseQuestionChoice(index: unknown, customText: unknown, locale: Locale):
  { ok: true; security_question: number; security_question_text: string | null } | { ok: false; message: string } {
  if (index === CUSTOM_QUESTION) {
    const text = typeof customText === 'string' ? customText.trim().replace(/\s+/g, ' ') : '';
    if (text.length < CUSTOM_QUESTION_MIN) {
      return { ok: false, message: tr(locale, 'Napište prosím vlastní otázku (alespoň 5 znaků).', 'Please write your own question (at least 5 characters).') };
    }
    if (text.length > CUSTOM_QUESTION_MAX) {
      return { ok: false, message: tr(locale, `Otázka může mít nejvýše ${CUSTOM_QUESTION_MAX} znaků.`, `The question can be at most ${CUSTOM_QUESTION_MAX} characters long.`) };
    }
    return { ok: true, security_question: CUSTOM_QUESTION, security_question_text: text };
  }
  if (typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < SECURITY_QUESTIONS.length) {
    return { ok: true, security_question: index, security_question_text: null };
  }
  return { ok: false, message: tr(locale, 'Vyberte bezpečnostní otázku.', 'Please choose a security question.') };
}
