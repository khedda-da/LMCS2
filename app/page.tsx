'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Users, BarChart3, Lock, Moon, Sun, Globe, ArrowRight, GraduationCap, BookOpen, Award } from 'lucide-react'
import { useTheme, useLanguage } from '@/components/providers'
import { useTranslation } from '@/lib/i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation(language)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  useEffect(() => {
    setMounted(true)
  }, [])

  const stats = [
    { value: '500+', label: language === 'fr' ? 'Encadrements' : 'Supervisions' },
    { value: '50+', label: language === 'fr' ? 'Chercheurs' : 'Researchers' },
    { value: '15+', label: language === 'fr' ? 'Annees' : 'Years' },
  ]

  const features = [
    {
      icon: GraduationCap,
      title: language === 'fr' ? 'Gestion des Etudiants' : 'Student Management',
      description: language === 'fr' 
        ? 'Suivez le parcours academique de chaque etudiant du debut a la soutenance.'
        : 'Track each student\'s academic journey from start to defense.'
    },
    {
      icon: BookOpen,
      title: language === 'fr' ? 'Suivi des Travaux' : 'Progress Tracking',
      description: language === 'fr'
        ? 'Enregistrez les seances, documents et jalons importants de chaque projet.'
        : 'Record sessions, documents, and important milestones for each project.'
    },
    {
      icon: Award,
      title: language === 'fr' ? 'Rapports & Statistiques' : 'Reports & Analytics',
      description: language === 'fr'
        ? 'Generez des rapports detailles sur les activites d\'encadrement du laboratoire.'
        : 'Generate detailed reports on the laboratory\'s supervision activities.'
    },
  ]

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-md flex-shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/lmcs-logo.png"
                alt="LMCS"
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="font-bold text-xl text-primary hidden sm:block">LMCS</span>
          </Link>
          
          <div className="flex items-center gap-2">
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2.5 hover:bg-muted rounded-xl transition-all duration-200 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">{language === 'en' ? 'EN' : 'FR'}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem 
                    onClick={() => setLanguage('en')}
                    className={language === 'en' ? 'bg-muted' : ''}
                  >
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLanguage('fr')}
                    className={language === 'fr' ? 'bg-muted' : ''}
                  >
                    Francais
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2.5 hover:bg-muted rounded-xl transition-all duration-200"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-400" />
                )}
              </button>
            )}
            
            <Link href="/auth/login">
              <Button className="ml-2 rounded-xl px-5 h-10 font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                {t('signIn')}
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            style={{ opacity, scale }}
            className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div 
            style={{ opacity, scale }}
            className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {language === 'fr' ? 'Plateforme de Gestion Academique' : 'Academic Management Platform'}
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight"
            >
              {language === 'fr' ? (
                <>
                  Gestion des <br className="sm:hidden" />
                  <span className="text-primary">Encadrements</span>
                </>
              ) : (
                <>
                  Supervision <br className="sm:hidden" />
                  <span className="text-primary">Management</span>
                </>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={fadeInUp}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              {language === 'fr'
                ? 'Une plateforme moderne pour gerer les encadrements academiques du Laboratoire LMCS a l\'ESI Alger.'
                : 'A modern platform for managing academic supervisions at the LMCS Laboratory, ESI Algiers.'}
            </motion.p>

            {/* CTA Button */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center justify-center pt-4"
            >
              <Link href="/auth/login">
                <Button size="lg" className="rounded-xl px-8 h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group">
                  {t('signIn')}
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center justify-center gap-8 sm:gap-16 pt-12"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
            >
              {language === 'fr' ? 'Fonctionnalites' : 'Features'}
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              {language === 'fr'
                ? 'Des outils concus pour simplifier la gestion des encadrements academiques.'
                : 'Tools designed to simplify academic supervision management.'}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={fadeInUp} className="space-y-6">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {language === 'fr' ? 'A Propos' : 'About'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {language === 'fr' ? 'Laboratoire LMCS' : 'LMCS Laboratory'}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  {language === 'fr' 
                    ? 'Le Laboratoire des Methodes de Conception de Systemes (LMCS) est un laboratoire de recherche a l\'Ecole Nationale Superieure d\'Informatique (ESI), Alger.'
                    : 'The Laboratory of Methods for System Design (LMCS) is a research laboratory at the Higher National School of Computer Science (ESI), Algiers.'}
                </p>
                <p>
                  {language === 'fr'
                    ? 'Notre mission est de faire progresser la recherche en genie logiciel et de former la prochaine generation de chercheurs.'
                    : 'Our mission is to advance research in software engineering and train the next generation of researchers.'}
                </p>
              </div>
              <div className="pt-4">
                <Link href="https://lmcs.esi.dz" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-xl group">
                    {language === 'fr' ? 'Visiter le site' : 'Visit Website'}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="space-y-4">
              {[
                { icon: Users, title: language === 'fr' ? 'Pour les Superviseurs' : 'For Supervisors', desc: language === 'fr' ? 'Gerez vos etudiants et suivez leur progression.' : 'Manage your students and track their progress.' },
                { icon: BarChart3, title: language === 'fr' ? 'Pour les Directeurs' : 'For Directors', desc: language === 'fr' ? 'Vue d\'ensemble des activites du laboratoire.' : 'Overview of laboratory activities.' },
                { icon: Lock, title: language === 'fr' ? 'Acces Securise' : 'Secure Access', desc: language === 'fr' ? 'Controle d\'acces base sur les roles.' : 'Role-based access control.' },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4 p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-primary/5">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
          >
            {language === 'fr' ? 'Pret a commencer ?' : 'Ready to get started?'}
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-muted-foreground text-lg mb-8"
          >
            {language === 'fr'
              ? 'Connectez-vous pour acceder a votre espace de gestion.'
              : 'Sign in to access your management dashboard.'}
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href="/auth/login">
              <Button size="lg" className="rounded-xl px-10 h-14 text-base font-semibold shadow-lg">
                {t('signIn')}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src="/lmcs-logo.png"
                  alt="LMCS"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="font-semibold text-foreground">LMCS</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="https://lmcs.esi.dz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                {language === 'fr' ? 'Site Web' : 'Website'}
              </Link>
              <Link href="https://esi.dz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                ESI Alger
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2026 LMCS. {language === 'fr' ? 'Tous droits reserves.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
