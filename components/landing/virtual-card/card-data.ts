export type CardVariant =
  | "platinum"
  | "midnight"
  | "aurora"
  | "sunset"
  | "emerald"
  | "cobalt"
  | "crimson"
  | "violet";

export type VirtualCardConfig = {
  id: string;
  variant: CardVariant;
  label: string;
  number: string;
  holder: string;
  expiry: string;
};

export const virtualCards: VirtualCardConfig[] = [
  {
    id: "platinum",
    variant: "platinum",
    label: "Platinum USD",
    number: "5412 •••• •••• 3290",
    holder: "James Whitfield",
    expiry: "11/29",
  },
  {
    id: "midnight",
    variant: "midnight",
    label: "Midnight Black",
    number: "4532 •••• •••• 7891",
    holder: "Sarah Chen",
    expiry: "09/28",
  },
  {
    id: "aurora",
    variant: "aurora",
    label: "Aurora Glass",
    number: "8821 •••• •••• 6644",
    holder: "Alex Morgan",
    expiry: "03/30",
  },
  {
    id: "sunset",
    variant: "sunset",
    label: "Sunset Gold",
    number: "6104 •••• •••• 2156",
    holder: "Maria Santos",
    expiry: "06/29",
  },
  {
    id: "emerald",
    variant: "emerald",
    label: "Emerald Elite",
    number: "7743 •••• •••• 9082",
    holder: "David Okoye",
    expiry: "12/28",
  },
  {
    id: "cobalt",
    variant: "cobalt",
    label: "Cobalt Blue",
    number: "3920 •••• •••• 5518",
    holder: "Elena Russo",
    expiry: "04/30",
  },
  {
    id: "crimson",
    variant: "crimson",
    label: "Crimson Red",
    number: "2287 •••• •••• 9034",
    holder: "Michael Torres",
    expiry: "08/29",
  },
  {
    id: "violet",
    variant: "violet",
    label: "Violet Rose",
    number: "9561 •••• •••• 4420",
    holder: "Priya Sharma",
    expiry: "01/31",
  },
];

export const AUTO_PLAY_INTERVAL_MS = 3500;

/** Default centered card on load — Aurora Glass */
export const DEFAULT_CARD_INDEX = 2;
