import { CheckIcon } from './icons'

export function ToastNotification({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className="animate-toast flex items-center gap-2 rounded-full bg-green-dark px-4 py-2.5 text-white shadow-lg">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange">
          <CheckIcon className="text-white" />
        </span>
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  )
}
