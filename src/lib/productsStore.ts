import fs from 'fs';
import path from 'path';
import { Product, Category } from '@/types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '@/data/products';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/data/categories';

const CUSTOM_PRODUCTS_PATH = path.join(process.cwd(), 'src', 'data', 'custom-products.json');
const CUSTOM_CATEGORIES_PATH = path.join(process.cwd(), 'src', 'data', 'custom-categories.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
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
  } catch (error) {
    console.error(`Erro ao salvar ${filePath}:`, error);
  }
}

/**
 * Retorna todos os produtos (padrão + cadastrados no painel)
 */
export function getAllProducts(): Product[] {
  const customProducts = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
  
  // Mescla: produtos personalizados têm precedência se tiverem o mesmo ID
  const customIds = new Set(customProducts.map(p => p.id));
  const filteredDefault = DEFAULT_PRODUCTS.filter(p => !customIds.has(p.id));
  
  return [...filteredDefault, ...customProducts];
}

/**
 * Salva ou atualiza um produto
 */
export function saveProduct(product: Product): Product {
  const customProducts = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
  const existingIndex = customProducts.findIndex(p => p.id === product.id);

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
export function deleteProduct(productId: string): boolean {
  let customProducts = readJsonFile<Product[]>(CUSTOM_PRODUCTS_PATH, []);
  const beforeLen = customProducts.length;
  customProducts = customProducts.filter(p => p.id !== productId);

  writeJsonFile(CUSTOM_PRODUCTS_PATH, customProducts);
  return customProducts.length !== beforeLen;
}

/**
 * Retorna todas as categorias (padrão + dinâmicas)
 */
export function getAllCategories(): Category[] {
  const customCategories = readJsonFile<Category[]>(CUSTOM_CATEGORIES_PATH, []);
  const customIds = new Set(customCategories.map(c => c.id));
  const filteredDefault = DEFAULT_CATEGORIES.filter(c => !customIds.has(c.id));
  
  return [...filteredDefault, ...customCategories];
}

/**
 * Salva uma nova categoria
 */
export function saveCategory(category: Category): Category {
  const customCategories = readJsonFile<Category[]>(CUSTOM_CATEGORIES_PATH, []);
  if (!customCategories.some(c => c.id === category.id)) {
    customCategories.push(category);
    writeJsonFile(CUSTOM_CATEGORIES_PATH, customCategories);
  }
  return category;
}
