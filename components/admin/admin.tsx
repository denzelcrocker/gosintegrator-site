"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutGrid,
  Package,
  ClipboardList,
  RefreshCw,
  LogOut,
  Plus,
  Search,
  Pencil,
  EyeOff,
  BriefcaseBusiness,
} from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import {
  type CatalogResponse,
  type Product,
  type Quote,
  money,
} from "@/lib/types";
import { ProductEditor } from "./product-editor";
import { Imports } from "./imports";
import { BulkPublish } from "./bulk-publish";
import { TenderInquiries } from "./tender-inquiries";
import { useStore } from "../store-provider";
const statuses: Record<string, string> = {
  new: "Новая",
  processing: "В работе",
  offered: "КП подготовлено",
  completed: "Завершена",
  cancelled: "Отменена",
};
export function Admin() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const handleUnauthorized = useCallback(() => setUser(null), []);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("overview");
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [overviewError, setOverviewError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const { notice } = useStore();
  const visibleError =
    error || (tab === "products" ? catalogError : overviewError);
  function load() {
    setRevision((value) => value + 1);
  }
  useEffect(() => {
    api<{ email: string }>("/auth/me")
      .then(setUser)
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401))
          setError(errorMessage(e));
      })
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    setOverviewError("");
    Promise.all([
      api<CatalogResponse>("/admin/products?pageSize=1&page=1", options),
      api<Quote[]>("/admin/quotes", options),
    ])
      .then(([products, orders]) => {
        if (controller.signal.aborted) return;
        setCatalogTotal(products.total);
        setQuotes(orders);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) setUser(null);
        else setOverviewError(errorMessage(e));
      });
    return () => controller.abort();
  }, [user, revision]);
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!user || tab !== "products") return;
    setCatalogLoading(true);
    if (search.trim() !== appliedSearch) return;
    const controller = new AbortController();
    setCatalogError("");
    api<CatalogResponse>(
      `/admin/products?pageSize=20&page=${page}&search=${encodeURIComponent(appliedSearch)}`,
      { signal: controller.signal },
    )
      .then((products) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(
          1,
          Math.ceil(products.total / products.pageSize),
        );
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setCatalog(products);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) setUser(null);
        else setCatalogError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [user, tab, page, search, appliedSearch, revision]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      setUser(
        await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
          }),
        }),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setCatalog(null);
      setCatalogTotal(null);
      setQuotes([]);
      setEditor(null);
      setError("");
      setCatalogError("");
      setOverviewError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function archive() {
    if (!archiveTarget) return;
    setBusy(true);
    try {
      await api(
        `/admin/products/${archiveTarget.id}?version=${archiveTarget.version}`,
        { method: "DELETE" },
      );
      setArchiveTarget(null);
      notice("Товар снят с публикации");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function updateStatus(id: string, status: string) {
    setBusy(true);
    try {
      await api(`/admin/quotes/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
      notice("Статус заявки обновлён");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (checking) return <div className="loading">Проверяем доступ…</div>;
  if (!user)
    return (
      <div className="admin-login">
        <div className="login-editorial">
          <span className="eyebrow">АЙТИ ИНТЕГРАТОР / УПРАВЛЕНИЕ</span>
          <h1>
            Всё под
            <br />
            вашим
            <br />
            <span>контролем.</span>
          </h1>
          <p>
            Товары, заявки и поставщики
            <br />в одном рабочем пространстве.
          </p>
        </div>
        <form onSubmit={login} className="login-form">
          <span className="eyebrow muted">КАБИНЕТ КОМАНДЫ</span>
          <h2>Войти в управление</h2>
          <p>Используйте учётную запись администратора.</p>
          <label>
            Электронная почта
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              placeholder="name@company.ru"
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Проверяем…" : "Войти"}
          </button>
          <Link href="/">Вернуться в магазин</Link>
        </form>
      </div>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <span className="eyebrow">УПРАВЛЕНИЕ МАГАЗИНОМ</span>
        <h2>
          Рабочее
          <br />
          пространство.
        </h2>
        <nav>
          {[
            { id: "overview", label: "Обзор", Icon: LayoutGrid },
            { id: "products", label: "Товары", Icon: Package },
            { id: "quotes", label: "Заявки", Icon: ClipboardList },
            {
              id: "tenders",
              label: "Тендерное сопровождение",
              Icon: BriefcaseBusiness,
            },
            { id: "imports", label: "Поставщики и реестр", Icon: RefreshCw },
          ].map(({ id, label, Icon }) => (
            <button
              className={tab === id ? "selected" : ""}
              key={id}
              onClick={() => {
                setTab(id);
                setEditor(null);
                setArchiveTarget(null);
                setError("");
              }}
            >
              <Icon size={18} />
              {label}
              {id === "quotes" &&
                quotes.filter((q) => q.status === "new").length > 0 && (
                  <b>{quotes.filter((q) => q.status === "new").length}</b>
                )}
            </button>
          ))}
        </nav>
        <div className="admin-account">
          <span>{user.email}</span>
          <button onClick={logout}>
            <LogOut size={15} />
            Выйти
          </button>
        </div>
      </aside>
      <div className="admin-content">
        {visibleError && (
          <div className="error" role="alert">
            {visibleError}
          </div>
        )}
        {editor ? (
          <ProductEditor
            product={editor === "new" ? null : editor}
            onCancel={() => setEditor(null)}
            onSaved={async () => {
              setEditor(null);
              await load();
              notice("Товар сохранён");
            }}
          />
        ) : (
          <>
            {tab === "overview" && (
              <>
                <div className="admin-heading">
                  <div>
                    <span className="eyebrow muted">СЕГОДНЯ В МАГАЗИНЕ</span>
                    <h1>Всё начинается здесь.</h1>
                  </div>
                  <button
                    className="button"
                    onClick={() => {
                      setTab("products");
                      setEditor("new");
                    }}
                  >
                    <Plus size={18} />
                    Добавить товар
                  </button>
                </div>
                <div className="metrics">
                  <article>
                    <span>Товаров в каталоге</span>
                    <strong>
                      {catalogTotal?.toLocaleString("ru-RU") ?? "—"}
                    </strong>
                    <small>Включая черновики</small>
                  </article>
                  <article>
                    <span>Заявок</span>
                    <strong>{quotes.length}</strong>
                    <small>Последние 500 заявок</small>
                  </article>
                  <article>
                    <span>Требуют внимания</span>
                    <strong className="blue-text">
                      {quotes.filter((q) => q.status === "new").length}
                    </strong>
                    <small>Новые запросы КП</small>
                  </article>
                </div>
                <div className="admin-guide">
                  <div>
                    <h2>Добавьте свою продукцию.</h2>
                    <p>
                      Заполните характеристики, стоимость и изображение.
                      Сохраните черновик или сразу опубликуйте карточку.
                    </p>
                    <button
                      className="button button-outline"
                      onClick={() => {
                        setTab("products");
                        setEditor("new");
                      }}
                    >
                      Создать карточку
                    </button>
                  </div>
                  <Package size={90} strokeWidth={0.7} />
                </div>
                <h2 className="admin-subheading">Последние заявки</h2>
                {quotes.length ? (
                  <div className="recent-quotes">
                    {quotes.slice(0, 5).map((q) => (
                      <button key={q.id} onClick={() => setTab("quotes")}>
                        <span>
                          {q.number}
                          <small>{q.company}</small>
                        </span>
                        <span className="badge blue">{statuses[q.status]}</span>
                        <strong>{money(q.total)}</strong>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted admin-empty">
                    Здесь появятся заявки, отправленные из магазина.
                  </p>
                )}
              </>
            )}
            {tab === "products" && (
              <>
                <div className="admin-heading">
                  <div>
                    <span className="eyebrow muted">КАТАЛОГ</span>
                    <h1>Ваше оборудование.</h1>
                  </div>
                  <button className="button" onClick={() => setEditor("new")}>
                    <Plus size={18} />
                    Добавить товар
                  </button>
                </div>
                <BulkPublish revision={revision} onPublished={load} />
                <label className="admin-search">
                  <Search size={18} />
                  <input
                    aria-label="Найти товар в админке"
                    placeholder="Найти по названию или артикулу"
                    maxLength={120}
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                  />
                </label>
                <p className="editor-note" role="status">
                  {catalogLoading
                    ? "Загружаем товары…"
                    : catalog
                      ? `Найдено: ${catalog.total.toLocaleString("ru-RU")}. На странице — до ${catalog.pageSize} товаров.`
                      : ""}
                </p>
                {archiveTarget && (
                  <div className="archive-confirm" role="alert">
                    <p>
                      Снять «{archiveTarget.name}» с публикации? Товар останется
                      в базе и старых заявках.
                    </p>
                    <button
                      className="button"
                      onClick={archive}
                      disabled={busy}
                    >
                      Снять с публикации
                    </button>
                    <button
                      className="button button-outline"
                      onClick={() => setArchiveTarget(null)}
                    >
                      Отмена
                    </button>
                  </div>
                )}
                <div className="table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Товар</th>
                        <th>Стоимость</th>
                        <th>Остаток</th>
                        <th>Статус</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!catalogLoading &&
                        catalog?.items.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="admin-product">
                                <img src={p.imageUrl} alt="" loading="lazy" />
                                <span>
                                  <strong>{p.name}</strong>
                                  <small>
                                    {p.sku} · {p.brand}
                                  </small>
                                  {!!p.supplierOffersCount && (
                                    <small>
                                      Предложений поставщиков:{" "}
                                      {p.supplierOffersCount}
                                    </small>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td>
                              {money(p.price)}
                              {p.useSupplierPrice && (
                                <small>Минимальная цена</small>
                              )}
                            </td>
                            <td>{p.stock} шт.</td>
                            <td>
                              <span
                                className={`badge ${p.isPublished ? "green" : "gray"}`}
                              >
                                {p.isPublished ? "Опубликован" : "Черновик"}
                              </span>
                              {p.isOwn && (
                                <small className="own-label">
                                  Своя продукция
                                </small>
                              )}
                            </td>
                            <td>
                              <button
                                className="icon-button"
                                title="Редактировать"
                                aria-label={`Редактировать ${p.name}`}
                                onClick={() => setEditor(p)}
                              >
                                <Pencil size={17} />
                              </button>
                              {p.isPublished && (
                                <button
                                  className="icon-button"
                                  title="Снять с публикации"
                                  aria-label={`Снять с публикации ${p.name}`}
                                  onClick={() => setArchiveTarget(p)}
                                >
                                  <EyeOff size={17} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!catalogLoading && catalog?.items.length === 0 && (
                  <p className="admin-empty muted">Товары не найдены.</p>
                )}
                {catalog && catalog.total > catalog.pageSize && (
                  <div className="pagination">
                    <button
                      aria-label="Предыдущая страница товаров"
                      disabled={page === 1 || catalogLoading}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      ‹
                    </button>
                    <span>
                      {page} / {Math.ceil(catalog.total / catalog.pageSize)}
                    </span>
                    <button
                      aria-label="Следующая страница товаров"
                      disabled={
                        page * catalog.pageSize >= catalog.total ||
                        catalogLoading
                      }
                      onClick={() => setPage((value) => value + 1)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
            {tab === "quotes" && (
              <>
                <div className="admin-heading">
                  <div>
                    <span className="eyebrow muted">
                      ЗАПРОСЫ КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ
                    </span>
                    <h1>От заявки к решению.</h1>
                  </div>
                  <button className="button button-outline" onClick={load}>
                    <RefreshCw size={16} />
                    Обновить
                  </button>
                </div>
                {quotes.length ? (
                  quotes.map((q) => (
                    <details className="quote-row" key={q.id}>
                      <summary>
                        <span>
                          <strong>{q.number}</strong>
                          <small>
                            {q.company} ·{" "}
                            {new Date(q.createdAt).toLocaleString("ru-RU")}
                          </small>
                        </span>
                        <span className="badge blue">{statuses[q.status]}</span>
                        <strong>{money(q.total)}</strong>
                      </summary>
                      <div className="quote-detail">
                        <div className="quote-contact">
                          <p>
                            <span>Организация / ИНН</span>
                            {q.company} / {q.inn}
                          </p>
                          <p>
                            <span>Контактное лицо</span>
                            {q.contactName}
                          </p>
                          <p>
                            <span>Электронная почта</span>
                            <a href={`mailto:${q.email}`}>{q.email}</a>
                          </p>
                          <p>
                            <span>Телефон</span>
                            <a href={`tel:${q.phone}`}>{q.phone}</a>
                          </p>
                        </div>
                        {q.comment && (
                          <div className="quote-comment">
                            <span>Комментарий</span>
                            <p>{q.comment}</p>
                          </div>
                        )}
                        <div className="table-scroll">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Оборудование</th>
                                <th>Кол-во</th>
                                <th>Цена на момент заявки</th>
                              </tr>
                            </thead>
                            <tbody>
                              {q.lines.map((l) => (
                                <tr key={l.productId}>
                                  <td>
                                    {l.name}
                                    <small>{l.sku}</small>
                                  </td>
                                  <td>{l.quantity}</td>
                                  <td>{money(l.unitPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {q.hasUnpricedItems && (
                          <p className="muted">
                            Есть позиции с ценой по запросу.
                          </p>
                        )}
                        <label className="status-select">
                          Статус заявки
                          <select
                            aria-label="Статус заявки"
                            value={q.status}
                            disabled={busy}
                            onChange={(e) => updateStatus(q.id, e.target.value)}
                          >
                            {Object.entries(statuses).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </details>
                  ))
                ) : (
                  <div className="empty">
                    <h2>Новых заявок пока нет</h2>
                    <p>
                      Отправьте тестовую заявку из корзины, чтобы проверить весь
                      процесс.
                    </p>
                    <Link href="/catalog" className="button">
                      Перейти в магазин
                    </Link>
                  </div>
                )}
              </>
            )}
            {tab === "tenders" && (
              <TenderInquiries onUnauthorized={handleUnauthorized} />
            )}
            {tab === "imports" && <Imports onImported={load} />}
          </>
        )}
      </div>
    </div>
  );
}
