'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/lib/directus';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('INVALID_CREDENTIALS') || msg.includes('Invalid user credentials')) {
        setError('Nesprávný email nebo heslo.');
      } else if (msg.includes('INVALID_IP') || msg.includes('too many')) {
        setError('Příliš mnoho pokusů. Zkuste to za chvíli.');
      } else {
        setError('Přihlášení se nezdařilo. Zkontrolujte email a heslo.');
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
      <Card className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Přihlášení</CardTitle>
          <CardDescription>
            Přihlaste se do svého portfolia
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
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vas@email.cz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Přihlašuji...' : 'Přihlásit se'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Nemáte účet?{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                Zaregistrujte se
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}