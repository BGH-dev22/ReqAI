import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, 
  FileText, 
  MessageSquare, 
  TestTube2, 
  GitMerge,
  ShieldCheck,
  Database,
  FileSearch,
  CheckCircle2,
  Sparkles,
  BrainCircuit,
  Upload,
  FileCheck,
  TableProperties,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Animation variants for reusability
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { name: 'Fonctionnalités', href: '#features' },
    { name: 'Workflow', href: '#workflow' },
    { name: 'Technologie', href: '#tech' },
    { name: 'Avantages', href: '#benefits' },
  ];

  const features = [
    {
      icon: FileSearch,
      title: 'Analyse Documentaire',
      description: 'Importez et parsez des documents PDF et DOCX complexes. Extraction intelligente du texte et des tableaux.',
      gradient: 'from-sky-500 to-blue-600',
      bgGlow: 'bg-sky-500/20',
    },
    {
      icon: MessageSquare,
      title: 'RAG & Q/R Intelligent',
      description: 'Posez des questions à vos spécifications. Réponses précises avec citations exactes.',
      gradient: 'from-violet-500 to-purple-600',
      bgGlow: 'bg-violet-500/20',
    },
    {
      icon: TestTube2,
      title: 'Génération de Tests',
      description: 'Créez automatiquement des cas de test structurés à partir de vos exigences fonctionnelles.',
      gradient: 'from-rose-500 to-pink-600',
      bgGlow: 'bg-rose-500/20',
    },
    {
      icon: GitMerge,
      title: 'Traçabilité Complète',
      description: 'Lien bidirectionnel entre chaque exigence et ses cas de test. Exports Excel et JSON.',
      gradient: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/20',
    },
  ];

  const badges = [
    { icon: ShieldCheck, text: 'Données 100% Privées', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { icon: Database, text: 'Exécution Locale', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { icon: FileText, text: 'PDF & DOCX', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Uploadez',
      subtitle: 'votre document',
      description: 'Glissez-déposez vos fichiers PDF ou DOCX. Extraction automatique des exigences.',
      icon: Upload,
      color: 'from-sky-500 to-blue-600',
    },
    {
      step: '02',
      title: 'Interrogez',
      subtitle: 'en langage naturel',
      description: 'Posez vos questions et obtenez des réponses précises avec citations.',
      icon: MessageSquare,
      color: 'from-violet-500 to-purple-600',
    },
    {
      step: '03',
      title: 'Générez',
      subtitle: 'vos tests',
      description: 'Chaque exigence est automatiquement liée à ses cas de test.',
      icon: FileCheck,
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  const benefits = [
    { text: 'Exécution 100% locale', highlight: 'vos données restent sur votre machine' },
    { text: 'Intégration Ollama', highlight: 'LLM open source' },
    { text: 'Traçabilité complète', highlight: 'exigences → tests' },
    { text: 'Export multi-formats', highlight: 'Excel, JSON, CSV' },
    { text: 'Interface intuitive', highlight: 'style ChatGPT' },
    { text: 'Documents complexes', highlight: 'tableaux, images, OCR' },
  ];

  const technologies = [
    { name: 'Python', category: 'Core', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    { name: 'FastAPI', category: 'Backend', color: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
    { name: 'LangChain', category: 'Orchestration', color: 'bg-green-500/10 text-green-300 border-green-500/30' },
    { name: 'Ollama', category: 'LLM', color: 'bg-slate-500/10 text-slate-200 border-slate-500/30' },
    { name: 'FAISS', category: 'Vector DB', color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
    { name: 'Streamlit', category: 'Frontend', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
    { name: 'Docker', category: 'Container', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
    { name: 'MLflow', category: 'MLOps', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
  ];

  const scrollToSection = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative h-9 w-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
                <BrainCircuit className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-white">ReqAI</span>
                <span className="text-blue-400">Analyze</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  {link.name}
                </button>
              ))}
              <div className="w-px h-6 bg-slate-700 mx-3" />
              <Link to="/login">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 transition-all">
                  Démarrer
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={isMobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="md:hidden overflow-hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/5"
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className="block w-full text-left px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                {link.name}
              </button>
            ))}
            <div className="pt-3">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl">
                  Démarrer
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-sm font-medium text-blue-300">Version 1.0 Disponible</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Analysez vos Exigences
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                avec l'IA Locale
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed"
            >
              Automatisez l'analyse des spécifications, le Q/R avec citations 
              et la génération de plans de tests.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg sm:text-xl font-semibold text-white mb-10"
            >
              100% local, sécurisé et traçable.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link to="/login">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-base font-semibold rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-blue-500/35 transition-all duration-300 hover:scale-[1.02] group"
                >
                  Commencer l'Analyse
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-600 px-8 py-6 text-base font-medium rounded-2xl transition-all duration-300"
              >
                <FileText className="mr-2 h-5 w-5" />
                Documentation
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            >
              {badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${badge.bg} border ${badge.border}`}
                  >
                    <Icon className={`h-4 w-4 ${badge.color}`} />
                    <span className="text-slate-300 text-sm font-medium">{badge.text}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div 
            style={{ opacity: heroOpacity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2"
          >
            <span className="text-xs text-slate-500 uppercase tracking-wider">Découvrir</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-5 w-5 text-slate-500" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 sm:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16 sm:mb-20"
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-block text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3"
            >
              Fonctionnalités
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
            >
              Suite Complète d'Ingénierie
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-slate-400 text-lg max-w-2xl mx-auto"
            >
              Optimisez votre cycle en V avec des outils conçus pour la rigueur et la performance.
            </motion.p>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group relative p-6 sm:p-7 rounded-2xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-700 transition-all duration-300"
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 ${feature.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                  
                  <div className="relative">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Feature Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-20 sm:mt-28 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl overflow-hidden border border-slate-700/50"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium w-fit mb-5">
                  <TableProperties className="w-4 h-4" />
                  <span>Extraction Avancée</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Ne perdez plus aucune information
                </h3>
                <p className="text-slate-400 mb-6 text-base leading-relaxed">
                  Notre moteur comprend la structure de vos documents. Titres, sous-sections et
                  <span className="text-white font-medium"> tableaux complexes</span> sont parsés automatiquement.
                </p>
                <ul className="space-y-3">
                  {[
                    'Support PDF (OCR inclus) et DOCX',
                    'Détection automatique REQ-XXX',
                    'Classification par type',
                    'Priorisation automatique',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-slate-300 text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Visual Demo */}
              <div className="relative bg-slate-900/80 min-h-[300px] lg:min-h-0 flex items-center justify-center p-8">
                <div className="w-full max-w-sm aspect-[4/5] bg-slate-800 rounded-xl shadow-2xl p-5 relative transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-slate-700">
                  <div className="h-3 w-24 bg-slate-700 rounded mb-5" />
                  <div className="space-y-2 mb-6">
                    <div className="h-2 w-full bg-slate-700/60 rounded" />
                    <div className="h-2 w-5/6 bg-slate-700/60 rounded" />
                    <div className="h-2 w-4/6 bg-slate-700/60 rounded" />
                  </div>
                  <div className="border border-slate-600/60 rounded-lg p-3 bg-slate-900/60">
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div className="h-2 bg-slate-600 rounded" />
                      <div className="h-2 bg-slate-600 rounded" />
                      <div className="h-2 bg-slate-600 rounded" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-2 bg-slate-700 rounded" />
                      <div className="h-2 bg-slate-700 rounded" />
                      <div className="h-2 bg-slate-700 rounded" />
                    </div>
                  </div>

                  <motion.div
                    className="absolute -right-3 top-1/4 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3 rounded-lg shadow-xl max-w-[160px]"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">REQ-001</span>
                    </div>
                    <div className="h-1.5 w-full bg-blue-400/60 rounded mb-1" />
                    <div className="h-1.5 w-2/3 bg-blue-400/60 rounded" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="relative py-24 sm:py-32 lg:py-40 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16 sm:mb-20"
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-block text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3"
            >
              Workflow
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
            >
              Comment ça marche ?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-slate-400 text-lg max-w-xl mx-auto"
            >
              Trois étapes simples pour automatiser votre analyse
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {workflowSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="relative group"
                >
                  <div className="h-full bg-slate-800/40 rounded-2xl p-7 sm:p-8 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:bg-slate-800/60">
                    <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-b from-blue-500/30 to-transparent bg-clip-text text-transparent mb-4">
                      {item.step}
                    </div>
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-blue-400 text-sm font-medium mb-3">{item.subtitle}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                  
                  {/* Connector Arrow */}
                  {index < 2 && (
                    <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-6 w-6 text-slate-700" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="relative py-24 sm:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">
                Avantages
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8">
                Pourquoi choisir ReqAI ?
              </h2>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/60 transition-colors group"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-200 text-sm sm:text-base">
                      {benefit.text} — <span className="text-slate-400">{benefit.highlight}</span>
                    </span>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8">
                <Link to="/login">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                    Commencer maintenant
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Demo Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-blue-600/15 to-violet-600/15 rounded-3xl p-6 sm:p-8 border border-slate-700/40">
                <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                      <BrainCircuit className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">ReqAI Assistant</p>
                      <p className="text-xs text-slate-500">Prêt à analyser</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-800/80 rounded-lg p-3">
                      <p className="text-sm text-slate-300">📄 specs_batterie.pdf uploadé</p>
                    </div>
                    <div className="bg-blue-600/10 border border-blue-500/25 rounded-lg p-3">
                      <p className="text-sm text-blue-300">✨ 12 exigences extraites</p>
                    </div>
                    <div className="bg-emerald-600/10 border border-emerald-500/25 rounded-lg p-3">
                      <p className="text-sm text-emerald-300">🧪 24 tests générés</p>
                    </div>
                    <div className="bg-violet-600/10 border border-violet-500/25 rounded-lg p-3">
                      <p className="text-sm text-violet-300">📊 Export Excel prêt</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="relative py-24 sm:py-32 lg:py-40 bg-slate-900/40 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">
                Technologies
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Architecture Open Source
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Stack technologique moderne et éprouvée. Aucune boîte noire propriétaire, tout est transparent et extensible.
              </p>

              <div className="space-y-4">
                {[
                  { color: 'bg-blue-500', title: 'LLM Interchangeables', desc: 'Llama 3.1, Qwen2, Phi-3.5 via Ollama' },
                  { color: 'bg-violet-500', title: 'API RESTful', desc: 'FastAPI avec Swagger UI' },
                  { color: 'bg-emerald-500', title: 'Versioning', desc: 'Traçabilité DVC et Git' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color} mt-1.5 flex-shrink-0`} />
                    <div>
                      <h4 className="font-semibold text-white">{item.title}</h4>
                      <p className="text-slate-400 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tech Grid */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {technologies.map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center justify-center p-4 sm:p-5 text-center bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-blue-500/30 hover:bg-slate-800/70 transition-all duration-300"
                  >
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold mb-2 border ${tech.color}`}>
                      {tech.category}
                    </span>
                    <span className="font-bold text-white text-sm sm:text-base">{tech.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-blue-600/10 rounded-3xl p-8 sm:p-12 lg:p-16 border border-slate-700/40">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Prêt à automatiser vos analyses ?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Commencez gratuitement, sans inscription requise.
            </p>
            <Link to="/login">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-6 text-lg font-semibold rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-blue-500/35 transition-all duration-300 hover:scale-[1.02]"
              >
                Lancer l'application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 sm:py-20 border-t border-slate-800/50 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg">
                  <span className="text-white">ReqAI</span>
                  <span className="text-blue-400">Analyze</span>
                </span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                Plateforme open-source d'analyse d'exigences et génération de tests assistée par IA. 
                Confidentialité, performance et traçabilité.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Produit</h4>
              <ul className="space-y-2.5 text-slate-400 text-sm">
                {['Fonctionnalités', 'Workflow', 'Technologie', 'Roadmap'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Légal</h4>
              <ul className="space-y-2.5 text-slate-400 text-sm">
                {['Mentions Légales', 'Confidentialité', 'Licence', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 ReqAI Analyze. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;