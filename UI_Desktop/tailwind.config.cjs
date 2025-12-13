/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // dùng class 'dark' cho dark mode
  theme: {
    extend: {
      colors: {
        // Primary - dùng CSS variables
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
          light: "var(--primary-light)",
        },
        // Status colors
        danger: "var(--danger)",
        warning: "var(--warning)", 
        success: "var(--success)",
        info: "var(--info)",
        // Surface colors
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        // Text colors  
        text: {
          1: "var(--text-1)",
          2: "var(--text-2)",
          3: "var(--text-3)",
        },
        // Border colors
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
          focus: "var(--border-focus)",
        },
      },
      backgroundColor: {
        'app': 'var(--bg)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'base': 'var(--space-base)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      fontSize: {
        'display': ['var(--text-display)', { lineHeight: '1.2' }],
        'h1': ['var(--text-h1)', { lineHeight: '1.3' }],
        'h2': ['var(--text-h2)', { lineHeight: '1.3' }],
        'h3': ['var(--text-h3)', { lineHeight: '1.4' }],
        'body': ['var(--text-body)', { lineHeight: '1.5' }],
        'sm': ['var(--text-sm)', { lineHeight: '1.5' }],
        'caption': ['var(--text-caption)', { lineHeight: '1.4' }],
        'tiny': ['var(--text-tiny)', { lineHeight: '1.4' }],
      },
      transitionDuration: {
        'fast': '100ms',
        'base': '150ms',
        'slow': '200ms',
      },
    },
  },
  plugins: [],
};
