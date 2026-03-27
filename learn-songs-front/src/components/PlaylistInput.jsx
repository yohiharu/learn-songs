import { useState } from 'react'

export default function PlaylistInput({ onLoad, loading, error }) {
  const [playlistId, setPlaylistId] = useState(
    () => localStorage.getItem('yt_playlist_id') || ''
  )

  const extractPlaylistId = (input) => {
    const trimmed = input.trim()
    try {
      const url = new URL(trimmed)
      const listParam = url.searchParams.get('list')
      if (listParam) return listParam
    } catch {
      // not a URL, use as-is
    }
    return trimmed
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!playlistId.trim()) return
    onLoad(extractPlaylistId(playlistId))
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-icon">🎵</div>
        <h1>曲を覚えよう</h1>
        <p className="setup-desc">
          YouTubeプレイリストの曲をスワイプで覚えましょう
        </p>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="field">
            <label>プレイリスト ID</label>
            <input
              type="text"
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              placeholder="PLxxxxxxxxxxxxxxxxxxxxxxxx または https://www.youtube.com/playlist?list=..."
              autoComplete="off"
              spellCheck={false}
            />
            <span className="field-hint">
              プレイリストIDまたはYouTubeのURLをそのまま貼り付けてください
            </span>
          </div>

          {error && <div className="error-box">プレイリストの読み込みに失敗しました。IDまたはURLを確認してください。</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !playlistId.trim()}
          >
            {loading ? '読み込み中...' : '開始する'}
          </button>
        </form>
      </div>
    </div>
  )
}
