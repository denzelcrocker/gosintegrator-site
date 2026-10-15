"use client";
import Link from "next/link";
import { useRef } from "react";
import { Heart, Minus, Plus, ChartNoAxesColumn } from "lucide-react";
import { type Product, productPrice } from "@/lib/types";
import { useStore } from "./store-provider";
export function ProductCard({ product: p }: { product: Product }) {
  const store = useStore();
  const quantity = store.cart.find((item) => item.product.id === p.id)?.quantity ?? 0;
  const addButton = useRef<HTMLButtonElement>(null);
  return (
    <article className="product-card">
      <div className="product-picture">
        <Link href={`/catalog/${p.slug}`} aria-label={p.name}>
          <img src={p.imageUrl} alt={p.name} loading="lazy" />
        </Link>
        <span className="product-label">
          {p.isOwn ? "Собственная линейка" : p.brand}
        </span>
        <button
          className="favorite icon-button"
          aria-label={`В избранное: ${p.name}`}
          aria-pressed={store.favorites.some((i) => i.id === p.id)}
          onClick={() => store.toggleFavorite(p)}
        >
          <Heart size={19} />
        </button>
      </div>
      <div className="product-info">
        <div className="product-meta">
          <span>
            {p.registryStatus === "verified"
              ? "Запись реестра проверена"
              : p.isOwn
                ? "Под вашу конфигурацию"
                : p.isDemo
                  ? "Пример конфигурации"
                  : "Оборудование для бизнеса"}
          </span>
          <button
            className="icon-button"
            aria-label={`Сравнить: ${p.name}`}
            aria-pressed={store.compare.some((i) => i.id === p.id)}
            onClick={() => store.toggleCompare(p)}
          >
            <ChartNoAxesColumn size={17} />
          </button>
        </div>
        <Link className="product-name" href={`/catalog/${p.slug}`} title={p.name}>
          {p.name}
        </Link>
        <p>{p.summary}</p>
        <div className="product-bottom">
          <div className="product-price">
            <small>
              {p.stock > 0
                ? p.useSupplierPrice
                  ? `${p.stock.toLocaleString("ru-RU")} шт. ${p.price !== null ? "по этой цене" : "доступно"}`
                  : "Доступен для заявки"
                : "Под заказ"}
            </small>
            <strong>{productPrice(p)}</strong>
          </div>
          <div className="product-actions">
            <div
              className={`product-quantity${quantity === 0 ? " is-empty" : ""}`}
              role="group"
              aria-label={`Количество в заявке: ${p.name}`}
            >
              {quantity > 0 && (
                <button
                  type="button"
                  aria-label={`Уменьшить количество: ${p.name}`}
                  onClick={() => {
                    store.setQuantity(p.id, quantity - 1);
                    if (quantity === 1) addButton.current?.focus();
                  }}
                >
                  <Minus size={17} aria-hidden="true" />
                </button>
              )}
              {quantity > 0 && (
                <output aria-label={`В заявке: ${p.name}`} aria-live="polite" aria-atomic="true">
                  {quantity}
                </output>
              )}
              <button
                ref={addButton}
                type="button"
                aria-label={quantity > 0 ? `Увеличить количество: ${p.name}` : `В заявку: ${p.name}`}
                disabled={quantity >= 999}
                onClick={() => quantity > 0 ? store.setQuantity(p.id, quantity + 1) : store.add(p)}
              >
                <Plus size={quantity > 0 ? 17 : 23} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
