// Bucket system:
// 0: New / Unknown  -> shown most frequently
// 1: Learning
// 2: Familiar
// 3: Known
// 4: Well known
// 5: Mastered       -> only shown in full review

const BUCKET_WEIGHTS = [8, 4, 2, 1, 1]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildDeck(songs, progress, sessionSize = 20) {
  if (songs.length === 0) return []

  const withBucket = songs.map((song) => ({
    ...song,
    bucket: progress[song.id]?.bucket ?? 0,
  }))

  const active = withBucket.filter((s) => s.bucket < 5)
  const mastered = withBucket.filter((s) => s.bucket >= 5)

  if (active.length === 0) {
    // All mastered — do a full review session
    return shuffle(mastered).slice(0, sessionSize)
  }

  // Build weighted pool
  const pool = []
  for (const song of active) {
    const w = BUCKET_WEIGHTS[Math.min(song.bucket, 4)]
    for (let i = 0; i < w; i++) pool.push(song)
  }

  // Pick unique songs up to sessionSize
  const shuffledPool = shuffle(pool)
  const seen = new Set()
  const deck = []

  for (const song of shuffledPool) {
    if (seen.has(song.id)) continue
    seen.add(song.id)
    deck.push(song)
    if (deck.length >= Math.min(sessionSize, active.length)) break
  }

  return shuffle(deck)
}

export function updateProgress(progress, songId, knew) {
  const current = progress[songId] ?? { bucket: 0, knew: 0, didntKnow: 0 }
  const newBucket = knew
    ? Math.min(current.bucket + 1, 5)
    : Math.max(current.bucket - 1, 0)

  return {
    ...progress,
    [songId]: {
      bucket: newBucket,
      knew: (current.knew ?? 0) + (knew ? 1 : 0),
      didntKnow: (current.didntKnow ?? 0) + (knew ? 0 : 1),
    },
  }
}

export function getStats(songs, progress) {
  const total = songs.length
  const buckets = [0, 0, 0, 0, 0, 0]

  for (const song of songs) {
    const bucket = progress[song.id]?.bucket ?? 0
    buckets[bucket]++
  }

  return {
    total,
    buckets,
    mastered: buckets[5],
    known: buckets[3] + buckets[4],
    learning: buckets[1] + buckets[2],
    new: buckets[0],
  }
}

export const BUCKET_LABELS = ['新曲', '学習中', '慣れてきた', '知ってる', 'よく知ってる', '完璧']
export const BUCKET_COLORS = ['#6b7280', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#22c55e']
