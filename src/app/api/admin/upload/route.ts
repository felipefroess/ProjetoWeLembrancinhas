import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs/promises';
import path from 'path';

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
    const buffer = Buffer.from(bytes);

    // Sanitiza o nome do arquivo e adiciona timestamp
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    const uniqueFileName = `${Date.now()}-${cleanFileName}`;

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
        // Segue tentando o upload normalmente (bucket pode já ter sido criado pelo schema.sql)
      }

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(uniqueFileName, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        });

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
