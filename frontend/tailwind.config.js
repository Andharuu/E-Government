/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"Cascadia Code"', 'Consolas', '"Liberation Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#172554',
          900: '#0f172a',
        },
        surface: {
          base: '#f4f6f9',
          elevated: '#ffffff',
          sunken: '#e8ecf2',
        },
        content: {
          primary: '#0c1222',
          secondary: '#4a5568',
          tertiary: '#6b7a90',
          disabled: '#94a3b8',
        },
        border: {
          default: '#d1d9e6',
          strong: '#94a3b8',
          focus: '#1e40af',
        },
        success: {
          DEFAULT: '#15803d',
          light: '#dcfce7',
          dark: '#166534',
        },
        warning: {
          DEFAULT: '#a16207',
          light: '#fef3c7',
          dark: '#854d0e',
        },
        error: {
          DEFAULT: '#b91c1c',
          light: '#fee2e2',
          dark: '#991b1b',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(12 18 34 / 0.04)',
        'sm': '0 1px 3px 0 rgb(12 18 34 / 0.06), 0 1px 2px -1px rgb(12 18 34 / 0.06)',
        'DEFAULT': '0 2px 4px -1px rgb(12 18 34 / 0.06), 0 1px 2px -2px rgb(12 18 34 / 0.06)',
        'md': '0 4px 6px -1px rgb(12 18 34 / 0.06), 0 2px 4px -2px rgb(12 18 34 / 0.06)',
        'lg': '0 10px 15px -3px rgb(12 18 34 / 0.06), 0 4px 6px -4px rgb(12 18 34 / 0.06)',
        'none': 'none',
      },
      transitionTimingFunction: {
        'responsive': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'layout': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      transitionDuration: {
        'fast': '120ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'var(--color-content-primary)',
            lineHeight: '1.5',
          },
        },
      },
    },
  },
  plugins: [],
}
