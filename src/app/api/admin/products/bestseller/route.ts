import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllProducts, saveProduct } from '@/lib/productsStore';

export async function POST(request: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { productId } = await request.json(); // string (id do produto) ou null (para desmarcar)
    const allProducts = await getAllProducts();

    for (const p of allProducts) {
      const shouldBeBestSeller = Boolean(productId && p.id === productId);
      if (Boolean(p.isBestSeller) !== shouldBeBestSeller) {
        await saveProduct({ ...p, isBestSeller: shouldBeBestSeller });
      }
    }

    const updated = await getAllProducts();
    return NextResponse.json({ success: true, products: updated });
  } catch (error) {
    console.error('Erro ao definir produto mais vendido:', error);
    return NextResponse.json({ success: false, error: 'Erro ao definir produto mais vendido' }, { status: 500 });
  }
}
