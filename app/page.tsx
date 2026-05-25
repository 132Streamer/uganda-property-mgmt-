import Link from 'next/link'
import { Home, CreditCard, Wrench, ArrowRight, MapPin } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-stone-100 max-w-7xl mx-auto">
        <span className="font-bold text-xl text-stone-900">PropertyHub</span>
        <div className="flex items-center gap-3">
          <Link href="/search" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
            Find Property
          </Link>
          <Link href="/login" className="text-sm bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-700 transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <span className="inline-block bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-amber-100">
          Built for Uganda 🇺🇬
        </span>
        <h1 className="text-5xl md:text-6xl font-bold text-stone-900 leading-tight mb-6">
          Manage Properties<br />
          <span className="text-amber-500">with Ease</span>
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto mb-10">
          Collect rent via Mobile Money, manage tenants, track maintenance — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2">
            I'm a Landlord <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/search" className="bg-amber-50 text-amber-700 px-8 py-4 rounded-2xl font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 border border-amber-100">
            <MapPin className="w-4 h-4" /> Find a Property
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-stone-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">Everything you need</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Home,
                title: 'List Properties',
                desc: 'Add properties, upload photos, set rent in UGX — visible to renters instantly.',
              },
              {
                icon: CreditCard,
                title: 'Collect Rent via Mobile Money',
                desc: 'Tenants pay via MTN or Airtel Money through Pesapal. Receipts sent automatically.',
              },
              {
                icon: Wrench,
                title: 'Manage Maintenance',
                desc: 'Tenants submit requests, you track and resolve them from your dashboard.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Sign up as a landlord', desc: 'Create your account in under 2 minutes.' },
            { step: '2', title: 'List your property', desc: 'Add details, photos, and set your rent price.' },
            { step: '3', title: 'Invite tenants', desc: 'Tenants get an invite link and pay rent via Mobile Money.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
              <p className="text-stone-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-900 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
        <p className="text-stone-400 mb-8">Join landlords across Uganda managing properties smarter.</p>
        <Link href="/signup" className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-amber-400 transition-colors inline-flex items-center gap-2">
          Get Started Free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-100 py-6 text-center text-stone-400 text-sm">
        © {new Date().getFullYear()} PropertyHub. Built for Uganda.
      </footer>
    </div>
  )
}