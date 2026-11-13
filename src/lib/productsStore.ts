import fs from 'fs';
import path from 'path';
import { Product, Category } from '@/types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '@/data/products';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/data/categories';
import { sql, isDbConfigured } from '@/server/db/client';
import { getSeedMeta, markSeedMeta } from '@/lib/seedMeta';

const CUSTOM_PRODUCTS_PATH = path.join(process.cwd(), 'src', 'data', 'custom-products.json');
const CUSTOM_CATEGORIES_PATH = path.join(process.cwd(), 'src', 'data', 'custom-categories.json');
const DELETED_PRODUCTS_SETTING_ID = 'deleted_products';

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Erro ao ler ${filePath}:`, error);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Em ambientes serverless somente leitura, ignora falha de escrita local
  }
}

async function getDeletedDefaultProductIds(): Promise<Set<string>> {
  if (!isDbConfigured()) return new Set();

  try {
    const rows = await sql<{ data: { ids?: string[] } }>`
      SELECT data FROM public.store_settings WHERE id = ${DELETED_PRODUCTS_SETTING_ID} LIMIT 1
    `;

    if (rows.length > 0 && rows[0]?.data && Array.isArray(rows[0].data.ids)) {
      return new Set(rows[0].data.ids.map(String));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

async function setDeletedDefaultProductIds(ids: Set<string>): Promise<void> {
  if (!isDbConfigured()) return;

  try {
    const nowIso = new Date().toISOString();
    const payload = JSON.stringify({ ids: Array.from(ids) });
    await sql`
      INSERT INTO public.store_settings (id, data, updated_at)
      VALUES (${DELETED_PRODUCTS_SETTING_ID}, ${payload}::jsonb, ${nowIso})
      ON CONFLICT (id) DO UPDATE
      SET data = ${payload}::jsonb, updated_at = ${nowIso}
    `;
  } catch (err) {
    console.error('Erro ao atualizar lista de produtos removidos:', err);
  }
}

/**
 * Retorna todos os produtos (padrão + cadastrados no painel / Neon)
 */
export async function getAllProducts(): Promise<Product[]> {
  if (isDbConfigured()) {
    try {
      const rows = await sql<{ id: string; data: Product }>`
        SELECT id, data FROM public.products ORDER BY created_at ASC
      `;

      let customProducts = rows
        .map((r) => r.data)
        .filter((p) => p && p.id);

      // Migração/Seed inicial automática dos produtos do JSON local na primeira execução no Neon
      if (customProducts.length === 0) {
        const meta = await getSeedMeta();
        if (!meta.productsSeeded) {
          const localCustom = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
          if (localCustom.length > 0) {
            const baseTime = Date.now();
            for (let idx = 0; idx < localCustom.length; idx++) {
              const p = localCustom[idx];
              const timeIso = new Date(baseTime + idx).toISOString();
              await sql`
                INSERT INTO public.products (id, data, created_at, updated_at)
                VALUES (${p.id}, ${JSON.stringify(p)}::jsonb, ${timeIso}, ${timeIso})
                ON CONFLICT (id) DO UPDATE
                SET data = ${JSON.stringify(p)}::jsonb, updated_at = ${timeIso}
              `;
            }
            customProducts = localCustom;
            await markSeedMeta({ productsSeeded: true });
          } else {
            await markSeedMeta({ productsSeeded: true });
          }
        }
      }

      const deletedIds = await getDeletedDefaultProductIds();
      const customIds = new Set(customProducts.map((p) => p.id));
      const filteredDefault = DEFAULT_PRODUCTS.filter(
        (p) => !customIds.has(p.id) && !deletedIds.has(p.id)
      );

      return [...filteredDefault, ...customProducts];
    } catch (err) {
      console.error('Erro ao buscar produtos no Neon, usando fallback local:', err);
    }
  }

  const customProducts = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
  const customIds = new Set(customProducts.map((p) => p.id));
  const filteredDefault = DEFAULT_PRODUCTS.filter((p) => !customIds.has(p.id));

  return [...filteredDefault, ...customProducts];
}

/**
 * Salva ou atualiza um produto no Neon
 */
export async function saveProduct(product: Product): Promise<Product> {
  if (isDbConfigured()) {
    const nowIso = new Date().toISOString();
    const payload = JSON.stringify(product);

    try {
      await sql`
        INSERT INTO public.products (id, data, updated_at)
        VALUES (${product.id}, ${payload}::jsonb, ${nowIso})
        ON CONFLICT (id) DO UPDATE
        SET data = ${payload}::jsonb, updated_at = ${nowIso}
      `;

      const deletedIds = await getDeletedDefaultProductIds();
      if (deletedIds.has(product.id)) {
        deletedIds.delete(product.id);
        await setDeletedDefaultProductIds(deletedIds);
      }
    } catch (error) {
      console.error('Erro ao salvar produto no Neon:', error);
      throw new Error('Erro ao salvar produto no banco de dados Neon.');
    }
  }

  // Mantém cópia local em ambiente de desenvolvimento
  const customProducts = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
  const existingIndex = customProducts.findIndex((p) => p.id === product.id);
  if (existingIndex >= 0) {
    customProducts[existingIndex] = product;
  } else {
    customProducts.push(product);
  }
  writeJsonFile(CUSTOM_PRODUCTS_PATH, customProducts);

  return product;
}

/**
 * Exclui um produto cadastrado no Neon
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  let deletedFromNeon = false;

  if (isDbConfigured()) {
    try {
      await sql`DELETE FROM public.products WHERE id = ${productId}`;

      if (DEFAULT_PRODUCTS.some((p) => p.id === productId)) {
        const deletedIds = await getDeletedDefaultProductIds();
        deletedIds.add(productId);
        await setDeletedDefaultProductIds(deletedIds);
      }
      deletedFromNeon = true;
    } catch (error) {
      console.error('Erro ao excluir produto no Neon:', error);
      throw new Error('Erro ao excluir produto no banco de dados Neon.');
    }
  }

  let customProducts = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
  const beforeLen = customProducts.length;
  customProducts = customProducts.filter((p) => p.id !== productId);
  writeJsonFile(CUSTOM_PRODUCTS_PATH, customProducts);

  return deletedFromNeon || customProducts.length !== beforeLen;
}

/**
 * Atualiza o prazo de produção de todos os produtos cadastrados
 */
export async function updateAllCustomProductsLeadTime(leadTimeDays: number): Promise<void> {
  const safeDays = Math.max(1, Number(leadTimeDays));

  if (isDbConfigured()) {
    try {
      const nowIso = new Date().toISOString();
      const rows = await sql<{ id: string; data: Product }>`
        SELECT id, data FROM public.products
      `;

      for (const row of rows) {
        const updatedData = { ...row.data, leadTimeDays: safeDays };
        await sql`
          UPDATE public.products
          SET data = ${JSON.stringify(updatedData)}::jsonb, updated_at = ${nowIso}
          WHERE id = ${row.id}
        `;
      }
    } catch (err) {
      console.error('Erro ao propagar prazo para produtos no Neon:', err);
    }
  }

  const customProducts = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
  if (customProducts.length > 0) {
    const updated = customProducts.map((p) => ({ ...p, leadTimeDays: safeDays }));
    writeJsonFile(CUSTOM_PRODUCTS_PATH, updated);
  }
}

/**
 * Retorna todas as categorias (padrão + dinâmicas)
 */
export async function getAllCategories(): Promise<Category[]> {
  if (isDbConfigured()) {
    try {
      const rows = await sql<{ id: string; name: string; description: string }>`
        SELECT id, name, description FROM public.categories ORDER BY created_at ASC
      `;

      let customCategories: Category[] = rows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        description: r.description ? String(r.description) : '',
      }));

      if (customCategories.length === 0) {
        const meta = await getSeedMeta();
        if (!meta.categoriesSeeded) {
          const localCustom = readJsonFile<Category[]>(CUSTOM_CATEGORIES_PATH, []);
          if (localCustom.length > 0) {
            const baseTime = Date.now();
            for (let idx = 0; idx < localCustom.length; idx++) {
              const c = localCustom[idx];
              const timeIso = new Date(baseTime + idx).toISOString();
              await sql`
                INSERT INTO public.categories (id, name, description, created_at)
                VALUES (${c.id}, ${c.name}, ${c.description || ''}, ${timeIso})
                ON CONFLICT (id) DO UPDATE
                SET name = EXCLUDED.name, description = EXCLUDED.description
              `;
            }
            customCategories = localCustom;
            await markSeedMeta({ categoriesSeeded: true });
          } else {
            await markSeedMeta({ categoriesSeeded: true });
          }
        }
      }

      const customIds = new Set(customCategories.map((c) => c.id));
      const filteredDefault = DEFAULT_CATEGORIES.filter((c) => !customIds.has(c.id));
      return [...filteredDefault, ...customCategories];
    } catch (err) {
      console.error('Erro ao buscar categorias no Neon, usando fallback local:', err);
    }
  }

  const customCategories = readJsonFile<Category[]>(CUSTOM_CATEGORIES_PATH, []);
  const customIds = new Set(customCategories.map((c) => c.id));
  const filteredDefault = DEFAULT_CATEGORIES.filter((c) => !customIds.has(c.id));

  return [...filteredDefault, ...customCategories];
}

/**
 * Salva uma nova categoria no Neon
 */
export async function saveCategory(category: Category): Promise<Category> {
  if (isDbConfigured()) {
    try {
      await sql`
        INSERT INTO public.categories (id, name, description)
        VALUES (${category.id}, ${category.name}, ${category.description || ''})
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name, description = EXCLUDED.description
      `;
    } catch (error) {
      console.error('Erro ao salvar categoria no Neon:', error);
    }
  }

  const customCategories = readJsonFile<Category[]>(CUSTOM_CATEGORIES_PATH, []);
  const existingIdx = customCategories.findIndex((c) => c.id === category.id);
  if (existingIdx >= 0) {
    customCategories[existingIdx] = category;
  } else {
    customCategories.push(category);
  }
  writeJsonFile(CUSTOM_CATEGORIES_PATH, customCategories);
  return category;
}
