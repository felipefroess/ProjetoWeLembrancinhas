import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, configured: false });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true, configured: false });
    }

    if (type === 'pageview') {
      const { path = '/', sessionId, userAgent } = body;
      await supabase.from('page_views').insert({
        page_path: path,
        session_id: sessionId || null,
        user_agent: userAgent || null,
      });
      return NextResponse.json({ success: true, tracked: 'pageview' });
    }

    if (type === 'click') {
      const { productId, productName, category } = body;
      if (!productId) {
        return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 });
      }

      await supabase.from('product_clicks').insert({
        product_id: productId,
        product_name: productName || null,
        category: category || null,
      });
      return NextResponse.json({ success: true, tracked: 'click' });
    }

    return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao registrar analytics:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
