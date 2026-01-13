export type PeriodType = "monthly" | "quarterly" | "yearly"
export type ViewMode = "standard" | "unlimited"

export interface StandardPlan {
  id: string
  name: string
  price: number | { monthly: number; quarterly: number; yearly: number }
  points: number
  features: string[]
  theme: "gray" | "cyan" | "blue" | "black"
  cta: string
  highlight?: boolean
}

export interface UnlimitedCard {
  duration: string
  type: string
  price: string
  unit: string
  oldPrice: string
  tag: string | null
  desc: string
}

export interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  userInfo?: {
    nickname?: string
    balance?: number
    onViewRecords?: () => void
  }
}
