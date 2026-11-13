-- ========================================================================
-- WE LEMBRANCINHAS - ESTRUTURA DO BANCO DE DADOS POSTGRESQL (NEON)
-- ========================================================================
-- Execute este script no SQL Editor do Console da Neon (https://console.neon.tech)
-- Todas as tabelas são relacionais puras e acessadas exclusivamente via servidor.
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
    coupon_code TEXT,
    discount_amount NUMERIC(10, 2),
    subtotal_amount NUMERIC(10, 2),
    status TEXT NOT NULL DEFAULT 'em_analise', -- 'em_analise', 'em_producao', 'pronto', 'entregue', 'cancelado'
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- ------------------------------------------------------------------------
-- 4. TABELA DE PRODUTOS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at);

-- ------------------------------------------------------------------------
-- 5. TABELA DE CATEGORIAS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 6. TABELA DE CUPONS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' ou 'fixed'
    value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    expires_at TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    first_purchase_only BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);

-- ------------------------------------------------------------------------
-- 7. TABELA DE CONFIGURAÇÕES E ESTADO DA LOJA
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 8. TABELA DE CLIENTES E HISTÓRICO DE COMPRAS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    instagram TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    purchases JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers (name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);

