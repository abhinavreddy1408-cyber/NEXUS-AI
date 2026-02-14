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
        // Executive Luxury Palette
        amber: {
          DEFAULT: '#B06A20', // Primary Action
          dark: '#8B5117',
          light: '#C87533', // Copper
        },
        bottleGreen: {
          DEFAULT: '#1E4B3A', // Secondary Depth
          dark: '#14382A',
        },
        cream: {
          DEFAULT: '#F5EFE8', // Canvas
          dim: '#E5DFD8', // Surface / Soft Gray
        },
        charcoal: {
          DEFAULT: '#202124', // Primary Text
          muted: '#3C4043',
        },
        warmGray: {
          DEFAULT: '#8B7D6B', // Muted Text
        },
        // Semantic overrides
        white: '#FFFFFF',
        'vibrant-red': '#FF4D6D',
        'vibrant-green': '#19C37D',
      },
      fontFamily: {
        serif: ['var(--font-playfair)'],
        sans: ['var(--font-inter)'],
      },
    },
  },
  plugins: [],
};
export default config;
