'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, X, Mail, ChevronDown } from 'lucide-react';
import { SECURITY_QUESTIONS } from '@/lib/security-questions';

function getStrength(pwd: string) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { score: 1, label: 'Slabé', color: 'bg-red-400' };
  if (s === 2) return { score: 2, label: 'Slušné', color: 'bg-yellow-400' };
  if (s === 3) return { score: 3, label: 'Dobré', color: 'bg-blue-400' };
  return { score: 4, label: 'Silné', color: 'bg-green-500' };
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'question' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminInfo, setShowAdminInfo] = useState(false);

  const strength = getStrength(newPassword);
  const passwordsMatch = confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reset-password?email=${encodeURIComponent(email)}`);
      const data = await res.json() as { security_question?: number; message?: string };
      if (!res.ok) {
        setError(data.message ?? 'Účet s tímto emailem nebyl nalezen.');
        return;
      }
      setQuestionIndex(data.security_question!);
      setStep('question');
    } catch {
      setError('Chyba připojení. Zkuste to znovu.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordsMatch) { setError('Hesla se neshodují.'); return; }
    if (newPassword.length < 8) { setError('Heslo musí mít alespoň 8 znaků.'); return; }
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
        setError(data.message ?? 'Chyba při obnovení hesla.');
        return;
      }
      setStep('done');
    } catch {
      setError('Chyba připojení. Zkuste to znovu.');
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

      <Card className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Obnovení hesla</CardTitle>
          <CardDescription>
            {step === 'email' && 'Zadejte e-mail svého účtu'}
            {step === 'question' && 'Odpovězte na bezpečnostní otázku'}
            {step === 'done' && 'Heslo bylo úspěšně změněno'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vas@email.cz"
                />
              </div>
              {error && <p className="text-red-600 text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Hledám účet...' : 'Pokračovat'}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> Zpět na přihlášení
                </Link>
              </div>
            </form>
          )}

          {step === 'question' && questionIndex != null && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">Bezpečnostní otázka:</p>
                <p>{SECURITY_QUESTIONS[questionIndex]}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="answer">Vaše odpověď</Label>
                <Input
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  placeholder="Zadejte odpověď..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nové heslo</Label>
                <Input
                  id="newPassword"
                  type="password"
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
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Potvrdit nové heslo</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={passwordsMismatch ? 'border-red-400' : passwordsMatch ? 'border-green-400' : ''}
                />
                {passwordsMatch && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Hesla se shodují</p>}
                {passwordsMismatch && <p className="text-xs text-red-500 flex items-center gap-1"><X className="h-3 w-3" /> Hesla se neshodují</p>}
              </div>

              {error && <p className="text-red-600 text-sm text-center">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading || !!passwordsMismatch}>
                {isLoading ? 'Měním heslo...' : 'Nastavit nové heslo'}
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm">Vaše heslo bylo úspěšně změněno. Můžete se nyní přihlásit.</p>
              <Link href="/login">
                <Button className="w-full">Přejít na přihlášení</Button>
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
                Nepamatujete si ani odpověď na bezpečnostní otázku?
                <ChevronDown className={`h-3 w-3 transition-transform ${showAdminInfo ? 'rotate-180' : ''}`} />
              </button>
              {showAdminInfo && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 space-y-1.5">
                  <p>Napište e-mail správci aplikace:</p>
                  <p className="font-mono font-semibold select-all">daasa.d@seznam.cz</p>
                  <p className="text-xs text-blue-700">Do předmětu napište přesně:</p>
                  <p className="font-mono font-semibold select-all text-xs">PORTFOLIO-PARADISE OBNOVENÍ HESLA</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
