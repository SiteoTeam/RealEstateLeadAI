import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  'Custom-built website (your brand, your content)',
  'Lead capture forms — go directly to you',
  'Automated email follow-up sequences',
  'Admin dashboard — edit anything yourself',
  'Custom domain connection',
  'Mobile-optimized design',
  'Cancel anytime',
];

const faqs = [
  {
    q: 'What happens after the 30-day free trial?',
    a: "You'll be billed $49/month to keep your site live. You can upgrade anytime from your dashboard — no credit card required to start.",
  },
  {
    q: 'Can I cancel anytime?',
    a: "Yes. Cancel from your dashboard at any time. Your site stays live until the end of your billing period.",
  },
  {
    q: 'Do I need a developer or any technical skills?',
    a: "None. We build your site for you. If you want to make changes, the admin dashboard is point-and-click. No code ever.",
  },
  {
    q: "What's my website URL?",
    a: "You get a free siteo.io subdomain (e.g., yourname.siteo.io). You can also connect your own custom domain at no extra cost.",
  },
  {
    q: 'How fast can I go live?',
    a: "Most sites are ready within 24 hours of signing up. We build it from your existing profile — no forms to fill out.",
  },
];

export function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleCta = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', { location: 'pricing_page' });
    }
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <a href="/" style={{ fontSize: 24, fontWeight: 500, color: '#f8fafc', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          Site<span style={{ color: '#6366f1' }}>o</span>
        </a>
        <a href="/" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>← Back to home</a>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 16px' }}>
          Simple pricing
        </p>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-1px' }}>
          One plan. No surprises.
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', margin: '0 auto', maxWidth: 480, lineHeight: 1.6 }}>
          Start free for 30 days. No credit card required. Your site goes live in 24 hours.
        </p>
      </div>

      {/* Pricing Card */}
      <div style={{ maxWidth: 480, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #1a1f35)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20,
          padding: '48px 40px',
          boxShadow: '0 0 60px rgba(99,102,241,0.12)',
        }}>
          {/* Price */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, letterSpacing: '-2px' }}>$49</span>
              <span style={{ fontSize: 18, color: '#94a3b8', marginBottom: 8 }}>/month</span>
            </div>
            <p style={{ fontSize: 14, color: '#6366f1', margin: 0, fontWeight: 600 }}>
              30-day free trial — no credit card needed
            </p>
          </div>

          {/* Features */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px' }}>
            {features.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < features.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span style={{ color: '#6366f1', fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.5 }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={handleCta}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              letterSpacing: '-0.2px',
              boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
            }}
          >
            Start Free Trial
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', margin: '16px 0 0' }}>
            No credit card required &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: '0 auto 100px', padding: '0 24px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', margin: '0 0 40px', letterSpacing: '-0.5px' }}>
          Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  background: 'none',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 16,
                }}
              >
                <span>{faq.q}</span>
                <span style={{ color: '#6366f1', fontSize: 18, flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 24px 20px', fontSize: 15, color: '#94a3b8', lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#475569', fontSize: 13 }}>
        © {new Date().getFullYear()} Siteo &nbsp;·&nbsp;
        <a href="mailto:george@siteo.io" style={{ color: '#475569', textDecoration: 'none' }}>george@siteo.io</a>
        &nbsp;·&nbsp;
        <a href="/privacy" style={{ color: '#475569', textDecoration: 'none' }}>Privacy</a>
      </div>
    </div>
  );
}
