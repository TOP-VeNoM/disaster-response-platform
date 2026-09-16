/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        // Three-tier dark surface system, darkest to lightest:
        // page (outermost bg) -> shell (the floating rounded container) -> card -> tile (nested stat boxes)
        surface: {
          page: '#0F1016',
          shell: '#171821',
          card: '#21222D',
          tile: '#171821',
          border: 'rgba(255, 255, 255, 0.06)'
        },
        // One dominant accent (mint) for primary data/active states,
        // plus a small rotating set used per-metric for visual variety —
        // matches the reference: each stat tile gets a different accent,
        // not one color-per-semantic-meaning.
        accent: {
          mint: '#A9DFD8',
          peach: '#FEB95A',
          pink: '#F2C8ED',
          blue: '#28AEF3',
          amber: '#FCB859'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#87888C',
          faint: '#5A5B63'
        },
        // Semantic status colors kept distinct from the decorative accent
        // palette above, since these carry real meaning (urgency, status)
        // and shouldn't be reassigned just to "look varied."
        status: {
          low: '#16a34a',
          medium: '#ca8a04',
          high: '#ea580c',
          critical: '#dc2626'
        }
      },
      borderRadius: {
        shell: '24px',
        card: '10px',
        tile: '10px'
      }
    }
  },
  plugins: []
};

