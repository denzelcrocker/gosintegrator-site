"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Heart, ChartNoAxesColumn, Check, FileText } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { type Product, money, categoryNames } from "@/lib/types";
import { useStore } from "./store-provider";
export function ProductDetail({ slug }: { slug: string }) {
  const [p, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const store = useStore();
  useEffect(() => {
    const controller = new AbortController();
    setProduct(null);
    setError("");
    api<Product>(`/catalog/products/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((product) => {
        if (!controller.signal.aborted) setProduct(product);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      });
    return () => controller.abort();
  }, [slug]);
  if (error)
    return (
      <div className="page-container">
        <div className="empty">
          <h1>Товар недоступен</h1>
          <p>{error}</p>
          <Link href="/catalog" className="button">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  if (!p) return <div className="loading">Загрузка оборудования…</div>;
  return (
    <div className="page-container">
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href="/catalog">Каталог</Link>
        <span>/</span>
        <Link href={`/catalog?category=${p.category}`}>
          {categoryNames[p.category]}
        </Link>
        <span>/</span>
        <span>{p.name}</span>
      </div>
      <div className="product-detail">
        <div className="detail-image">
          <span className="eyebrow">{p.brand}</span>
          <img src={p.imageUrl} alt={p.name} />
          <span className="image-caption">
            {p.isDemo
              ? "Изображение для демонстрационной конфигурации"
              : p.name}
          </span>
        </div>
        <div className="detail-info">
          <div className="detail-top">
            <span className="badge">
              {p.isOwn ? "Собственная линейка" : p.brand}
            </span>
            <span>Арт. {p.sku}</span>
          </div>
          <h1>{p.name}</h1>
          {p.manufacturerPartNumber && (
            <p className="detail-mpn">
              Код производителя: {p.manufacturerPartNumber}
            </p>
          )}
          <p className="detail-summary">{p.summary}</p>
          <div className="detail-specs">
            {p.specifications.slice(0, 4).map((s) => (
              <div key={s.name}>
                <span>{s.name}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
          <div className="detail-price">
            {p.useSupplierPrice && p.price !== null && (
              <span className="supplier-price-caption">Минимальная цена</span>
            )}
            <strong>{money(p.price)}</strong>
            <span>
              {p.stock > 0
                ? `${p.stock.toLocaleString("ru-RU")} шт.${p.useSupplierPrice && p.price !== null ? " по этой цене" : p.isDemo ? " в демонстрационном каталоге" : " в наличии"}`
                : "Конфигурация под заказ"}
            </span>
            {p.useSupplierPrice && p.availabilityCheckedAt && (
              <span>
                Наличие проверено{" "}
                {new Date(p.availabilityCheckedAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <div className="detail-actions">
            <button className="button" onClick={() => store.add(p)}>
              <Plus size={20} />
              Добавить в заявку
            </button>
            <button
              className="button button-outline"
              aria-label="В избранное"
              aria-pressed={store.favorites.some((i) => i.id === p.id)}
              onClick={() => store.toggleFavorite(p)}
            >
              <Heart size={20} />
            </button>
            <button
              className="button button-outline"
              aria-label="Добавить к сравнению"
              aria-pressed={store.compare.some((i) => i.id === p.id)}
              onClick={() => store.toggleCompare(p)}
            >
              <ChartNoAxesColumn size={20} />
            </button>
          </div>
          <p className="detail-disclaimer">
            {p.useSupplierPrice &&
              p.price !== null &&
              "Для большей партии цена за штуку может измениться. "}
            Итоговая стоимость и сроки поставки фиксируются в коммерческом
            предложении.
          </p>
        </div>
      </div>
      <div className="detail-columns">
        <section>
          <h2>Оборудование под задачу</h2>
          <p>{p.description}</p>
          <h3>Характеристики</h3>
          <dl className="spec-table">
            {p.specifications.map((s) => (
              <div key={s.name}>
                <dt>{s.name}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <aside className="registry-panel">
          <FileText size={28} strokeWidth={1.3} />
          <h3>Происхождение и реестр</h3>
          {p.registryNumber ? (
            <>
              <p>
                Реестровая запись
                <br />
                <strong>№ {p.registryNumber}</strong>
              </p>
              <span
                className={`badge ${p.registryStatus === "verified" ? "green" : "gray"}`}
              >
                {p.registryStatus === "verified"
                  ? "Проверена по загруженной выгрузке"
                  : p.registryStatus === "expired"
                    ? "Срок действия истёк"
                    : p.registryStatus === "cancelled"
                      ? "Запись аннулирована"
                      : "Требует проверки"}
              </span>
              {p.registryValidUntil && (
                <p>
                  Действует до{" "}
                  {new Date(p.registryValidUntil).toLocaleDateString("ru-RU")}
                </p>
              )}
              {p.registryCheckedAt && (
                <p>
                  Сверена{" "}
                  {new Date(p.registryCheckedAt).toLocaleDateString("ru-RU")}
                </p>
              )}
              {p.registrySourceUrl && (
                <a
                  className="text-link"
                  href={p.registrySourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Источник в ГИСП
                </a>
              )}
            </>
          ) : (
            <p>Подтверждённая реестровая запись пока не добавлена.</p>
          )}
          <p className="registry-note">
            Соответствие требованиям закупки проверяется по конкретной
            комплектации и актуальным документам.
          </p>
          <Link href="/procurement" className="button button-outline">
            Запросить документы
          </Link>
        </aside>
      </div>
    </div>
  );
}
