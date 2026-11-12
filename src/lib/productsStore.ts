import fs from 'fs';
import path from 'path';
import { Product, Category } from '@/types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '@/data/products';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/data/categories';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
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
    // Em ambientes somente leitura (ex: Vercel), ignora falha de escrita local
  }
}

async function getDeletedDefaultProductIds(): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return new Set();

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('data')
      .eq('id', DELETED_PRODUCTS_SETTING_ID)
      .maybeSingle();

    if (error || !data?.data || !Array.isArray((data.data as { ids?: string[] }).ids)) {
      return new Set();
    }
    return new Set(((data.data as { ids: string[] }).ids || []).map(String));
  } catch {
    return new Set();
  }
}

async function setDeletedDefaultProductIds(ids: Set<string>): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.from('store_settings').upsert(
      {
        id: DELETED_PRODUCTS_SETTING_ID,
        data: { ids: Array.from(ids) },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Erro ao atualizar lista de produtos removidos:', err);
  }
}

/**
 * Retorna todos os produtos (padrão + cadastrados no painel / Supabase)
 */
export async function getAllProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: rows, error } = await supabase
          .from('products')
          .select('id, data')
          .order('created_at', { ascending: true });

        if (!error && rows) {
          let customProducts = rows
            .map((r) => r.data as Product)
            .filter((p) => p && p.id);

          // Migra automaticamente os produtos do JSON local na primeira execução
          if (customProducts.length === 0) {
            const meta = await getSeedMeta();
            if (!meta.productsSeeded) {
              const localCustom = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
              if (localCustom.length > 0) {
                const baseTime = Date.now();
                const payload = localCustom.map((p, idx) => ({
                  id: p.id,
                  data: p,
                  created_at: new Date(baseTime + idx).toISOString(),
                  updated_at: new Date(baseTime + idx).toISOString(),
                }));
                const { error: seedError } = await supabase
                  .from('products')
                  .upsert(payload, { onConflict: 'id' });
                if (!seedError) {
                  customProducts = localCustom;
                  await markSeedMeta({ productsSeeded: true });
                } else {
                  console.error('Erro ao migrar produtos para o Supabase, mantendo fallback local:', seedError);
                  customProducts = localCustom;
                }
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
        }
      } catch (err) {
        console.error('Erro ao buscar produtos no Supabase, usando fallback local:', err);
      }
    }
  }

  const customProducts = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
  const customIds = new Set(customProducts.map((p) => p.id));
  const filteredDefault = DEFAULT_PRODUCTS.filter((p) => !customIds.has(p.id));

  return [...filteredDefault, ...customProducts];
}

/**
 * Salva ou atualiza um produto
 */
export async function saveProduct(product: Product): Promise<Product> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from('products').upsert(
        {
          id: product.id,
          data: product,
          updated_at: nowIso,
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error('Erro ao salvar produto no Supabase:', error);
        throw new Error('Erro ao salvar produto no banco de dados Supabase.');
      }

      const deletedIds = await getDeletedDefaultProductIds();
      if (deletedIds.has(product.id)) {
        deletedIds.delete(product.id);
        await setDeletedDefaultProductIds(deletedIds);
      }
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
 * Exclui um produto cadastrado
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  let deletedFromSupabase = false;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Erro ao excluir produto no Supabase:', error);
        throw new Error('Erro ao excluir produto no banco de dados Supabase.');
      }

      if (DEFAULT_PRODUCTS.some((p) => p.id === productId)) {
        const deletedIds = await getDeletedDefaultProductIds();
        deletedIds.add(productId);
        await setDeletedDefaultProductIds(deletedIds);
      }
      deletedFromSupabase = true;
    }
  }

  let customProducts = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
  const beforeLen = customProducts.length;
  customProducts = customProducts.filter((p) => p.id !== productId);
  writeJsonFile(CUSTOM_PRODUCTS_PATH, customProducts);

  return deletedFromSupabase || customProducts.length !== beforeLen;
}

/**
 * Atualiza o prazo de produção de todos os produtos cadastrados no Supabase e no arquivo local
 */
export async function updateAllCustomProductsLeadTime(leadTimeDays: number): Promise<void> {
  const safeDays = Math.max(1, Number(leadTimeDays));

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: rows, error } = await supabase
          .from('products')
          .select('id, data');

        if (!error && rows && rows.length > 0) {
          const nowIso = new Date().toISOString();
          const updatedRows = rows.map((r) => ({
            id: r.id,
            data: { ...(r.data as Product), leadTimeDays: safeDays },
            updated_at: nowIso,
          }));
          await supabase.from('products').upsert(updatedRows, { onConflict: 'id' });
        }
      } catch (err) {
        console.error('Erro ao propagar prazo para produtos no Supabase:', err);
      }
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
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: rows, error } = await supabase
          .from('categories')
          .select('id, name, description')
          .order('created_at', { ascending: true });

        if (!error && rows) {
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
                const payload = localCustom.map((c, idx) => ({
                  id: c.id,
                  name: c.name,
                  description: c.description || '',
                  created_at: new Date(baseTime + idx).toISOString(),
                }));
                const { error: seedError } = await supabase
                  .from('categories')
                  .upsert(payload, { onConflict: 'id' });
                if (!seedError) {
                  customCategories = localCustom;
                  await markSeedMeta({ categoriesSeeded: true });
                } else {
                  console.error('Erro ao migrar categorias para o Supabase, mantendo fallback local:', seedError);
                  customCategories = localCustom;
                }
              } else {
                await markSeedMeta({ categoriesSeeded: true });
              }
            }
          }

          const customIds = new Set(customCategories.map((c) => c.id));
          const filteredDefault = DEFAULT_CATEGORIES.filter((c) => !customIds.has(c.id));
          return [...filteredDefault, ...customCategories];
        }
      } catch (err) {
        console.error('Erro ao buscar categorias no Supabase, usando fallback local:', err);
      }
    }
  }

  const customCategories = readJsonFile<Category[]>(CUSTOM_CATEGORIES_PATH, []);
  const customIds = new Set(customCategories.map((c) => c.id));
  const filteredDefault = DEFAULT_CATEGORIES.filter((c) => !customIds.has(c.id));

  return [...filteredDefault, ...customCategories];
}

/**
 * Salva uma nova categoria
 */
export async function saveCategory(category: Category): Promise<Category> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from('categories').upsert(
        {
          id: category.id,
          name: category.name,
          description: category.description || '',
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error('Erro ao salvar categoria no Supabase:', error);
      }
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
