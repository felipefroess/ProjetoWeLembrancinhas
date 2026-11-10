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
CREATE POLICY "Permitir registrar visitas anônimas" 
ON public.page_views FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir registrar cliques anônimos" 
ON public.product_clicks FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir clientes enviarem pedidos" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Permite leitura de visitas e cliques (para dashboards e estatísticas)
CREATE POLICY "Permitir leitura de visitas" 
ON public.page_views FOR SELECT 
USING (true);

CREATE POLICY "Permitir leitura de cliques" 
ON public.product_clicks FOR SELECT 
USING (true);

CREATE POLICY "Permitir leitura de pedidos" 
ON public.orders FOR SELECT 
USING (true);

CREATE POLICY "Permitir atualização de pedidos" 
ON public.orders FOR UPDATE 
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
