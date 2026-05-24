import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  MessageSquare,
  TestTube2,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Upload,
  Brain,
  GitBranch,
} from 'lucide-react';

export function HomePage() {
  const features = [
    {
      icon: FileText,
      title: 'Analyse Documentaire',
      description:
        'Importez et parsez des documents PDF et DOCX complexes. Extraction intelligente du texte et des tableaux avec préservation de la structure.',
    },
    {
      icon: MessageSquare,
      title: 'RAG & Q/R Intelligent',
      description:
        'Posez des questions à vos spécifications. Réponses précises générées par IA avec citations exactes (page, section, paragraphe).',
    },
    {
      icon: TestTube2,
      title: 'Génération de Tests',
      description:
        'Créez automatiquement des cas de test structurés (préconditions, étapes, résultats attendus) à partir de vos exigences fonctionnelles.',
    },
    {
      icon: GitBranch,
      title: 'Traçabilité Complète',
      description:
        'Lien bidirectionnel garanti entre chaque exigence et ses cas de test. Exports Excel et JSON pour une intégration facile.',
    },
  ];

  const workflow = [
    {
      step: 1,
      title: 'Import',
      description: 'Téléversez vos spécifications techniques (PDF, DOCX).',
    },
    {
      step: 2,
      title: 'Analyse',
      description: "L'IA extrait et structure les exigences automatiquement.",
    },
    {
      step: 3,
      title: 'Q/R & RAG',
      description: 'Interrogez vos documents pour clarifier les points complexes.',
    },
    {
      step: 4,
      title: 'Génération',
      description: 'Obtenez un plan de test complet et traçable (Excel/JSON).',
    },
  ];

  const stats = [
    { value: '80%', label: "Réduction du temps d'analyse" },
    { value: '100%', label: 'Exécution Locale' },
    { value: '500+', label: 'Pages supportées' },
    { value: '<2s', label: 'Latence Q/R' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />

        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-4 py-1.5">
              <Zap className="w-3 h-3 mr-1" />
              Version 1.0 Disponible
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold max-w-4xl leading-tight">
              Analysez vos Exigences avec{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                l'Intelligence Artificielle Locale
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl">
              Automatisez l'analyse des spécifications, le Q/R avec citations précises et la
              génération de plans de tests. 100% local, sécurisé et traçable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/upload">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12">
                  <Upload className="w-4 h-4 mr-2" />
                  Commencer l'Analyse
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 h-12"
              >
                Documentation
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-8">
              <Badge variant="outline" className="border-slate-700 text-slate-400 px-3 py-1">
                <Shield className="w-3 h-3 mr-1" />
                Données 100% Privées
              </Badge>
              <Badge variant="outline" className="border-slate-700 text-slate-400 px-3 py-1">
                <Brain className="w-3 h-3 mr-1" />
                Exécution Locale (Ollama)
              </Badge>
              <Badge variant="outline" className="border-slate-700 text-slate-400 px-3 py-1">
                <FileText className="w-3 h-3 mr-1" />
                Support PDF & DOCX
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Une Suite Complète pour l'Ingénierie
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Optimisez votre cycle en V avec des outils conçus pour la rigueur et la performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-slate-900/80 border-slate-800 hover:border-blue-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Extraction Feature */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/30 mb-4">
                Extraction Avancée
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ne perdez plus aucune information
              </h2>
              <p className="text-slate-400 mb-8">
                Notre moteur d'extraction comprend la structure de vos documents. Titres,
                sous-sections, et surtout tableaux complexes sont parsés et structurés
                automatiquement pour une analyse sans faille.
              </p>
              <ul className="space-y-3">
                {[
                  'Support PDF (OCR inclus) et DOCX',
                  'Détection automatique des exigences (REQ-XXX)',
                  'Classification par type (Fonctionnelle, Sécurité...)',
                  'Priorisation automatique',
                ].map((item, index) => (
                  <li key={index} className="flex items-center text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>REQ-001 Extracted</span>
                </div>
                <div className="text-slate-500 text-xs mb-4">
                  Type: Fonctionnelle | Priorité: Haute
                </div>
                <div className="text-slate-300 text-sm">
                  "Le système doit permettre l'authentification des utilisateurs via un système
                  de double facteur..."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Un Workflow Simplifié</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Passez du document brut au plan de test validé en quelques minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflow.map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </div>
                {item.step < 4 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl p-12 text-center border border-slate-800">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à transformer votre processus de validation ?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-8">
              Rejoignez les équipes d'ingénierie qui gagnent du temps et améliorent la qualité de
              leurs tests grâce à l'IA locale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12">
                  Commencer Maintenant
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 h-12"
              >
                Voir les Spécifications
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-white">ReqAI Analyze</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2025 ReqAI Analyze. Tous droits réservés. Version 1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
