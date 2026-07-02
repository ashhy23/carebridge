/**
 * Main layout shell: fixed sidebar + scrollable content area.
 */
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-cb-bg">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="min-h-screen md:ml-[240px]">
        <button
          type="button"
          aria-label="Open navigation menu"
          className="fixed left-4 top-4 z-30 rounded-lg border border-cb-border bg-cb-card p-2 text-white transition hover:bg-white/5 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <main className="min-h-screen pt-16 md:pt-0">{children}</main>
      </div>
    </div>
  );
}
