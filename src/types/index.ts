/**
 * Modelagem de Domínio da Wê Lembrancinhas
 * 
 * Em Engenharia de Software, modelar o domínio antes de codificar telas
 * evita retrabalho e garante consistência entre regras de negócio e interface.
 */

export type CategoryId = 
  | 'todos'
  | 'natal'
  | 'dia-dos-professores'
  | 'cadernos';

export interface Category {
  id: CategoryId;
  name: string;
  icon?: string;
  description: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  image: string;
  images?: string[];
  description?: string;
}

export interface CustomizationOptions {
  theme?: string;          // Ex: "Bosque Encantado", "Safari", "Jardim das Borboletas"
  childName?: string;      // Ex: "Maria Clara", "Professora Leandra"
  ageOrDate?: string;      // Ex: "1 aninho" ou "15/10/2026"
  ribbonColor?: string;    // Ex: "Dourado", "Rosa Chá", "Verde Oliva"
  variation?: string;      // Ex: "Chocolate Talento" ou "Sonho de Valsa"
  notes?: string;          // Observações adicionais do cliente
}

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  price: number;
  minQuantity: number;
  image: string;
  images?: string[];
  variations?: ProductVariation[];
  leadTimeDays: number; // Prazo de produção em dias úteis
  popular?: boolean;
  featured?: boolean;
  unit: string; // "unidade", "kit", "cento"
  availableRibbonColors?: string[];
}

export interface CartItem {
  cartItemId: string; // Identificador único (id do produto + hash das customizações)
  product: Product;
  quantity: number;
  customization: CustomizationOptions;
  subtotal: number;
}

export type DeliveryMethod = 
  | 'retirada-pouso-alegre'
  | 'retirada-paraisopolis'
  | 'entrega-correios';

export interface CustomerOrderData {
  customerName: string;
  customerPhone: string;
  eventDate: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  generalNotes?: string;
}
