"use client";

import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { categoryNames } from "@/lib/types";

type BulkImportState =
  | "queued"
  | "preparing"
  | "ready"
  | "importing"
  | "completed"
  | "cancelled"
  | "failed"
  | "interrupted";

type BulkImportStatus = {
  id: string;
  supplierCode: string;
  state: BulkImportState;
  stage: string;
  processed: number;
  total: number;
  prepared: number;
  created: number;
  updated: number;
  skipped: number;
  categories: string[];
  warnings: string[];
  error: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
};

type Props = {
  credentialsConfigured: boolean;
  credentialsLoading: boolean;
  onImported: () => void;
};

const activeStates = new Set<BulkImportState>([
  "queued",
  "preparing",
  "importing",
]);
const stateLabels: Record<BulkImportState, string> = {
  queued: "В очереди",
  preparing: "Готовим каталог",
  ready: "Выборка готова",
  importing: "Загружаем товары",
  completed: "Загрузка завершена",
  cancelled: "Загрузка отменена",
  failed: "Не удалось завершить",
  interrupted: "Загрузка прервана",
};
const latestEndpoint = "/admin/imports/suppliers/it-partner/bulk/latest";
const number = (value: number) => new Intl.NumberFormat("ru-RU").format(value);
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function BulkImport({
  credentialsConfigured,
  credentialsLoading,
  onImported,
}: Props) {
  const [categories, setCategories] = useState(Object.keys(categoryNames));
  const [job, setJob] = useState<BulkImportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestLoaded, setLatestLoaded] = useState(false);
  const [reload, setReload] = useState(0);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pollError, setPollError] = useState("");
  const [now, setNow] = useState(Date.now());
  const mounted = useRef(false);
  const actionPending = useRef(false);
  const notifiedJobs = useRef(new Set<string>());
  const onImportedRef = useRef(onImported);
  const active = !!job && activeStates.has(job.state);
  const expiresAt = job?.expiresAt ? Date.parse(job.expiresAt) : null;
  const expired =
    job?.state === "ready" && expiresAt !== null && expiresAt <= now;
  const changedSelection =
    !!job &&
    (job.categories.length !== categories.length ||
      job.categories.some((category) => !categories.includes(category)));
  const hasSavedProducts = !!job && job.created + job.updated > 0;
  const partial =
    !!job &&
    ["failed", "interrupted", "cancelled"].includes(job.state) &&
    hasSavedProducts;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    onImportedRef.current = onImported;
  }, [onImported]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<BulkImportStatus | null | undefined>(latestEndpoint, {
      signal: controller.signal,
    })
      .then((latest) => {
        if (controller.signal.aborted) return;
        setJob(latest ?? null);
        if (latest) setCategories(latest.categories);
        setLatestLoaded(true);
        setNow(Date.now());
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    if (!job || !activeStates.has(job.state) || pendingAction) return;
    const jobId = job.id;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | null = null;

    async function poll() {
      if (stopped || document.hidden) return;
      controller = new AbortController();
      const signal = controller.signal;
      try {
        const next = await api<BulkImportStatus | null | undefined>(
          `/admin/imports/bulk/${jobId}`,
          {
            signal,
          },
        );
        if (stopped || signal.aborted) return;
        if (!next || next.id !== jobId)
          throw new Error("Сервер не вернул актуальное состояние задачи.");
        setJob(next ?? null);
        setPollError("");
        setNow(Date.now());
      } catch (e) {
        if (!stopped && !signal.aborted) setPollError(errorMessage(e));
      } finally {
        if (!stopped && !signal.aborted && !document.hidden)
          timer = setTimeout(poll, 2000);
      }
    }

    function visibilityChanged() {
      clearTimeout(timer);
      controller?.abort();
      if (!document.hidden) void poll();
    }

    if (!document.hidden) timer = setTimeout(poll, 2000);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [job?.id, job?.state, pendingAction]);

  useEffect(() => {
    if (job?.state !== "ready" || expiresAt === null) return;
    setNow(Date.now());
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, expiresAt - Date.now() + 50),
    );
    return () => clearTimeout(timer);
  }, [job?.state, expiresAt]);

  useEffect(() => {
    if (
      job &&
      (job.state === "completed" || partial) &&
      !notifiedJobs.current.has(job.id)
    ) {
      notifiedJobs.current.add(job.id);
      onImportedRef.current();
    }
  }, [job, partial]);

  async function run(action: "prepare" | "apply" | "cancel") {
    if (actionPending.current) return;
    actionPending.current = true;
    setPendingAction(action);
    setError("");
    setPollError("");
    try {
      const endpoint =
        action === "prepare"
          ? "/admin/imports/suppliers/it-partner/bulk"
          : `/admin/imports/bulk/${job!.id}/${action}`;
      const response = await api<BulkImportStatus | null | undefined>(
        endpoint,
        {
          method: "POST",
          ...(action === "prepare"
            ? { body: JSON.stringify({ categories }) }
            : {}),
        },
      );
      if (!mounted.current) return;
      const next =
        response ??
        (await api<BulkImportStatus | null | undefined>(latestEndpoint)) ??
        null;
      if (!mounted.current) return;
      if (!next)
        throw new Error(
          "Сервер не вернул состояние задачи. Проверьте последнюю загрузку перед повторным запуском.",
        );
      setJob(next ?? null);
      setLatestLoaded(true);
      setNow(Date.now());
    } catch (e) {
      if (!mounted.current) return;
      setError(errorMessage(e));
      try {
        const latest = await api<BulkImportStatus | null | undefined>(
          latestEndpoint,
        );
        if (mounted.current) {
          setJob(latest ?? null);
          setLatestLoaded(true);
          setNow(Date.now());
        }
      } catch {
        if (mounted.current) {
          setLatestLoaded(false);
          setPollError(
            "Статус задачи пока недоступен. Обновите страницу перед повторным запуском.",
          );
        }
      }
    } finally {
      actionPending.current = false;
      if (mounted.current) setPendingAction(null);
    }
  }

  return (
    <section className="bulk-import" aria-labelledby="bulk-import-title">
      <div className="bulk-import-heading">
        <div>
          <span className="eyebrow muted">МАССОВАЯ ЗАГРУЗКА</span>
          <h2 id="bulk-import-title">Загрузить ассортимент IT Partner</h2>
        </div>
        <span className={`badge ${credentialsConfigured ? "blue" : "gray"}`}>
          {credentialsLoading
            ? "Проверяем настройки"
            : credentialsConfigured
              ? "Доступ настроен"
              : "Нужен доступ"}
        </span>
      </div>
      <p className="bulk-import-intro">
        У поставщика широкий ассортимент. Подготовим товары выбранных
        ИТ-категорий с точным остатком на центральном складе и продажей
        поштучно. Новые карточки сохранятся в черновики с минимальной подходящей
        ценой поставщика без наценки; без такой цены — «По запросу». У ранее
        загруженных обновятся предложения, а ручная цена сохранится. Полный
        ассортимент поставщика, включая отсутствующие товары, в эту выборку не
        входит.
      </p>
      <fieldset
        className="bulk-import-categories"
        disabled={loading || active || pendingAction !== null}
      >
        <legend>Какие категории загрузить</legend>
        {Object.entries(categoryNames).map(([code, name]) => (
          <label key={code}>
            <input
              type="checkbox"
              checked={categories.includes(code)}
              onChange={(e) =>
                setCategories((selected) =>
                  e.target.checked
                    ? [...selected, code]
                    : selected.filter((category) => category !== code),
                )
              }
            />
            <span>{name}</span>
          </label>
        ))}
      </fieldset>
      {!credentialsLoading && !credentialsConfigured && (
        <p className="bulk-import-note">
          Для запуска нужен действующий доступ IT Partner на сервере. Состояние
          подключения и инструкция находятся в справочнике поставщиков ниже.
        </p>
      )}
      <div className="bulk-import-actions">
        {!active && (
          <button
            className={`button ${job?.state === "ready" && !expired ? "button-outline" : ""}`}
            disabled={
              !credentialsConfigured ||
              credentialsLoading ||
              loading ||
              !latestLoaded ||
              categories.length === 0 ||
              pendingAction !== null
            }
            onClick={() => run("prepare")}
          >
            {pendingAction === "prepare"
              ? "Запускаем подготовку…"
              : job
                ? "Подготовить каталог заново"
                : "Подготовить каталог"}
          </button>
        )}
        {active && (
          <button
            className="button button-outline"
            disabled={pendingAction !== null}
            onClick={() => run("cancel")}
          >
            {pendingAction === "cancel" ? "Отменяем…" : "Отменить загрузку"}
          </button>
        )}
        <p>
          Другие поставщики подключаются отдельно. Здесь загружается только IT
          Partner.
        </p>
      </div>
      {loading && (
        <p className="bulk-import-note" role="status">
          Проверяем последнюю задачу…
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!loading && !latestLoaded && (
        <button
          className="button button-outline"
          onClick={() => setReload((value) => value + 1)}
        >
          Повторить загрузку статуса
        </button>
      )}
      {pollError && (
        <p className="bulk-import-note" role="status">
          {pollError}
          {active &&
            " Задача может продолжать работу на сервере. Обновление статуса повторится автоматически."}
        </p>
      )}
      {job && (
        <div
          className={`bulk-import-job ${partial || job.state === "failed" || job.state === "interrupted" ? "bulk-import-job-error" : ""}`}
        >
          <div className="bulk-import-job-heading">
            <h3>{expired ? "Выборка устарела" : stateLabels[job.state]}</h3>
            <span>Обновлено {dateTime(job.updatedAt)}</span>
          </div>
          <div role="status" aria-live="polite" aria-atomic="true">
            <p className="bulk-import-stage">{job.stage}</p>
            {active && (
              <div className="bulk-import-progress">
                <progress
                  aria-label="Прогресс загрузки"
                  max={job.total > 0 ? job.total : 1}
                  {...(job.total > 0
                    ? { value: Math.min(job.processed, job.total) }
                    : {})}
                />
                <span>
                  {job.total > 0
                    ? `${number(job.processed)} из ${number(job.total)}`
                    : `Обработано: ${number(job.processed)}`}
                </span>
              </div>
            )}
          </div>
          <dl className="bulk-import-metrics">
            <div>
              <dt>Подготовлено</dt>
              <dd>{number(job.prepared)}</dd>
            </div>
            <div>
              <dt>Создано</dt>
              <dd>{number(job.created)}</dd>
            </div>
            <div>
              <dt>Обновлено</dt>
              <dd>{number(job.updated)}</dd>
            </div>
            <div>
              <dt>Пропущено</dt>
              <dd>{number(job.skipped)}</dd>
            </div>
          </dl>
          <p className="bulk-import-snapshot-categories">
            Категории выборки:{" "}
            {job.categories
              .map((category) => categoryNames[category] ?? category)
              .join(", ")}
            .
          </p>
          {job.error && (
            <p className="error" role="alert">
              {job.error}
            </p>
          )}
          {partial && (
            <p className="bulk-import-partial" role="status">
              Загрузка выполнена частично. Уже сохранено: {number(job.created)}{" "}
              новых товаров и {number(job.updated)} обновлений. Эти изменения
              остаются в каталоге.
            </p>
          )}
          {job.state === "cancelled" && !hasSavedProducts && (
            <p className="bulk-import-note">
              Товары в этом запуске не сохранялись.
            </p>
          )}
          {job.state === "completed" && (
            <p className="bulk-import-note">
              Новые карточки доступны в разделе «Товары». Проверьте описания и
              предложения поставщиков, выберите автоматический или ручной режим
              цены и опубликуйте нужные позиции.
            </p>
          )}
          {job.state === "ready" && (
            <div className="bulk-import-confirmation">
              <p>
                {expired
                  ? "Срок действия выборки истёк. Подготовьте каталог заново перед загрузкой."
                  : job.prepared === 0
                    ? "Подходящих товаров нет. Изучите предупреждения или измените категории."
                    : changedSelection
                      ? "Категории изменены. Подготовьте каталог заново, чтобы применить новый выбор."
                      : `Выборка готова к загрузке${job.expiresAt ? ` до ${dateTime(job.expiresAt)}` : ""}. После подтверждения начнётся сохранение товаров.`}
              </p>
              <button
                className="button"
                disabled={
                  !credentialsConfigured ||
                  expired ||
                  changedSelection ||
                  job.prepared === 0 ||
                  pendingAction !== null
                }
                onClick={() => run("apply")}
              >
                {pendingAction === "apply"
                  ? "Начинаем загрузку…"
                  : `Загрузить ${number(job.prepared)} товаров в черновики`}
              </button>
            </div>
          )}
          {job.warnings.length > 0 && (
            <details className="bulk-import-warnings">
              <summary>Предупреждения ({number(job.warnings.length)})</summary>
              <ul>
                {job.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </details>
          )}
          <p className="bulk-import-history-note">
            Последняя задача сохранена на сервере и останется доступна после
            обновления страницы.
          </p>
        </div>
      )}
    </section>
  );
}
