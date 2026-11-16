'use client';

import { Input } from '@/components/ui/input';
import { SECURITY_QUESTIONS, CUSTOM_QUESTION, CUSTOM_QUESTION_MAX } from '@/lib/security-questions';
import { useLocale } from '@/components/LocaleProvider';

/** Question dropdown with an "own question" option, plus the answer field. */
export function SecurityQuestionPicker({ question, onQuestion, customText, onCustomText, answer, onAnswer }: {
  question: number;
  onQuestion: (q: number) => void;
  customText: string;
  onCustomText: (t: string) => void;
  answer: string;
  onAnswer: (a: string) => void;
}) {
  const { t } = useLocale();
  const isCustom = question === CUSTOM_QUESTION;
  return (
    <div className="space-y-2">
      <select
        value={question}
        onChange={e => onQuestion(Number(e.target.value))}
        aria-label={t('Bezpečnostní otázka', 'Security question')}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value={-1} disabled>{t('— Vyberte otázku —', '— Choose a question —')}</option>
        {SECURITY_QUESTIONS.map((q, i) => (
          <option key={i} value={i}>{t(q)}</option>
        ))}
        <option value={CUSTOM_QUESTION}>{t('✏️ Napíšu si vlastní otázku…', '✏️ I’ll write my own question…')}</option>
      </select>
      {isCustom && (
        <div className="space-y-1">
          <Input
            value={customText}
            onChange={e => onCustomText(e.target.value)}
            maxLength={CUSTOM_QUESTION_MAX}
            placeholder={t('Např. Jak se jmenovala babiččina kočka?', "E.g. What was your grandma's cat called?")}
            autoFocus
          />
          <p className="text-xs text-gray-500">
            {t(
              'Otázku uvidí každý, kdo zadá váš e-mail při obnově hesla — odpověď by měla znát jen vy.',
              'Anyone who enters your email when resetting the password will see the question — only you should know the answer.',
            )}
          </p>
        </div>
      )}
      <Input
        value={answer}
        onChange={e => onAnswer(e.target.value)}
        placeholder={t('Vaše odpověď...', 'Your answer...')}
        maxLength={200}
        disabled={question < 0}
      />
      <p className="text-xs text-gray-500">{t('Odpověď není citlivá na velká/malá písmena.', "The answer isn't case-sensitive.")}</p>
    </div>
  );
}
