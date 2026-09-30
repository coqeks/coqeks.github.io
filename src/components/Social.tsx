const icon = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3 }

export default function Social() {
  return (
    <div className="social">
      <a href="https://linkedin.com/in/" aria-label="LinkedIn">
        <svg {...icon}>
          <rect x="3" y="9" width="3.5" height="11" />
          <circle cx="4.8" cy="5" r="1.6" />
          <path d="M10 20V9h3.4v1.6C14.2 9.4 15.5 9 16.8 9 19 9 20.5 10.4 20.5 13v7H17v-6c0-1.3-.6-2-1.7-2s-1.8.8-1.8 2v6z" />
        </svg>
      </a>
      <a href="https://github.com/coqeks" aria-label="GitHub">
        <svg {...icon}>
          <path d="M9 19c-4 1-4-2-6-2m12 4v-3.2a2.8 2.8 0 0 0-.8-2.2c2.6-.3 5.3-1.3 5.3-5.7A4.4 4.4 0 0 0 18.3 6.7 4.1 4.1 0 0 0 18.2 3.5S17.2 3.2 15 4.7a11 11 0 0 0-6 0C6.8 3.2 5.8 3.5 5.8 3.5A4.1 4.1 0 0 0 5.7 6.7 4.4 4.4 0 0 0 4.5 9.8c0 4.4 2.7 5.4 5.3 5.7A2.8 2.8 0 0 0 9 17.7V21" />
        </svg>
      </a>
    </div>
  )
}