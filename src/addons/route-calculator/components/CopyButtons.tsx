'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { OptimizedRoute } from '../types'

interface CopyButtonsProps {
  route: OptimizedRoute
}

export function CopyButtons({ route }: CopyButtonsProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success'>('idle')

  const handleCopy = async () => {
    try {
      const itineraryText = generateClientItinerary()
      await navigator.clipboard.writeText(itineraryText)
      
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const generateClientItinerary = () => {
    const formattedDate = format(route.startTime, 'EEEE, MMMM do')
    let text = `🏠 Property Showings - ${formattedDate}\n\n`
    
    route.items.forEach((item, index) => {
      const showingTime = format(item.appointmentTime, 'h:mm a')
      const duration = `${item.property.showingDuration}min`
      const nextDriveTime = index < route.items.length - 1 ? ` • ${route.items[index + 1].travelTime}min drive to next` : ''
      
      text += `${index + 1}. ${showingTime} - ${item.property.address}\n`
      text += `   ${duration} showing${nextDriveTime}\n\n`
    })
    
    const totalTime = `${Math.floor(route.totalTime / 60)}h ${route.totalTime % 60}m`
    text += `Total time: ${totalTime} (${route.items.length} properties)`
    
    return text
  }

  return (
    <div className="copy-options">
      <button 
        className={`copy-btn client-copy ${copyStatus === 'success' ? 'btn-success' : ''}`}
        onClick={handleCopy}
      >
        <span className={`btn-text ${copyStatus === 'success' ? 'hidden' : ''}`}>
          📱 COPY DETAILS
        </span>
        <span className={`btn-success ${copyStatus === 'success' ? '' : 'hidden'}`}>
          COPIED!
        </span>
      </button>
    </div>
  )
}