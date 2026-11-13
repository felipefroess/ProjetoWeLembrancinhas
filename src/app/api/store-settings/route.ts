import { NextRequest, NextResponse, connection } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getStoreSettings, updateStoreSettings } from '@/lib/storeSettingsStore';

// GET: Retornar as configurações atuais da loja
export async function GET() {
  await connection();
  try {
    const settings = await getStoreSettings();
    return NextResponse.json(
      { success: true, settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Erro na API de store-settings (GET):', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar configurações da loja.' },
      { status: 500 }
    );
  }
}

// POST: Salvar ou atualizar as configurações da loja
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applyLeadTimeToAllProducts, ...updates } = body;

    const result = await updateStoreSettings(updates, Boolean(applyLeadTimeToAllProducts));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao salvar configurações.' },
        { status: 400 }
      );
    }

    try {
      revalidatePath('/api/store-settings');
      revalidatePath('/', 'page');
      revalidatePath('/admin', 'page');
    } catch {}

    return NextResponse.json({
      success: true,
      settings: result.settings,
      message: 'Configurações da loja atualizadas com sucesso!',
    });
  } catch (error) {
    console.error('Erro na API de store-settings (POST):', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar atualização das configurações.' },
      { status: 500 }
    );
  }
}
