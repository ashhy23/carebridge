/**
 * Public marketing landing page shown at / for unauthenticated visitors.
 */
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

const KEYWORDS = [
  'Real-time Vitals',
  'Smart Alerts',
  'Shift Management',
  'AI Care Summaries',
  'Family Updates',
];

const FEATURES = [
  {
    title: 'Vitals Monitoring',
    description: 'Track heart rate, blood pressure, and oxygen levels in real time.',
    glow: 'shadow-[0_0_24px_rgba(59,130,246,0.35)]',
    iconBg: 'bg-blue-500/20 text-blue-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    ),
  },
  {
    title: 'Smart Alerts',
    description: 'Instant notifications when vitals cross safe thresholds.',
    glow: 'shadow-[0_0_24px_rgba(239,68,68,0.3)]',
    iconBg: 'bg-red-500/20 text-red-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 .75.75 0 00-1.5 0 .75.75 0 11-1.5 0 .75.75 0 10-1.5 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: 'AI Summaries',
    description: 'Automated care summaries that keep families informed.',
    glow: 'shadow-[0_0_24px_rgba(212,245,60,0.25)]',
    iconBg: 'bg-cb-lime/20 text-cb-lime',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.568l.257 1.036a1.875 1.875 0 001.318 1.318l1.036.257a.75.75 0 010 1.456l-1.036.257a1.875 1.875 0 00-1.318 1.318l-.257 1.036a.75.75 0 01-1.456 0l-.257-1.036a1.875 1.875 0 00-1.318-1.318l-1.036-.257a.75.75 0 010-1.456l1.036-.257a1.875 1.875 0 001.318-1.318l.257-1.036A.75.75 0 0116.5 15z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '500+', label: 'Patients Monitored' },
  { value: '24/7', label: 'Care Coordination' },
  { value: '100%', label: 'Secure & Private' },
];

function KeywordCarousel() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((current) => (current + 1) % KEYWORDS.length);
        setVisible(true);
      }, 400);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <p className="mt-6 text-lg text-gray-400">
      Powered by{' '}
      <span
        className={[
          'inline-block font-semibold text-cb-lime transition-all duration-[400ms]',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        ].join(' ')}
      >
        {KEYWORDS[index]}
      </span>
    </p>
  );
}

function VitalsPreviewCard() {
  const metrics = [
    { label: 'Heart Rate', value: '72 bpm', status: 'Normal', dot: 'bg-green-500' },
    { label: 'Blood Oxygen', value: '98%', status: 'Optimal', dot: 'bg-green-500' },
    { label: 'Blood Pressure', value: '125/82', status: 'Elevated', dot: 'bg-yellow-500' },
  ];

  return (
    <div className="animate-float rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-[20px]">
      <h3 className="text-lg font-semibold text-white">Live Patient Overview</h3>
      <p className="mt-1 text-sm text-gray-400">Real-time monitoring</p>

      <div className="mt-6 space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">{metric.label}</p>
              <p className="text-lg font-semibold text-white">{metric.value}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className={`h-2 w-2 rounded-full ${metric.dot}`} />
              {metric.status}
            </div>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 280 60" className="mt-6 h-14 w-full" aria-hidden="true">
        <path
          d="M0 30 C20 10, 40 50, 60 30 S100 10, 120 30 S160 50, 180 30 S220 10, 240 30 S260 50, 280 30"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-pulse-draw"
        />
      </svg>

      <p className="mt-4 text-xs text-gray-500">Last updated just now</p>
    </div>
  );
}

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cb-bg">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-cb-bg text-white">
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 py-16">
        <div className="pointer-events-none absolute left-[-100px] top-[-100px] h-[600px] w-[600px] animate-drift rounded-full bg-[#3b82f6]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-80px] right-[-80px] h-[400px] w-[400px] animate-drift-reverse rounded-full bg-[#d4f53c]/[0.08] blur-3xl" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[3fr_2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cb-lime">
              AI-Powered Elderly Care
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Care
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Bridge
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-xl text-gray-400">
              Coordinating care. Connecting families. Protecting lives.
            </p>

            <KeywordCarousel />

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="rounded-full bg-cb-lime px-8 py-4 text-base font-semibold text-black transition hover:scale-105 hover:brightness-110"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-white/30 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-6 sm:gap-8">
              {STATS.map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-6 sm:gap-8">
                  <div>
                    <p className="text-xl font-bold text-white sm:text-2xl">{stat.value}</p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </div>
                  {i < STATS.length - 1 && <div className="hidden h-10 w-px bg-white/20 sm:block" />}
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <VitalsPreviewCard />
          </div>
        </div>
      </section>

      <section className="border-t border-cb-border px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-2xl border border-cb-border bg-cb-card p-6 ${feature.glow}`}
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${feature.iconBg}`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-cb-border bg-cb-card px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to transform elderly care?
        </h2>
        <Link
          to="/register"
          className="mt-8 inline-block rounded-full bg-cb-lime px-8 py-4 text-base font-semibold text-black transition hover:scale-105 hover:brightness-110"
        >
          Get Started Free
        </Link>
      </section>
    </div>
  );
}
