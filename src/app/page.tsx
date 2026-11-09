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
import { Sparkles, PackageSearch } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('natal');
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

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D231E] flex flex-col font-sans">
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
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Cabeçalho da Seção de Produtos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D231E] flex items-center gap-2">
              <Sparkles size={20} className="text-[#D4AF37]" />
              {searchQuery ? `Resultados para "${searchQuery}"` : 'Catálogo Especial de Natal'}
            </h2>
            <p className="text-xs sm:text-sm text-[#7C6E64] mt-1">
              Clique em qualquer item para personalizar nomes, cores e detalhes
            </p>
          </div>
          <span className="text-xs font-semibold text-[#8C7A6B] bg-[#EFE6DC] px-3 py-1 rounded-full self-start sm:self-auto border border-[#DACFBF]">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'modelo encontrado' : 'modelos disponíveis'}
          </span>
        </div>

        {/* Grade de Produtos */}
        {filteredProducts.length > 0 ? (
          <div className={filteredProducts.length === 1 ? 'max-w-sm' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Estado Vazio de Busca */
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFD5] p-8 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#DACFBF] flex items-center justify-center mx-auto mb-3 text-[#8C7A6B]">
              <PackageSearch size={28} />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#2D231E] mb-1">
              Nenhuma lembrancinha encontrada
            </h3>
            <p className="text-xs text-[#7C6E64] mb-4">
              Não encontramos nenhum produto com o termo &quot;{searchQuery}&quot;. Tente buscar por caixa milk, esfera ou topo de bolo.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('natal');
              }}
              className="px-4 py-2 rounded-full bg-[#6D4C3D] text-white text-xs font-bold hover:bg-[#5A3E31] transition"
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
