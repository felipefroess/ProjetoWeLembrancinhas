-- ========================================================================
-- WE LEMBRANCINHAS - ESTRUTURA DO BANCO DE DADOS (SUPABASE POSTGRESQL)
-- ========================================================================
-- Este script cria todas as tabelas necessárias para:
-- 1. Visitas no site em tempo real (page_views)
-- 2. Cliques e interesse em produtos (product_clicks)
-- 3. Pedidos gerados via WhatsApp e controle de vendas (orders)
-- ========================================================================

-- Habilita extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------
-- 1. TABELA DE VISITAS NO SITE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_views (
    id BIGSERIAL PRIMARY KEY,
    page_path TEXT NOT NULL DEFAULT '/',
    session_id TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas rápidas de métricas por período
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at);

-- ------------------------------------------------------------------------
-- 2. TABELA DE CLIQUES EM PRODUTOS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_clicks (
    id BIGSERIAL PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para ranking dos mais clicados e filtro por data
CREATE INDEX IF NOT EXISTS idx_product_clicks_product_id ON public.product_clicks (product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_created_at ON public.product_clicks (created_at);

-- ------------------------------------------------------------------------
-- 3. TABELA DE PEDIDOS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    event_date TEXT,
    delivery_method TEXT,
    delivery_address TEXT,
    general_notes TEXT,
    total_units INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'confirmado', 'concluido', 'cancelado'
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para filtros de status e relatórios de faturamento
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- ------------------------------------------------------------------------
-- 4. POLÍTICAS DE ACESSO E SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Permite inserção anônima para registrar acessos, cliques e pedidos do site
DROP POLICY IF EXISTS "Permitir registrar visitas anônimas" ON public.page_views;
CREATE POLICY "Permitir registrar visitas anônimas" 
ON public.page_views FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir registrar cliques anônimos" ON public.product_clicks;
CREATE POLICY "Permitir registrar cliques anônimos" 
ON public.product_clicks FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir clientes enviarem pedidos" ON public.orders;
CREATE POLICY "Permitir clientes enviarem pedidos" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Permite leitura de visitas e cliques (para dashboards e estatísticas)
DROP POLICY IF EXISTS "Permitir leitura de visitas" ON public.page_views;
CREATE POLICY "Permitir leitura de visitas" 
ON public.page_views FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir leitura de cliques" ON public.product_clicks;
CREATE POLICY "Permitir leitura de cliques" 
ON public.product_clicks FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir leitura de pedidos" ON public.orders;
CREATE POLICY "Permitir leitura de pedidos" 
ON public.orders FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir atualização de pedidos" ON public.orders;
CREATE POLICY "Permitir atualização de pedidos" 
ON public.orders FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Permitir exclusão de pedidos" ON public.orders;
CREATE POLICY "Permitir exclusão de pedidos" 
ON public.orders FOR DELETE 
USING (true);


-- ------------------------------------------------------------------------
-- 5. CONCESSÃO DE PERMISSÕES PARA AS ROLES DA API (ANON e AUTHENTICATED)
-- ------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ------------------------------------------------------------------------
-- 6. TABELAS DE CATÁLOGO, CUPONS E CONFIGURAÇÕES DA LOJA
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'percentage',
    value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    expires_at TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Permitir leitura publica de produtos') THEN
    CREATE POLICY "Permitir leitura publica de produtos" ON public.products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Permitir escrita de produtos') THEN
    CREATE POLICY "Permitir escrita de produtos" ON public.products FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Permitir leitura publica de categorias') THEN
    CREATE POLICY "Permitir leitura publica de categorias" ON public.categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Permitir escrita de categorias') THEN
    CREATE POLICY "Permitir escrita de categorias" ON public.categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'Permitir leitura de cupons') THEN
    CREATE POLICY "Permitir leitura de cupons" ON public.coupons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'Permitir escrita de cupons') THEN
    CREATE POLICY "Permitir escrita de cupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_settings' AND policyname = 'Permitir leitura de ajustes da loja') THEN
    CREATE POLICY "Permitir leitura de ajustes da loja" ON public.store_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_settings' AND policyname = 'Permitir escrita de ajustes da loja') THEN
    CREATE POLICY "Permitir escrita de ajustes da loja" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;

GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.coupons TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.store_settings TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------
-- 7. BUCKET DE STORAGE PÚBLICO PARA FOTOS DE PRODUTOS
-- ------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Leitura publica product-images') THEN
    CREATE POLICY "Leitura publica product-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Upload product-images') THEN
    CREATE POLICY "Upload product-images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Update product-images') THEN
    CREATE POLICY "Update product-images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Delete product-images') THEN
    CREATE POLICY "Delete product-images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'product-images');
  END IF;
END
$$;
