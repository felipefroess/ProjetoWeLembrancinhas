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

    if (typeof window !== "undefined") {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      const handleBeforeUnload = () => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      };
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, []);

  useEffect(() => {
    try {
      const cachedCategories = localStorage.getItem("we_cached_categories");
      if (cachedCategories) {
        const parsedCats = JSON.parse(cachedCategories);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          setCategoriesList(parsedCats);
        }
      }
      const cachedProducts = localStorage.getItem("we_cached_products");
      if (cachedProducts) {
        const parsedProds = JSON.parse(cachedProducts);
        if (Array.isArray(parsedProds) && parsedProds.length > 0) {
          setProductsList(parsedProds);
        }
      }
    } catch {
    }

    async function fetchDynamicData() {
      try {
        const res = await fetch(`/api/products?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
          },
        });
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProductsList(data.products);
            try {
              localStorage.setItem("we_cached_products", JSON.stringify(data.products));
            } catch {}
          }
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategoriesList(data.categories);
            try {
              localStorage.setItem("we_cached_categories", JSON.stringify(data.categories));
            } catch {}
          }
        }
      } catch (err) {
        console.error("Erro ao buscar dados dinâmicos:", err);
      }
    }

    fetchDynamicData();

    const handleFocus = () => {
      fetchDynamicData();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categoriesList.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categoriesList]);

  const mostRequestedProductId = useMemo(() => {
    const manualBestSeller = productsList.find((p) => p.isBestSeller);
    if (manualBestSeller) return manualBestSeller.id;
    if (!clientDate) return null;
    return getSeasonalTopProductId(productsList, categoryNameMap, clientDate);
  }, [productsList, categoryNameMap, clientDate]);

  const sortedCategories = useMemo(() => {
    return sortCategoriesBySeasonalProximity(categoriesList, clientDate);
  }, [categoriesList, clientDate]);

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

    let sortedList: Product[];
    if (selectedCategory === "todos") {
      sortedList = sortProductsBySeasonalProximity(list, categoryNameMap, clientDate);
    } else {
      sortedList = [...list];
    }

    const bestSellerId = productsList.find((p) => p.isBestSeller)?.id;
    if (bestSellerId) {
      sortedList.sort((a, b) => {
        if (a.id === bestSellerId) return -1;
        if (b.id === bestSellerId) return 1;
        return 0;
      });
    }

    return sortedList;
  }, [productsList, selectedCategory, searchQuery, categoryNameMap, clientDate]);

  const gridClass =
    filteredProducts.length === 1
      ? styles.productsGridSingle
      : filteredProducts.length === 2
        ? styles.productsGridDouble
        : styles.productsGridMulti;

  return (
    <div className={styles.pageWrapper}>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        products={productsList}
        categories={sortedCategories}
        onSelectCategory={setSelectedCategory}
      />

      <HeroBanner />

      <div id="catalogo">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={sortedCategories}
        />
      </div>

      <main className={styles.mainCatalog}>
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

        {filteredProducts.length > 0 ? (
          <div className={gridClass}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoriesList.find((c) => c.id === product.category)?.name}
                isMostRequested={product.id === mostRequestedProductId || Boolean(product.isBestSeller)}
              />
            ))}
          </div>
        ) : (
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

      <ProductModal />
      <CartDrawer />
      <CheckoutModal />
      <WhatsappButton />

      <Footer />
    </div>
  );
}
