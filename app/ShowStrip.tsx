'use client'

import Link from 'next/link'
import { HERO_EXAMPLES } from '@/lib/examples'

export default function ShowStrip() {
  const show = HERO_EXAMPLES.filter((x) => x.heroSlot === 'show').slice(0, 2)
  if (show.length === 0) return null

  return (
    <section className="showstrip">
      <div className="showstrip-head">
        <h2 className="showstrip-title">Popular scenarios</h2>
        <p className="showstrip-sub">Pick a proven style, then tweak the prompt.</p>
      </div>

      <div className="showstrip-grid">
        {show.map((ex) => (
          <Link
            key={ex.id}
            href={`/examples#${ex.id}`}
            className="card card-hover showstrip-card"
          >
            <div className="showstrip-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ex.thumbnail}
                alt={ex.title}
                loading="lazy"
                className={`crop-${ex.tag}`}
              />
            </div>
            <div className="showstrip-meta">
              <div>
                <div className="showstrip-name">{ex.title}</div>
                <div className="showstrip-tag">{ex.tag}</div>
              </div>
              <span className="badge badge-cta">See →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

