import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Target, Calendar, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Portfolio Paradise</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline">Přihlášení</Button>
              </Link>
              <Link href="/register">
                <Button>Registrace</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Online Portfolio pro Žáky ZŠ
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Moderní platforma pro žáky základních škol s individuálním studiem. 
            Sledujte své cíle, vytvářejte portfolio a sdílejte své úspěchy s učiteli.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Začít zdarma
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Přihlásit se
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Osobní cíle</CardTitle>
              <CardDescription>
                Stanovte si krátkodobé, dlouhodobé a celoživotní cíle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sledování pokroku</li>
                <li>• Různé typy cílů</li>
                <li>• Termíny a deadline</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>
                Vytvářejte a organizujte své práce a projekty
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Různé šablony stránek</li>
                <li>• Kategorie a organizace</li>
                <li>• Nahrávání souborů</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Kalendář</CardTitle>
              <CardDescription>
                Plánujte si denní aktivity a sledujte pokrok
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Denní plány</li>
                <li>• Události a deadline</li>
                <li>• Reflexe a hodnocení</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Sdílení</CardTitle>
              <CardDescription>
                Sdílejte své portfolio s učiteli a rodinou
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bezpečné sdílení</li>
                <li>• Hesla a expirace</li>
                <li>• Statistiky zobrazení</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Připraveni začít?
          </h3>
          <p className="text-gray-600 mb-6">
            Vytvořte si účet a začněte budovat své portfolio ještě dnes.
          </p>
          <Link href="/register">
            <Button size="lg">
              Vytvořit účet zdarma
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 Portfolio Paradise. Vytvořeno pro individuální studium.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
