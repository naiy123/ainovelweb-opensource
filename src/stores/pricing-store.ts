import { create } from "zustand";

interface PricingStore {
  isOpen: boolean;
  openPricing: () => void;
  closePricing: () => void;
}

export const usePricingStore = create<PricingStore>((set) => ({
  isOpen: false,
  openPricing: () => set({ isOpen: true }),
  closePricing: () => set({ isOpen: false }),
}));
