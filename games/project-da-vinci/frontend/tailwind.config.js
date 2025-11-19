/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gallery/Museum Color Palette
        gallery: {
          wall: '#2B2520',           // Dark wood/museum wall
          'wall-light': '#3A332E',   // Lighter wall tone
          floor: '#1A1512',          // Dark floor
          cream: '#F5F5DC',          // Cream/Beige
          ivory: '#FFFEF0',          // Ivory white
        },
        gold: {
          frame: '#D4AF37',          // Gold frame
          dark: '#B8860B',           // Dark gold
          light: '#FFD700',          // Bright gold
        },
        wood: {
          dark: '#3E2723',           // Dark brown
          medium: '#5D4037',         // Medium brown
          light: '#6D4C41',          // Light brown
        },
        velvet: {
          red: '#8B0000',            // Deep red velvet
          burgundy: '#A52A2A',       // Burgundy
        },
        // Semantic colors for compatibility
        primary: '#D4AF37',    // Gold
        secondary: '#6D4C41',  // Wood
        success: '#2E7D32',    // Museum green
        warning: '#F57C00',    // Warm orange
        danger: '#C62828',     // Deep red
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],      // Elegant serif for titles
        cormorant: ['Cormorant Garamond', 'serif'],   // Classic serif for body
        crimson: ['Crimson Text', 'serif'],           // Readable serif
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Frame reveal animation
        frameReveal: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
            boxShadow: '0 0 0 rgba(212, 175, 55, 0)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 0 0 8px rgba(212, 175, 55, 0.2)'
          },
        },
        // Spotlight effect
        spotlight: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        shimmer: 'shimmer 2s infinite',
        slideIn: 'slideIn 0.4s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
        frameReveal: 'frameReveal 0.6s ease-out forwards',
        spotlight: 'spotlight 3s ease-in-out infinite',
      },
      boxShadow: {
        'frame-gold': '0 0 0 8px #D4AF37, 0 0 0 12px #B8860B, 0 15px 40px rgba(0, 0, 0, 0.4)',
        'frame-wood': '0 0 0 10px #6D4C41, 0 0 0 14px #5D4037, 0 15px 40px rgba(0, 0, 0, 0.5)',
        'canvas': 'inset 0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)',
        'gallery': '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'wood-texture': "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" /%3E%3CfeColorMatrix type=\"saturate\" values=\"0\"/%3E%3C/filter%3E%3Crect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.05\"/%3E%3C/svg%3E')",
      },
    },
  },
  plugins: [],
}
