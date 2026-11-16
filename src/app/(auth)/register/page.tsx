'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, ShieldQuestion } from 'lucide-react';
import { register } from '@/lib/directus';
import { CUSTOM_QUESTION } from '@/lib/security-questions';
import { SecurityQuestionPicker } from '@/components/SecurityQuestionPicker';
import { useLocale } from '@/components/LocaleProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { L10n } from '@/lib/i18n';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

interface StrengthResult { score: number; label: L10n; color: string }

function getStrength(pwd: string): StrengthResult {
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

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </li>
  );
}

export default function RegisterPage() {
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '',
  });
  const [securityQuestion, setSecurityQuestion] = useState<number>(-1);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityQuestionText, setSecurityQuestionText] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const strength = getStrength(formData.password);
  const emailError = emailTouched && formData.email && !isValidEmail(formData.email);
  const passwordsMatch = formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  const req = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!isValidEmail(formData.email)) {
      setError(t('Zadejte platnou e-mailovou adresu.', 'Please enter a valid email address.'));
      return;
    }
    if (!req.length) {
      setError(t('Heslo musí mít alespoň 8 znaků.', 'The password must be at least 8 characters long.'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('Hesla se neshodují.', "The passwords don't match."));
      return;
    }
    if (securityQuestion < 0) {
      setError(t('Vyberte bezpečnostní otázku pro obnovu hesla.', 'Please choose a security question for password recovery.'));
      return;
    }
    if (securityQuestion === CUSTOM_QUESTION && securityQuestionText.trim().length < 5) {
      setError(t('Napište svou bezpečnostní otázku (alespoň 5 znaků).', 'Write your own security question (at least 5 characters).'));
      return;
    }
    if (!securityAnswer.trim()) {
      setError(t('Vyplňte odpověď na bezpečnostní otázku.', 'Please fill in the answer to the security question.'));
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await register(formData.email, formData.password, formData.firstName, formData.lastName, securityQuestion, securityAnswer, securityQuestionText);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Chyba při registraci. Zkuste to znovu.', 'Sign-up failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="fixed inset-0 z-0">
        <Image src="/images/paradise-bg.webp" alt="" fill className="object-cover" priority quality={85} />
        <div className="absolute inset-0 bg-white/20" />
      </div>
      <div className="fixed top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('Registrace', 'Sign up')}</CardTitle>
          <CardDescription>{t('Vytvořte si účet pro své portfolio', 'Create an account for your portfolio')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">{t('Jméno', 'First name')}</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder={t('Jan', 'John')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">{t('Příjmení', 'Last name')}</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder={t('Novák', 'Smith')} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('E-mail', 'Email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => setEmailTouched(true)}
                required
                placeholder={t('jan.novak@email.cz', 'john.smith@example.com')}
                className={emailError ? 'border-red-400 focus-visible:ring-red-300' : ''}
              />
              {emailError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <X className="h-3 w-3" /> {t('Neplatná e-mailová adresa', 'Invalid email address')}
                </p>
              )}
            </div>

            {/* Heslo */}
            <div className="space-y-1.5">
              <Label htmlFor="password">{t('Heslo', 'Password')}</Label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />

              {/* Strength bar */}
              {formData.password && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          i <= strength.score ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.score <= 1 ? 'text-red-500' :
                    strength.score === 2 ? 'text-yellow-600' :
                    strength.score === 3 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {t(strength.label)}
                  </p>
                  <ul className="space-y-0.5">
                    <Req ok={req.length} label={t('Alespoň 8 znaků', 'At least 8 characters')} />
                    <Req ok={req.upper} label={t('Alespoň jedno velké písmeno', 'At least one capital letter')} />
                    <Req ok={req.number} label={t('Alespoň jedna číslice', 'At least one number')} />
                  </ul>
                </div>
              )}
            </div>

            {/* Potvrdit heslo */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">{t('Potvrdit heslo', 'Confirm password')}</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className={passwordsMismatch ? 'border-red-400 focus-visible:ring-red-300' : passwordsMatch ? 'border-green-400' : ''}
              />
              {passwordsMatch && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {t('Hesla se shodují', 'Passwords match')}
                </p>
              )}
              {passwordsMismatch && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <X className="h-3 w-3" /> {t('Hesla se neshodují', "Passwords don't match")}
                </p>
              )}
            </div>

            {/* Bezpečnostní otázka */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <ShieldQuestion className="h-4 w-4 text-blue-500" />
                {t('Bezpečnostní otázka pro obnovu hesla', 'Security question for password recovery')}
              </div>
              <p className="text-xs text-gray-400">{t('Použijete ji, pokud zapomenete heslo.', "You'll use it if you forget your password.")}</p>
              <SecurityQuestionPicker
                question={securityQuestion}
                onQuestion={setSecurityQuestion}
                customText={securityQuestionText}
                onCustomText={setSecurityQuestionText}
                answer={securityAnswer}
                onAnswer={setSecurityAnswer}
              />
            </div>

            {/* Souhlas se zpracováním osobních údajů (GDPR čl. 6) */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={e => setConsentAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                required
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                {t('Souhlasím se', 'I agree to the')}{' '}
                <a href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">
                  {t('zpracováním osobních údajů', 'processing of my personal data')}
                </a>{' '}
                {t(
                  'za účelem provozování portfolia. Souhlas mohu kdykoli odvolat smazáním účtu.',
                  'for the purpose of running the portfolio. I can withdraw my consent at any time by deleting my account.',
                )}
              </span>
            </label>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading || !consentAccepted}>
              {isLoading ? t('Registruji...', 'Signing up...') : t('Zaregistrovat se', 'Sign up')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {t('Už máte účet?', 'Already have an account?')}{' '}
              <a href="/login" className="text-blue-600 hover:underline">{t('Přihlaste se', 'Log in')}</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
