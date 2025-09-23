'use server'

import { format } from 'date-fns'
import type { OptimizedRoute, ExportRequest } from '../types'

export async function exportItinerary(requestInfo: any): Promise<Response> {
  const request = requestInfo.request
  try {
    const url = new URL(request.url)
    const exportFormat = url.pathname.split('/').pop() as 'client' | 'detailed'
    
    if (!exportFormat || !['client', 'detailed'].includes(exportFormat)) {
      return new Response(JSON.stringify({ error: 'Invalid export format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    const body = await request.json() as { route: OptimizedRoute }
    const route: OptimizedRoute = body.route
    
    if (!route || !route.items) {
      return new Response(JSON.stringify({ error: 'Invalid route data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    const itineraryText = exportFormat === 'client' 
      ? generateClientItinerary(route)
      : generateDetailedItinerary(route)
    
    return new Response(JSON.stringify({ 
      success: true, 
      itinerary: itineraryText,
      format: exportFormat 
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Export error:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export function generateClientItinerary(route: OptimizedRoute): string {
  if (!route.items.length) return ''

  // Generate SMS-friendly format for clients
  let text = '🏠 PROPERTY SHOWING SCHEDULE\n\n'

  route.items.forEach((routeItem, index) => {
    text += `${index + 1}. ${formatDisplayTime(routeItem.appointmentTime)}\n`
    text += `📍 ${routeItem.property.address}\n`
    if (routeItem.travelTime > 0 && index > 0) {
      text += `🚗 ${routeItem.travelTime} min drive from previous\n`
    }
    text += '\n'
  })

  // Add summary
  text += `📊 SUMMARY:\n`
  text += `• ${route.items.length} properties\n`
  text += `• ${formatDuration(route.totalTime)} total time\n`
  text += `• ${formatDuration(route.totalDrivingTime)} driving\n\n`
  
  text += `Please let me know if you need any adjustments!`

  return text
}

export function generateDetailedItinerary(route: OptimizedRoute): string {
  if (!route.items.length) return ''

  // Generate detailed format for agent use
  let text = 'PROPERTY SHOWING ITINERARY\n'
  text += '='.repeat(30) + '\n\n'

  text += `Schedule Overview:\n`
  text += `Start Time: ${formatDisplayTime(route.startTime)}\n`
  text += `End Time: ${formatDisplayTime(route.endTime)}\n`
  text += `Total Duration: ${formatDuration(route.totalTime)}\n\n`

  route.items.forEach((routeItem, index) => {
    text += `${index + 1}. ${formatDisplayTime(routeItem.appointmentTime)} - ${routeItem.property.address}\n`
    text += `   Showing Duration: ${routeItem.property.showingDuration} minutes\n`
    if (routeItem.travelTime > 0) {
      text += `   Drive time: ${routeItem.travelTime} minutes\n`
    }
    if (routeItem.property.isFrozen) {
      text += `   ⚠ APPOINTMENT TIME FROZEN\n`
    }
    if (routeItem.property.coordinates) {
      text += `   GPS: ${routeItem.property.coordinates.lat.toFixed(6)}, ${routeItem.property.coordinates.lng.toFixed(6)}\n`
    }
    text += '\n'
  })

  text += `ROUTE SUMMARY:\n`
  text += `Total Properties: ${route.items.length}\n`
  text += `Total Time: ${formatDuration(route.totalTime)}\n`
  text += `Driving Time: ${formatDuration(route.totalDrivingTime)}\n`
  text += `Showing Time: ${formatDuration(route.totalShowingTime)}\n`
  
  // Add timing breakdown
  text += '\nTIMING BREAKDOWN:\n'
  route.items.forEach((item, index) => {
    const startTime = format(item.appointmentTime, 'HH:mm')
    const endTime = format(new Date(item.appointmentTime.getTime() + item.property.showingDuration * 60000), 'HH:mm')
    text += `${index + 1}. ${startTime}-${endTime} (${item.property.showingDuration}min)\n`
  })

  text += `\nGenerated: ${format(new Date(), 'PPpp')}`

  return text
}

export function generateICalendar(route: OptimizedRoute): string {
  let ical = 'BEGIN:VCALENDAR\n'
  ical += 'VERSION:2.0\n'
  ical += 'PRODID:-//Route Calculator//Real Estate Showing//EN\n'
  ical += 'CALSCALE:GREGORIAN\n'

  route.items.forEach((routeItem, index) => {
    const startTime = routeItem.appointmentTime
    const endTime = new Date(startTime.getTime() + routeItem.property.showingDuration * 60000)
    
    ical += 'BEGIN:VEVENT\n'
    ical += `UID:showing-${routeItem.property.id}-${Date.now()}\n`
    ical += `DTSTART:${formatICalDate(startTime)}\n`
    ical += `DTEND:${formatICalDate(endTime)}\n`
    ical += `SUMMARY:Property Showing - ${routeItem.property.address}\n`
    ical += `DESCRIPTION:Property showing appointment\\n\\nDuration: ${routeItem.property.showingDuration} minutes\n`
    ical += `LOCATION:${routeItem.property.address}\n`
    ical += `STATUS:CONFIRMED\n`
    ical += 'END:VEVENT\n'
  })

  ical += 'END:VCALENDAR\n'
  return ical
}

function formatDisplayTime(date: Date): string {
  return format(date, 'h:mm a')
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function formatICalDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss")
}