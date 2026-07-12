'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { register } from '@/lib/directus';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

interface StrengthResult { score: number; label: string; color: string }

function getStrength(pwd: string): StrengthResult {
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

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </li>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '',
  });
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
      setError('Zadejte platnou e-mailovou adresu.');
      return;
    }
    if (!req.length) {
      setError('Heslo musí mít alespoň 8 znaků.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Hesla se neshodují.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await register(formData.email, formData.password, formData.firstName, formData.lastName);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při registraci. Zkuste to znovu.');
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
      <Card className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Registrace</CardTitle>
          <CardDescription>Vytvořte si účet pro své portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Jméno</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Jan" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Příjmení</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Novák" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => setEmailTouched(true)}
                required
                placeholder="jan.novak@email.cz"
                className={emailError ? 'border-red-400 focus-visible:ring-red-300' : ''}
              />
              {emailError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <X className="h-3 w-3" /> Neplatná e-mailová adresa
                </p>
              )}
            </div>

            {/* Heslo */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                name="password"
                type="password"
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
                    {strength.label}
                  </p>
                  <ul className="space-y-0.5">
                    <Req ok={req.length} label="Alespoň 8 znaků" />
                    <Req ok={req.upper} label="Alespoň jedno velké písmeno" />
                    <Req ok={req.number} label="Alespoň jedna číslice" />
                  </ul>
                </div>
              )}
            </div>

            {/* Potvrdit heslo */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Potvrdit heslo</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className={passwordsMismatch ? 'border-red-400 focus-visible:ring-red-300' : passwordsMatch ? 'border-green-400' : ''}
              />
              {passwordsMatch && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Hesla se shodují
                </p>
              )}
              {passwordsMismatch && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <X className="h-3 w-3" /> Hesla se neshodují
                </p>
              )}
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registruji...' : 'Zaregistrovat se'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Už máte účet?{' '}
              <a href="/login" className="text-blue-600 hover:underline">Přihlaste se</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
