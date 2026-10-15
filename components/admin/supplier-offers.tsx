"use client";

import { type SupplierOffersResponse } from "@/lib/types";

const supplierNames: Record<string, string> = {
  "it-partner": "IT Partner",
  "absolut-trade": "Absolut Trade / ELKO",
};

export function SupplierOffers({
  response,
  loading,
  error,
  onRefresh,
}: {
  response: SupplierOffersResponse | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  return (
    <section className="supplier-offers-panel">
      <div className="editor-section-heading">
        <h2>
          Предложения поставщиков
          {response ? ` · ${response.offers.length}` : ""}
        </h2>
        <button
          type="button"
          className="button button-outline"
          disabled={loading}
          onClick={onRefresh}
        >
          {loading ? "Обновляем…" : "Обновить"}
        </button>
      </div>
      <p className="editor-note">
        Минимум рассчитывается по положительным ценам в RUB при наличии товара и
        проверке за последние 24 часа. Цена передаётся без наценки; база НДС не
        пересчитывается. Остатки разных предложений не суммируются.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p className="editor-note" role="status">
          Загружаем предложения…
        </p>
      )}
      {!loading && !error && response?.offers.length === 0 && (
        <p className="editor-note">
          Предложения ещё не загружены. После импорта они появятся здесь.
        </p>
      )}
      {!loading && !error && !!response?.offers.length && (
        <>
          <div className="table-scroll supplier-offers-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Поставщик / MPN</th>
                  <th>Цена поставщика</th>
                  <th>Остаток</th>
                  <th>Проверено</th>
                  <th>Расчёт цены</th>
                </tr>
              </thead>
              <tbody>
                {response.offers.map((offer) => (
                  <tr key={`${offer.supplierCode}:${offer.externalId}`}>
                    <td>
                      <strong>
                        {supplierNames[offer.supplierCode] ??
                          offer.supplierCode}
                      </strong>
                      <small>
                        {offer.manufacturerPartNumber || "MPN не указан"}
                      </small>
                      <small>Код: {offer.externalId}</small>
                    </td>
                    <td>
                      {offer.price === null
                        ? "Не указана"
                        : offer.price.toLocaleString("ru-RU", {
                            maximumFractionDigits: 6,
                          })}
                      <small>{offer.currency || "Валюта не указана"}</small>
                    </td>
                    <td>
                      {offer.stock === null
                        ? "Неизвестно"
                        : `${offer.stock.toLocaleString("ru-RU")} шт.`}
                    </td>
                    <td>
                      {offer.observedAt
                        ? new Date(offer.observedAt).toLocaleString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Нет проверки"}
                    </td>
                    <td>
                      <span
                        className={`badge ${offer.isSelected ? "blue" : offer.isEligible ? "green" : "gray"}`}
                      >
                        {offer.isSelected
                          ? "Выбрано"
                          : offer.isEligible
                            ? "Подходит"
                            : "Не участвует"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="editor-note">
            «Выбрано» — предложение, которое сейчас определяет цену и остаток
            сохранённой карточки. Кнопка «Обновить» перечитывает сохранённые
            предложения; новые данные поставщика поступают при импорте.
          </p>
        </>
      )}
    </section>
  );
}
