export interface LadderOffer {
  id: string;
  title: string;
  price: number;
  currency: string;
  delivery: string;
  completeness_pct: number;
  is_published: boolean;
}

export interface OfferLadder {
  level_1: LadderOffer | null; // Lead Magnet
  level_2: LadderOffer | null; // Tripwire
  level_3: LadderOffer | null; // Core
  level_4: LadderOffer | null; // Premium
}

export interface ConversionProjections {
  l1_to_l2: number;
  l2_to_l3: number;
  l3_to_l4: number;
}
