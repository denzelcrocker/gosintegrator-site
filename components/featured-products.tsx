"use client";
import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";
export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    api<Product[]>("/catalog/products/featured", { signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setProducts(items);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  return error ? (
    <p className="error" role="alert">
      Каталог временно недоступен. {error}
    </p>
  ) : products.length ? (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  ) : !loading ? (
    <div className="empty">
      <p>Каталог готовится к публикации.</p>
    </div>
  ) : (
    <div className="product-grid" aria-label="Загрузка каталога">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
