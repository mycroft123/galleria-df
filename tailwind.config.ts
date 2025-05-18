import type { Config } from "tailwindcss";

const config: Config = {
  mode: "jit",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        "radial-gradient":
          "radial-gradient(73.15% 70.06% at 50% -10.9%, #43ccae 0%, #3db399 100%)",
      },
      boxShadow: {
        glow: "0 0 5px 2px rgba(238, 199, 188, 0.6)", // This is a blue glow
      },
      animation: {
        'scanner': 'scanner 4s linear infinite',
        'heartbeat': 'heartbeat 1.5s ease infinite',
        'slow-pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scanner: {
          '0%': { left: '0%' },
          '50%': { left: '100%' },
          '50.001%': { left: '100%' },
          '100%': { left: '0%' }
        },
        heartbeat: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '25%': { transform: 'scale(1.1)', opacity: '0.8' },
          '40%': { transform: 'scale(1)', opacity: '1' },
          '60%': { transform: 'scale(1.1)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
      },
    },
  },

  plugins: [
    require("daisyui"),
    require('@tailwindcss/forms'),
  ],
  daisyui: {
    themes: [
      {
        Helius: {
          primary: "#E4552E",

          secondary: "#a03b20",

          accent: "#ffaf99",

          neutral: "#454549",

          "neutral-2": "#5F5F5F",

          "base-100": "#222222",

          info: "#008ce5",

          success: "#84cc16",

          warning: "#fb923c",

          error: "#dc2626",
        },
      },
    ],
    darkTheme: false,
  },
};

export default config;