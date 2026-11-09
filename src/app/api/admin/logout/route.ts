import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Sessão encerrada com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json({ success: false, error: 'Erro ao deslogar' }, { status: 500 });
  }
}
