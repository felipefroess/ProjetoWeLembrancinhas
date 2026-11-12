"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { WhatsappButton } from "@/components/WhatsappButton";
import { Footer } from "@/components/Footer";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import {
  sortCategoriesBySeasonalProximity,
  sortProductsBySeasonalProximity,
  getSeasonalTopProductId,
} from "@/lib/seasonalEvents";
import { Category, CategoryId, Product } from "@/types";
import { PackageSearch } from "lucide-react";
import styles from "./Home.module.css";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [categoriesList, setCategoriesList] = useState<Category[]>(CATEGORIES);
  const [clientDate, setClientDate] = useState<Date | null>(null);

  useEffect(() => {
    setClientDate(new Date());
  }, []);

  useEffect(() => {
    async function fetchDynamicData() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) {
          if (data.products && data.products.length > 0) {
            setProductsList(data.products);
          }
          if (data.categories && data.categories.length > 0) {
            setCategoriesList(data.categories);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar dados dinâmicos:", err);
      }
    }

    fetchDynamicData();
  }, []);

  // Mapeia nomes das categorias para consulta rápida
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categoriesList.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categoriesList]);

  // Categorias ordenadas automaticamente pela proximidade dos eventos comemorativos do ano
  // Identifica o ÚNICO produto que recebe o selo de 'Mais Pedido' (pertencente ao evento sazonal mais próximo)
  const mostRequestedProductId = useMemo(() => {
    if (!clientDate) return null;
    return getSeasonalTopProductId(productsList, categoryNameMap, clientDate);
  }, [productsList, categoryNameMap, clientDate]);

  const sortedCategories = useMemo(() => {
    return sortCategoriesBySeasonalProximity(categoriesList, clientDate);
  }, [categoriesList, clientDate]);

  // Filtro performático combinando categoria, busca e ordenação sazonal automática
  const filteredProducts = useMemo(() => {
    const list = productsList.filter((product) => {
      const matchesCategory =
        selectedCategory === "todos" || product.category === selectedCategory;

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    // Quando "Todos os Mimos" está selecionado, os produtos do evento mais próximo do calendário aparecem primeiro!
    if (selectedCategory === "todos") {
      return sortProductsBySeasonalProximity(list, categoryNameMap, clientDate);
    }

    return list;
  }, [productsList, selectedCategory, searchQuery, categoryNameMap]);

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
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        products={productsList}
        categories={sortedCategories}
        onSelectCategory={setSelectedCategory}
      />

      {/* Hero Section */}
      <HeroBanner />

      {/* Filtro de Categorias */}
      <div id="catalogo">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={sortedCategories}
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
                : selectedCategory === "natal"
                  ? "Catálogo Especial de Natal"
                  : selectedCategory === "dia-dos-professores"
                    ? "Catálogo Dia dos Professores"
                    : selectedCategory === "cadernos"
                      ? "Cadernos & Cadernetas Personalizadas"
                      : selectedCategory !== "todos" &&
                          categoryNameMap.get(selectedCategory)
                        ? `Catálogo ${categoryNameMap.get(selectedCategory)}`
                        : "Catálogo de Lembrancinhas"}
            </h2>
            <p className={styles.catalogSubtitle}>
              Clique em qualquer item para personalizar
            </p>
          </div>
          <span className={styles.itemsCountBadge}>
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1
              ? "modelo encontrado"
              : "modelos disponíveis"}
          </span>
        </div>

        {/* Grade de Produtos */}
        {filteredProducts.length > 0 ? (
          <div className={gridClass}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isMostRequested={product.id === mostRequestedProductId}
              />
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
              Não encontramos nenhum produto com o termo &quot;{searchQuery}
              &quot;. Tente buscar por outros termos como talento, sonho de
              valsa ou lata.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("todos");
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
