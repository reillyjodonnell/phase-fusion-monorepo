/** @type {import('tailwindcss').Config} */
// tailwind.config.js

// theme.js

const LightTheme = {
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(222.2, 47.4%, 11.2%)',
  muted: 'hsl(210, 40%, 96.1%)',
  mutedForeground: 'hsl(215.4, 16.3%, 46.9%)',
  popover: 'hsl(0, 0%, 100%)',
  popoverForeground: 'hsl(222.2, 47.4%, 11.2%)',
  border: 'hsl(214.3, 31.8%, 91.4%)',
  input: 'hsl(214.3, 31.8%, 91.4%)',
  card: 'hsl(0, 0%, 100%)',
  cardForeground: 'hsl(222.2, 47.4%, 11.2%)',
  primary: 'hsl(222.2, 47.4%, 11.2%)',
  primaryForeground: 'hsl(210, 40%, 98%)',
  secondary: 'hsl(210, 40%, 96.1%)',
  secondaryForeground: 'hsl(222.2, 47.4%, 11.2%)',
  accent: 'hsl(210, 40%, 96.1%)',
  accentForeground: 'hsl(222.2, 47.4%, 11.2%)',
  destructive: 'hsl(0, 100%, 50%)',
  destructiveForeground: 'hsl(210, 40%, 98%)',
  ring: 'hsl(215, 20.2%, 65.1%)',
  radius: 8, // this is an approximation, as React Native doesn't use 'rem'
};

const DarkTheme = {
  ...LightTheme,
  background: 'hsl(224, 71%, 4%)',
  foreground: 'hsl(213, 31%, 91%)',
  muted: 'hsl(223, 47%, 11%)',
  mutedForeground: 'hsl(215.4, 16.3%, 56.9%)',
  accent: 'hsl(216, 34%, 17%)',
  accentForeground: 'hsl(210, 40%, 98%)',
  popover: 'hsl(224, 71%, 4%)',
  popoverForeground: 'hsl(215, 20.2%, 65.1%)',
  border: 'hsl(216, 34%, 17%)',
  input: 'hsl(216, 34%, 17%)',
  card: 'hsl(224, 71%, 4%)',
  cardForeground: 'hsl(213, 31%, 91%)',
  primary: 'hsl(210, 40%, 98%)',
  primaryForeground: 'hsl(222.2, 47.4%, 1.2%)',
  secondary: 'hsl(222.2, 47.4%, 11.2%)',
  secondaryForeground: 'hsl(210, 40%, 98%)',
  destructive: 'hsl(0, 63%, 31%)',
  destructiveForeground: 'hsl(210, 40%, 98%)',
  ring: 'hsl(216, 34%, 17%)',
};

const theme = LightTheme;

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: theme.border,
        input: theme.input,
        ring: theme.ring,
        background: theme.background,
        foreground: theme.foreground,
        primary: {
          DEFAULT: theme.primary,
          foreground: theme.primaryForeground,
        },
        secondary: {
          DEFAULT: theme.secondary,
          foreground: theme.secondaryForeground,
        },
        destructive: {
          DEFAULT: theme.destructive,
          foreground: theme.destructiveForeground,
        },
        muted: {
          DEFAULT: theme.muted,
          foreground: theme.mutedForeground,
        },
        accent: {
          DEFAULT: theme.accent,
          foreground: theme.accentForeground,
        },
        popover: {
          DEFAULT: theme.popover,
          foreground: theme.popoverForeground,
        },
        card: {
          DEFAULT: theme.card,
          foreground: theme.cardForeground,
        },
      },
      borderRadius: {
        lg: `${theme.radius}px`, // assuming that radius is defined in pixels
        md: `${theme.radius - 2}px`,
        sm: `${theme.radius - 4}px`,
      },
    },
  },
  plugins: [],
};
