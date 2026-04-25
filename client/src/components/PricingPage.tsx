import { createPortal } from 'react-dom'

interface Props {
  onClose: () => void
}

const TIERS = [
  {
    id: 'free',
    edition: 'I',
    name: 'Free',
    tagline: 'The Essentials',
    price: '0',
    unit: 'forever',
    accentClass: 'bg-zinc-500',
    accentColor: 'rgb(113 113 122)',
    glowColor: 'rgba(113,113,122,0.08)',
    borderClass: 'border-[#1e1e21]',
    features: [
      '100 MB cloud storage',
      '5 playlists max',
      'Deezer 30-sec previews',
      'Standard AI assistant',
      'Community support',
    ],
    cta: 'Current Plan',
    current: true,
  },
  {
    id: 'pro',
    edition: 'II',
    name: 'Pro',
    tagline: 'The Audiophile',
    price: '4.99',
    unit: 'per month',
    accentClass: 'bg-orange-500',
    accentColor: 'rgb(249 115 22)',
    glowColor: 'rgba(249,115,22,0.10)',
    borderClass: 'border-orange-500/30',
    featured: true,
    features: [
      '5 GB cloud storage',
      'Unlimited playlists',
      'Full Deezer streaming',
      'Advanced AI DJ',
      'High-quality audio',
      'Priority support',
    ],
    cta: 'Coming Soon',
  },
  {
    id: 'max',
    edition: 'III',
    name: 'Max',
    tagline: 'The Obsessive',
    price: '9.99',
    unit: 'per month',
    accentClass: 'bg-[#c9a96e]',
    accentColor: 'rgb(201 169 110)',
    glowColor: 'rgba(201,169,110,0.07)',
    borderClass: 'border-[#c9a96e]/20',
    features: [
      'Unlimited cloud storage',
      'Unlimited playlists',
      'All streaming platforms',
      'AI-curated radio',
      'Lossless FLAC audio',
      'Early access features',
      'Dedicated support',
    ],
    cta: 'Coming Soon',
  },
]

export function PricingPage({ onClose }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-[200] bg-[#0a0a0b] overflow-y-auto">

      {/* Giant MOCKUP watermark — can't miss it */}
      <div
        aria-hidden
        className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <span
          className="text-[18vw] font-bold text-white/[0.022] tracking-[0.15em] rotate-[-22deg] whitespace-nowrap"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          MOCKUP
        </span>
      </div>

      {/* Sticky alert banner */}
      <div className="sticky top-0 z-[202] border-b border-amber-500/20 backdrop-blur-md"
           style={{ background: 'rgba(10,10,11,0.90)' }}>
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <p className="text-[11px] font-mono text-amber-400/80 tracking-wide">
              <strong className="text-amber-300 font-semibold">Design mockup only.</strong>
              {' '}No tiers exist. No payment is processed. This is a prototype.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[11px] font-mono text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0 tracking-wide"
          >
            ← close
          </button>
        </div>
      </div>

      <div className="relative z-[202] max-w-4xl mx-auto px-4 pt-16 pb-28">

        {/* Page header */}
        <header className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="h-px flex-1 max-w-[64px]"
                 style={{ background: 'linear-gradient(to right, transparent, rgba(249,115,22,0.4))' }} />
            <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
            <span className="text-[8px] font-mono uppercase tracking-[0.35em] text-zinc-600">Vibe Player · Plans</span>
            <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
            <div className="h-px flex-1 max-w-[64px]"
                 style={{ background: 'linear-gradient(to left, transparent, rgba(249,115,22,0.4))' }} />
          </div>

          <h1
            className="text-[clamp(3.5rem,9vw,6.5rem)] font-bold leading-[0.9] tracking-tight text-zinc-50 mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Sound,<br />
            <span className="text-orange-400">Elevated.</span>
          </h1>

          <p
            className="text-xl text-zinc-500 mt-5"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}
          >
            Three editions. One obsession.
          </p>
        </header>

        {/* Tier grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl border ${tier.borderClass} overflow-hidden transition-all duration-300 group ${
                tier.featured ? 'sm:shadow-2xl sm:shadow-orange-500/5' : ''
              }`}
              style={{
                background: tier.featured
                  ? `radial-gradient(ellipse at top, ${tier.glowColor}, #0d0d0f 60%)`
                  : '#0d0d0f',
              }}
            >
              {/* Accent top bar */}
              <div className={`h-0.5 w-full ${tier.accentClass}`} />

              {/* Popular badge */}
              {tier.featured && (
                <div className="absolute top-4 right-4">
                  <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-1">
                    Most popular
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Edition mark */}
                <p
                  className="text-[3rem] font-semibold leading-none mb-2 opacity-10"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: tier.accentColor,
                  }}
                >
                  {tier.edition}
                </p>

                {/* Names */}
                <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-1">
                  {tier.tagline}
                </p>
                <h2
                  className="text-2xl font-semibold leading-tight mb-6"
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    color: tier.featured ? tier.accentColor : 'rgb(228 228 231)',
                  }}
                >
                  Vibe {tier.name}
                </h2>

                {/* Price */}
                <div
                  className="mb-6 pb-6"
                  style={{ borderBottom: '1px solid #1e1e21' }}
                >
                  <div className="flex items-end gap-1">
                    <span
                      className="text-[11px] font-mono text-zinc-600 mb-2 leading-none"
                    >
                      {tier.price === '0' ? '' : '$'}
                    </span>
                    <span
                      className="text-6xl font-semibold leading-none text-zinc-100"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {tier.price === '0' ? 'Free' : tier.price}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-600 mt-2 tracking-wide">
                    {tier.unit}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <span
                        className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                        style={{ background: tier.accentColor, opacity: 0.7 }}
                      />
                      <span className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  disabled
                  className={`w-full py-3 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] border transition-colors cursor-not-allowed ${
                    tier.current
                      ? 'text-zinc-600 border-[#1e1e21] bg-transparent'
                      : tier.featured
                      ? 'text-orange-500/40 border-orange-500/20 bg-orange-500/5'
                      : 'text-zinc-700 border-[#1e1e21] bg-transparent'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer disclaimer */}
        <footer className="mt-16 text-center space-y-3">
          <div className="flex items-center gap-3 justify-center">
            <div className="h-px w-16 bg-[#1e1e21]" />
            <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-700">Prototype</span>
            <div className="h-px w-16 bg-[#1e1e21]" />
          </div>
          <p className="text-[10px] font-mono text-zinc-700 leading-loose max-w-md mx-auto">
            All pricing, features, and tiers shown above are illustrative only and do not represent
            real product offerings. No payment infrastructure is connected.
            This page is a design mockup built for demonstration purposes.
          </p>
        </footer>
      </div>
    </div>,
    document.body
  )
}
