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
      {/* Tangerine is loaded via custom.css, no inline <style> needed here */}
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
