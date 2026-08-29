import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-cream p-8 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="font-serif text-3xl font-bold text-green-dark mb-4">
          Not Found
        </h1>
        <p className="text-text-secondary mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn-primary">
          <span>Go Home</span>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage