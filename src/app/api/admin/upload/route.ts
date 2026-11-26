import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { uploadImageToStorage } from '@/server/storage/storageClient';
import path from 'path';

export async function POST(request: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Arquivo muito grande (máximo 10MB).' }, { status: 400 });
    }

    const ALLOWED_MIME_TYPES = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ]);
    const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

    const rawExt = path.extname(file.name).toLowerCase();
    if (
      (!file.type || !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) &&
      !ALLOWED_EXTENSIONS.has(rawExt)
    ) {
      return NextResponse.json(
        { success: false, error: 'Formato de arquivo não permitido. Envie apenas imagens (JPG, PNG, WebP, GIF ou AVIF).' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    let contentType = ALLOWED_MIME_TYPES.has(file.type?.toLowerCase()) ? file.type.toLowerCase() : 'image/jpeg';
    let cleanExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.jpg';

    let buffer = rawBuffer;
    try {
      const sharp = (await import('sharp')).default;
      const isPng = file.type === 'image/png' || cleanExt === '.png';
      const pipeline = sharp(rawBuffer).resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: 'lanczos3',
      });

      if (isPng) {
        buffer = await pipeline.png({ quality: 88, compressionLevel: 8 }).toBuffer();
        contentType = 'image/png';
        cleanExt = '.png';
      } else {
        buffer = await pipeline.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
        contentType = 'image/jpeg';
        cleanExt = '.jpg';
      }
    } catch {
      buffer = rawBuffer;
    }

    const baseName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    const uniqueFileName = `${Date.now()}-${baseName}${cleanExt}`;

    const uploadResult = await uploadImageToStorage(buffer, uniqueFileName, contentType);

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || 'Erro ao enviar imagem para o storage.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      storage: uploadResult.provider,
    });
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json({ success: false, error: 'Erro ao fazer upload da imagem' }, { status: 500 });
  }
}
