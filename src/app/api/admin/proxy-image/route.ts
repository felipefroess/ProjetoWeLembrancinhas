import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

function isSafeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('::ffff:') ||
      hostname.startsWith('fc') ||
      hostname.startsWith('fd') ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl || !isSafeUrl(targetUrl)) {
    return NextResponse.json({ success: false, error: 'URL inválida ou insegura' }, { status: 400 });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
      return NextResponse.json(
        { success: false, error: 'Redirecionamentos externos não são permitidos.' },
        { status: 400 }
      );
    }

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { success: false, error: `Falha ao carregar imagem externa: ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    const contentType = (upstreamRes.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/') || contentType.includes('svg')) {
      return NextResponse.json(
        { success: false, error: 'O recurso informado não é uma imagem válida.' },
        { status: 400 }
      );
    }

    const buffer = await upstreamRes.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Erro no proxy de imagem:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar imagem no servidor' },
      { status: 500 }
    );
  }
}
