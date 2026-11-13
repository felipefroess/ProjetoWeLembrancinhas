import { NextResponse, connection } from 'next/server';
import { getAllProducts, getAllCategories } from '@/lib/productsStore';

export async function GET() {
  await connection();
  try {
    const [products, categories] = await Promise.all([
      getAllProducts(),
      getAllCategories(),
    ]);
    return NextResponse.json(
      { success: true, products, categories },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Erro na rota /api/products:', error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar produtos' }, { status: 500 });
  }
}
