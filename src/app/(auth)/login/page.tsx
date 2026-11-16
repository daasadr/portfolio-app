'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/lib/directus';
import { useLocale } from '@/components/LocaleProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export default function LoginPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const router = useRouter();

  const invalidEmailMsg = t('Neplatná e-mailová adresa', 'Invalid email address');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError(invalidEmailMsg);
      return;
    }
    setIsLoading(true);
    setError('');
    setEmailError('');

    try {
      await login(email, password, remember);
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('INVALID_CREDENTIALS') || msg.includes('Invalid user credentials')) {
        setError(t('Nesprávný email nebo heslo.', 'Incorrect email or password.'));
      } else if (msg.includes('INVALID_IP') || msg.includes('too many')) {
        setError(t('Příliš mnoho pokusů. Zkuste to za chvíli.', 'Too many attempts. Please try again in a moment.'));
      } else {
        setError(t('Přihlášení se nezdařilo. Zkontrolujte email a heslo.', 'Login failed. Please check your email and password.'));
      }
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
          <CardTitle className="text-2xl font-bold">{t('Přihlášení', 'Log in')}</CardTitle>
          <CardDescription>
            {t('Přihlaste se do svého portfolia', 'Log in to your portfolio')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                onBlur={() => email && !isValidEmail(email) && setEmailError(invalidEmailMsg)}
                required
                placeholder={t('vas@email.cz', 'you@example.com')}
                className={emailError ? 'border-red-400 focus-visible:ring-red-300' : ''}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('Heslo', 'Password')}</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <Label htmlFor="remember" className="font-normal cursor-pointer select-none text-gray-700">
                {t('Pamatovat si přihlášení', 'Keep me logged in')}
              </Label>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('Přihlašuji...', 'Logging in...') : t('Přihlásit se', 'Log in')}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-1.5">
            <p className="text-sm text-gray-600">
              {t('Nemáte účet?', "Don't have an account?")}{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                {t('Zaregistrujte se', 'Sign up')}
              </a>
            </p>
            <p className="text-sm">
              <a href="/forgot-password" className="text-gray-400 hover:text-gray-600 hover:underline">
                {t('Zapomněli jste heslo?', 'Forgotten your password?')}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
