import { Product } from '@/types';

export const STORE_CONFIG = {
  storeName: 'Wê Lembrancinhas',
  artisanName: 'Wenilze Fróes',
  instagram: 'welembrancinhas',
  instagramUrl: 'https://instagram.com/welembrancinhas',
  // Número oficial de WhatsApp (DDD de Minas 35 - Pouso Alegre / Paraisópolis)
  whatsappNumber: '5535984026382', 
  locations: ['Pouso Alegre - MG', 'Paraisópolis - MG'],
  tagline: 'Lembrancinhas personalizadas e papelaria afetiva para qualquer ocasião especial',
  defaultLeadTimeDays: 5,
};

export const PRODUCTS: Product[] = [
  {
    id: 'mini-lata-natal-luxo',
    name: 'Mini Lata Natalina Personalizada com Laço e Tag',
    category: 'natal',
    description: 'Lembrancinha natalina em lata com acabamento artesanal de luxo. Acompanha rótulo temático personalizado com o nome, laço de cetim com pompom de neve e tag de Boas Festas com cordão dourado. Ideal para rechear com biscoitos caseiros, bombons, pães de mel ou doces.',
    price: 15.00,
    minQuantity: 1,
    unit: 'unidade',
    leadTimeDays: 5,
    popular: true,
    featured: true,
    image: '/images/natal/lata-natal-1.jpg',
    images: [
      '/images/natal/lata-natal-1.jpg',
      '/images/natal/lata-natal-2.jpg'
    ],
    availableRibbonColors: [
      'Laço Verde com Pompom Branco',
      'Laço Vermelho com Pompom Branco',
      'Dourado com Pompom Branco'
    ]
  },
  {
    id: 'lembrancinha-porta-chocolate-professores',
    name: 'Porta-Chocolate Dia dos Professores',
    category: 'dia-dos-professores',
    description: 'Lembrancinha personalizada para o Dia dos Professores. Cartão especial em papel de alta gramatura com corujinha e mensagens afetuosas, embalado individualmente em saquinho com laço de cetim e tag temática. Escolha entre o modelo com mini chocolate Talento ou bombom Sonho de Valsa.',
    price: 9.90,
    minQuantity: 1,
    unit: 'unidade',
    leadTimeDays: 4,
    popular: false,
    featured: true,
    image: '/images/professores/lembrancinha-talento.jpg',
    images: [
      '/images/professores/lembrancinha-talento.jpg',
      '/images/professores/lembrancinha-sonho-de-valsa.jpg'
    ],
    variations: [
      {
        id: 'talento',
        name: 'Chocolate Talento',
        image: '/images/professores/lembrancinha-talento.jpg',
        description: 'Com mini Talento Avelãs ("Para você que tem muito Talento")'
      },
      {
        id: 'sonho-de-valsa',
        name: 'Sonho de Valsa',
        image: '/images/professores/lembrancinha-sonho-de-valsa.jpg',
        description: 'Com bombom Sonho de Valsa ("Onde histórias começam e Sonhos se tornam possíveis")'
      }
    ],
    availableRibbonColors: [
      'Laço Rosa com Tag',
      'Laço Verde com Tag',
      'Laço Dourado com Tag'
    ]
  },
  {
    id: 'caderno-personalizado-luxo',
    name: 'Caderno Personalizado Luxo com Wire-o & Elástico',
    category: 'cadernos',
    description: 'Caderno e caderneta artesanal personalizada com o seu nome na capa dura laminada. Encadernação wire-o metálica dupla, elástico coordenado para fechamento seguro e miolo pautado especial com cabeçalho de dias da semana (STQQSSD). Perfeito para anotações, estudos, presentes afetivos ou caderneta de vacinação.',
    price: 35.00,
    minQuantity: 1,
    unit: 'unidade',
    leadTimeDays: 5,
    popular: false,
    featured: true,
    image: '/images/cadernos/caderno-azul-fechado.jpg',
    images: [
      '/images/cadernos/caderno-azul-fechado.jpg',
      '/images/cadernos/caderno-azul-aberto.jpg',
      '/images/cadernos/caderno-verde-fechado.jpg',
      '/images/cadernos/caderno-verde-aberto.jpg',
      '/images/cadernos/caderneta-floral-lilas.jpg'
    ],
    variations: [
      {
        id: 'geometrico-azul',
        name: 'Geométrico Azul',
        image: '/images/cadernos/caderno-azul-fechado.jpg',
        images: [
          '/images/cadernos/caderno-azul-fechado.jpg',
          '/images/cadernos/caderno-azul-aberto.jpg'
        ],
        description: 'Modelo geométrico moderno em azul marinho com elástico coordenado e miolo pautado.'
      },
      {
        id: 'geometrico-verde',
        name: 'Geométrico Verde',
        image: '/images/cadernos/caderno-verde-fechado.jpg',
        images: [
          '/images/cadernos/caderno-verde-fechado.jpg',
          '/images/cadernos/caderno-verde-aberto.jpg'
        ],
        description: 'Modelo geométrico em verde oliva e bege com elástico coordenado e miolo pautado.'
      },
      {
        id: 'floral-lilas',
        name: 'Floral Lilás (Vacinação)',
        image: '/images/cadernos/caderneta-floral-lilas.jpg',
        images: [
          '/images/cadernos/caderneta-floral-lilas.jpg'
        ],
        description: 'Caderneta com acabamento holográfico, flores campestres, tassel de seda roxo e passante de borboleta dourada.'
      }
    ],
    availableRibbonColors: [
      'Elástico Coordenado com a Capa',
      'Elástico com Passante Dourado',
      'Elástico Branco',
      'Elástico Preto'
    ]
  }
];
