import React from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-primary-dark text-white p-4 shadow-md">
        <nav className="container mx-auto flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <Link href="/" className="text-xl font-bold hover:text-accent transition-colors">
              Community Learning Hub
            </Link>
          </div>
          
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <Link href="/" className="text-white hover:text-accent transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-white hover:text-accent transition-colors">
              Blog
            </Link>
            <Link href="/events" className="text-white hover:text-accent transition-colors">
              Events
            </Link>
            <Link href="/forum" className="text-white hover:text-accent transition-colors">
              Forum
            </Link>
            <Link href="/pricing" className="text-white hover:text-accent transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-white hover:text-accent transition-colors">
              Dashboard
            </Link>
            <Link href="/admin" className="text-white hover:text-accent transition-colors">
              Admin
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>

      <footer className="bg-neutral-200 dark:bg-neutral-800 text-center p-4 mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 sm:mb-0">
              &copy; {new Date().getFullYear()} Community Learning Hub. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
