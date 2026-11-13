import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { getAllProducts, saveProduct, deleteProduct, saveCategory } from '@/lib/productsStore';
import { Product } from '@/types';

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const products = await getAllProducts();
  return NextResponse.json(
    { success: true, products },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    }
  );
}

export async function POST(request: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const product: Product = body.product;

    if (!product.id || !product.name || !product.price || !product.category) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    // Se o usuário digitou uma categoria nova, garante que ela é registrada
    if (body.newCategoryName) {
      await saveCategory({
        id: product.category,
        name: body.newCategoryName,
        description: `Produtos da categoria ${body.newCategoryName}`,
      });
    }

    // Se marcado como Mais Vendido, garante exclusividade desmarcando dos demais produtos
    if (product.isBestSeller) {
      const allExisting = await getAllProducts();
      for (const p of allExisting) {
        if (p.id !== product.id && p.isBestSeller) {
          await saveProduct({ ...p, isBestSeller: false });
        }
      }
    }

    const saved = await saveProduct(product);

    // Invalida os caches do Next.js para garantir atualização imediata no site e na API
    try {
      revalidatePath('/api/products');
      revalidatePath('/', 'page');
      revalidatePath('/admin', 'page');
    } catch (revalErr) {
      console.warn('Erro ao revalidar cache após salvar produto:', revalErr);
    }

    return NextResponse.json({ success: true, product: saved });
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    return NextResponse.json({ success: false, error: 'Erro ao processar dados do produto' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do produto não informado' }, { status: 400 });
    }

    const deleted = await deleteProduct(id);

    // Invalida os caches do Next.js para garantir atualização imediata no site e na API
    try {
      revalidatePath('/api/products');
      revalidatePath('/', 'page');
      revalidatePath('/admin', 'page');
    } catch (revalErr) {
      console.warn('Erro ao revalidar cache após excluir produto:', revalErr);
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ success: false, error: 'Erro ao excluir produto' }, { status: 500 });
  }
}
