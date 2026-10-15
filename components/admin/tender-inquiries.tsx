"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { tariffName } from "@/lib/tender-tariffs";
import { useStore } from "../store-provider";

interface TenderInquiry {
  id: string;
  number: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  tariff: string;
  tenderUrl: string | null;
  comment: string | null;
  status: string;
  createdAt: string;
}

const statuses: Record<string, string> = {
  new: "Новая",
  processing: "В работе",
  offered: "Предложение отправлено",
  completed: "Завершена",
  cancelled: "Отменена",
};

export function TenderInquiries({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [items, setItems] = useState<TenderInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const { notice } = useStore();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<TenderInquiry[]>("/admin/tender-inquiries", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) setItems(response);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) onUnauthorized();
        else setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision, onUnauthorized]);

  async function updateStatus(id: string, status: string) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    try {
      await api(`/admin/tender-inquiries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item)),
      );
      notice("Статус тендерной заявки обновлён");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
      else setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow muted">ТЕНДЕРНОЕ СОПРОВОЖДЕНИЕ</span>
          <h1>Задачи ваших клиентов.</h1>
        </div>
        <button
          className="button button-outline"
          disabled={loading || !!busyId}
          onClick={() => setRevision((value) => value + 1)}
        >
          <RefreshCw size={16} />
          Обновить
        </button>
      </div>
      <p className="editor-note">
        Заявки на сопровождение тендеров. Последние 500 обращений, новые сверху.
      </p>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <p className="loading" role="status">
          Загружаем обращения…
        </p>
      ) : items.length ? (
        items.map((item) => (
          <details className="quote-row tender-admin-row" key={item.id}>
            <summary>
              <span>
                <strong>
                  {item.number} · {item.company}
                </strong>
                <small>
                  {tariffName(item.tariff)} ·{" "}
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </small>
              </span>
              <span className="badge blue">
                {statuses[item.status] ?? item.status}
              </span>
            </summary>
            <div className="quote-detail">
              <div className="quote-contact">
                <p>
                  <span>Контактное лицо</span>
                  {item.contactName}
                </p>
                <p>
                  <span>Тариф</span>
                  {tariffName(item.tariff)}
                </p>
                <p>
                  <span>Электронная почта</span>
                  <a href={`mailto:${item.email}`}>{item.email}</a>
                </p>
                <p>
                  <span>Телефон</span>
                  <a href={`tel:${item.phone}`}>{item.phone}</a>
                </p>
              </div>
              {item.tenderUrl && /^https?:\/\//i.test(item.tenderUrl) && (
                <p className="tender-admin-link">
                  <a
                    href={item.tenderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Открыть закупку <ArrowUpRight size={16} />
                  </a>
                  <small>{item.tenderUrl}</small>
                </p>
              )}
              {item.comment && (
                <div className="quote-comment">
                  <span>Задача клиента</span>
                  <p>{item.comment}</p>
                </div>
              )}
              <label className="status-select">
                Статус обращения
                <select
                  value={item.status}
                  disabled={!!busyId}
                  onChange={(event) =>
                    updateStatus(item.id, event.target.value)
                  }
                >
                  {Object.entries(statuses).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        ))
      ) : (
        !error && (
          <div className="empty">
            <h2>Обращений пока нет</h2>
            <p>Здесь появятся заявки из раздела тендерного сопровождения.</p>
            <a href="/tender-support" className="button">
              Открыть страницу услуги
            </a>
          </div>
        )
      )}
    </>
  );
}
