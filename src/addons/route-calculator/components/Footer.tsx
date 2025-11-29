'use client'

import './Footer.css'

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="footer-link">
          Terms of Service
        </a>
        <span className="footer-divider">•</span>
        <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="footer-link">
          Privacy Policy
        </a>
        <span className="footer-divider">•</span>
        <a href="mailto:barrett@digitalglue.dev" className="footer-link">
          Contact
        </a>
      </div>
    </footer>
  )
}
