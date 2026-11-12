import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const expectedUser = (process.env.ADMIN_USER || 'admin').trim();
    const expectedPassword = (process.env.ADMIN_PASSWORD || 'welembrancinhas2026').trim();

    const cleanUser = (username || '').trim();
    const cleanPassword = (password || '').trim();

    if (
      cleanUser.toLowerCase() === expectedUser.toLowerCase() &&
      cleanPassword === expectedPassword
    ) {
      await setSessionCookie(cleanUser);
      return NextResponse.json({ success: true, message: 'Autenticado com sucesso' });
    }

    return NextResponse.json({ success: false, error: 'Usuário ou senha incorretos' }, { status: 401 });
  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao processar login' }, { status: 500 });
  }
}
