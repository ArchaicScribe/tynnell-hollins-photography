'use client'

import Image from 'next/image'
import type { ImageProps } from 'next/image'
import styles from './ProtectedImage.module.css'

const prevent = (e: React.SyntheticEvent) => e.preventDefault()

export function ProtectedImage({ className, quality, ...props }: ImageProps) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...props}
      // Default quality bumped from next/image's own default (75) - a
      // photography portfolio gets scrutinized more closely than most sites,
      // and 75 was visibly compressing photos on top of the resize Payload's
      // sharp step already does (TYN-344). Callers can still override.
      quality={quality ?? 90}
      draggable={false}
      onContextMenu={prevent}
      onDragStart={prevent}
      className={`${styles.protected} ${className ?? ''}`}
    />
  )
}
