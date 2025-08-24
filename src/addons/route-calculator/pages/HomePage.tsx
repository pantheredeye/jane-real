import { AddressInput } from '../components/AddressInput'
import { DurationSelector } from '../components/DurationSelector'
import { PropertyCard } from '../components/PropertyCard'
import { RouteSummary } from '../components/RouteSummary'
import { CopyButtons } from '../components/CopyButtons'

export default function HomePage() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">ROUTE CALCULATOR</h1>
        <p className="app-subtitle">Real Estate Showing Planner</p>
      </header>

      <main className="main-content">
        <section className="input-section glass-card">
          <h2 className="section-title">PROPERTY ADDRESSES</h2>
          
          <AddressInput />
          
          <div className="starting-point-container">
            <label htmlFor="starting-point" className="input-label">STARTING POINT</label>
            <select id="starting-point" className="starting-point-dropdown">
              <option value="0">First property (auto-selected)</option>
            </select>
          </div>

          <DurationSelector />

          <button className="calculate-btn" id="calculate-route">
            <span className="btn-text">CALCULATE ROUTE</span>
            <span className="btn-loader hidden">CALCULATING...</span>
          </button>
        </section>

        <section className="results-section hidden" id="results-section">
          <h2 className="section-title">OPTIMIZED ITINERARY</h2>
          <p className="section-description">
            Review your route below. Adjust appointment times and lock specific slots as needed, then re-optimize if changes are made.
          </p>
          
          <RouteSummary />

          <div className="itinerary-container">
            <div className="itinerary-list" id="itinerary-list">
              {/* Dynamic property cards will be rendered here */}
            </div>
          </div>

          <CopyButtons />

          <div className="action-buttons">
            <button className="optimize-btn" id="re-optimize">
              RE-OPTIMIZE ROUTE
            </button>
          </div>
        </section>
      </main>

      <div className="status-container">
        <div className="status-message hidden" id="status-message"></div>
      </div>
    </div>
  )
}