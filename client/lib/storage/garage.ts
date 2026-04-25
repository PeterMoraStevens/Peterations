import 'server-only'
import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: process.env.GARAGE_ENDPOINT!,
  region: process.env.GARAGE_REGION ?? 'garage',
  credentials: {
    accessKeyId: process.env.GARAGE_ACCESS_KEY!,
    secretAccessKey: process.env.GARAGE_SECRET_KEY!,
  },
  forcePathStyle: true, // required for Garage / MinIO-compatible stores
})

const CDN = (process.env.NEXT_PUBLIC_CDN_URL ?? '').replace(/\/$/, '')
const BUCKET = process.env.GARAGE_BUCKET!

export async function uploadToGarage(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  )
  return `${CDN}/${key}`
}

export async function deleteFromGarage(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function listGarageObjects(prefix: string): Promise<{ key: string; url: string }[]> {
  const result = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  )
  return (result.Contents ?? [])
    .filter((obj) => obj.Key && !obj.Key.endsWith('/'))
    .map((obj) => ({ key: obj.Key!, url: `${CDN}/${obj.Key}` }))
}

export async function listAllGarageKeys(): Promise<string[]> {
  const keys: string[] = []
  let token: string | undefined
  do {
    const result = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token })
    )
    for (const obj of result.Contents ?? []) {
      if (obj.Key && !obj.Key.endsWith('/')) keys.push(obj.Key)
    }
    token = result.IsTruncated ? result.NextContinuationToken : undefined
  } while (token)
  return keys
}

export async function deleteGarageObjects(keys: string[]): Promise<void> {
  const BATCH = 1000
  for (let i = 0; i < keys.length; i += BATCH) {
    const batch = keys.slice(i, i + BATCH)
    await s3.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: batch.map((k) => ({ Key: k })), Quiet: true },
    }))
  }
}
