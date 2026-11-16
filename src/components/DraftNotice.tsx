'use client';

import { History } from 'lucide-react';
import { draftTimeLabel } from '@/lib/drafts';
import { useLocale } from '@/components/LocaleProvider';

/** Shown when a form was refilled from an autosaved draft. */
export function DraftNotice({ savedAt, onDiscard, discardLabel }: {
  savedAt: number;
  onDiscard: () => void;
  discardLabel?: string;
}) {
  const { t, locale } = useLocale();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
      <History className="h-4 w-4 shrink-0 text-sky-600" />
      <span className="flex-1 min-w-0">{t('Obnovili jsme tvůj rozepsaný text', 'We restored your unfinished text')} ({draftTimeLabel(savedAt, locale)}).</span>
      <button type="button" onClick={onDiscard} className="text-xs font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900">
        {discardLabel ?? t('Zahodit koncept', 'Discard draft')}
      </button>
    </div>
  );
}

/** Small "saved as draft" hint under a form. */
export function DraftHint() {
  const { t } = useLocale();
  return <p className="text-[11px] text-gray-400">{t('Rozepsaný text se průběžně ukládá v tomto prohlížeči.', 'Your unfinished text is saved in this browser as you type.')}</p>;
}
