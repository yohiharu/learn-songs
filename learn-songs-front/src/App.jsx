import { useState, useEffect } from 'react'
import PlaylistInput from './components/PlaylistInput.jsx'
import SwipeContainer from './components/SwipeContainer.jsx'
import { fetchPlaylistItems } from './utils/youtube.js'

const CACHE_KEY = 'playlist_cache'
const PROGRESS_KEY = 'song_progress'

export default function App() {
  const [songs, setSongs] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)

  // Load cached playlist and progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(PROGRESS_KEY)
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress))
      } catch {}
    }

    const cache = localStorage.getItem(CACHE_KEY)
    if (cache) {
      try {
        const { songs: cachedSongs } = JSON.parse(cache)
        if (cachedSongs?.length > 0) {
          setSongs(cachedSongs)
          setStarted(true)
        }
      } catch {}
    }
  }, [])

  const handleLoad = async (playlistId) => {
    setLoading(true)
    setError('')
    try {
      const items = await fetchPlaylistItems(playlistId)
      if (items.length === 0) {
        throw new Error('プレイリストに曲が見つかりませんでした')
      }
      localStorage.setItem('yt_playlist_id', playlistId)
      localStorage.setItem(CACHE_KEY, JSON.stringify({ songs: items, playlistId }))
      setSongs(items)
      setStarted(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProgress = (newProgress) => {
    setProgress(newProgress)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress))
  }

  const handleChangePlaylist = () => {
    if (confirm('プレイリストを変更しますか？進捗はリセットされません。')) {
      setSongs([])
      setStarted(false)
      localStorage.removeItem(CACHE_KEY)
    }
  }

  const handleResetProgress = () => {
    setProgress({})
    localStorage.removeItem(PROGRESS_KEY)
  }

  if (!started) {
    return (
      <PlaylistInput
        onLoad={handleLoad}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <SwipeContainer
      songs={songs}
      progress={progress}
      onProgress={handleProgress}
      onReset={handleChangePlaylist}
      onResetProgress={handleResetProgress}
    />
  )
}
