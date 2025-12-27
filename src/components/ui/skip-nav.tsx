/**
 * Skip Navigation Component
 * Provides a skip link for keyboard users to bypass navigation and jump to main content
 * Meets WCAG 2.1 Level A requirement for bypass blocks
 */

import Link from 'next/link';

export function SkipNav() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
      aria-label="Skip to main content"
    >
      Skip to main content
    </Link>
  );
}
