'use client'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useState, useCallback } from 'react'

interface AnnouncementItem {
  id: string
  title: string
  content: string
  startAt?: number
  location?: string
  rsvps?: Record<string, string>
  createdByUserId?: string
  cliqId?: string
  canDelete?: boolean
}

export default function AnnouncementsCarousel({ items: initialItems, cliqOwnerId, currentUserId }: { items: AnnouncementItem[]; cliqOwnerId?: string; currentUserId?: string }) {
  const [items, setItems] = useState(initialItems)
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })])
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

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

  const handleDelete = useCallback(async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    setDeleteLoading(activityId)
    try {
      const res = await fetch('/api/activities/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activityId }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Delete failed:', res.status, res.statusText, errorData)
        alert(`Delete failed: ${errorData.error || res.statusText}`)
        return
      }

      const result = await res.json()
      console.log(`[CAROUSEL_DELETE] Activity ${activityId} deleted successfully:`, result)

      // Optimistically remove the deleted card
      setItems((prev) => prev.filter((i) => i.id !== activityId))
    } catch (err) {
      console.error('Delete error:', err)
      alert(`Delete error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setDeleteLoading(null)
    }
  }, [])

  const canUserDelete = (item: AnnouncementItem): boolean => {
    if (!currentUserId) return false
    // Creator can delete
    if (item.createdByUserId === currentUserId) return true
    // Cliq owner can delete
    if (cliqOwnerId && cliqOwnerId === currentUserId) return true
    // Note: Parent permission check would require additional API call or data
    return item.canDelete === true
  }

  console.log('AnnouncementsCarousel items:', items)

  return (
    <div
      ref={emblaRef}
      className="overflow-hidden w-full"
    >
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

            {/* Delete Button - Show only if user has permission */}
            {canUserDelete(item) && (
              <div className="flex justify-center gap-3 mt-3">
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteLoading === item.id}
                  className="text-xs px-3 py-1 rounded bg-red-100 hover:bg-red-200 disabled:opacity-50 flex items-center gap-1 justify-center"
                  title="Delete activity"
                >
                  {deleteLoading === item.id ? '...' : '🗑'} Delete
                </button>
              </div>
            )}

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
