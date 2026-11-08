/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Driven by CSS variables set per active section theme.
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accent2: 'rgb(var(--accent-2) / <alpha-value>)',
        accent3: 'rgb(var(--accent-3) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        deep: 'rgb(var(--deep) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Orbitron', 'Chakra Petch', 'system-ui', 'sans-serif'],
        sans: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgb(var(--accent) / 0.45), 0 0 60px rgb(var(--accent) / 0.18)',
        'glow-sm': '0 0 10px rgb(var(--accent) / 0.5)',
        'glow-lg': '0 0 40px rgb(var(--accent) / 0.5), 0 0 120px rgb(var(--accent) / 0.22)',
        panel: '0 18px 60px -12px rgb(0 0 0 / 0.75)',
      },
      backgroundImage: {
        'holo-edge':
          'linear-gradient(135deg, rgb(var(--accent) / 0.55), transparent 35%, transparent 65%, rgb(var(--accent-2) / 0.45))',
        grid: 'linear-gradient(rgb(var(--accent)/0.14) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--accent)/0.14) 1px, transparent 1px)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-22px) rotate(1.2deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(2000%)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.85' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        flicker: {
          '0%,19%,21%,23%,25%,54%,56%,100%': { opacity: '1' },
          '20%,22%,24%,55%': { opacity: '0.55' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        scanline: 'scanline 7s linear infinite',
        sweep: 'sweep 2.4s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2.8s ease-out infinite',
        flicker: 'flicker 5s linear infinite',
        shimmer: 'shimmer 3.5s linear infinite',
        blink: 'blink 1.05s step-end infinite',
        'spin-slow': 'spinSlow 22s linear infinite',
      },
    },
  },
  plugins: [],
}
