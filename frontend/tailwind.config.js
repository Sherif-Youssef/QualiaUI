module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--color-border))",
        input: "hsl(var(--color-input))",
        ring: "hsl(var(--color-ring))",
        background: "hsl(var(--color-background))",
        foreground: "hsl(var(--color-foreground))",
        primary: {
          DEFAULT: "hsl(var(--color-primary))",
          foreground: "hsl(var(--color-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--color-secondary))",
          foreground: "hsl(var(--color-secondary-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--color-tertiary))",
          foreground: "hsl(var(--color-tertiary-foreground))",
        },
        neutral: {
          DEFAULT: "hsl(var(--color-neutral))",
          foreground: "hsl(var(--color-neutral-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--color-success))",
          foreground: "hsl(var(--color-success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--color-warning))",
          foreground: "hsl(var(--color-warning-foreground))",
        },
        failure: {
          DEFAULT: "hsl(var(--color-failure))",
          foreground: "hsl(var(--color-failure-foreground))",
        },
        idle: {
          DEFAULT: "hsl(var(--color-idle))",
          foreground: "hsl(var(--color-idle-foreground))",
        },
        gray: {
          50: "hsl(var(--color-gray-50))",
          100: "hsl(var(--color-gray-100))",
          200: "hsl(var(--color-gray-200))",
          300: "hsl(var(--color-gray-300))",
          400: "hsl(var(--color-gray-400))",
          500: "hsl(var(--color-gray-500))",
          600: "hsl(var(--color-gray-600))",
          700: "hsl(var(--color-gray-700))",
          800: "hsl(var(--color-gray-800))",
          900: "hsl(var(--color-gray-900))",
        },
        muted: {
          DEFAULT: "hsl(var(--color-muted))",
          foreground: "hsl(var(--color-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--color-accent))",
          foreground: "hsl(var(--color-accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--color-destructive))",
          foreground: "hsl(var(--color-destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--color-card))",
          foreground: "hsl(var(--color-card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--color-popover))",
          foreground: "hsl(var(--color-popover-foreground))",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        fancy:['"Fira Sans"', 'sans-serif'],
      },
      fontSize: {
        'headline-xl': ['36px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'headline-lg': ['25px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'headline-md': ['18px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'headline-sm': ['13px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'body-lg': ['16px', { lineHeight: '1.5' }],
        'body-md': ['13px', { lineHeight: '1.5' }],
        'body-sm': ['10px', { lineHeight: '1.5' }],
      },
      spacing: {
        '4': '1rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem',
        '32': '8rem',
        '48': '12rem',
        '64': '16rem',
      },
      backgroundImage: {
        'gradient-1': 'linear-gradient(135deg, hsl(190, 100%, 50%) 0%, hsl(270, 70%, 60%) 100%)',
        'gradient-2': 'linear-gradient(180deg, hsl(210, 20%, 98%) 0%, hsl(210, 15%, 90%) 100%)',
        'button-border-gradient': 'linear-gradient(90deg, hsl(190, 100%, 50%), hsl(155, 55%, 45%))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
