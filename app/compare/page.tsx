"use client";
import Link from "next/link";
import { X } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { productPrice } from "@/lib/types";
import { useCurrentProducts } from "@/lib/use-current-products";
export default function Compare() {
  const { compare: savedCompare, toggleCompare, add } = useStore();
  const {
    products: compare,
    loading,
    error,
  } = useCurrentProducts(savedCompare);
  const names = [
    ...new Set(compare.flatMap((p) => p.specifications.map((s) => s.name))),
  ];
  return (
    <div className="page-container">
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Сравнение</span>
      </div>
      <h1 className="page-title">Детали имеют значение.</h1>
      <p className="page-intro">До четырёх товаров в одном сравнении.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="loading">Обновляем цены и наличие…</div>
      ) : compare.length ? (
        <div className="table-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Оборудование</th>
                {compare.map((p) => (
                  <th key={p.id}>
                    <button
                      className="icon-button"
                      aria-label={`Убрать ${p.name}`}
                      onClick={() => toggleCompare(p)}
                    >
                      <X size={16} />
                    </button>
                    <img src={p.imageUrl} alt={p.name} />
                    <Link href={`/catalog/${p.slug}`}>{p.name}</Link>
                    <strong>{productPrice(p)}</strong>
                    <button className="button" onClick={() => add(p)}>
                      В заявку
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Производитель</td>
                {compare.map((p) => (
                  <td key={p.id}>{p.brand}</td>
                ))}
              </tr>
              {names.map((n) => (
                <tr key={n}>
                  <td>{n}</td>
                  {compare.map((p) => (
                    <td key={p.id}>
                      {p.specifications.find((s) => s.name === n)?.value ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h2>Пока нечего сравнивать</h2>
          <p>Отметьте товары значком сравнения в каталоге.</p>
          <Link href="/catalog" className="button">
            Выбрать оборудование
          </Link>
        </div>
      )}
    </div>
  );
}
