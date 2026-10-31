import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        enterprise: {
          navy: '#0F172A',       // Primary Base: Sidebars, nav, primary CTA
          blue: '#1E3A8A',       // Primary Accent: Active tabs, focus states
          bg: '#F8FAFC',         // Background: Page canvas
          surface: '#FFFFFF',    // Surface/Card: Containers, data tables, cards
          border: '#E2E8F0',     // Borders: Structural dividers, inputs
          charcoal: '#020617',   // Text Primary: Headings, high-contrast text
          smoke: '#64748B',      // Text Muted: Subtext, meta labels
          forest: '#15803D',     // Success Status: Approved, active warranties
          amber: '#B45309',      // Warning/Pending: Dispatches queued, surveys pending
          brick: '#991B1B',      // Destructive/Error: Disqualified roof, fault alerts
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;