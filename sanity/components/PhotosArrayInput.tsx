import { useCallback, useRef, useState } from 'react'
import { ArrayOfObjectsInputProps, insert, setIfMissing } from 'sanity'
import { useClient } from 'sanity'
import { Button, Stack, Text } from '@sanity/ui'
import { UploadIcon } from '@sanity/icons'

export function PhotosArrayInput(props: ArrayOfObjectsInputProps) {
  const client = useClient({ apiVersion: '2026-03-10' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const handleFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
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

  return (
    <Stack space={4}>
      <Stack space={3}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFiles}
          id="photos-multi-upload"
          disabled={uploading}
        />
        <label htmlFor="photos-multi-upload">
          <Button
            as="span"
            icon={UploadIcon}
            text={uploading ? `Uploading ${progress?.done ?? 0} of ${progress?.total ?? 0}…` : 'Upload photos'}
            mode="ghost"
            tone="primary"
            disabled={uploading}
            style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
          />
        </label>
        {!uploading && (
          <Text size={1} muted>
            Use Ctrl+click (Windows/Linux) or Cmd+click (Mac) to select multiple files. Shift+click for a range.
          </Text>
        )}
      </Stack>
      {props.renderDefault(props)}
    </Stack>
  )
}
