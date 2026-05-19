export const REGIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IN", name: "India" },
] as const;

export type RegionCode = (typeof REGIONS)[number]["code"];
