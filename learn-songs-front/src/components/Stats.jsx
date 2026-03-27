import { useState } from 'react'
import { BUCKET_LABELS, BUCKET_COLORS } from '../utils/deck.js'

export default function Stats({ songs, progress, stats, onBack, onResetProgress }) {
  const [filterBucket, setFilterBucket] = useState(null)

  const bucketGroups = Array.from({ length: 6 }, (_, i) =>
    songs.filter((s) => (progress[s.id]?.bucket ?? 0) === i)
  )

  const handleBucketClick = (bucket) => {
    setFilterBucket((prev) => (prev === bucket ? null : bucket))
  }

  const filteredSongs = filterBucket === null
    ? songs
    : songs.filter((s) => (progress[s.id]?.bucket ?? 0) === filterBucket)

  return (
    <div className="stats-screen">
      <header className="stats-header">
        <button className="btn-icon" onClick={onBack}>
          ←
        </button>
        <h2>学習の進捗</h2>
        <button className="btn-text-danger" onClick={onResetProgress}>
          リセット
        </button>
      </header>

      {/* Overview */}
      <div className="stats-overview">
        <div className="overview-ring">
          <svg viewBox="0 0 100 100" className="ring-svg">
            <circle cx="50" cy="50" r="40" className="ring-bg" />
            <circle
              cx="50"
              cy="50"
              r="40"
              className="ring-fill"
              strokeDasharray={`${(stats.mastered / stats.total) * 251.2} 251.2`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="ring-label">
            <span className="ring-num">{stats.mastered}</span>
            <span className="ring-sub">/ {stats.total}</span>
          </div>
        </div>
        <p className="overview-caption">マスター済み</p>
      </div>

      {/* Bucket breakdown */}
      <div className="bucket-breakdown">
        {bucketGroups.map((group, bucket) => (
          <div
            key={bucket}
            className={`bucket-row${filterBucket === bucket ? ' bucket-row-active' : ''}`}
            onClick={() => handleBucketClick(bucket)}
            role="button"
            aria-pressed={filterBucket === bucket}
          >
            <div
              className="bucket-label-dot"
              style={{ background: BUCKET_COLORS[bucket] }}
            />
            <span className="bucket-name">{BUCKET_LABELS[bucket]}</span>
            <div className="bucket-bar-wrap">
              <div
                className="bucket-bar"
                style={{
                  width: `${(group.length / stats.total) * 100}%`,
                  background: BUCKET_COLORS[bucket],
                }}
              />
            </div>
            <span className="bucket-count">{group.length}</span>
          </div>
        ))}
      </div>

      {/* Song list */}
      <div className="song-list">
        <h3>
          曲の一覧
          {filterBucket !== null && (
            <span className="filter-label" style={{ color: BUCKET_COLORS[filterBucket] }}>
              — {BUCKET_LABELS[filterBucket]}
            </span>
          )}
        </h3>
        {[...filteredSongs].sort((a, b) => {
          const aTotal = (progress[a.id]?.knew ?? 0) + (progress[a.id]?.didntKnow ?? 0)
          const bTotal = (progress[b.id]?.knew ?? 0) + (progress[b.id]?.didntKnow ?? 0)
          if (bTotal !== aTotal) return bTotal - aTotal
          const aBucket = progress[a.id]?.bucket ?? 0
          const bBucket = progress[b.id]?.bucket ?? 0
          return bBucket - aBucket
        }).map((song) => {
          const p = progress[song.id]
          const bucket = p?.bucket ?? 0
          const knew = p?.knew ?? 0
          const didntKnow = p?.didntKnow ?? 0
          const total = knew + didntKnow
          return (
            <a
              key={song.id}
              className="song-row"
              href={`https://www.youtube.com/watch?v=${song.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={song.thumbnail} alt="" className="song-thumb" />
              <div className="song-row-info">
                <span className="song-row-title">{song.title}</span>
                <span className="song-row-channel">{song.channelTitle}</span>
                {total > 0 && (
                  <div className="song-row-counts">
                    <span className="count-know">✓ {knew}</span>
                    <span className="count-sep"> / </span>
                    <span className="count-dont">✗ {didntKnow}</span>
                    <span className="count-rate">
                      ({Math.round((knew / total) * 100)}%)
                    </span>
                  </div>
                )}
              </div>
              <div
                className="song-row-bucket"
                style={{ color: BUCKET_COLORS[bucket] }}
              >
                {BUCKET_LABELS[bucket]}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
