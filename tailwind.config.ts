import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define warm orange and yellow colors here
        // Example using default Tailwind colors - replace with specific hex/rgb values later
        primary: {
          DEFAULT: '#F97316', // orange-500
          light: '#FB923C', // orange-400
          dark: '#EA580C',  // orange-600
        },
        accent: {
          DEFAULT: '#FACC15', // yellow-400
          light: '#FDE047', // yellow-300
          dark: '#EAB308',  // yellow-500
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: theme('colors.neutral.700'),
            a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.primary.dark'),
              },
            },
            h1: {
              color: theme('colors.primary.dark'),
            },
            h2: {
              color: theme('colors.primary.dark'),
            },
            h3: {
              color: theme('colors.primary.DEFAULT'),
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.neutral.300'),
            a: {
              color: theme('colors.primary.light'),
              '&:hover': {
                color: theme('colors.primary.DEFAULT'),
              },
            },
            h1: {
              color: theme('colors.primary.light'),
            },
            h2: {
              color: theme('colors.primary.light'),
            },
            h3: {
              color: theme('colors.primary.DEFAULT'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
