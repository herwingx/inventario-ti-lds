/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colores principales del tema Karciz
        primary: {
          DEFAULT: '#13B497',
          hover: '#0e8670',
          dark: '#042a23',
          50: 'rgba(19, 180, 151, 0.1)',
          100: 'rgba(19, 180, 151, 0.2)',
          200: 'rgba(19, 180, 151, 0.3)',
          300: 'rgba(19, 180, 151, 0.4)',
          400: 'rgba(19, 180, 151, 0.5)',
          500: '#13B497',
          600: '#0e8670',
          700: '#0a5f50',
          800: '#063830',
          900: '#042a23',
        },
        secondary: {
          DEFAULT: '#D07407',
          light: '#f78f13',
        },
        // Colores para las cards de acceso rápido
        card: {
          blue: '#3C65F5',
          green: '#2bc155',
          orange: '#FFAB2D',
          red: '#B03636',
          teal: '#13B497',
          purple: '#7d49eb',
        },
        // Colores del modo oscuro (exactos del diseño original)
        dark: {
          bg: '#24292d',        // Background principal body
          card: '#2f363e',      // Cards y containers
          sidebar: '#2f363e',   // Sidebar
          header: '#2f363e',    // Header (mismo que cards)
          border: '#3e454d',    // Bordes sutiles
          text: '#e4e6eb',      // Texto principal
          muted: '#8b949e',     // Texto secundario
        },
        // Colores del modo claro
        light: {
          bg: '#F6FBF8',
          card: '#ffffff',
          sidebar: '#ffffff',     // Sidebar claro
          header: '#ffffff',      // Header claro (igual que sidebar)
          border: '#e2e8f0',
          text: '#3d4465',
          muted: '#6c757d',
        },
        // Estados
        success: '#2bc155',
        warning: '#FFAB2D',
        danger: '#B03636',
        info: '#3C65F5',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        title: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.2)',
        'sidebar': '2px 0 10px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
