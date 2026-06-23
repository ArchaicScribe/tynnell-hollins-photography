'use client'

import Image from 'next/image'
import type { ImageProps } from 'next/image'
import styles from './ProtectedImage.module.css'

const prevent = (e: React.SyntheticEvent) => e.preventDefault()

export function ProtectedImage({ className, ...props }: ImageProps) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...props}
      draggable={false}
      onContextMenu={prevent}
      onDragStart={prevent}
      className={`${styles.protected} ${className ?? ''}`}
    />
  )
}
