import { NextResponse, connection } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getStoreStatus, updateStoreStatus } from '@/lib/storeSettingsStore';

export async function GET() {
  await connection();
  try {
    const status = await getStoreStatus();
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Erro ao ler status da loja:', error);
    return NextResponse.json({ isOnline: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateStoreStatus(Boolean(body.isOnline));

    try {
      revalidatePath('/api/store-status');
      revalidatePath('/', 'page');
      revalidatePath('/admin', 'page');
    } catch {}

    return NextResponse.json({ success: true, isOnline: updated.isOnline });
  } catch (error) {
    console.error('Erro ao atualizar status da loja:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
