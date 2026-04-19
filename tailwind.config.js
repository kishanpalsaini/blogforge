/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      typography: {
        gray: {
          css: {
            '--tw-prose-body': '#374151',
            '--tw-prose-headings': '#111827',
            '--tw-prose-links': '#111827',
            '--tw-prose-code': '#111827',
            '--tw-prose-pre-bg': '#f9fafb',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
