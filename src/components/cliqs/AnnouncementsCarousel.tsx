'use client'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useState } from 'react'

interface AnnouncementItem {
  id: string
  title: string
  content: string
  startAt?: number
  location?: string
  rsvps?: Record<string, string>
}

export default function AnnouncementsCarousel({ items }: { items: AnnouncementItem[] }) {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })])
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)

  const handleRsvp = async (activityId: string, status: string) => {
    setRsvpLoading(activityId)
    try {
      const res = await fetch('/api/activities/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activityId, status }),
      })
      if (!res.ok) {
        console.error('RSVP failed:', res.statusText)
      }
    } catch (err) {
      console.error('RSVP error:', err)
    } finally {
      setRsvpLoading(null)
    }
  }

  return (
    <div className="overflow-hidden border rounded-lg shadow-sm bg-white" ref={emblaRef}>
      <div className="flex">
        {items.map((item) => (
          <div className="flex-[0_0_100%] p-4 sm:p-6 text-center" key={item.id}>
            <h3 className="text-lg font-semibold text-black truncate">{item.title}</h3>
            {item.location && (
              <p className="text-sm text-gray-500 mt-1">{item.location}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {item.startAt ? new Date(item.startAt).toLocaleDateString() : ''}
            </p>

            {/* RSVP Buttons */}
            <div className="flex justify-center gap-2 mt-3">
              {['going', 'maybe', 'raincheck'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleRsvp(item.id, status)}
                  disabled={rsvpLoading === item.id}
                  className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 capitalize"
                >
                  {status}
                </button>
              ))}
            </div>

            {/* RSVP Counts */}
            {item.rsvps && (
              <p className="text-xs text-gray-500 mt-2">
                {Object.values(item.rsvps).filter(s => s === 'going').length} Going • 
                {Object.values(item.rsvps).filter(s => s === 'maybe').length} Maybe • 
                {Object.values(item.rsvps).filter(s => s === 'raincheck').length} Raincheck
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
