import Link from 'next/link';
import {
  ClipboardCheck,
  BookOpen,
  TrendingUp,
  Download,
  Shield,
  Zap,
  UserPlus,
  ListChecks,
  BarChart3,
  ChevronDown,
  ArrowRight,
  Star,
  Lock,
  Globe,
} from 'lucide-react';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-white/5 last:border-0">
      <summary className="flex items-center justify-between py-5 cursor-pointer list-none">
        <h3 className="font-display font-medium text-white text-left pr-4">{question}</h3>
        <ChevronDown className="w-5 h-5 text-surface-500 group-open:rotate-180 transition-transform flex-shrink-0" />
      </summary>
      <p className="text-surface-400 text-sm leading-relaxed pb-5 pr-8">{answer}</p>
    </details>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-display font-bold text-lg">MedFolio</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-surface-300 hover:text-white">
              Log in
            </Link>
            <Link
              href="/register"
              className="btn-primary !bg-brand-500 hover:!bg-brand-400"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-brand-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Free during early access
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            Coming Soon, Your portfolio,{' '}
            <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-brand-400 bg-clip-text text-transparent">
              actually useful
            </span>
          </h1>
          <p className="text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A modern companion for UK junior doctors. Track ARCP requirements across specialties,
            log interesting cases, and own your professional development — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="btn-primary !bg-brand-500 hover:!bg-brand-400 !py-3.5 !px-8 !text-base shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
            >
              Start tracking for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary !bg-white/5 !border-white/10 !text-surface-300 hover:!bg-white/10 hover:!text-white !py-3.5 !px-8 !text-base"
            >
              See how it works
            </a>
          </div>
          <p className="text-surface-500 text-sm mt-5">
            No credit card required · Not affiliated with NHS or any Royal College
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-8 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-x-10 gap-y-4 text-surface-500 text-sm">
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-500" />
            AES-256 encrypted
          </span>
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-500" />
            UK-hosted (London)
          </span>
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-500" />
            GDPR compliant
          </span>
          <span className="flex items-center gap-2">
            <Star className="w-4 h-4 text-brand-500" />
            Built by junior doctors
          </span>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium uppercase tracking-wider mb-4">
              Simple setup
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Up and running in 60 seconds
            </h2>
            <p className="text-surface-400 text-lg max-w-2xl mx-auto">
              No configuration, no learning curve. Sign up and start tracking immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: UserPlus,
                title: 'Create your account',
                desc: 'Sign up in seconds with your email. Choose your training stage and the specialties you want to track.',
              },
              {
                step: '02',
                icon: ListChecks,
                title: 'Track your requirements',
                desc: 'Pre-built ARCP checklists show exactly what you need. Tick items off, add notes, and upload evidence as you go.',
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'See your progress',
                desc: 'Visual dashboards show where you stand. Spot gaps early, export for ARCP, and never miss a requirement.',
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-brand-500 text-sm font-bold">{item.step}</span>
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                      <item.icon className="w-5 h-5 text-brand-400" />
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-surface-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium uppercase tracking-wider mb-4">
              Features
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Built for how doctors actually work
            </h2>
            <p className="text-surface-400 text-lg max-w-2xl mx-auto">
              Not another box-ticking exercise. MedFolio is your personal space for tracking
              what matters — alongside your official portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: ClipboardCheck,
                title: 'Specialty checklists',
                desc: 'Pre-built ARCP requirement templates for Foundation, IMT, and Ophthalmology. See exactly where you stand with visual progress tracking.',
              },
              {
                icon: BookOpen,
                title: 'Case journal',
                desc: 'Log interesting cases with structured prompts and built-in anonymisation guidance. Build a searchable library of your clinical experience.',
              },
              {
                icon: TrendingUp,
                title: 'Visual analytics',
                desc: 'See your progress at a glance. Track WBAs, procedures, and case exposure over time. Spot gaps before ARCP.',
              },
              {
                icon: Download,
                title: 'Export everything',
                desc: 'Download your data as PDF, CSV, or copy formatted text straight into Horus, ISCP, or FourteenFish. You own your data.',
              },
              {
                icon: Shield,
                title: 'Private & secure',
                desc: 'UK-hosted, encrypted, and GDPR compliant. No patient data stored — built-in anonymisation prompts keep you safe.',
              },
              {
                icon: Zap,
                title: 'Quick capture',
                desc: 'Log a case in under 60 seconds. No configuration needed — just sign up and start tracking.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand-500/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 group-hover:scale-110 transition-all">
                  <feature.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium uppercase tracking-wider mb-4">
              Specialties
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Checklists for your specialty
            </h2>
            <p className="text-surface-400 text-lg max-w-2xl mx-auto">
              Pre-built ARCP requirement templates. More specialties added regularly based on demand.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { name: 'Foundation', desc: 'FY1 & FY2', items: '25 items' },
              { name: 'IMT', desc: 'IMT1 – IMT3', items: '28 items' },
              { name: 'Ophthalmology', desc: 'ST1 – ST7', items: '16 items' },
            ].map((spec) => (
              <div
                key={spec.name}
                className="p-5 rounded-xl border border-brand-500/20 bg-brand-500/5 text-center"
              >
                <h3 className="font-display font-semibold text-white mb-0.5">{spec.name}</h3>
                <p className="text-brand-400 text-sm mb-2">{spec.desc}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/20 text-brand-300">{spec.items}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {['GP Training', 'Core Surgical', 'Anaesthetics', 'Emergency Medicine', 'Paediatrics', 'Psychiatry'].map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-lg border border-white/5 text-surface-500 text-xs">
                {s} — coming soon
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div>
            <FAQItem
              question="Is this an official NHS tool?"
              answer="No. MedFolio is an independent companion tool and is not affiliated with, endorsed by, or connected to NHS England, Health Education England, any Royal College, or any NHS Trust. It sits alongside your official portfolio (Horus, ISCP, FourteenFish, etc.) — it doesn't replace it."
            />
            <FAQItem
              question="Is my data safe?"
              answer="Yes. Your data is stored on encrypted servers in London (UK) with AES-256 encryption at rest and TLS 1.3 in transit. Row Level Security ensures you can only access your own data. We're fully GDPR compliant. We never sell your data."
            />
            <FAQItem
              question="Can I use this alongside Horus / ISCP / FourteenFish?"
              answer="Absolutely — that's exactly how it's designed. MedFolio is your personal companion for tracking progress, logging interesting cases, and organising evidence. When you need to submit formally, use the copy-to-clipboard or export features to transfer your data to your official portfolio."
            />
            <FAQItem
              question="Is it really free?"
              answer="Yes, completely free during early access. We plan to introduce a small premium tier in the future for advanced features like AI-assisted reflections and job alerts, but the core portfolio tracking and case journal will always have a generous free tier."
            />
            <FAQItem
              question="What about patient confidentiality?"
              answer="MedFolio does not store patient-identifiable data. All case entries must be anonymised before saving, and the app includes built-in prompts following GMC guidance on anonymisation. Our terms of service explicitly prohibit entering patient-identifiable information."
            />
            <FAQItem
              question="Are the ARCP checklists accurate?"
              answer="Checklists are compiled from publicly available Royal College curricula and are regularly reviewed. However, requirements can vary between deaneries and may change. Always verify your specific requirements with your Training Programme Director or Educational Supervisor."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/20 to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to take control of your portfolio?
          </h2>
          <p className="text-surface-400 text-lg mb-8">
            Join the early access. Free during development, no credit card needed.
          </p>
          <Link
            href="/register"
            className="btn-primary !bg-brand-500 hover:!bg-brand-400 !py-3.5 !px-8 !text-base shadow-lg shadow-brand-500/20"
          >
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="font-display font-bold text-sm text-surface-400">MedFolio</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-surface-500">
              <Link href="/privacy" className="hover:text-surface-300 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-surface-300 transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-surface-300 transition-colors">Contact</Link>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 text-xs text-surface-600">
            <p>&copy; {new Date().getFullYear()} MedFolio. Not affiliated with NHS England, Health Education England, or any Royal College.</p>
            <p className="mt-1">ARCP checklists are for guidance only. Always verify requirements with your Training Programme Director.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
