import { useCallback, useRef, useState } from 'react'
import { ArrayOfObjectsInputProps, insert, setIfMissing } from 'sanity'
import { useClient } from 'sanity'
import { Button, Stack, Text } from '@sanity/ui'
import { UploadIcon } from '@sanity/icons'

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.gif', '.tiff']

async function pickFiles(): Promise<File[]> {
  if ('showOpenFilePicker' in window) {
    try {
      const handles = await (window as any).showOpenFilePicker({
        multiple: true,
        startIn: 'pictures',
        types: [{ description: 'Images', accept: { 'image/*': IMAGE_TYPES } }],
      })
      return Promise.all(handles.map((h: any) => h.getFile()))
    } catch {
      return []
    }
  }
  return []
}

export function PhotosArrayInput(props: ArrayOfObjectsInputProps) {
  const client = useClient({ apiVersion: '2026-03-10' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const processFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return

      setUploading(true)
      setProgress({ done: 0, total: files.length })

      const newItems: object[] = []

      for (const file of files) {
        const asset = await client.assets.upload('image', file, { filename: file.name })
        newItems.push({
          _type: 'object',
          _key: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          image: {
            _type: 'image',
            asset: { _type: 'reference', _ref: asset._id },
          },
          alt: '',
          caption: '',
        })
        setProgress((p) => p && { done: p.done + 1, total: p.total })
      }

      props.onChange([setIfMissing([]), insert(newItems, 'after', [-1])])

      if (fileInputRef.current) fileInputRef.current.value = ''
      setUploading(false)
      setProgress(null)
    },
    [client, props],
  )

  const handleClick = useCallback(async () => {
    if ('showOpenFilePicker' in window) {
      const selected = await pickFiles()
      if (selected.length) await processFiles(selected)
    } else {
      fileInputRef.current?.click()
    }
  }, [processFiles])

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await processFiles(Array.from(e.target.files ?? []))
    },
    [processFiles],
  )

  return (
    <Stack space={4}>
      <Stack space={3}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleInputChange}
          disabled={uploading}
        />
        <Button
          icon={UploadIcon}
          text={uploading ? `Uploading ${progress?.done ?? 0} of ${progress?.total ?? 0}...` : 'Upload photos'}
          mode="ghost"
          tone="primary"
          disabled={uploading}
          onClick={handleClick}
        />
        {!uploading && (
          <Text size={1} muted>
            Use Ctrl+click or Shift+click to select multiple files.
          </Text>
        )}
      </Stack>
      {props.renderDefault(props)}
    </Stack>
  )
}
