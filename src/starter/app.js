// MVP Route Calculator - JavaScript Application Logic

class RouteCalculator {
  constructor() {
    this.properties = [];
    this.currentRoute = null;
    this.selectedDuration = 15; // Default showing duration in minutes
    this.startingPropertyIndex = 0;
    
    this.initializeEventListeners();
    this.updateStartingPointOptions();
  }

  initializeEventListeners() {
    // Address input changes
    document.getElementById('addresses').addEventListener('input', () => {
      this.parseAddresses();
      this.updateStartingPointOptions();
    });

    // Starting point selection
    document.getElementById('starting-point').addEventListener('change', (e) => {
      this.startingPropertyIndex = parseInt(e.target.value);
    });

    // Duration preset buttons
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectDuration(parseInt(e.target.dataset.duration));
      });
    });

    // Calculate route button
    document.getElementById('calculate-route').addEventListener('click', () => {
      this.calculateRoute();
    });

    // Re-optimize button
    document.getElementById('re-optimize').addEventListener('click', () => {
      this.reOptimizeRoute();
    });

    // Copy itinerary buttons
    document.getElementById('copy-client').addEventListener('click', () => {
      this.copyItinerary('client');
    });

    document.getElementById('copy-detailed').addEventListener('click', () => {
      this.copyItinerary('detailed');
    });
  }

  parseAddresses() {
    const addressText = document.getElementById('addresses').value.trim();
    if (!addressText) {
      this.properties = [];
      return;
    }

    const addresses = addressText.split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    this.properties = addresses.map((address, index) => ({
      id: `prop_${index}`,
      address: address,
      showingDuration: this.selectedDuration,
      appointmentTime: null,
      isFrozen: false,
      coordinates: null // Will be populated by geocoding
    }));
  }

  updateStartingPointOptions() {
    const select = document.getElementById('starting-point');
    
    // Clear existing options except first
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }

    // Add options for each property
    this.properties.forEach((property, index) => {
      if (index === 0) {
        select.children[0].textContent = `${property.address} (auto-selected)`;
        select.children[0].value = index;
      } else {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = property.address;
        select.appendChild(option);
      }
    });

    // Reset to first property if current selection is out of bounds
    if (this.startingPropertyIndex >= this.properties.length) {
      this.startingPropertyIndex = 0;
      select.value = 0;
    }
  }

  selectDuration(duration) {
    this.selectedDuration = duration;
    
    // Update UI
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.duration) === duration);
    });

    // Update all non-frozen properties
    this.properties.forEach(property => {
      if (!property.isFrozen) {
        property.showingDuration = duration;
      }
    });

    // Only update display if route has been calculated
    if (this.currentRoute) {
      this.updateUnifiedItineraryDisplay();
    }
  }

  async calculateRoute() {
    if (this.properties.length === 0) {
      this.showStatus('Please enter at least one property address', 'error');
      return;
    }

    this.showCalculating(true);

    try {
      // Simulate geocoding and route calculation
      await this.simulateGeocoding();
      await this.simulateRouteOptimization();
      
      this.displayResults();
      this.showCalculating(false);
      this.showStatus('Route optimized! Check your itinerary below.', 'success');
      
    } catch (error) {
      this.showCalculating(false);
      this.showStatus('Error calculating route. Please try again.', 'error');
      console.error('Route calculation error:', error);
    }
  }

  async simulateGeocoding() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock coordinates for each property
    this.properties.forEach((property, index) => {
      property.coordinates = {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1, // NYC area with some variation
        lng: -74.0060 + (Math.random() - 0.5) * 0.1
      };
    });
  }

  async simulateRouteOptimization() {
    // Simulate route optimization delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple optimization: start with starting property, then randomize others
    const optimizedOrder = [this.startingPropertyIndex];
    const remainingIndices = this.properties
      .map((_, index) => index)
      .filter(index => index !== this.startingPropertyIndex);
    
    // Add remaining properties in random order (in real app, this would be optimized)
    while (remainingIndices.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingIndices.length);
      optimizedOrder.push(remainingIndices.splice(randomIndex, 1)[0]);
    }

    // Calculate appointment times
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0); // Start at 9:00 AM

    this.currentRoute = optimizedOrder.map((propertyIndex, routeIndex) => {
      const property = this.properties[propertyIndex];
      const appointmentTime = new Date(currentTime);
      
      // Add travel time between properties (5-15 minutes)
      if (routeIndex > 0) {
        const travelTime = Math.floor(Math.random() * 10) + 5;
        currentTime.setMinutes(currentTime.getMinutes() + travelTime);
        appointmentTime.setTime(currentTime.getTime());
      }

      // Set appointment time if not frozen
      if (!property.isFrozen) {
        property.appointmentTime = appointmentTime;
      }

      // Add showing duration for next travel calculation
      currentTime.setMinutes(currentTime.getMinutes() + property.showingDuration);

      return {
        propertyIndex,
        property,
        appointmentTime: property.appointmentTime || appointmentTime,
        travelTime: routeIndex > 0 ? Math.floor(Math.random() * 10) + 5 : 0
      };
    });
  }

  displayResults() {
    // Show results section only (no separate properties section)
    document.getElementById('results-section').classList.remove('hidden');

    // Update route summary
    this.updateRouteSummary();

    // Update unified itinerary display with controls
    this.updateUnifiedItineraryDisplay();

    // Subtle scroll hint on mobile/small screens
    setTimeout(() => {
      // Just a gentle nudge downward to hint at content below
      window.scrollBy({ 
        top: 150, 
        behavior: 'smooth' 
      });
    }, 500);
  }

  updateUnifiedItineraryDisplay() {
    const container = document.getElementById('itinerary-list');
    container.innerHTML = '';

    if (!this.currentRoute) return;

    this.currentRoute.forEach((routeItem, routeIndex) => {
      const card = this.createUnifiedPropertyCard(routeItem, routeIndex);
      container.appendChild(card);
    });
  }

  createUnifiedPropertyCard(routeItem, routeIndex) {
    const { property } = routeItem;
    const card = document.createElement('div');
    card.className = `property-card ${property.isFrozen ? 'locked' : ''}`;
    
    card.innerHTML = `
      <div class="property-main">
        <div class="property-number">${routeIndex + 1}</div>
        <div class="property-info">
          <div class="property-time">${this.formatDisplayTime(routeItem.appointmentTime)}</div>
          <div class="property-address">${property.address}</div>
          ${routeItem.travelTime > 0 ? `<div class="travel-time">Drive time: ${routeItem.travelTime} min</div>` : ''}
        </div>
        <button class="maps-btn" data-address="${property.address}">
          📍 DIRECTIONS
        </button>
      </div>
      
      <div class="property-controls">
        <div class="control-group">
          <label class="control-label">Appointment Time</label>
          <div class="control-row">
            <input 
              type="time" 
              class="time-input" 
              value="${this.formatTimeInput(routeItem.appointmentTime)}"
              data-property-id="${property.id}"
            />
            <button class="freeze-btn ${property.isFrozen ? 'active' : ''}" data-property-id="${property.id}">
              ${property.isFrozen ? '🔒 FROZEN' : '🔒 FREEZE'}
            </button>
          </div>
          ${property.isFrozen ? '<div class="lock-status">⚠ APPOINTMENT TIME FROZEN</div>' : ''}
        </div>
        
        <div class="control-group">
          <label class="control-label">Showing Duration (minutes)</label>
          <input 
            type="number" 
            class="duration-input" 
            value="${property.showingDuration}" 
            min="5" 
            max="120" 
            step="5"
            data-property-id="${property.id}"
          />
        </div>
      </div>
    `;

    // Add event listeners
    const freezeBtn = card.querySelector('.freeze-btn');
    const timeInput = card.querySelector('.time-input');
    const durationInput = card.querySelector('.duration-input');
    const mapsBtn = card.querySelector('.maps-btn');

    freezeBtn.addEventListener('click', () => {
      this.togglePropertyFreeze(property.id);
    });

    timeInput.addEventListener('change', (e) => {
      this.updatePropertyTime(property.id, e.target.value);
    });

    durationInput.addEventListener('change', (e) => {
      this.updatePropertyDuration(property.id, parseInt(e.target.value));
    });

    mapsBtn.addEventListener('click', () => {
      this.openDirections(property.address);
    });

    return card;
  }

  togglePropertyFreeze(propertyId) {
    const property = this.properties.find(p => p.id === propertyId);
    if (property) {
      // Before freezing, save any pending time input changes
      const timeInput = document.querySelector(`input[data-property-id="${propertyId}"].time-input`);
      if (timeInput && timeInput.value) {
        this.updatePropertyTime(propertyId, timeInput.value);
      }
      
      property.isFrozen = !property.isFrozen;
      this.updateUnifiedItineraryDisplay();
      this.showStatus(
        property.isFrozen ? 'Appointment time frozen' : 'Appointment time unfrozen',
        property.isFrozen ? 'warning' : 'success'
      );
    }
  }

  updatePropertyTime(propertyId, timeValue) {
    const property = this.properties.find(p => p.id === propertyId);
    if (property && timeValue) {
      const [hours, minutes] = timeValue.split(':');
      const appointmentTime = new Date();
      appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      property.appointmentTime = appointmentTime;
      
      // Also update the corresponding route item to keep data in sync
      if (this.currentRoute) {
        const routeItem = this.currentRoute.find(item => item.property.id === propertyId);
        if (routeItem) {
          routeItem.appointmentTime = appointmentTime;
        }
      }
    }
  }

  updatePropertyDuration(propertyId, duration) {
    const property = this.properties.find(p => p.id === propertyId);
    if (property) {
      property.showingDuration = duration;
    }
  }

  formatTimeInput(date) {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  formatDisplayTime(date) {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  updateRouteSummary() {
    document.getElementById('total-properties').textContent = this.properties.length;
    
    if (this.currentRoute) {
      const totalDrivingTime = this.currentRoute.reduce((sum, item) => sum + item.travelTime, 0);
      const totalShowingTime = this.properties.reduce((sum, prop) => sum + prop.showingDuration, 0);
      const totalTime = totalDrivingTime + totalShowingTime;

      document.getElementById('total-time').textContent = this.formatDuration(totalTime);
      document.getElementById('driving-time').textContent = this.formatDuration(totalDrivingTime);
    }
  }

  updateItineraryDisplay() {
    const container = document.getElementById('itinerary-list');
    container.innerHTML = '';

    if (!this.currentRoute) return;

    this.currentRoute.forEach((routeItem, index) => {
      const item = document.createElement('div');
      item.className = 'itinerary-item';
      
      item.innerHTML = `
        <div class="itinerary-header">
          <div class="itinerary-time">${this.formatDisplayTime(routeItem.appointmentTime)}</div>
          <div class="itinerary-address">${routeItem.property.address}</div>
        </div>
        ${routeItem.travelTime > 0 ? `<div class="travel-info">Drive time: ${routeItem.travelTime} min</div>` : ''}
      `;

      container.appendChild(item);
    });
  }

  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  async reOptimizeRoute() {
    if (!this.currentRoute) return;
    
    this.showStatus('Re-optimizing route...', 'warning');
    await this.simulateRouteOptimization();
    this.updateRouteSummary();
    this.updateUnifiedItineraryDisplay();
    this.showStatus('Route re-optimized!', 'success');
  }

  async copyItinerary(format = 'client') {
    if (!this.currentRoute) return;

    const itineraryText = format === 'client' 
      ? this.generateItineraryText() 
      : this.generateDetailedItineraryText();
    
    try {
      await navigator.clipboard.writeText(itineraryText);
      this.showCopySuccess(format);
      this.showStatus(
        format === 'client' 
          ? 'Client-friendly itinerary copied!' 
          : 'Detailed itinerary copied!', 
        'success'
      );
    } catch (err) {
      // Fallback for older browsers
      this.fallbackCopyToClipboard(itineraryText);
      this.showCopySuccess(format);
      this.showStatus(
        format === 'client' 
          ? 'Client-friendly itinerary copied!' 
          : 'Detailed itinerary copied!', 
        'success'
      );
    }
  }

  generateItineraryText() {
    if (!this.currentRoute) return '';

    // Generate SMS-friendly format for clients
    let text = '🏠 PROPERTY SHOWING SCHEDULE\n\n';

    this.currentRoute.forEach((routeItem, index) => {
      text += `${index + 1}. ${this.formatDisplayTime(routeItem.appointmentTime)}\n`;
      text += `📍 ${routeItem.property.address}\n`;
      if (routeItem.travelTime > 0 && index > 0) {
        text += `🚗 ${routeItem.travelTime} min drive from previous\n`;
      }
      text += '\n';
    });

    // Add summary
    const totalDrivingTime = this.currentRoute.reduce((sum, item) => sum + item.travelTime, 0);
    const totalShowingTime = this.properties.reduce((sum, prop) => sum + prop.showingDuration, 0);
    const totalTime = totalDrivingTime + totalShowingTime;
    
    text += `📊 SUMMARY:\n`;
    text += `• ${this.properties.length} properties\n`;
    text += `• ${this.formatDuration(totalTime)} total time\n`;
    text += `• ${this.formatDuration(totalDrivingTime)} driving\n\n`;
    
    text += `Please let me know if you need any adjustments!`;

    return text;
  }

  generateDetailedItineraryText() {
    if (!this.currentRoute) return '';

    // Generate detailed format for agent use
    let text = 'PROPERTY SHOWING ITINERARY\n';
    text += '=' .repeat(30) + '\n\n';

    this.currentRoute.forEach((routeItem, index) => {
      text += `${index + 1}. ${this.formatDisplayTime(routeItem.appointmentTime)} - ${routeItem.property.address}\n`;
      text += `   Showing Duration: ${routeItem.property.showingDuration} minutes\n`;
      if (routeItem.travelTime > 0) {
        text += `   Drive time: ${routeItem.travelTime} minutes\n`;
      }
      if (routeItem.property.isFrozen) {
        text += `   ⚠ APPOINTMENT TIME FROZEN\n`;
      }
      text += '\n';
    });

    text += `Total Properties: ${this.properties.length}\n`;
    
    if (this.currentRoute) {
      const totalDrivingTime = this.currentRoute.reduce((sum, item) => sum + item.travelTime, 0);
      const totalShowingTime = this.properties.reduce((sum, prop) => sum + prop.showingDuration, 0);
      const totalTime = totalDrivingTime + totalShowingTime;
      
      text += `Total Time: ${this.formatDuration(totalTime)}\n`;
      text += `Driving Time: ${this.formatDuration(totalDrivingTime)}\n`;
      text += `Showing Time: ${this.formatDuration(totalShowingTime)}`;
    }

    return text;
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  showCopySuccess(format) {
    const btnId = format === 'client' ? 'copy-client' : 'copy-detailed';
    const btn = document.getElementById(btnId);
    const btnText = btn.querySelector('.btn-text');
    const btnSuccess = btn.querySelector('.btn-success');
    
    btnText.classList.add('hidden');
    btnSuccess.classList.remove('hidden');
    btn.classList.add('btn-success');
    
    setTimeout(() => {
      btnText.classList.remove('hidden');
      btnSuccess.classList.add('hidden');
      btn.classList.remove('btn-success');
    }, 2000);
  }

  showCalculating(isCalculating) {
    const btn = document.getElementById('calculate-route');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    if (isCalculating) {
      btnText.classList.add('hidden');
      btnLoader.classList.remove('hidden');
      btn.disabled = true;
      btn.classList.add('shimmer');
    } else {
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
      btn.disabled = false;
      btn.classList.remove('shimmer');
    }
  }

  openDirections(address) {
    // Create Google Maps URL that works on both mobile and desktop
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://maps.google.com/maps?q=${encodedAddress}`;
    
    // Open in new tab/window
    window.open(mapsUrl, '_blank');
    
    this.showStatus('Opening directions in Google Maps...', 'success');
  }

  showStatus(message, type = 'info') {
    const statusContainer = document.getElementById('status-message');
    statusContainer.textContent = message;
    statusContainer.className = `status-message ${type}`;
    statusContainer.classList.remove('hidden');

    setTimeout(() => {
      statusContainer.classList.add('hidden');
    }, 3000);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RouteCalculator();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RouteCalculator;
}