import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

export const runtime = 'nodejs' // важно: пишем файл на диск

export async function POST(req) {
  try {
    const fd = await req.formData()
    const uid = String(fd.get('uid') || '').trim()
    const file = fd.get('file')

    if (!uid) {
      return NextResponse.json({ ok: false, error: 'no_uid' }, { status: 400 })
    }
    if (!file || typeof file === 'string') {
      return NextResponse.json({ ok: false, error: 'no_file' }, { status: 400 })
    }

    // читаем в Buffer
    const ab = await file.arrayBuffer()
    const buf = Buffer.from(ab)

    // папка под аватары
    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    await fs.mkdir(dir, { recursive: true })

    // имя файла (короткое, чтобы влезало в db поля типа VARCHAR(64))
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20)
    const name = `ava_${uid.slice(0, 12).replace(/[^a-zA-Z0-9_]/g, '')}_${id}.png`

    const full = path.join(dir, name)
    await fs.writeFile(full, buf)

    // публичный URL
    const url = `/uploads/avatars/${name}`
    return NextResponse.json({ ok: true, url })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'upload_failed' }, { status: 500 })
  }
}
