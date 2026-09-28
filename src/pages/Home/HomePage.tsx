import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Seo } from '../../components/common'
import { Hero } from './components/Hero'
import { TrustBar } from './components/TrustBar'
import { HowItWorks } from './components/HowItWorks'
import { FeaturedListings } from './components/FeaturedListings'
import { LandlordCTA } from './components/LandlordCTA'
import { FinalCTA } from './components/FinalCTA'
import { LandingSplash } from '../../components/common/LandingSplash'

export default function HomePage() {
  const location = useLocation()
  const [showSplash, setShowSplash] = useState(true)

  // Only show splash on initial landing page load
  useEffect(() => {
    if (location.pathname !== '/') {
      setShowSplash(false)
      return
    }

    // Check if we've already seen the splash this session
    const hasSeenSplash = sessionStorage.getItem('rb:splash:seen')
    if (hasSeenSplash) {
      setShowSplash(false)
    } else {
      setShowSplash(true)
    }
  }, [location])

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem('rb:splash:seen', 'true')
  }

  return (
    <>
      <Seo
        title="Rent Bridge — Verified Homes for Rent & Sale in Nigeria"
        description="Rent Bridge is a Nigerian property marketplace with NIN-verified landlords, lawyer-reviewed agreements and verified listings. Rent or buy without agent wahala."
        path="/"
        image="/rentbridge-logo.png"
      />
      {showSplash && (
        <LandingSplash onComplete={handleSplashComplete} />
      )}
      {!showSplash && (
        <>
          <Hero />
          <TrustBar />
          <HowItWorks />
          <FeaturedListings />
          <LandlordCTA />
          <FinalCTA />
        </>
      )}
    </>
  )
}
