'use client'
import { useCallback, useEffect, useState } from 'react'
import type { LayoutProps } from 'sanity'
import { Box, Button, Tooltip, Text } from '@sanity/ui'
import { PanelLeftIcon } from '@sanity/icons'

const STORAGE_KEY = 'studio-nav-collapsed'

// Confirmed via DOM inspection:
// The nav pane is [data-ui="ListPane"]:first-child inside [data-ui="PaneLayout"]
const COLLAPSE_CSS = `
  [data-ui="PaneLayout"] > [data-ui="ListPane"]:first-child {
    transition: max-width 0.25s ease, min-width 0.25s ease, opacity 0.2s ease !important;
  }

  html[data-studio-nav="collapsed"] [data-ui="PaneLayout"] > [data-ui="ListPane"]:first-child {
    max-width: 0 !important;
    min-width: 0 !important;
    opacity: 0 !important;
    overflow: hidden !important;
    flex: 0 0 0% !important;
  }
`

export function StudioLayout(props: LayoutProps) {
  const { renderDefault } = props
  const [collapsed, setCollapsed] = useState(false)

  // Read persisted state and apply data attribute on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === 'true'
    setCollapsed(stored)
    document.documentElement.dataset.studioNav = stored ? 'collapsed' : 'expanded'
  }, [])

  // Persist and apply data attribute whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
    document.documentElement.dataset.studioNav = collapsed ? 'collapsed' : 'expanded'
  }, [collapsed])

  const toggle = useCallback(() => setCollapsed((c) => !c), [])

  return (
    <>
      <style>{COLLAPSE_CSS}</style>

      {renderDefault(props)}

      {/* Toggle button — bottom-left, above the Sanity "What's new" banner */}
      <Box
        style={{
          position: 'fixed',
          bottom: '48px',
          left: '8px',
          zIndex: 99999,
          background: 'var(--card-bg-color)',
          borderRadius: '4px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      >
        <Tooltip
          content={
            <Box padding={2}>
              <Text size={1}>{collapsed ? 'Show navigation' : 'Hide navigation'}</Text>
            </Box>
          }
          placement="right"
          portal
        >
          <Button
            icon={PanelLeftIcon}
            mode="ghost"
            tone="default"
            fontSize={1}
            padding={2}
            onClick={toggle}
            aria-label={collapsed ? 'Show navigation' : 'Hide navigation'}
          />
        </Tooltip>
      </Box>
    </>
  )
}
