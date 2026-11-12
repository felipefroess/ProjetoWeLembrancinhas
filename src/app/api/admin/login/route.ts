import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const expectedUser = process.env.ADMIN_USER;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUser || !expectedPassword) {
      console.error('Variáveis ADMIN_USER ou ADMIN_PASSWORD não configuradas.');
      return NextResponse.json(
        { success: false, error: 'Configuração de autenticação do servidor ausente' },
        { status: 500 }
      );
    }

    if (username === expectedUser && password === expectedPassword) {
      await setSessionCookie(username);
      return NextResponse.json({ success: true, message: 'Autenticado com sucesso' });
    }

    return NextResponse.json({ success: false, error: 'Usuário ou senha incorretos' }, { status: 401 });
  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao processar login' }, { status: 500 });
  }
}
