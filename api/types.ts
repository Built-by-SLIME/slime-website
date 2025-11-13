// Printify API Type Definitions (API copy)

export interface PrintifyProduct {
  id: string
  title: string
  description: string
  tags: string[]
  options: Array<{
    name: string
    type: string
    values: Array<{
      id: number
      title: string
    }>
  }>
  variants: PrintifyVariant[]
  images: Array<{
    src: string
    position: string
    is_default: boolean
    variant_ids: number[]
  }>
  created_at: string
  updated_at: string
  visible: boolean
  is_locked: boolean
  blueprint_id: number
  user_id: number
  shop_id: number
  print_provider_id: number
  print_areas: Array<{
    variant_ids: number[]
    placeholders: Array<{
      position: string
      images: Array<{
        id: string
        name: string
        type: string
        height: number
        width: number
        x: number
        y: number
        scale: number
        angle: number
      }>
    }>
  }>
  sales_channel_properties: any[]
}

export interface PrintifyVariant {
  id: number
  sku: string
  cost: number
  price: number
  title: string
  grams: number
  is_enabled: boolean
  is_default: boolean
  is_available: boolean
  options: number[]
}

export interface PrintifyAddress {
  first_name: string
  last_name: string
  email: string
  phone: string
  country: string
  region: string
  address1: string
  address2?: string
  city: string
  zip: string
}

export interface PrintifyOrderLineItem {
  product_id: string
  variant_id: number
  quantity: number
}

export interface PrintifyOrderRequest {
  line_items: PrintifyOrderLineItem[]
  shipping_method: number
  send_shipping_notification: boolean
  address_to: PrintifyAddress
}

export interface PrintifyOrder {
  id: string
  status: string
  shipping_method: number
  shipments: any[]
  created_at: string
  sent_to_production_at: string | null
  fulfilled_at: string | null
  line_items: Array<{
    product_id: string
    variant_id: number
    quantity: number
    print_provider_id: number
    cost: number
    shipping_cost: number
    status: string
    metadata: {
      title: string
      price: number
      variant_label: string
      sku: string
      country: string
    }
    sent_to_production_at: string | null
    fulfilled_at: string | null
  }>
  address_to: PrintifyAddress
  total_price: number
  total_shipping: number
  total_tax: number
}

