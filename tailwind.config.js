/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── ChurchOS design tokens — now driven by CSS vars (runtime customisable) ──
        'primary':                   'rgb(var(--c-primary) / <alpha-value>)',
        'primary-dim':               'rgb(var(--c-primary-dim) / <alpha-value>)',
        'primary-fixed':             'rgb(var(--c-primary-container) / <alpha-value>)',
        'primary-container':         'rgb(var(--c-primary-container) / <alpha-value>)',
        'on-primary':                'rgb(var(--c-on-primary) / <alpha-value>)',
        'on-primary-container':      'rgb(var(--c-on-primary-container) / <alpha-value>)',

        'secondary':                 'rgb(var(--c-secondary) / <alpha-value>)',
        'secondary-dim':             'rgb(var(--c-secondary-dim) / <alpha-value>)',
        'secondary-fixed':           'rgb(var(--c-secondary-container) / <alpha-value>)',
        'secondary-container':       'rgb(var(--c-secondary-container) / <alpha-value>)',
        'on-secondary':              'rgb(var(--c-on-primary) / <alpha-value>)',
        'on-secondary-container':    'rgb(var(--c-on-secondary-container) / <alpha-value>)',

        'tertiary':                  'rgb(var(--c-tertiary) / <alpha-value>)',
        'tertiary-dim':              'rgb(var(--c-tertiary-dim) / <alpha-value>)',
        'tertiary-container':        'rgb(var(--c-tertiary-container) / <alpha-value>)',
        'on-tertiary':               'rgb(var(--c-on-primary) / <alpha-value>)',
        'on-tertiary-container':     'rgb(var(--c-on-tertiary-container) / <alpha-value>)',

        'surface':                   'rgb(var(--c-surface) / <alpha-value>)',
        'surface-bright':            'rgb(var(--c-surface) / <alpha-value>)',
        'surface-dim':               'rgb(var(--c-surface-container-high) / <alpha-value>)',
        'surface-tint':              'rgb(var(--c-primary) / <alpha-value>)',
        'surface-variant':           'rgb(var(--c-surface-variant) / <alpha-value>)',
        'surface-container-lowest':  'rgb(var(--c-surface-container-lowest) / <alpha-value>)',
        'surface-container-low':     'rgb(var(--c-surface-container-low) / <alpha-value>)',
        'surface-container':         'rgb(var(--c-surface-container) / <alpha-value>)',
        'surface-container-high':    'rgb(var(--c-surface-container-high) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--c-surface-container-highest) / <alpha-value>)',
        'on-surface':                'rgb(var(--c-on-surface) / <alpha-value>)',
        'on-surface-variant':        'rgb(var(--c-on-surface-variant) / <alpha-value>)',
        'inverse-surface':           'rgb(var(--c-on-surface) / <alpha-value>)',
        'inverse-on-surface':        'rgb(var(--c-on-surface-variant) / <alpha-value>)',

        'background':                'rgb(var(--c-surface) / <alpha-value>)',
        'on-background':             'rgb(var(--c-on-surface) / <alpha-value>)',

        'outline':                   'rgb(var(--c-outline) / <alpha-value>)',
        'outline-variant':           'rgb(var(--c-outline-variant) / <alpha-value>)',

        'error':                     'rgb(var(--c-error) / <alpha-value>)',
        'error-container':           'rgb(var(--c-error-container) / <alpha-value>)',
        'on-error':                  'rgb(var(--c-on-error) / <alpha-value>)',
        'on-error-container':        'rgb(var(--c-on-error-container) / <alpha-value>)',
      },
      fontFamily: {
        headline: ['var(--font-headline)'],
        sans:     ['var(--font-body)'],
        body:     ['var(--font-body)'],
        label:    ['var(--font-body)'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg:      '0.5rem',
        xl:      '0.75rem',
        '2xl':   '1.5rem',
        full:    '9999px',
      },
    },
  },
  plugins: [],
}