import { NextResponse } from 'next/server';
import { getAllProducts, getAllCategories } from '@/lib/productsStore';

export async function GET() {
  try {
    const [products, categories] = await Promise.all([
      getAllProducts(),
      getAllCategories(),
    ]);
    return NextResponse.json({ success: true, products, categories });
  } catch (error) {
    console.error('Erro na rota /api/products:', error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar produtos' }, { status: 500 });
  }
}
