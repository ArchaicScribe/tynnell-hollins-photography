'use client'

import Image from 'next/image'
import type { ImageProps } from 'next/image'
import styles from './ProtectedImage.module.css'

const prevent = (e: React.SyntheticEvent) => e.preventDefault()

export function ProtectedImage({ className, ...props }: ImageProps) {
  return (
    <Image
      {...props}
      draggable={false}
      onContextMenu={prevent}
      onDragStart={prevent}
      className={`${styles.protected} ${className ?? ''}`}
    />
  )
}
