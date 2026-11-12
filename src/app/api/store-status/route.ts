import { NextResponse } from 'next/server';
import { getStoreStatus, updateStoreStatus } from '@/lib/storeSettingsStore';

export async function GET() {
  try {
    const status = await getStoreStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Erro ao ler status da loja:', error);
    return NextResponse.json({ isOnline: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateStoreStatus(Boolean(body.isOnline));
    return NextResponse.json({ success: true, isOnline: updated.isOnline });
  } catch (error) {
    console.error('Erro ao atualizar status da loja:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
