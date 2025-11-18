/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyber Retro Color Scheme
        terminal: {
          bg: '#0A0E27',        // Deep space blue-black
          surface: '#1A1F3A',   // Lighter surface
          border: '#2A2F4A',    // Border color
        },
        phosphor: {
          green: '#00FF41',     // Terminal green (primary)
          glow: '#00FF4180',    // Green with transparency for glow
        },
        cyber: {
          blue: '#00D9FF',      // Neon cyan (secondary)
          pink: '#FF0080',      // Bright magenta/pink (AI HUNTER style)
          magenta: '#FF1493',   // Hot pink
          purple: '#A855F7',    // Purple for gradients
          red: '#FF3366',       // Alert red
          yellow: '#FFD700',    // Warning yellow
          gold: '#FFA500',      // Gold for selection/highlight
        },
        // Keep semantic names for compatibility
        primary: '#00FF41',
        secondary: '#00D9FF',
        success: '#00FF41',
        warning: '#FFD700',
        danger: '#FF3366',
      },
      fontFamily: {
        terminal: ['VT323', 'monospace'],           // Retro terminal font
        mono: ['JetBrains Mono', 'monospace'],      // Modern monospace
      },
      keyframes: {
        // Terminal typing effect
        typewriter: {
          '0%': { width: '0', opacity: '0' },
          '1%': { opacity: '1' },
          '100%': { width: '100%', opacity: '1' },
        },
        // Cursor blink
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        // CRT flicker
        flicker: {
          '0%, 100%': { opacity: '1' },
          '41.99%': { opacity: '1' },
          '42%': { opacity: '0.8' },
          '43%': { opacity: '1' },
          '45.99%': { opacity: '1' },
          '46%': { opacity: '0.9' },
          '46.5%': { opacity: '1' },
        },
        // Glitch effect
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-2px, -2px)' },
          '80%': { transform: 'translate(2px, 2px)' },
        },
        // Scanline movement
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        // Phosphor glow pulse
        glow: {
          '0%, 100%': {
            textShadow: '0 0 4px #00FF41, 0 0 8px #00FF41, 0 0 12px #00FF41',
          },
          '50%': {
            textShadow: '0 0 6px #00FF41, 0 0 12px #00FF41, 0 0 18px #00FF41, 0 0 24px #00FF41',
          },
        },
        // Matrix-style text cascade
        matrixFall: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        // Slide in from left (terminal style)
        slideInTerminal: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // Scale in with glow
        scaleGlow: {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0',
            filter: 'brightness(0.5)',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
            filter: 'brightness(1)',
          },
        },
      },
      animation: {
        typewriter: 'typewriter 0.8s steps(20) forwards',
        blink: 'blink 1s step-end infinite',
        flicker: 'flicker 0.15s infinite',
        glitch: 'glitch 0.5s cubic-bezier(.25,.46,.45,.94) both',
        scanline: 'scanline 8s linear infinite',
        glow: 'glow 2s ease-in-out infinite',
        matrixFall: 'matrixFall 3s linear infinite',
        slideInTerminal: 'slideInTerminal 0.4s ease-out forwards',
        scaleGlow: 'scaleGlow 0.5s ease-out forwards',
      },
      boxShadow: {
        'glow-green': '0 0 10px #00FF4180, 0 0 20px #00FF4140, 0 0 30px #00FF4120',
        'glow-blue': '0 0 10px #00D9FF80, 0 0 20px #00D9FF40, 0 0 30px #00D9FF20',
        'glow-red': '0 0 10px #FF336680, 0 0 20px #FF336640, 0 0 30px #FF336620',
        'glow-pink': '0 0 10px #FF008080, 0 0 20px #FF008040, 0 0 30px #FF008020',
        'glow-gold': '0 0 10px #FFA50080, 0 0 20px #FFA50040, 0 0 30px #FFA50020',
      },
    },
  },
  plugins: [],
}
