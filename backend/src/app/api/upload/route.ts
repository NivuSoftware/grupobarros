import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import { ok, handleError } from '@/lib/response'
import { ValidationError } from '@/lib/errors'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) throw new ValidationError('No se recibió ningún archivo')
    if (!ALLOWED_TYPES.includes(file.type)) throw new ValidationError('Tipo de archivo no permitido. Use JPEG, PNG, WebP o GIF.')
    if (file.size > MAX_SIZE) throw new ValidationError('El archivo supera el tamaño máximo de 5 MB')

    const ext = extname(file.name) || `.${file.type.split('/')[1]}`
    const filename = `${randomUUID()}${ext}`

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadDir, filename), buffer)

    return ok({ url: `/uploads/${filename}` })
  } catch (e) {
    return handleError(e)
  }
}
