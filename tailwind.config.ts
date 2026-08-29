import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#1B7A3E',
          dark: '#124A28',
        },
        orange: {
          DEFAULT: '#E4661F',
          hover: '#CF580F',
          light: '#F5A97A',
        },
        cream: '#FAF9F6',
        ink: '#222222',
        forest: {
          DEFAULT: '#0F5132',
          deep: '#0B3D26',
        },
        flame: {
          DEFAULT: '#F26419',
          dark: '#D9530F',
          soft: '#FDEADD',
        },
        sand: '#F5F3EE',
        sage: {
          DEFAULT: '#D5E3DA',
          soft: '#EDF3EF',
          line: '#E3ECE6',
        },
        mist: '#6B7280',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        site: '1180px',
      },
      borderRadius: {
        card: '6px',
      },
    },
  },
  plugins: [],
} satisfies Config
