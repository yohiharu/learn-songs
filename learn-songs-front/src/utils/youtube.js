export async function fetchPlaylistItems(playlistId) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  const params = new URLSearchParams({ playlistId })
  const res = await fetch(`${baseUrl}/playlist.py?${params}`)

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = data.error?.message || data.error || 'APIエラーが発生しました'
    throw new Error(msg)
  }

  return data.items || []
}
