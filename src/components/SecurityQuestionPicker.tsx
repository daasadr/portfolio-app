'use client';

import { Input } from '@/components/ui/input';
import { SECURITY_QUESTIONS, CUSTOM_QUESTION, CUSTOM_QUESTION_MAX } from '@/lib/security-questions';

/** Question dropdown with an "own question" option, plus the answer field. */
export function SecurityQuestionPicker({ question, onQuestion, customText, onCustomText, answer, onAnswer }: {
  question: number;
  onQuestion: (q: number) => void;
  customText: string;
  onCustomText: (t: string) => void;
  answer: string;
  onAnswer: (a: string) => void;
}) {
  const isCustom = question === CUSTOM_QUESTION;
  return (
    <div className="space-y-2">
      <select
        value={question}
        onChange={e => onQuestion(Number(e.target.value))}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value={-1} disabled>— Vyberte otázku —</option>
        {SECURITY_QUESTIONS.map((q, i) => (
          <option key={i} value={i}>{q}</option>
        ))}
        <option value={CUSTOM_QUESTION}>✏️ Napíšu si vlastní otázku…</option>
      </select>
      {isCustom && (
        <div className="space-y-1">
          <Input
            value={customText}
            onChange={e => onCustomText(e.target.value)}
            maxLength={CUSTOM_QUESTION_MAX}
            placeholder="Např. Jak se jmenovala babiččina kočka?"
            autoFocus
          />
          <p className="text-xs text-gray-500">
            Otázku uvidí každý, kdo zadá váš e-mail při obnově hesla — odpověď by měla znát jen vy.
          </p>
        </div>
      )}
      <Input
        value={answer}
        onChange={e => onAnswer(e.target.value)}
        placeholder="Vaše odpověď..."
        maxLength={200}
        disabled={question < 0}
      />
      <p className="text-xs text-gray-500">Odpověď není citlivá na velká/malá písmena.</p>
    </div>
  );
}
