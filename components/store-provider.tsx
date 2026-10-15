"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/lib/types";
type Store = {
  cart: CartItem[];
  add: (p: Product) => void;
  setQuantity: (id: string, n: number) => void;
  clear: () => void;
  compare: Product[];
  toggleCompare: (p: Product) => void;
  favorites: Product[];
  toggleFavorite: (p: Product) => void;
  notice: (message: string) => void;
};
const Context = createContext<Store | null>(null);
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [compare, setCompare] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setCart(read("ai-cart", []));
    setCompare(read("ai-compare", []));
    setFavorites(read("ai-favorites", []));
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      localStorage.setItem("ai-cart", JSON.stringify(cart));
      localStorage.setItem("ai-compare", JSON.stringify(compare));
      localStorage.setItem("ai-favorites", JSON.stringify(favorites));
    }
  }, [cart, compare, favorites, ready]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [message]);
  const add = (product: Product) => {
    setCart((items) => {
      const item = items.find((i) => i.product.id === product.id);
      return item
        ? items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: Math.min(999, i.quantity + 1) }
              : i,
          )
        : [...items, { product, quantity: 1 }];
    });
    setMessage("Товар добавлен в заявку");
  };
  const toggleCompare = (product: Product) =>
    setCompare((items) =>
      items.some((p) => p.id === product.id)
        ? items.filter((p) => p.id !== product.id)
        : items.length < 4
          ? [...items, product]
          : (setMessage("Можно сравнить до 4 товаров"), items),
    );
  const toggleFavorite = (product: Product) =>
    setFavorites((items) =>
      items.some((p) => p.id === product.id)
        ? items.filter((p) => p.id !== product.id)
        : [...items, product],
    );
  return (
    <Context.Provider
      value={{
        cart,
        add,
        setQuantity: (id, n) =>
          setCart((items) =>
            n <= 0
              ? items.filter((i) => i.product.id !== id)
              : items.map((i) =>
                  i.product.id === id
                    ? { ...i, quantity: Math.min(999, n) }
                    : i,
                ),
          ),
        clear: () => setCart([]),
        compare,
        toggleCompare,
        favorites,
        toggleFavorite,
        notice: setMessage,
      }}
    >
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("StoreProvider is required");
  return store;
}
