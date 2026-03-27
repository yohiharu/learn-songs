import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { BUCKET_LABELS, BUCKET_COLORS } from '../utils/deck.js'

export default function SongCard({ song, onKnow, onDontKnow, isTop, offset, triggerSwipe }) {
  const [showVideo, setShowVideo] = useState(false)
  const [flyDir, setFlyDir] = useState(0) // 0 = idle, 1 = flying right, -1 = flying left
  const timeoutRef = useRef(null)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-250, 250], [-18, 18])
  const knowOpacity = useTransform(x, [30, 120], [0, 1])
  const dontKnowOpacity = useTransform(x, [-120, -30], [1, 0])

  // Handle button-triggered swipe from parent
  useEffect(() => {
    if (triggerSwipe?.id && isTop && flyDir === 0) {
      const dir = triggerSwipe.dir === 'right' ? 1 : -1
      fly(dir)
    }
  }, [triggerSwipe?.id])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const fly = (dir) => {
    setShowVideo(false)
    setFlyDir(dir)
    timeoutRef.current = setTimeout(() => {
      if (dir > 0) onKnow()
      else onDontKnow()
    }, 320)
  }

  const handleDragEnd = (_, info) => {
    if (flyDir !== 0) return
    if (info.offset.x > 100) {
      fly(1)
    } else if (info.offset.x < -100) {
      fly(-1)
    }
  }

  const bucket = song.bucket ?? 0
  const scale = isTop ? 1 : Math.max(0.9, 0.95 - offset * 0.03)

  return (
    <motion.div
      className="song-card"
      style={{ x, rotate, zIndex: isTop ? 10 : 5 }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={
        flyDir !== 0
          ? {
              x: flyDir * 700,
              opacity: 0,
              transition: { duration: 0.32, ease: 'easeOut' },
            }
          : { scale, opacity: 1 }
      }
      drag={isTop && flyDir === 0 ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      whileDrag={{ scale: 1.03 }}
      onDragEnd={handleDragEnd}
    >
      {/* Swipe indicators */}
      <motion.div className="swipe-label swipe-know" style={{ opacity: knowOpacity }}>
        知ってる！
      </motion.div>
      <motion.div className="swipe-label swipe-dont" style={{ opacity: dontKnowOpacity }}>
        知らない
      </motion.div>

      {/* Bucket badge */}
      <div className="bucket-badge" style={{ background: BUCKET_COLORS[bucket] }}>
        {BUCKET_LABELS[bucket]}
      </div>

      {/* Thumbnail / Video */}
      <div className="card-media">
        {showVideo ? (
          <iframe
            className="yt-embed"
            src={`https://www.youtube.com/embed/${song.id}?autoplay=1`}
            allow="autoplay; encrypted-media; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-autoplay"
            allowFullScreen
            title={song.title}
          />
        ) : (
          <div className="thumbnail-wrap" onClick={() => setShowVideo(true)}>
            <img src={song.thumbnail} alt={song.title} className="thumbnail" />
            <div className="play-overlay">
              <span className="play-icon">▶</span>
              <span className="play-text">再生して確認</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card-info">
        <h2 className="song-title">{song.title}</h2>
        {song.channelTitle && (
          <p className="channel-title">{song.channelTitle}</p>
        )}
      </div>

      {/* Hint */}
      {isTop && flyDir === 0 && (
        <p className="swipe-hint">← 知らない　　知ってる →</p>
      )}
    </motion.div>
  )
}
