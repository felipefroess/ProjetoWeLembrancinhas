import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/server/db/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!isDbConfigured()) {
      return NextResponse.json({ success: true, configured: false });
    }

    if (type === 'pageview') {
      const { path = '/', sessionId, userAgent } = body;
      await sql`
        INSERT INTO public.page_views (page_path, session_id, user_agent)
        VALUES (${path}, ${sessionId || null}, ${userAgent || null})
      `;
      return NextResponse.json({ success: true, tracked: 'pageview' });
    }

    if (type === 'click') {
      const { productId, productName, category } = body;
      if (!productId) {
        return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 });
      }

      await sql`
        INSERT INTO public.product_clicks (product_id, product_name, category)
        VALUES (${productId}, ${productName || null}, ${category || null})
      `;
      return NextResponse.json({ success: true, tracked: 'click' });
    }

    return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao registrar analytics no Neon:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
