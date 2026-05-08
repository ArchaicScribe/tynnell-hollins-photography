import { useCallback, useRef, useState } from 'react'
import { useClient } from 'sanity'
import { Badge, Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { UploadIcon } from '@sanity/icons'

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

interface FileState {
  name: string
  status: UploadStatus
  error?: string
}

export function BulkUploadPane() {
  const client = useClient({ apiVersion: '2026-03-10' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileState[]>([])
  const [running, setRunning] = useState(false)

  const handleFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? [])
      if (!selected.length) return

      setFiles(selected.map((f) => ({ name: f.name, status: 'pending' })))
      setRunning(true)

      for (let i = 0; i < selected.length; i++) {
        const file = selected[i]
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f)))
        try {
          const asset = await client.assets.upload('image', file, { filename: file.name })
          await client.create({
            _type: 'photo',
            title: file.name.replace(/\.[^.]+$/, ''),
            alt: '',
            image: {
              _type: 'image',
              asset: { _type: 'reference', _ref: asset._id },
            },
            featured: false,
          })
          setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'done' } : f)))
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Upload failed'
          setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'error', error: msg } : f)))
        }
      }

      if (fileInputRef.current) fileInputRef.current.value = ''
      setRunning(false)
    },
    [client],
  )

  const done = files.filter((f) => f.status === 'done').length
  const errors = files.filter((f) => f.status === 'error').length

  return (
    <Card padding={5} height="fill">
      <Stack space={5}>
        <Stack space={2}>
          <Text size={3} weight="semibold">Upload Multiple Photos</Text>
          <Text size={1} muted>
            Select multiple photos to upload them all at once. Each file becomes a separate Photo document.
            Use Ctrl+click or Shift+click in the file picker to select multiple files.
          </Text>
        </Stack>

        <Flex gap={3} align="center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFiles}
            id="bulk-upload-pane-input"
            disabled={running}
          />
          <label htmlFor="bulk-upload-pane-input">
            <Button
              as="span"
              icon={UploadIcon}
              text={running ? `Uploading ${done} of ${files.length}...` : 'Choose photos'}
              tone="primary"
              disabled={running}
              style={{ cursor: running ? 'not-allowed' : 'pointer' }}
            />
          </label>
          {files.length > 0 && !running && (
            <Button text="Clear" mode="ghost" onClick={() => setFiles([])} />
          )}
        </Flex>

        {files.length > 0 && (
          <Stack space={2}>
            {files.map((f, i) => (
              <Card
                key={i}
                padding={3}
                radius={2}
                tone={f.status === 'error' ? 'critical' : f.status === 'done' ? 'positive' : 'default'}
              >
                <Flex align="center" gap={3}>
                  <Text size={1} style={{ flex: 1 }}>{f.name}</Text>
                  <Badge
                    tone={
                      f.status === 'done'
                        ? 'positive'
                        : f.status === 'error'
                          ? 'critical'
                          : 'default'
                    }
                  >
                    {f.status === 'pending'
                      ? 'Waiting'
                      : f.status === 'uploading'
                        ? 'Uploading...'
                        : f.status === 'done'
                          ? 'Done'
                          : 'Error'}
                  </Badge>
                </Flex>
                {f.error && (
                  <Text size={0} muted>
                    {f.error}
                  </Text>
                )}
              </Card>
            ))}
          </Stack>
        )}

        {!running && files.length > 0 && (
          <Text size={1} muted>
            {done} uploaded{errors > 0 ? `, ${errors} failed` : ''}. Go to Photo in the sidebar to edit titles, alt text, and categories.
          </Text>
        )}
      </Stack>
    </Card>
  )
}
