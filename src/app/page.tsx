'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { WhatsappButton } from '@/components/WhatsappButton';
import { Footer } from '@/components/Footer';
import { PRODUCTS } from '@/data/products';
import { CategoryId } from '@/types';
import { PackageSearch } from 'lucide-react';
import styles from './Home.module.css';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtro performático combinando categoria e busca
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'todos' || product.category === selectedCategory;

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Escolhe a classe de grid de acordo com o número de itens
  const gridClass =
    filteredProducts.length === 1
      ? styles.productsGridSingle
      : filteredProducts.length === 2
      ? styles.productsGridDouble
      : styles.productsGridMulti;

  return (
    <div className={styles.pageWrapper}>
      {/* Barra de Navegação */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Hero Section */}
      <HeroBanner />

      {/* Filtro de Categorias */}
      <div id="catalogo">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Catálogo de Produtos */}
      <main className={styles.mainCatalog}>
        {/* Cabeçalho da Seção de Produtos */}
        <div className={styles.catalogHeader}>
          <div>
            <h2 className={styles.catalogTitle}>
              {searchQuery
                ? `Resultados para "${searchQuery}"`
                : selectedCategory === 'natal'
                ? 'Catálogo Especial de Natal'
                : selectedCategory === 'dia-dos-professores'
                ? 'Catálogo Dia dos Professores'
                : selectedCategory === 'cadernos'
                ? 'Cadernos & Cadernetas Personalizadas'
                : 'Catálogo de Lembrancinhas'}
            </h2>
            <p className={styles.catalogSubtitle}>
              Clique em qualquer item para personalizar modelos, nomes e detalhes
            </p>
          </div>
          <span className={styles.itemsCountBadge}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'modelo encontrado' : 'modelos disponíveis'}
          </span>
        </div>

        {/* Grade de Produtos */}
        {filteredProducts.length > 0 ? (
          <div className={gridClass}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Estado Vazio de Busca */
          <div className={styles.emptyStateCard}>
            <div className={styles.emptyIconCircle}>
              <PackageSearch size={28} />
            </div>
            <h3 className={styles.emptyStateTitle}>
              Nenhuma lembrancinha encontrada
            </h3>
            <p className={styles.emptyStateText}>
              Não encontramos nenhum produto com o termo &quot;{searchQuery}&quot;. Tente buscar por outros termos como talento, sonho de valsa ou lata.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('todos');
              }}
              className={styles.clearFilterBtn}
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </main>

      {/* Modais e Componentes Globais */}
      <ProductModal />
      <CartDrawer />
      <CheckoutModal />
      <WhatsappButton />

      {/* Rodapé */}
      <Footer />
    </div>
  );
}
