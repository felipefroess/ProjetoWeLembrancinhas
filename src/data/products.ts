import { Product } from '@/types';

export const STORE_CONFIG = {
  storeName: 'Wê Lembrancinhas',
  artisanName: 'Wenilze Fróes',
  instagram: 'welembrancinhas',
  instagramUrl: 'https://instagram.com/welembrancinhas',
  whatsappNumber: '5535984026382',
  locations: ['Pouso Alegre - MG', 'Paraisópolis - MG'],
  tagline: 'Lembrancinhas personalizadas e papelaria afetiva para qualquer ocasião especial',
  defaultLeadTimeDays: 5,
};

export const PRODUCTS: Product[] = [
  {
    "id": "lata-personalizada-maternidade-ursinho-classico-2764",
    "name": "Mini Lata Maternidade",
    "category": "maternidade",
    "description": "Uma lembrancinha delicada e encantadora para celebrar a chegada do seu bebê. Perfeita para colocar docinhos, suspiros, amêndoas ou pequenos mimos.",
    "price": 14.9,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794273604641-saveclip.app_772146016_18210586753347767_6013644574615738441_n.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794273604641-saveclip.app_772146016_18210586753347767_6013644574615738441_n.jpg",
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794273611919-saveclip.app_772021578_18210586780347767_4415137288430920270_n.jpg"
    ],
    "customizationSettings": {
      "allowChildName": true,
      "childNameLabel": "Nome na Lembrancinha",
      "childNamePlaceholder": "Ex: Davi",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true,
      "customFields": [
        {
          "id": "field_1794440341528",
          "label": "Cor",
          "type": "select",
          "required": true,
          "placeholder": "Verde",
          "options": [
            "Azul",
            "Rosa",
            "Outros"
          ]
        }
      ]
    },
    "popular": false
  },
  {
    "id": "kit-presente-professores-bloco-de-notas-com-caixa-estojo-e-caneta-8914",
    "name": "Bloco de Notas com Caixa Estojo e Caneta",
    "category": "dia-dos-professores",
    "description": "Um presente carinhoso para homenagear e agradecer a dedicação dos professores. Caixa rígida tipo estojo com fecho em fita, bloco de notas e caneta decorada.",
    "price": 59.9,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416303745-recorte-1794416303725.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416303745-recorte-1794416303725.jpg"
    ],
    "variations": [
      {
        "id": "var_1794457544897_0",
        "name": "Modelo 1",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794274822116-saveclip.app_561757077_18177293875347767_1852012969418825078_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794274822116-saveclip.app_561757077_18177293875347767_1852012969418825078_n.jpg"
        ]
      },
      {
        "id": "var_1794457544897_1",
        "name": "Modelo 2",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794274832811-saveclip.app_559554486_18177293884347767_1237520079746612932_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794274832811-saveclip.app_559554486_18177293884347767_1237520079746612932_n.jpg"
        ]
      }
    ],
    "customizationSettings": {
      "allowChildName": true,
      "childNameLabel": "Nome na Lembrancinha",
      "childNamePlaceholder": "Ex: João Miguel",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true,
      "customFields": [
        {
          "id": "field_1794457497600",
          "label": "Nome da professora",
          "type": "text",
          "required": true,
          "placeholder": "Ex: Professora Karina"
        }
      ]
    },
    "popular": false
  },
  {
    "id": "lembrancinha-porta-chocolate-professores",
    "name": "Porta-Chocolate",
    "category": "dia-dos-professores",
    "description": "Lembrancinha personalizada para o Dia dos Professores. Escolha entre o modelo com mini chocolate Talento ou bombom Sonho de Valsa.",
    "price": 9.9,
    "minQuantity": 1,
    "unit": "unidade",
    "leadTimeDays": 5,
    "popular": false,
    "featured": true,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416284556-recorte-1794416284528.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416284556-recorte-1794416284528.jpg",
      "/images/professores/lembrancinha-sonho-de-valsa.jpg"
    ],
    "variations": [
      {
        "id": "var_1794456872367_0",
        "name": "Chocolate Talento",
        "image": "/images/professores/lembrancinha-talento.jpg",
        "images": [
          "/images/professores/lembrancinha-talento.jpg"
        ],
        "description": "Com mini Talento Avelãs (\"Para você que tem muito Talento\")"
      },
      {
        "id": "var_1794456872367_1",
        "name": "Sonho de Valsa",
        "image": "/images/professores/lembrancinha-sonho-de-valsa.jpg",
        "images": [
          "/images/professores/lembrancinha-sonho-de-valsa.jpg"
        ],
        "description": "Com bombom Sonho de Valsa (\"Onde histórias começam e Sonhos se tornam possíveis\")"
      }
    ],
    "availableRibbonColors": [
      "Laço Rosa com Tag",
      "Laço Verde com Tag",
      "Laço Dourado com Tag"
    ],
    "customizationSettings": {
      "allowChildName": true,
      "childNameLabel": "Nome na Lembrancinha",
      "childNamePlaceholder": "Ex: Professor Leandro",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "allowRibbonColors": true,
      "ribbonColors": [
        "Laço Rosa com Tag",
        "Laço Verde com Tag",
        "Laço Dourado com Tag"
      ],
      "allowNotes": true
    }
  },
  {
    "id": "mini-lata-natal-luxo",
    "name": "Mini Lata Natalina",
    "category": "natal",
    "description": "Lembrancinha natalina em lata. Acompanha rótulo temático personalizado com o nome, laço de cetim com pompom de neve e tag de Boas Festas com cordão dourado. Ideal para rechear com biscoitos caseiros, bombons, pães de mel ou doces.",
    "price": 14.9,
    "minQuantity": 1,
    "unit": "unidade",
    "leadTimeDays": 5,
    "popular": true,
    "featured": true,
    "image": "/images/natal/lata-natal-1.jpg",
    "images": [
      "/images/natal/lata-natal-1.jpg",
      "/images/natal/lata-natal-2.jpg"
    ],
    "availableRibbonColors": [
      "Laço Verde com Pompom Branco",
      "Laço Vermelho com Pompom Branco",
      "Dourado com Pompom Branco"
    ],
    "customizationSettings": {
      "allowChildName": true,
      "childNameLabel": "Nome na Lembrancinha",
      "childNamePlaceholder": "Ex: Luís",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "allowRibbonColors": true,
      "ribbonColors": [
        "Laço Verde com Pompom Branco",
        "Laço Vermelho com Pompom Branco",
        "Dourado com Pompom Branco"
      ],
      "allowNotes": true
    }
  },
  {
    "id": "caderno-personalizado-luxo",
    "name": "Caderno Personalizado com Elástico",
    "category": "cadernos",
    "description": "Caderno personalizado com o seu nome. Perfeito para anotações, estudos ou presentes afetivos.",
    "price": 79.9,
    "minQuantity": 1,
    "unit": "unidade",
    "leadTimeDays": 5,
    "popular": false,
    "featured": true,
    "image": "/images/cadernos/caderno-azul-fechado.jpg",
    "images": [
      "/images/cadernos/caderno-azul-fechado.jpg",
      "/images/cadernos/caderno-azul-aberto.jpg",
      "/images/cadernos/caderno-verde-fechado.jpg",
      "/images/cadernos/caderno-verde-aberto.jpg",
      "/images/cadernos/caderneta-floral-lilas.jpg"
    ],
    "variations": [
      {
        "id": "var_1794456911805_0",
        "name": "Modelo 1",
        "image": "/images/cadernos/caderno-azul-fechado.jpg",
        "images": [
          "/images/cadernos/caderno-azul-fechado.jpg"
        ],
        "description": "Modelo conta com capa dura em azul marinho com elástico e personalizado com o nome"
      },
      {
        "id": "var_1794456911805_1",
        "name": "Modelo 2",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794333437976-saveclip.app_538768100_18172355338347767_2299544466431525219_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794333437976-saveclip.app_538768100_18172355338347767_2299544466431525219_n.jpg"
        ],
        "description": "Modelo conta com a capa dura e acabamento holográfico, flores campestres, tassel roxo e passante de borboleta dourada."
      },
      {
        "id": "var_1794456911805_2",
        "name": "Modelo 3",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794333488324-saveclip.app_539454379_18173392714347767_7517392955588664362_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794333488324-saveclip.app_539454379_18173392714347767_7517392955588664362_n.jpg",
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794333493211-saveclip.app_544073499_18173392741347767_8193566408890919383_n.jpg"
        ],
        "description": "Modelo conta com a capa dura e holográfica floral, nome e inicial, e elástico com passante dourado."
      },
      {
        "id": "var_1794456911805_3",
        "name": "Modelo 4",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794333556658-saveclip.app_521541070_18169066933347767_8499588843540459767_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794333556658-saveclip.app_521541070_18169066933347767_8499588843540459767_n.jpg"
        ],
        "description": "Modelo conta com capa dura floral holográfica, nome com inicial, elástico e tassel."
      }
    ],
    "customizationSettings": {
      "allowChildName": true,
      "childNameLabel": "Nome na Lembrancinha",
      "childNamePlaceholder": "Ex: Davi",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true,
      "customFields": [
        {
          "id": "field_1794440222764",
          "label": "Cor do Caderno",
          "type": "text",
          "required": true,
          "placeholder": "Ex: Azul, Rosa, Roxo..."
        }
      ]
    }
  },
  {
    "id": "bola-de-natal-em-acrilico-4461",
    "name": "Bola de natal em Acrílico",
    "category": "natal",
    "description": "Enfeite de Natal delicado e cheio de significado para iluminar a sua árvore de Natal",
    "price": 9.9,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794419836305-gemini_generated_image_s2zf35s2zf35s2zf.jfif",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794419836305-gemini_generated_image_s2zf35s2zf35s2zf.jfif"
    ],
    "variations": [
      {
        "id": "var_1794441887458_0",
        "name": "Modelo 1",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794419831520-gemini_generated_image_s2zf35s2zf35s2zf.jfif",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794419831520-gemini_generated_image_s2zf35s2zf35s2zf.jfif"
        ]
      },
      {
        "id": "var_1794441887458_1",
        "name": "Modelo 2",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794419827872-saveclip.app_588720354_18183661219347767_9060147958946855120_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794419827872-saveclip.app_588720354_18183661219347767_9060147958946855120_n.jpg"
        ]
      }
    ],
    "availableRibbonColors": [
      "Laço Vermelho",
      "Laço Dourado",
      "Laço Verde",
      "Laço Rosa"
    ],
    "customizationSettings": {
      "allowChildName": false,
      "childNameLabel": "Nome na Lembrancinha",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "variationsNote": "OBS: As fotos para a personalização das bolinhas devem ser enviadas pelo nosso WhatsApp após o fechamento do pedido!",
      "allowRibbonColors": true,
      "ribbonColors": [
        "Laço Vermelho",
        "Laço Dourado",
        "Laço Verde",
        "Laço Rosa"
      ],
      "allowNotes": true
    },
    "popular": false,
    "variationsNote": "OBS: As fotos para a personalização das bolinhas devem ser enviadas pelo nosso WhatsApp após o fechamento do pedido!"
  },
  {
    "id": "kit-tacas-de-champanhe-acrilicas-3787",
    "name": "Kit Taças de Champanhe Acrílicas",
    "category": "dia-dos-namorados",
    "description": "Kit Dia dos Namorados com Suporte Alça e 2 Taças – \"Um Brinde ao Nosso Amor\"",
    "price": 39.9,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794319780757-saveclip.app_502950022_18164158618347767_3604424657868561051_n.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794319780757-saveclip.app_502950022_18164158618347767_3604424657868561051_n.jpg",
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794319788254-saveclip.app_502405449_18164158609347767_4785126441019407278_n.jpg"
    ],
    "customizationSettings": {
      "allowChildName": false,
      "childNameLabel": "Nome na Lembrancinha",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true
    },
    "popular": false
  },
  {
    "id": "caixas-explosao-com-fotos-e-doces-8012",
    "name": "Caixa Explosão com Fotos e Doces",
    "category": "dia-dos-namorados",
    "description": "Caixa com Fotos e Mensagens para 7 Doces",
    "price": 79.9,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794322329304-saveclip.app_502942743_18164158282347767_2874077480112854440_n.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794322329304-saveclip.app_502942743_18164158282347767_2874077480112854440_n.jpg",
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794322336977-saveclip.app_502084229_18164158291347767_6072347069785725598_n.jpg"
    ],
    "variations": [
      {
        "id": "var_1794416989068_0",
        "name": "Modelo 1",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794322348494-saveclip.app_502942743_18164158282347767_2874077480112854440_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794322348494-saveclip.app_502942743_18164158282347767_2874077480112854440_n.jpg",
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794322336977-saveclip.app_502084229_18164158291347767_6072347069785725598_n.jpg"
        ]
      },
      {
        "id": "var_1794416989068_1",
        "name": "Modelo 2",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794322416835-saveclip.app_502659714_18163975918347767_928340238878548303_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794322416835-saveclip.app_502659714_18163975918347767_928340238878548303_n.jpg",
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794323172385-saveclip.app_502069239_18163975927347767_3323008487323382388_n.jpg"
        ]
      }
    ],
    "customizationSettings": {
      "allowChildName": false,
      "childNameLabel": "Nome na Lembrancinha",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true,
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial..."
    },
    "popular": false
  },
  {
    "id": "porta-sabonete-5923",
    "name": "Porta-sabonete",
    "category": "natal",
    "description": "Lembrancinha de Natal Porta-Sabonete com Saco e Laço Vermelho",
    "price": 15,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335405021-saveclip.app_624067620_18171071590384048_8655808288146978986_n.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335405021-saveclip.app_624067620_18171071590384048_8655808288146978986_n.jpg"
    ],
    "customizationSettings": {
      "allowChildName": false,
      "childNameLabel": "Nome na Lembrancinha",
      "allowRibbonColors": true,
      "ribbonColors": [
        "Laço Vermelho",
        "Laço Verde",
        "Laço Dourado"
      ],
      "allowNotes": true,
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial..."
    },
    "popular": false,
    "availableRibbonColors": [
      "Laço Vermelho",
      "Laço Verde",
      "Laço Dourado"
    ]
  },
  {
    "id": "porta-bis-9810",
    "name": "Porta-Bis",
    "category": "natal",
    "description": "Lembrancinha de Natal Porta-Bis com Embalagem e Laço",
    "price": 15,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335601162-saveclip.app_654891797_18089775532928331_951258065111492404_n.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335601162-saveclip.app_654891797_18089775532928331_951258065111492404_n.jpg"
    ],
    "customizationSettings": {
      "allowChildName": false,
      "childNameLabel": "Nome na Lembrancinha",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true,
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial..."
    },
    "popular": false,
    "variations": [
      {
        "id": "var_1794438450489_0",
        "name": "Modelo 1",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335810079-saveclip.app_654891797_18089775532928331_951258065111492404_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335810079-saveclip.app_654891797_18089775532928331_951258065111492404_n.jpg",
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335815075-saveclip.app_652773064_18084625118254083_8374610967704577579_n.jpg"
        ],
        "description": "Lembrancinha de Natal Porta-Bis com 3 unidades"
      },
      {
        "id": "var_1794438450489_1",
        "name": "Modelo 2",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335921834-saveclip.app_669951093_18579763231027025_2885427802905799559_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335921834-saveclip.app_669951093_18579763231027025_2885427802905799559_n.jpg",
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794335925204-saveclip.app_649604025_17938381596014062_8131345668314107267_n.jpg"
        ],
        "description": "Lembrancinha de Natal Porta-Bis com 6 unidades"
      }
    ]
  },
  {
    "id": "porta-bombom-3259",
    "name": "Porta-Bombom",
    "category": "natal",
    "description": "Lembrancinha de Natal Porta-Bombom com Embalagem Transparente e Laço",
    "price": 15,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794336063492-saveclip.app_625871771_18087632734883825_6662944217020735260_n.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794336063492-saveclip.app_625871771_18087632734883825_6662944217020735260_n.jpg"
    ],
    "customizationSettings": {
      "allowChildName": false,
      "childNameLabel": "Nome na Lembrancinha",
      "allowRibbonColors": true,
      "ribbonColors": [
        "Laço Vermelho",
        "Laço Dourado",
        "Laço Verde"
      ],
      "allowNotes": true,
      "customFields": [
        {
          "id": "field_1794438917631",
          "label": "Chocolate",
          "type": "select",
          "required": true,
          "placeholder": "Sonho de Valsa",
          "options": [
            "Ouro Branco",
            "Outros"
          ]
        }
      ],
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial..."
    },
    "popular": false,
    "availableRibbonColors": [
      "Laço Vermelho",
      "Laço Dourado",
      "Laço Verde"
    ]
  },
  {
    "id": "porta-bala-4315",
    "name": "Porta-Bala",
    "category": "natal",
    "description": "Um mimo simples, acessível e carinhoso para mimar clientes, parceiros ou colaboradores.",
    "price": 15,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794336276063-saveclip.app_625053975_18112211146567565_1096708006824092779_n.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794336276063-saveclip.app_625053975_18112211146567565_1096708006824092779_n.jpg"
    ],
    "customizationSettings": {
      "allowChildName": false,
      "childNameLabel": "Nome na Lembrancinha",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true,
      "customFields": [
        {
          "id": "field_1794439599023",
          "label": "Bala",
          "type": "select",
          "required": true,
          "placeholder": "7Belo",
          "options": [
            "Yogurte",
            "Freegells",
            "Outros"
          ]
        }
      ],
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial..."
    },
    "popular": false
  },
  {
    "id": "kit-lembrancinhas-personalizadas-4379",
    "name": "Lembracinhas de Time personalizadas",
    "category": "anivers-rio-infantil",
    "description": "Caixas temáticas em camadas 3D com foto. Perfeito para compor a mesa e encantar os convidados!",
    "price": 15,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794407326238-saveclip.app_857246287_18218060854347767_5753697527518423786_n.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794407326238-saveclip.app_857246287_18218060854347767_5753697527518423786_n.jpg"
    ],
    "variations": [
      {
        "id": "var_1794457278774_0",
        "name": "Modelo 1",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794407368494-saveclip.app_859801689_18218060917347767_3784566472842721051_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794407368494-saveclip.app_859801689_18218060917347767_3784566472842721051_n.jpg"
        ]
      },
      {
        "id": "var_1794457278774_1",
        "name": "Modelo 2",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794407375645-saveclip.app_858263650_18218060965347767_7417340956182341151_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794407375645-saveclip.app_858263650_18218060965347767_7417340956182341151_n.jpg"
        ]
      },
      {
        "id": "var_1794457278774_2",
        "name": "Modelo 3",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794407383078-saveclip.app_858263658_18218060863347767_196120946507788477_n.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794407383078-saveclip.app_858263658_18218060863347767_196120946507788477_n.jpg"
        ]
      }
    ],
    "availableRibbonColors": [
      "Laço Dourado",
      "Laço Verde",
      "Laço Vermelho",
      "Laço Azul",
      "Laço Preto"
    ],
    "customizationSettings": {
      "allowChildName": true,
      "childNameLabel": "Nome na Lembrancinha",
      "childNamePlaceholder": "Ex: Davi",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "variationsNote": "OBS: As fotos para a personalização das lembrancinhas devem ser enviadas pelo nosso WhatsApp após o fechamento do pedido!",
      "allowRibbonColors": true,
      "ribbonColors": [
        "Laço Dourado",
        "Laço Verde",
        "Laço Vermelho",
        "Laço Azul",
        "Laço Preto"
      ],
      "allowNotes": true,
      "customFields": [
        {
          "id": "field_1794407683677",
          "label": "Time",
          "type": "text",
          "required": true,
          "placeholder": "Ex: Palmeiras, Flamengo, Corinthians..."
        }
      ]
    },
    "popular": true,
    "variationsNote": "OBS: As fotos para a personalização das lembrancinhas devem ser enviadas pelo nosso WhatsApp após o fechamento do pedido!"
  },
  {
    "id": "lembrancinha-super-mario-personalizada-7540",
    "name": "Lembrancinhas de Desenho Personalizadas",
    "category": "anivers-rio-infantil",
    "description": "Caixas personalizados com o desenho favorito da criança!",
    "price": 15,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416341154-recorte-1794416341134.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416341154-recorte-1794416341134.jpg"
    ],
    "customizationSettings": {
      "allowChildName": true,
      "childNameLabel": "Nome na Lembrancinha",
      "childNamePlaceholder": "Ex: Davi",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true
    },
    "popular": true,
    "variations": [
      {
        "id": "var_1794457002025_0",
        "name": "Mário",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416586504-recorte-1794416586485.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416586504-recorte-1794416586485.jpg",
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416582565-recorte-1794416582548.jpg"
        ]
      },
      {
        "id": "var_1794457002025_1",
        "name": "Hulk",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416607996-recorte-1794416607988.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416607996-recorte-1794416607988.jpg",
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794416614710-recorte-1794416614700.jpg"
        ]
      },
      {
        "id": "var_1794457002025_2",
        "name": "Léo o Caminhão",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794417620183-gemini_generated_image_magdxqmagdxqmagd.jfif",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794417620183-gemini_generated_image_magdxqmagdxqmagd.jfif"
        ]
      }
    ]
  },
  {
    "id": "kit-colorir-tematico-personalizado-4812",
    "name": "Kit Colorir Temático Personalizado",
    "category": "anivers-rio-infantil",
    "description": "Um mimo para estimular a criatividade! Acompanha sacolinha especial, livrinho de colorir e giz de cera com o tema da sua festa.",
    "price": 15,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794415829547-recorte-1794415829510.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794415829547-recorte-1794415829510.jpg"
    ],
    "variations": [
      {
        "id": "var_1794457010872_0",
        "name": "Azul",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794417285879-recorte-1794417285857.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794417285879-recorte-1794417285857.jpg"
        ]
      },
      {
        "id": "var_1794457010872_1",
        "name": "Rosa",
        "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794417297379-recorte-1794417297344.jpg",
        "images": [
          "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794417297379-recorte-1794417297344.jpg"
        ]
      }
    ],
    "customizationSettings": {
      "allowChildName": true,
      "childNameLabel": "Nome na Lembrancinha",
      "childNamePlaceholder": "Ex: Davi",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true
    },
    "popular": true
  },
  {
    "id": "caneca-personalizada-1864",
    "name": "Caneca Personalizada",
    "category": "dia-dos-professores",
    "description": "Caneca temática para o Dia dos Professores. O mimo acompanha caixa especial com visor, laço de cetim e tag afetuosa.",
    "price": 15,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794420796849-recorte-1794420796838.jpg",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794420796849-recorte-1794420796838.jpg"
    ],
    "customizationSettings": {
      "allowChildName": false,
      "childNameLabel": "Nome na Lembrancinha",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true,
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial..."
    },
    "popular": true
  },
  {
    "id": "porta-doces-tematico-6622",
    "name": "Porta-Doces Temático",
    "category": "anivers-rio-infantil",
    "description": "Encantadora lembrancinha de chá de bebê. Acompanha copo bolha para doces, delicado laço de cetim e papelaria criativa.",
    "price": 15,
    "unit": "unidade",
    "leadTimeDays": 5,
    "minQuantity": 1,
    "image": "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794422432939-gemini_generated_image_3p41gy3p41gy3p41.jfif",
    "images": [
      "https://pub-5f80dd6841fe4a50865ac65cdf461956.r2.dev/1794422432939-gemini_generated_image_3p41gy3p41gy3p41.jfif"
    ],
    "customizationSettings": {
      "allowChildName": false,
      "childNameLabel": "Nome na Lembrancinha",
      "notesPlaceholder": "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial...",
      "allowRibbonColors": false,
      "ribbonColors": [],
      "allowNotes": true,
      "customFields": [
        {
          "id": "field_1794422438901",
          "label": "Nome na lembrancinha",
          "type": "text",
          "required": true,
          "placeholder": "Ex: Samuel"
        },
        {
          "id": "field_1794457328251",
          "label": "Tema",
          "type": "text",
          "required": true,
          "placeholder": "Ex: Astronauta, desenho..."
        }
      ]
    },
    "popular": true
  }
];

