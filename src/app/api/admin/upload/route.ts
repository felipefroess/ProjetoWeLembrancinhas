import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const STORAGE_BUCKET = 'product-images';

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

    // Otimização automática e profissional para alta definição (1200px máx) preservando nitidez impecável
    let buffer = rawBuffer;
    let contentType = file.type || 'image/jpeg';
    let cleanExt = path.extname(file.name).toLowerCase() || '.jpg';

    try {
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
    } catch (err) {
      console.warn('Aviso: Sharp ignorado no upload, usando buffer original:', err);
      buffer = rawBuffer;
    }

    // Sanitiza o nome do arquivo e adiciona timestamp
    const baseName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    const uniqueFileName = `${Date.now()}-${baseName}${cleanExt}`;

    // Em produção / quando Supabase está configurado, salva no Supabase Storage (persistente)
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json(
          { success: false, error: 'Cliente Supabase não inicializado.' },
          { status: 500 }
        );
      }

      // Garante que o bucket público exista (caso tenha permissões de service_role)
      try {
        const { data: bucket } = await supabase.storage.getBucket(STORAGE_BUCKET);
        if (!bucket) {
          await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
        }
      } catch {
        // Segue tentando o upload normalmente
      }

      // Tenta upload com retry em caso de oscilação momentânea de rede na hospedagem
      let uploadResult = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(uniqueFileName, buffer, {
          contentType,
          upsert: false,
        });

      if (uploadResult.error && (uploadResult.error.message.includes('fetch failed') || uploadResult.error.message.includes('network'))) {
        console.warn('Primeira tentativa de upload falhou, tentando novamente em 1s...');
        await new Promise((r) => setTimeout(r, 1000));
        uploadResult = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(uniqueFileName, buffer, {
            contentType,
            upsert: false,
          });
      }

      const { error: uploadError } = uploadResult;

      if (uploadError) {
        console.error('Erro ao enviar imagem para Supabase Storage:', uploadError);
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao enviar imagem para o Supabase Storage: ${uploadError.message}`,
          },
          { status: 500 }
        );
      }

      const { data: publicData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uniqueFileName);

      return NextResponse.json({
        success: true,
        url: publicData.publicUrl,
        storage: 'supabase',
      });
    }

    // Fallback local quando Supabase não está configurado
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, uniqueFileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    return NextResponse.json({ success: true, url: publicUrl, storage: 'local' });
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json({ success: false, error: 'Erro ao fazer upload da imagem' }, { status: 500 });
  }
}
