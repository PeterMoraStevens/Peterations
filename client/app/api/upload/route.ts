import { NextRequest, NextResponse } from 'next/server'
import { uploadToGarage, deleteFromGarage } from '@/lib/storage/garage'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const folder = (form.get('folder') as string | null) ?? 'uploads'
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToGarage(key, buffer, file.type || 'application/octet-stream')

    return NextResponse.json({ url, storagePath: key })
  } catch (err) {
    console.error('[upload/POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { storagePath } = await req.json()
    if (!storagePath) return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    await deleteFromGarage(storagePath)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[upload/DELETE]', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
