'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, X, ChevronDown } from 'lucide-react';
import { questionLabel } from '@/lib/security-questions';
import { useLocale } from '@/components/LocaleProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { L10n } from '@/lib/i18n';

function getStrength(pwd: string): { score: number; label: L10n; color: string } {
  if (!pwd) return { score: 0, label: { cs: '', en: '' }, color: '' };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { score: 1, label: { cs: 'Slabé', en: 'Weak' }, color: 'bg-red-400' };
  if (s === 2) return { score: 2, label: { cs: 'Slušné', en: 'Fair' }, color: 'bg-yellow-400' };
  if (s === 3) return { score: 3, label: { cs: 'Dobré', en: 'Good' }, color: 'bg-blue-400' };
  return { score: 4, label: { cs: 'Silné', en: 'Strong' }, color: 'bg-green-500' };
}

export default function ForgotPasswordPage() {
  const { t, locale } = useLocale();
  const [step, setStep] = useState<'email' | 'question' | 'done'>('email');
  const [email, setEmail] = useState('');
  // Stored as index + custom text so the label follows the language switcher
  const [question, setQuestion] = useState<{ index: number; text: string | null } | null>(null);
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminInfo, setShowAdminInfo] = useState(false);

  const questionText = question ? questionLabel(question.index, question.text, locale) : null;
  const strength = getStrength(newPassword);
  const passwordsMatch = confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reset-password?email=${encodeURIComponent(email)}`);
      const data = await res.json() as { security_question: number | null; security_question_text?: string | null };
      if (data.security_question === null || !questionLabel(data.security_question, data.security_question_text, locale)) {
        setError(t(
          'Pokud je e-mail zaregistrován a má nastavenou bezpečnostní otázku, zobrazí se formulář. Jinak kontaktujte správce.',
          'If the email is registered and has a security question set, the form will appear. Otherwise, please contact the administrator.',
        ));
        return;
      }
      setQuestion({ index: data.security_question, text: data.security_question_text ?? null });
      setStep('question');
    } catch {
      setError(t('Chyba připojení. Zkuste to znovu.', 'Connection error. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordsMatch) { setError(t('Hesla se neshodují.', "The passwords don't match.")); return; }
    if (newPassword.length < 8) { setError(t('Heslo musí mít alespoň 8 znaků.', 'The password must be at least 8 characters long.')); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answer, newPassword }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) {
        setError(data.message ?? t('Chyba při obnovení hesla.', 'Could not reset the password.'));
        return;
      }
      setStep('done');
    } catch {
      setError(t('Chyba připojení. Zkuste to znovu.', 'Connection error. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative">
      <div className="fixed inset-0 z-0">
        <Image src="/images/paradise-bg.webp" alt="" fill className="object-cover" priority quality={85} />
        <div className="absolute inset-0 bg-white/20" />
      </div>
      <div className="fixed top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('Obnovení hesla', 'Reset password')}</CardTitle>
          <CardDescription>
            {step === 'email' && t('Zadejte e-mail svého účtu', 'Enter the email of your account')}
            {step === 'question' && t('Odpovězte na bezpečnostní otázku', 'Answer your security question')}
            {step === 'done' && t('Heslo bylo úspěšně změněno', 'Your password has been changed')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('E-mail', 'Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('vas@email.cz', 'you@example.com')}
                />
              </div>
              {error && <p className="text-red-600 text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('Hledám účet...', 'Looking for your account...') : t('Pokračovat', 'Continue')}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> {t('Zpět na přihlášení', 'Back to log in')}
                </Link>
              </div>
            </form>
          )}

          {step === 'question' && questionText && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">{t('Bezpečnostní otázka:', 'Security question:')}</p>
                <p>{questionText}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="answer">{t('Vaše odpověď', 'Your answer')}</Label>
                <Input
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  placeholder={t('Zadejte odpověď...', 'Type your answer...')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">{t('Nové heslo', 'New password')}</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                {newPassword && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-500' : strength.score === 2 ? 'text-yellow-600' : strength.score === 3 ? 'text-blue-600' : 'text-green-600'}`}>
                      {t(strength.label)}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">{t('Potvrdit nové heslo', 'Confirm new password')}</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={passwordsMismatch ? 'border-red-400' : passwordsMatch ? 'border-green-400' : ''}
                />
                {passwordsMatch && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> {t('Hesla se shodují', 'Passwords match')}</p>}
                {passwordsMismatch && <p className="text-xs text-red-500 flex items-center gap-1"><X className="h-3 w-3" /> {t('Hesla se neshodují', "Passwords don't match")}</p>}
              </div>

              {error && <p className="text-red-600 text-sm text-center">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading || !!passwordsMismatch}>
                {isLoading ? t('Měním heslo...', 'Changing password...') : t('Nastavit nové heslo', 'Set new password')}
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm">{t('Vaše heslo bylo úspěšně změněno. Můžete se nyní přihlásit.', 'Your password has been changed. You can log in now.')}</p>
              <Link href="/login">
                <Button className="w-full">{t('Přejít na přihlášení', 'Go to log in')}</Button>
              </Link>
            </div>
          )}

          {step !== 'done' && (
            <div className="mt-5 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAdminInfo(v => !v)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1"
              >
                {t('Nepamatujete si odpověď, nebo obnova nefunguje?', "Can't remember the answer, or the reset isn't working?")}
                <ChevronDown className={`h-3 w-3 transition-transform ${showAdminInfo ? 'rotate-180' : ''}`} />
              </button>
              {showAdminInfo && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 space-y-1.5">
                  <p>{t('Napište e-mail správci aplikace:', 'Email the app administrator:')}</p>
                  <p className="font-mono font-semibold select-all">{process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'daasa.d@seznam.cz'}</p>
                  <p className="text-xs text-blue-700">{t('Do předmětu napište přesně:', 'Use exactly this subject line:')}</p>
                  <p className="font-mono font-semibold select-all text-xs">{/* Exact subject the administrator filters on — intentionally not translated */}
                    PORTFOLIO-PARADISE OBNOVENÍ HESLA</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
