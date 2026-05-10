/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',
        background: '#F2F2F7',
        surface: '#FFFFFF',
        textPrimary: '#1C1C1E',
        textSecondary: '#8E8E93',
        border: '#C6C6C8',
        danger: '#FF3B30',
        success: '#34C759',
      },
    },
  },
  plugins: [],
};
