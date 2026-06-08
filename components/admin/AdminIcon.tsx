'use client'

import React from 'react'

/**
 * Small brand monogram shown in the Payload admin nav when the sidebar
 * is collapsed, and anywhere Payload needs a compact icon.
 */
export function AdminIcon() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tangerine:wght@700&display=swap');
      `}</style>
      <span
        style={{
          fontFamily: "'Tangerine', cursive",
          fontSize: '1.7rem',
          fontWeight: 700,
          color: '#D6D1CE',
          lineHeight: 1,
          letterSpacing: '-0.01em',
          userSelect: 'none',
        }}
      >
        TH
      </span>
    </div>
  )
}
