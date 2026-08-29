import { Container } from '../../components/layout'
import { Seo } from '../../components/common'
import { Button } from '../../components/ui'

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found | Rent Bridge" description="The page you were looking for could not be found." path="/404" />
      <Container className="py-24 text-center">
        <p className="font-serif text-6xl font-bold text-orange">404</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-green-dark">Page not found</h1>
        <p className="mt-2 text-ink/70">The page you’re looking for doesn’t exist or has moved.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button to="/">Back home</Button>
          <Button to="/properties" variant="outline">
            Browse listings
          </Button>
        </div>
      </Container>
    </>
  )
}
