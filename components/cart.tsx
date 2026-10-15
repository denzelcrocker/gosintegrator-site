"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, CheckCircle2, FileDown } from "lucide-react";
import { useStore } from "./store-provider";
import { api, errorMessage } from "@/lib/api";
import { money, productPrice, type Product } from "@/lib/types";
export function Cart() {
  const { cart, setQuantity, clear } = useStore();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{
    number: string;
    total: number;
    hasUnpricedItems: boolean;
  } | null>(null);
  const [requestKey, setRequestKey] = useState("");
  const [fresh, setFresh] = useState<Record<string, Product>>({});
  const [refreshError, setRefreshError] = useState("");
  const ids = cart.map((i) => i.product.id).join(",");
  useEffect(() => {
    setRequestKey(crypto.randomUUID());
  }, []);
  useEffect(() => {
    let active = true;
    if (!ids) return;
    setRefreshError("");
    Promise.all(
      ids.split(",").map((id) => api<Product>(`/catalog/products/${id}`)),
    )
      .then((items) => {
        if (active) setFresh(Object.fromEntries(items.map((p) => [p.id, p])));
      })
      .catch(() => {
        if (active)
          setRefreshError(
            "Не удалось обновить все товары. Проверьте каталог перед отправкой.",
          );
      });
    return () => {
      active = false;
    };
  }, [ids]);
  const total = cart.reduce(
    (s, i) => s + ((fresh[i.product.id] ?? i.product).price ?? 0) * i.quantity,
    0,
  );
  const unpriced = cart.some(
    (i) => (fresh[i.product.id] ?? i.product).price === null,
  );
  const hasMinimumPrices = cart.some((item) => {
    const product = fresh[item.product.id] ?? item.product;
    return product.useSupplierPrice && product.price !== null;
  });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const result = await api<{
        number: string;
        total: number;
        hasUnpricedItems: boolean;
      }>("/quotes", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: requestKey,
          company: form.get("company"),
          inn: form.get("inn"),
          contactName: form.get("contactName"),
          email: form.get("email"),
          phone: form.get("phone"),
          comment: form.get("comment"),
          consent: form.get("consent") === "on",
          lines: cart.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      setReceipt(result);
      clear();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function exportCsv() {
    const quote = (v: string) => '"' + v.replaceAll('"', '""') + '"';
    const rows = [
      [
        "Артикул",
        "Наименование",
        "Количество",
        "Ориентировочная цена, руб.",
        "Условия цены",
      ],
      ...cart.map((i) => [
        i.product.sku,
        i.product.name,
        String(i.quantity),
        String((fresh[i.product.id] ?? i.product).price ?? "По запросу"),
        (fresh[i.product.id] ?? i.product).useSupplierPrice
          ? "Минимальная цена; стоимость партии зависит от количества"
          : "Цена на момент выгрузки",
      ]),
    ];
    const text =
      "\ufeff" +
      rows
        .map((row) =>
          row.map((x) => quote(/^[=+@-]/.test(x) ? "'" + x : x)).join(";"),
        )
        .join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    a.download = "specification.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  if (receipt)
    return (
      <div className="page-container">
        <div className="receipt">
          <CheckCircle2 size={50} strokeWidth={1.2} />
          <span className="eyebrow">ЗАЯВКА СОХРАНЕНА</span>
          <h1>
            Спасибо.
            <br />
            Задача принята.
          </h1>
          <p>
            Номер вашей заявки <strong>{receipt.number}</strong>.<br />
            Менеджер увидит оборудование, реквизиты и комментарий в кабинете.
          </p>
          <div className="receipt-total">
            {receipt.hasUnpricedItems
              ? "Известная часть стоимости"
              : "Предварительная стоимость"}
            <strong>{money(receipt.total)}</strong>
          </div>
          <Link href="/catalog" className="button">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  if (!cart.length)
    return (
      <div className="page-container">
        <div className="breadcrumb">
          <Link href="/">Главная</Link>
          <span>/</span>
          <span>Заявка</span>
        </div>
        <div className="empty">
          <h1 className="page-title">Начните с оборудования.</h1>
          <p>
            Добавьте товары из каталога, чтобы запросить коммерческое
            предложение.
          </p>
          <Link href="/catalog" className="button">
            Открыть каталог
          </Link>
        </div>
      </div>
    );
  return (
    <div className="page-container">
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Заявка</span>
      </div>
      <div className="section-title">
        <h1 className="page-title">
          Ваша комплектация<span className="title-dot">.</span>
        </h1>
        <button className="button button-outline" onClick={exportCsv}>
          <FileDown size={17} />
          Спецификация CSV
        </button>
      </div>
      <p className="page-intro">
        Соберите оборудование и запросите коммерческое предложение для вашей
        организации.
      </p>
      {refreshError && <p className="error">{refreshError}</p>}
      <div className="cart-layout">
        <div>
          <div className="cart-items">
            {cart.map(({ product, quantity }) => {
              const p = fresh[product.id] ?? product;
              return (
                <article className="cart-item" key={p.id}>
                  <Link href={`/catalog/${p.slug}`}>
                    <img src={p.imageUrl} alt={p.name} />
                  </Link>
                  <div className="cart-item-info">
                    <span>{p.sku}</span>
                    <Link href={`/catalog/${p.slug}`}>{p.name}</Link>
                    <small>{productPrice(p)} / шт.</small>
                  </div>
                  <div className="quantity">
                    <button
                      onClick={() => setQuantity(p.id, quantity - 1)}
                      aria-label={`Уменьшить количество ${p.name}`}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      aria-label={`Количество ${p.name}`}
                      type="number"
                      min="1"
                      max="999"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          p.id,
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                    />
                    <button
                      onClick={() => setQuantity(p.id, quantity + 1)}
                      aria-label={`Увеличить количество ${p.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <strong>
                    {p.useSupplierPrice && p.price !== null ? "от " : ""}
                    {money(p.price === null ? null : p.price * quantity)}
                  </strong>
                  <button
                    className="icon-button"
                    aria-label={`Удалить ${p.name}`}
                    onClick={() => setQuantity(p.id, 0)}
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              );
            })}
          </div>
          <section className="checkout">
            <h2>Кому подготовить предложение</h2>
            <p>Контакты и реквизиты нужны для обработки вашей заявки.</p>
            <form id="quote-form" onSubmit={submit}>
              <div className="form-grid">
                <label>
                  Организация
                  <input
                    required
                    name="company"
                    autoComplete="organization"
                    placeholder="ООО «Компания»"
                    maxLength={200}
                  />
                </label>
                <label>
                  ИНН
                  <input
                    required
                    name="inn"
                    inputMode="numeric"
                    pattern="[0-9]{10}|[0-9]{12}"
                    placeholder="10 или 12 цифр"
                    maxLength={12}
                  />
                </label>
                <label>
                  Контактное лицо
                  <input
                    required
                    name="contactName"
                    autoComplete="name"
                    placeholder="Имя и фамилия"
                    maxLength={120}
                  />
                </label>
                <label>
                  Телефон
                  <input
                    required
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="+7"
                    minLength={6}
                    maxLength={30}
                  />
                </label>
                <label className="full">
                  Электронная почта
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="name@company.ru"
                    maxLength={200}
                  />
                </label>
                <label className="full">
                  Требования к закупке
                  <textarea
                    name="comment"
                    rows={4}
                    placeholder="Номер закупки, сроки поставки, требования к реестру или конфигурации"
                    maxLength={5000}
                  />
                </label>
              </div>
              <label className="check-label consent">
                <input name="consent" type="checkbox" required />
                <span>
                  Согласен на обработку данных для подготовки предложения
                  согласно{" "}
                  <Link href="/privacy" target="_blank">
                    условиям обработки данных
                  </Link>
                  .
                </span>
              </label>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </form>
          </section>
        </div>
        <aside className="cart-summary">
          <span className="eyebrow">ВАША ЗАЯВКА</span>
          <h2>Всё для следующего шага.</h2>
          <div>
            <span>Позиций</span>
            <strong>{cart.length}</strong>
          </div>
          <div>
            <span>Единиц оборудования</span>
            <strong>{cart.reduce((s, i) => s + i.quantity, 0)}</strong>
          </div>
          <div className="summary-total">
            <span>
              {unpriced
                ? "Известная часть стоимости"
                : "Ориентировочная стоимость"}
            </span>
            <strong>
              {hasMinimumPrices ? "от " : ""}
              {money(total)}
            </strong>
          </div>
          {unpriced && <p>В заявке есть позиции с ценой по запросу.</p>}
          {hasMinimumPrices && (
            <p>
              Для большей партии цена за штуку может измениться. Стоимость по
              выбранному количеству рассчитаем при отправке заявки.
            </p>
          )}
          <button
            className="button"
            type="submit"
            form="quote-form"
            disabled={busy || !!refreshError}
          >
            {busy ? "Сохраняем заявку…" : "Получить предложение"}
          </button>
          <p>
            Отправка заявки не является оплатой. Цены, условия и сроки менеджер
            уточнит при подготовке КП.
          </p>
        </aside>
      </div>
    </div>
  );
}
