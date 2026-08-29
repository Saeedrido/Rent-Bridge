import { useMemo, useState } from 'react'
import { Seo } from '../../components/common'
import { dashboardProperties } from '../../features/dashboard/data/dashboardProperties'
import { SearchFilters } from '../../features/dashboard/components/SearchFilters'
import { PropertyGrid } from '../../features/dashboard/components/PropertyGrid'

export default function DashboardPage() {
  const [location, setLocation] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [type, setType] = useState('all')

  const filtered = useMemo(() => {
    const loc = location.trim().toLowerCase()
    const priceNum = Number(maxPrice)
    return dashboardProperties.filter((p) => {
      const locOk = loc === '' || p.location.toLowerCase().includes(loc)
      const priceOk = maxPrice.trim() === '' || (!isNaN(priceNum) && p.price <= priceNum)
      const typeOk = type === 'all' || p.type === type
      return locOk && priceOk && typeOk
    })
  }, [location, maxPrice, type])

  const clear = () => {
    setLocation('')
    setMaxPrice('')
    setType('all')
  }

  return (
    <>
      <Seo
        title="Dashboard | Rent Bridge"
        description="Browse verified homes near you on Rent Bridge."
        path="/dashboard"
      />
      <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-8">
        <header className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">Homes near Yaba, Lagos</h1>
          <p className="mt-2 text-ink/70">
            {filtered.length} verified homes matching your search
          </p>
        </header>

        <SearchFilters
          location={location}
          onLocationChange={setLocation}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          type={type}
          onTypeChange={setType}
          onClear={clear}
        />

        <div className="mt-8">
          <PropertyGrid properties={filtered} />
        </div>
      </div>
    </>
  )
}
