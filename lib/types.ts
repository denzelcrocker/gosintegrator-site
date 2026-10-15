export interface Category {
  slug: string;
  name: string;
  count: number;
}
export interface Specification {
  name: string;
  value: string;
}
export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  summary: string;
  description: string;
  price: number | null;
  stock: number;
  imageUrl: string;
  isOwn: boolean;
  isPublished: boolean;
  isDemo: boolean;
  registryNumber: string | null;
  registryStatus: string;
  registryValidUntil: string | null;
  registryCheckedAt: string | null;
  registrySourceUrl: string | null;
  specifications: Specification[];
  version: number;
  manufacturerPartNumber?: string | null;
  useSupplierPrice?: boolean;
  supplierOffersCount?: number;
  availabilityCheckedAt?: string | null;
}
export interface SupplierOffer {
  supplierCode: string;
  externalId: string;
  manufacturerPartNumber: string | null;
  price: number | null;
  currency: string | null;
  stock: number | null;
  observedAt: string | null;
  isEligible: boolean;
  isSelected: boolean;
}
export interface SupplierOffersResponse {
  offers: SupplierOffer[];
  useSupplierPrice: boolean;
}
export interface CatalogResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  brands: string[];
}
export interface CartItem {
  product: Product;
  quantity: number;
}
export interface QuoteLine {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number | null;
}
export interface Quote {
  id: string;
  number: string;
  company: string;
  inn: string;
  contactName: string;
  email: string;
  phone: string;
  comment: string;
  status: string;
  createdAt: string;
  total: number;
  hasUnpricedItems: boolean;
  lines: QuoteLine[];
}
export const money = (value: number | null) =>
  value === null
    ? "По запросу"
    : new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
export const productPrice = (
  product: Pick<Product, "price" | "useSupplierPrice">,
) =>
  `${product.useSupplierPrice && product.price !== null ? "от " : ""}${money(product.price)}`;
export const categoryNames: Record<string, string> = {
  computers: "Компьютеры",
  servers: "Серверы и СХД",
  laptops: "Ноутбуки",
  monitors: "Мониторы",
  networking: "Сетевое оборудование",
  peripherals: "Периферия",
  components: "Комплектующие",
};

export function productCountLabel(count: number) {
  const form = new Intl.PluralRules("ru-RU").select(count);
  const word = form === "one" ? "товар" : form === "few" ? "товара" : "товаров";
  return `${count} ${word}`;
}
