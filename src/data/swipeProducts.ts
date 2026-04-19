/**
 * Ropa de segunda mano — cada producto incluye exactamente 5 fotos (requisito de listado).
 */

import type { FichaTecnicaV1 } from "@/data/vendorVerificationQuestionnaire";

export type SwipeProduct = {
  id: string;
  name: string;
  size: string;
  /** Precio de venta en colones costarricenses (CRC). */
  priceColones: number;
  /** Exactamente 5 URLs de imagen */
  images: readonly [string, string, string, string, string];
  /** Categoría de venta (id) para el cuestionario de verificación. */
  categoryId?: string;
  /** Demo: mismas claves que guarda el flujo de publicación / columna `ficha_tecnica`. */
  ficha_tecnica?: FichaTecnicaV1;
  /** Id del vendedor para reportes (demo). */
  sellerUserId?: string;
  /** Nombre mostrado en ficha de vendedor / reportes. */
  sellerDisplayName?: string;
};

const u = (id: string, sig: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80&sig=${sig}`;

export const SWIPE_PRODUCTS: SwipeProduct[] = [
  {
    id: "ch-001",
    name: "Chaqueta denim vintage Levi's",
    size: "M",
    priceColones: 48_000,
    categoryId: "moda",
    sellerUserId: "seller_ch_001",
    sellerDisplayName: "María · Moda circular",
    ficha_tecnica: {
      manchas_motas: "no",
      ajustes_sastre: "no",
      libre_olor_tabaco: "yes",
    },
    images: [
      u("photo-1576995853123-5a10305d93c0", "a1"),
      u("photo-1541099649105-f69ad21f3246", "a2"),
      u("photo-1551028719-00167b16eac5", "a3"),
      u("photo-1523381210438-271e66be0eb6", "a4"),
      u("photo-1509631179647-0177331693ae", "a5"),
    ],
  },
  {
    id: "ch-002",
    name: "Sudadera gris oversize",
    size: "L",
    priceColones: 22_000,
    sellerUserId: "seller_ch_002",
    sellerDisplayName: "Lucía G.",
    images: [
      u("photo-1556821840-3a63f95609a7", "b1"),
      u("photo-1578587018452-892b21fd8d7a", "b2"),
      u("photo-1515886657613-9f3515b0c78f", "b3"),
      u("photo-1469334031218-e382a71b716b", "b4"),
      u("photo-1490481651871-ab68de25d43d", "b5"),
    ],
  },
  {
    id: "ch-003",
    name: "Vestido floral midi",
    size: "S",
    priceColones: 35_000,
    sellerUserId: "seller_ch_003",
    sellerDisplayName: "Ana Vintage",
    images: [
      u("photo-1595777457583-95e059d581b8", "c1"),
      u("photo-1515372039744-b8f02a3ae446", "c2"),
      u("photo-1583496661160-fb5886a0aaaa", "c3"),
      u("photo-1572804013309-59a74b9e646f", "c4"),
      u("photo-1496747611176-843222e1e57c", "c5"),
    ],
  },
  {
    id: "ch-004",
    name: "Camisa de lino blanca",
    size: "M",
    priceColones: 28_000,
    sellerUserId: "seller_ch_004",
    sellerDisplayName: "Carlos R.",
    images: [
      u("photo-1602810318383-e386cc2a3ccf", "d1"),
      u("photo-1596755094514-f87d3407b14c", "d2"),
      u("photo-1620799140408-ed534dfffd51", "d3"),
      u("photo-1434382657669-0ae9bd436e20", "d4"),
      u("photo-1562157873-818bc0726c68", "d5"),
    ],
  },
  {
    id: "ch-005",
    name: "Pantalón cargo verde oliva",
    size: "32",
    priceColones: 40_000,
    sellerUserId: "seller_ch_005",
    sellerDisplayName: "Streetwear CR",
    images: [
      u("photo-1624378515193-66bbfd0a9adf", "e1"),
      u("photo-1473966968600-fa801b869a0a", "e2"),
      u("photo-1542272604-787c3835535d", "e3"),
      u("photo-1506629082955-511b1aa562c8", "e4"),
      u("photo-1582418702059-97ebafb35d09", "e5"),
    ],
  },
  {
    id: "ch-006",
    name: "Blazer negro entallado",
    size: "S",
    priceColones: 55_000,
    sellerUserId: "seller_ch_006",
    sellerDisplayName: "Valeria M.",
    images: [
      u("photo-1594938298603-c8148c4dae35", "f1"),
      u("photo-1591369822096-ffd140ec948f", "f2"),
      u("photo-1507003211169-0a1dd7228f2d", "f3"),
      u("photo-1534030346649-47e6da62d48b", "f4"),
      u("photo-1503341455253-b2e723bb3dbb", "f5"),
    ],
  },
  {
    id: "ch-007",
    name: "Hoodie negra con capucha",
    size: "XL",
    priceColones: 30_000,
    sellerUserId: "seller_ch_007",
    sellerDisplayName: "Hoodie Lab",
    images: [
      u("photo-1556905055-8f358a7a47b2", "g1"),
      u("photo-1620799140188-3b2a02fd9a77", "g2"),
      u("photo-1521572163474-6864f9cf17ab", "g3"),
      u("photo-1618354691373-d851c5642cb3", "g4"),
      u("photo-1622445275577-35d35f712ca6", "g5"),
    ],
  },
];
