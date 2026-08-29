import { Seo } from '../../components/common'
import { Hero } from './components/Hero'
import { TrustBar } from './components/TrustBar'
import { HowItWorks } from './components/HowItWorks'
import { FeaturedListings } from './components/FeaturedListings'
import { LandlordCTA } from './components/LandlordCTA'
import { FinalCTA } from './components/FinalCTA'

export default function HomePage() {
  return (
    <>
      <Seo
        title="Rent Bridge — Verified Homes for Rent & Sale in Nigeria"
        description="Rent Bridge is a Nigerian property marketplace with NIN-verified landlords, lawyer-reviewed agreements and verified listings. Rent or buy without agent wahala."
        path="/"
        image="/logo.png"
      />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <FeaturedListings />
      <LandlordCTA />
      <FinalCTA />
    </>
  )
}
