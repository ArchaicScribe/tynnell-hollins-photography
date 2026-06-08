'use client'

import React from 'react'

/**
 * Custom brand mark shown on the Payload admin login page and in the sidebar.
 * Renders "Tynnell Hollins" in Tangerine and "Photography" in Archivo below it.
 * Uses inline styles so it works even when Payload's CSS fails to load.
 */
export function AdminLogo() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem 0 0.25rem',
        userSelect: 'none',
      }}
    >
      {/* Tangerine is loaded via custom.css — no inline <style> needed here */}
      <span
        style={{
          fontFamily: "'Tangerine', cursive",
          fontSize: '2.6rem',
          fontWeight: 700,
          color: '#D6D1CE',
          lineHeight: 1.05,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        Tynnell Hollins
      </span>
      <span
        style={{
          fontFamily: "'Archivo', sans-serif",
          fontSize: '0.5rem',
          fontWeight: 600,
          letterSpacing: '0.38em',
          textTransform: 'uppercase',
          color: '#9B9A9A',
          marginTop: '0.1rem',
          whiteSpace: 'nowrap',
        }}
      >
        Photography
      </span>
    </div>
  )
}
