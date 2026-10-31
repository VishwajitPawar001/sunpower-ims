import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SunPower - Solar Installation & Lifecycle Management',
  description: 'Enterprise EPC platform for solar project lifecycle tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-enterprise-bg text-enterprise-charcoal">
        {children}
      </body>
    </html>
  );
}