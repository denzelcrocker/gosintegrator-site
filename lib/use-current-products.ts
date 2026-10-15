"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import type { Product } from "./types";

export function useCurrentProducts(saved: Product[]) {
  const ids = saved.map((product) => product.id).join(",");
  const [current, setCurrent] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ids) {
      setCurrent({});
      setError("");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const productIds = ids.split(",");
    setLoading(true);
    setError("");

    async function refresh() {
      const products: Record<string, Product> = {};
      let failed = false;
      for (let offset = 0; offset < productIds.length; offset += 4) {
        if (controller.signal.aborted) return;
        const results = await Promise.allSettled(
          productIds
            .slice(offset, offset + 4)
            .map((id) =>
              api<Product>(`/catalog/products/${encodeURIComponent(id)}`, {
                signal: controller.signal,
              }),
            ),
        );
        if (controller.signal.aborted) return;
        for (const result of results) {
          if (result.status === "fulfilled" && result.value)
            products[result.value.id] = result.value;
          else failed = true;
        }
      }
      setCurrent(products);
      setError(
        failed
          ? "Некоторые товары недоступны или не удалось обновить их цену и наличие. Для них стоимость нужно уточнить."
          : "",
      );
      setLoading(false);
    }

    void refresh();
    return () => controller.abort();
  }, [ids]);

  return {
    products: saved.map(
      (product) => current[product.id] ?? { ...product, price: null, stock: 0 },
    ),
    loading,
    error,
  };
}
