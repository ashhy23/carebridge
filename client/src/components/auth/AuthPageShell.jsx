/**
 * Shared dark auth layout with animated ECG background and glass form card.
 */
export const AUTH_INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export const AUTH_LABEL_CLASS = 'mb-1 block text-sm text-gray-300';

export const AUTH_SELECT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

function EcgBackground() {
  const ecgSegment =
    'M0 50 L80 50 L95 50 L100 15 L105 85 L110 50 L190 50 L205 50 L210 15 L215 85 L220 50 L300 50';

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
      <svg
        className="animate-ecg-scroll h-20 w-[200%] min-w-[200%] shrink-0 opacity-[0.15]"
        viewBox="0 0 600 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={`${ecgSegment} ${ecgSegment.replace(/M0/g, 'M300')}`} fill="none" stroke="#3b82f6" strokeWidth="2" />
      </svg>
    </div>
  );
}

function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="w-full rounded-3xl border border-white/10 bg-[rgba(17,17,24,0.8)] p-10 backdrop-blur-[20px]">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
      {children}
      {footer}
    </div>
  );
}

export default function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
  layout = 'split',
  belowCard,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-cb-bg">
      <EcgBackground />
      <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-[500px] w-[500px] animate-drift rounded-full bg-[#3b82f6]/[0.12] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-60px] left-[-60px] h-[400px] w-[400px] animate-drift-reverse rounded-full bg-[#d4f53c]/[0.06] blur-3xl" />

      {layout === 'centered' ? (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white">CareBridge</h1>
              <p className="mt-1 text-sm text-cb-lime">Care Platform</p>
              <p className="mt-2 text-sm text-gray-400">
                Coordinating care. Connecting families.
              </p>
            </div>

            <AuthCard title={title} subtitle={subtitle} footer={footer}>
              {children}
            </AuthCard>

            {belowCard}
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex min-h-screen">
          <div className="hidden flex-col justify-center px-12 md:flex md:w-[40%] lg:px-16">
            <h1 className="text-4xl font-bold text-white lg:text-5xl">CareBridge</h1>
            <p className="mt-2 text-sm font-medium text-cb-lime">Care Platform</p>
            <p className="mt-6 max-w-sm text-lg text-gray-400">
              Coordinating care. Connecting families.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {['✓ Real-time Vitals', '✓ Smart Alerts', '✓ AI Care Summaries'].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-gray-300"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 py-12">
            <div className="w-full max-w-[420px]">
              <AuthCard title={title} subtitle={subtitle} footer={footer}>
                {children}
              </AuthCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
