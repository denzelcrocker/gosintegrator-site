"use client";
import Link from "next/link";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";
import { useCurrentProducts } from "@/lib/use-current-products";
export default function Favorites() {
  const { favorites: savedFavorites } = useStore();
  const {
    products: favorites,
    loading,
    error,
  } = useCurrentProducts(savedFavorites);
  return (
    <div className="page-container">
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Избранное</span>
      </div>
      <h1 className="page-title">Отложено к решению.</h1>
      <p className="page-intro">Оборудование, к которому удобно вернуться.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="loading">Обновляем цены и наличие…</div>
      ) : favorites.length ? (
        <div className="product-grid">
          {favorites.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Здесь появятся избранные товары</h2>
          <p>Нажмите на сердце в карточке оборудования.</p>
          <Link href="/catalog" className="button">
            Перейти в каталог
          </Link>
        </div>
      )}
    </div>
  );
}
