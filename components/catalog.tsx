"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import {
  type CatalogResponse,
  type Category,
  categoryNames,
  productCountLabel,
} from "@/lib/types";
import { ProductCard } from "./product-card";
export function Catalog() {
  const params = useSearchParams();
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const query = params.toString();
  const requestedPageSize = Number(params.get("pageSize") ?? 48);
  const pageSize = Number.isInteger(requestedPageSize) && requestedPageSize >= 1 && requestedPageSize <= 100
    ? requestedPageSize : 48;
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const paginationPages = data
    ? [...new Set([1, data.page - 1, data.page, data.page + 1, totalPages])]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((left, right) => left - right)
    : [];
  useEffect(() => {
    const controller = new AbortController();
    api<Category[]>("/catalog/categories", { signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setCategories(items);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    setSearch(params.get("search") ?? "");
  }, [params]);
  useEffect(() => {
    const controller = new AbortController();
    const requestQuery = new URLSearchParams(query);
    requestQuery.set("pageSize", String(pageSize));
    setLoading(true);
    setError("");
    api<CatalogResponse>(`/catalog/products?${requestQuery.toString()}`, { signal: controller.signal })
      .then((d) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(d.total / d.pageSize));
        if (d.page > lastPage) {
          requestQuery.set("page", String(lastPage));
          window.history.replaceState(null, "", `/catalog?${requestQuery.toString()}`);
          return;
        }
        setData(d);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, pageSize, retry]);
  function change(key: string, value: string) {
    const next = new URLSearchParams(query);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    window.history.pushState(null, "", `/catalog?${next.toString()}`);
  }
  const category = params.get("category");
  const title =
    params.get("ownOnly") === "true"
      ? "Наше производство"
      : category
        ? (categoryNames[category] ?? "Оборудование")
        : "Каталог оборудования";
  return (
    <div className="page-container">
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Каталог</span>
        {category && (
          <>
            <span>/</span>
            <span>{title}</span>
          </>
        )}
      </div>
      <div className="catalog-heading">
        <div>
          <span className="eyebrow muted">
            ОТ РАБОЧЕГО МЕСТА ДО ЦЕНТРА ОБРАБОТКИ ДАННЫХ
          </span>
          <h1 className="page-title">
            {title}
            <span className="title-dot">.</span>
          </h1>
        </div>
        <p>
          Выбирайте оборудование.
          <br />
          Собирайте решение.
        </p>
      </div>
      <form
        className="catalog-search"
        onSubmit={(e) => {
          e.preventDefault();
          change("search", search.trim());
        }}
      >
        <Search size={21} />
        <input
          aria-label="Поиск по названию, артикулу или бренду"
          placeholder="Название, артикул или производитель"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={120}
        />
        <button className="button" type="submit">
          Найти
        </button>
      </form>
      <div className="catalog-layout">
        <aside className={`filters ${filtersOpen ? "visible" : ""}`}>
          <div className="filters-heading">
            <strong>Категории</strong>
            <button
              className="icon-button mobile-menu"
              onClick={() => setFiltersOpen(false)}
              aria-label="Закрыть фильтры"
            >
              <X />
            </button>
          </div>
          <button
            className={
              !category ? "category-filter selected" : "category-filter"
            }
            onClick={() => change("category", "")}
          >
            <span>Все оборудование</span>
            <span>{categories.reduce((s, c) => s + c.count, 0)}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              className={
                category === c.slug
                  ? "category-filter selected"
                  : "category-filter"
              }
              onClick={() => change("category", c.slug)}
            >
              <span>{c.name}</span>
              <span>{c.count}</span>
            </button>
          ))}
          <div className="filter-section">
            <strong>Производитель</strong>
            <select
              aria-label="Производитель"
              value={params.get("brand") ?? ""}
              onChange={(e) => change("brand", e.target.value)}
            >
              <option value="">Все производители</option>
              {data?.brands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="filter-section">
            <strong>Стоимость, ₽</strong>
            <div className="price-inputs">
              <input
                aria-label="Цена от"
                type="number"
                min="0"
                placeholder="От"
                value={params.get("minPrice") ?? ""}
                onChange={(e) => change("minPrice", e.target.value)}
              />
              <input
                aria-label="Цена до"
                type="number"
                min="0"
                placeholder="До"
                value={params.get("maxPrice") ?? ""}
                onChange={(e) => change("maxPrice", e.target.value)}
              />
            </div>
          </div>
          <div className="filter-section">
            {[
              ["registryOnly", "Проверенная запись реестра"],
              ["ownOnly", "Собственная продукция"],
              ["inStock", "Есть в наличии"],
            ].map(([key, label]) => (
              <label className="check-label" key={key}>
                <input
                  type="checkbox"
                  checked={params.get(key) === "true"}
                  onChange={(e) => change(key, e.target.checked ? "true" : "")}
                />
                {label}
              </label>
            ))}
          </div>
          <button
            className="reset-button"
            onClick={() => window.history.pushState(null, "", "/catalog")}
          >
            Сбросить фильтры
          </button>
          <div className="filter-help">
            <span className="eyebrow">ЕСТЬ ТЕХНИЧЕСКОЕ ЗАДАНИЕ?</span>
            <h3>Начните с задачи.</h3>
            <p>Поможем подобрать конфигурацию.</p>
            <Link href="/procurement">Обсудить закупку</Link>
          </div>
        </aside>
        <div className="catalog-results">
          <div className="results-toolbar">
            <span>
              {loading
                ? "Обновляем каталог…"
                : productCountLabel(data?.total ?? 0)}
            </span>
            <button
              className="mobile-filter button button-outline"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={16} />
              Фильтры
            </button>
            <label className="catalog-page-size">
              На странице
              <select
                aria-label="На странице"
                value={pageSize}
                onChange={(e) => change("pageSize", e.target.value)}
              >
                {![24, 48, 96].includes(pageSize) && <option value={pageSize}>{pageSize}</option>}
                {[24, 48, 96].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <select
              aria-label="Сортировка"
              value={params.get("sort") ?? "featured"}
              onChange={(e) => change("sort", e.target.value)}
            >
              <option value="featured">Выбор интегратора</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
              <option value="name">По названию</option>
            </select>
          </div>
          {error ? (
            <div className="error" role="alert">
              {error}
              <button onClick={() => setRetry((value) => value + 1)}>
                Обновить страницу
              </button>
            </div>
          ) : loading && !data ? (
            <div className="product-grid">
              {[1, 2, 3].map((i) => (
                <div className="skeleton" key={i} />
              ))}
            </div>
          ) : data?.items.length ? (
            <>
              <div className="product-grid" aria-busy={loading}>
                {data.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {data.total > data.pageSize && (
                <nav className="pagination" aria-label="Страницы каталога">
                  <button
                    aria-label="Предыдущая страница"
                    disabled={loading || data.page <= 1}
                    onClick={() => change("page", String(data.page - 1))}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  {paginationPages.map((page, index) => (
                    <Fragment key={page}>
                      {index > 0 && page - paginationPages[index - 1] > 1 && (
                        <span aria-hidden="true">…</span>
                      )}
                      <button
                        className={data.page === page ? "selected" : ""}
                        aria-label={`Страница ${page}`}
                        aria-current={data.page === page ? "page" : undefined}
                        disabled={loading}
                        onClick={() => change("page", String(page))}
                      >
                        {page}
                      </button>
                    </Fragment>
                  ))}
                  <button
                    aria-label="Следующая страница"
                    disabled={loading || data.page >= totalPages}
                    onClick={() => change("page", String(data.page + 1))}
                  >
                    <ArrowRight size={16} />
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="empty">
              <h2>Ничего не найдено</h2>
              <p>Попробуйте изменить запрос или убрать часть фильтров.</p>
              <button
                className="button button-outline"
                onClick={() => window.history.pushState(null, "", "/catalog")}
              >
                Сбросить фильтры
              </button>
            </div>
          )}
          <p className="catalog-note">
            Демонстрационные конфигурации. Цены и наличие подтверждаются в
            коммерческом предложении.
          </p>
        </div>
      </div>
    </div>
  );
}
