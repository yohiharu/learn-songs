import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SongCard from './SongCard.jsx'
import Stats from './Stats.jsx'
import { buildDeck, updateProgress, getStats, BUCKET_LABELS, BUCKET_COLORS } from '../utils/deck.js'

const SESSION_SIZE = 20

export default function SwipeContainer({ songs, progress, onProgress, onReset, onResetProgress }) {
  const [deck, setDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionProgress, setSessionProgress] = useState(progress)
  const [showStats, setShowStats] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [sessionResults, setSessionResults] = useState({ knew: 0, didntKnow: 0 })
  // Used to trigger button-press animations in SongCard
  const [swipeTrigger, setSwipeTrigger] = useState({ id: 0, dir: null })

  useEffect(() => {
    const newDeck = buildDeck(songs, progress, SESSION_SIZE)
    setDeck(newDeck)
    setCurrentIndex(0)
    setSessionProgress(progress)
    setSessionDone(false)
    setSessionResults({ knew: 0, didntKnow: 0 })
  }, [songs])

  const handleSwipe = useCallback(
    (knew) => {
      if (currentIndex >= deck.length) return

      const song = deck[currentIndex]
      const newProgress = updateProgress(sessionProgress, song.id, knew)
      setSessionProgress(newProgress)
      onProgress(newProgress)

      setSessionResults((r) => ({
        knew: knew ? r.knew + 1 : r.knew,
        didntKnow: knew ? r.didntKnow : r.didntKnow + 1,
      }))

      // Reset swipe trigger so the next card doesn't auto-trigger
      setSwipeTrigger({ id: 0, dir: null })

      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)

      if (nextIndex >= deck.length) {
        setSessionDone(true)
      }
    },
    [currentIndex, deck, sessionProgress, onProgress]
  )

  // Called by action buttons — sends a trigger to SongCard to animate, then calls handleSwipe
  const handleButtonPress = (knew) => {
    if (currentIndex >= deck.length) return
    setSwipeTrigger({ id: Date.now(), dir: knew ? 'right' : 'left' })
  }

  const handleResetProgress = () => {
    if (!confirm('すべての進捗をリセットしますか？\nこの操作は元に戻せません。')) return
    onResetProgress()
    const newDeck = buildDeck(songs, {}, SESSION_SIZE)
    setDeck(newDeck)
    setCurrentIndex(0)
    setSessionProgress({})
    setSessionDone(false)
    setSessionResults({ knew: 0, didntKnow: 0 })
    setSwipeTrigger({ id: 0, dir: null })
    setShowStats(false)
  }

  const handleNextSession = () => {
    const newDeck = buildDeck(songs, sessionProgress, SESSION_SIZE)
    setDeck(newDeck)
    setCurrentIndex(0)
    setSessionDone(false)
    setSessionResults({ knew: 0, didntKnow: 0 })
    setSwipeTrigger({ id: 0, dir: null })
  }

  const stats = getStats(songs, sessionProgress)
  const progressPct = deck.length > 0 ? (currentIndex / deck.length) * 100 : 0

  if (showStats) {
    return (
      <Stats
        songs={songs}
        progress={sessionProgress}
        stats={stats}
        onBack={() => setShowStats(false)}
        onResetProgress={handleResetProgress}
      />
    )
  }

  if (sessionDone) {
    return (
      <div className="session-done">
        <button className="btn-icon done-back-btn" onClick={onReset} title="プレイリストを変更">
          ←
        </button>
        <div className="done-card">
          <div className="done-icon">
            {stats.mastered === stats.total ? '🏆' : '🎉'}
          </div>
          <h2>セッション完了！</h2>

          <div className="done-results">
            <div className="result-item know">
              <span className="result-num">{sessionResults.knew}</span>
              <span className="result-label">知ってた</span>
            </div>
            <div className="result-item dont">
              <span className="result-num">{sessionResults.didntKnow}</span>
              <span className="result-label">知らなかった</span>
            </div>
          </div>

          <div className="overall-stats">
            <div className="stat-bar-wrap">
              <div className="stat-bar-row">
                <span>完璧に覚えた</span>
                <span>{stats.mastered} / {stats.total}</span>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill mastered"
                  style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {stats.mastered === stats.total ? (
            <p className="all-mastered-msg">すべての曲をマスターしました！</p>
          ) : (
            <p className="remaining-msg">
              あと <strong>{stats.total - stats.mastered}</strong> 曲覚えましょう
            </p>
          )}

          <div className="done-actions">
            <button className="btn-primary" onClick={handleNextSession}>
              次のセッションへ
            </button>
            <button className="btn-secondary" onClick={() => setShowStats(true)}>
              詳細を見る
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show current card + 1 behind it for the stack effect
  const visibleCards = deck.slice(currentIndex, currentIndex + 2)

  return (
    <div className="swipe-screen">
      {/* Header */}
      <header className="swipe-header">
        <button className="btn-icon" onClick={onReset} title="プレイリストを変更">
          ←
        </button>
        <div className="session-counter">
          {currentIndex} / {deck.length}
        </div>
        <button className="btn-icon" onClick={() => setShowStats(true)} title="進捗">
          📊
        </button>
      </header>

      {/* Progress bar */}
      <div className="progress-bar-track">
        <motion.div
          className="progress-bar-fill"
          animate={{ width: `${progressPct}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Overall mini stats */}
      <div className="mini-stats">
        {BUCKET_LABELS.map((label, i) => (
          <span
            key={i}
            className="mini-stat"
            style={{ background: BUCKET_COLORS[i] + '26', color: BUCKET_COLORS[i] }}
          >
            {label}: {stats.buckets?.[i] ?? 0}
          </span>
        ))}
      </div>

      {/* Card stack */}
      <div className="card-stack">
        <AnimatePresence>
          {visibleCards.map((song, i) => (
            <SongCard
              key={`${song.id}-${currentIndex + i}`}
              song={song}
              isTop={i === 0}
              offset={i}
              triggerSwipe={i === 0 ? swipeTrigger : null}
              onKnow={() => handleSwipe(true)}
              onDontKnow={() => handleSwipe(false)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button
          className="action-btn dont-btn"
          onClick={() => handleButtonPress(false)}
          aria-label="知らない"
        >
          ✕
        </button>
        <button
          className="action-btn know-btn"
          onClick={() => handleButtonPress(true)}
          aria-label="知ってる"
        >
          ♪
        </button>
      </div>
    </div>
  )
}
