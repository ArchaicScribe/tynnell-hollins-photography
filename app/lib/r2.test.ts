import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { uploadedFreebieKey, deleteR2Object } from './r2'

const env = { ...process.env }
const media = 'https://media.tynnellhollinsphotography.com'
const key = 'files/adbd4cbe-d021-47c6-b7f9-38dcfbb294fe-upload-test-guide.pdf'

beforeEach(() => {
  process.env.R2_PUBLIC_URL = media
  process.env.R2_ACCOUNT_ID = 'acct'
  process.env.R2_BUCKET = 'bucket'
})

afterEach(() => {
  process.env = { ...env }
  vi.restoreAllMocks()
})

describe('uploadedFreebieKey', () => {
  it('finds the storage key of a guide uploaded from Site Settings', () => {
    expect(uploadedFreebieKey(`${media}/${key}`)).toBe(key)
  })

  it('copes with a trailing slash on the media address setting', () => {
    process.env.R2_PUBLIC_URL = `${media}/`

    expect(uploadedFreebieKey(`${media}/${key}`)).toBe(key)
  })

  it.each([
    ['an empty link', ''],
    ['a guide stored somewhere else', 'https://drive.example.com/files/adbd4cbe-d021-47c6-b7f9-38dcfbb294fe-guide.pdf'],
    ['a page on the site', '/guide.pdf'],
    ['a photo in the same storage', `${media}/photos/wedding-01.jpg`],
    ['a file outside the uploads folder', `${media}/guide.pdf`],
    ['a name that was not made by the uploader', `${media}/files/guide.pdf`],
    ['a link that climbs out of the folder', `${media}/files/adbd4cbe-d021-47c6-b7f9-38dcfbb294fe-x.pdf/../../photos/a.jpg`],
    ['a link with extra text after it', `${media}/${key}?v=2`],
    ['a look-alike host', `${media}.evil.example/${key}`],
  ])('leaves %s alone', (_, url) => {
    expect(uploadedFreebieKey(url)).toBeNull()
  })
})

describe('deleteR2Object', () => {
  it('deletes the object from the bucket', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as never)

    await deleteR2Object(key)

    const command = send.mock.calls[0][0]
    expect(command).toBeInstanceOf(DeleteObjectCommand)
    expect(command.input).toEqual({ Bucket: 'bucket', Key: key })
  })

  it('passes a storage failure on to the caller', async () => {
    vi.spyOn(S3Client.prototype, 'send').mockRejectedValue(new Error('denied') as never)

    await expect(deleteR2Object(key)).rejects.toThrow('denied')
  })
})
