/**
 * admin-dashboard/src/app/dashboard/support/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Support Inbox Page.
 *
 * Renders the interactive SupportInboxClient which loads authenticated data
 * via tRPC and TanStack Query using the browser's admin authentication tokens.
 */

import { SupportInboxClient } from './SupportInboxClient';

export default function SupportPage() {
  return <SupportInboxClient />;
}

export const metadata = {
  title: 'Support Inbox | Scrapiz Admin',
};
