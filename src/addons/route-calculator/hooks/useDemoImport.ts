import { useState, useEffect } from 'react'
import { DEMO_PROPERTIES_KEY } from '@/app/pages/landing/components/demo/DemoContent'
import type { PropertyInput } from '../types'

export function useDemoImport(onImport: (properties: PropertyInput[]) => void) {
  const [showDemoImportBanner, setShowDemoImportBanner] = useState(false)
  const [demoProperties, setDemoProperties] = useState<PropertyInput[] | null>(null)

  // Check for demo properties on mount
  useEffect(() => {
    const storedDemo = localStorage.getItem(DEMO_PROPERTIES_KEY)
    if (storedDemo) {
      try {
        const parsedProperties = JSON.parse(storedDemo) as PropertyInput[]
        // Filter out example addresses - only import user-entered addresses
        const realProperties = parsedProperties.filter(prop => !prop.isExample)
        if (realProperties.length > 0) {
          setDemoProperties(realProperties)
          setShowDemoImportBanner(true)
        } else {
          // Only had example addresses, clear them
          localStorage.removeItem(DEMO_PROPERTIES_KEY)
        }
      } catch (error) {
        console.error('Failed to parse demo properties:', error)
        // Clear invalid data
        localStorage.removeItem(DEMO_PROPERTIES_KEY)
      }
    }
  }, [])

  const handleImportDemoProperties = () => {
    if (demoProperties) {
      onImport(demoProperties)
      setShowDemoImportBanner(false)
      localStorage.removeItem(DEMO_PROPERTIES_KEY)
    }
  }

  const handleDismissDemoImport = () => {
    setShowDemoImportBanner(false)
    localStorage.removeItem(DEMO_PROPERTIES_KEY)
  }

  return {
    showDemoImportBanner,
    demoProperties,
    handleImportDemoProperties,
    handleDismissDemoImport
  }
}
