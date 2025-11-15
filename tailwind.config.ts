import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // 使用 class 策略控制深色模式
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'energy-base': "var(--energy-base-white)",
        'energy-soft': "var(--energy-base-soft)",
        'energy-deep': "var(--energy-deep-black)",
        'energy-water': {
          DEFAULT: "var(--energy-water-blue)",
          hover: "var(--energy-water-blue-hover)",
          deep: "var(--energy-water-blue-deep)",
          surface: "var(--energy-water-surface)",
          muted: "var(--energy-water-muted)",
        },
        'energy-gold': {
          light: "var(--energy-gold-light)",
          mid: "var(--energy-gold-mid)",
          soft: "var(--energy-gold-soft)",
          outline: "var(--energy-gold-outline)",
        },
        indigo: {
          50: '#f2f8ff',
          100: '#e0efff',
          200: '#c0dcff',
          300: '#96c4ff',
          400: '#6baaff',
          500: '#408fff',
          600: '#0066cc',
          700: '#0052a3',
          800: '#003d7a',
          900: '#002952',
        },
        blue: {
          50: '#f4faff',
          100: '#e6f4ff',
          200: '#cce8ff',
          300: '#a3d1ff',
          400: '#7bb8ff',
          500: '#529eff',
          600: '#2a84f5',
          700: '#1f6cc7',
          800: '#155499',
          900: '#0a3d6b',
        },
        // 功能色
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      backgroundImage: {
        'energy-gold': "var(--energy-gold-gradient)",
        'energy-hero': "var(--energy-hero-gradient)",
        'energy-hero-dark': "var(--energy-hero-gradient-dark)",
      },
      ringColor: {
        'energy-water': "var(--energy-water-blue)",
        'energy-water-deep': "var(--energy-water-blue-deep)",
        'energy-gold': "var(--energy-gold-mid)",
      },
      outlineColor: {
        'energy-water': "var(--energy-water-blue)",
        'energy-gold': "var(--energy-gold-mid)",
      },
      borderColor: {
        'energy-gold-mid': "var(--energy-gold-mid)",
        'energy-gold-soft': "var(--energy-gold-soft)",
        'energy-gold-outline': "var(--energy-gold-outline)",
        'energy-water-surface': "var(--energy-water-surface)",
      },
      boxShadow: {
        'energy-card': '0 20px 45px -20px rgba(0, 51, 102, 0.25)',
        'energy-focus': '0 0 0 4px rgba(0, 102, 204, 0.15)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
export default config;

