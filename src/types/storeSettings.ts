export interface StoreSettings {
  companyName: string | null;
  storeName: string | null;
  businessName: string | null;
  name: string | null;
  brandName: string | null;
  logoUrl: string | null;
  raw: Record<string, any> | null;
}

export const EMPTY_STORE_SETTINGS: StoreSettings = {
  companyName: null,
  storeName: null,
  businessName: null,
  name: null,
  brandName: null,
  logoUrl: null,
  raw: null
};
