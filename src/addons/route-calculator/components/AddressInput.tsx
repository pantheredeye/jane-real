'use client'

import { useState } from 'react'

export function AddressInput() {
  // TODO: Connect to parent component state management
  // TODO: Add address validation and parsing
  // TODO: Handle form submission to server function
  // TODO: Show parsed address count/validation feedback
  // TODO: Add clear/reset functionality
  
  const [addresses, setAddresses] = useState('')

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddresses(e.target.value)
  }

  return (
    <div className="address-input-container">
      <label htmlFor="addresses" className="input-label">
        PASTE ADDRESSES (ONE PER LINE)
      </label>
      <textarea 
        id="addresses" 
        className="address-textarea"
        placeholder="123 Main St, City, State&#10;456 Oak Ave, City, State&#10;789 Pine Rd, City, State"
        rows={6}
        value={addresses}
        onChange={handleAddressChange}
      />
    </div>
  )
}