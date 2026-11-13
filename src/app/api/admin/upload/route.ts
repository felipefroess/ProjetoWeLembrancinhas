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

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    let contentType = file.type || 'image/jpeg';
    let cleanExt = path.extname(file.name).toLowerCase() || '.jpg';

    // Tenta carregar sharp dinamicamente para otimização se instalado, senão usa o buffer diretamente
    let buffer = rawBuffer;
    try {
      // @ts-ignore
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
      // Sharp opcional não instalado; preserva buffer original
      buffer = rawBuffer;
    }

    // Sanitiza o nome do arquivo e adiciona timestamp único
    const baseName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    const uniqueFileName = `${Date.now()}-${baseName}${cleanExt}`;

    // Envia diretamente para o Object Storage externo (R2 / S3 com fallback)
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
