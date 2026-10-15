"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Clock3, RefreshCw, Save } from "lucide-react";
import { api, errorMessage } from "@/lib/api";

type Schedule = {
  code: string;
  name: string;
  ready: boolean;
  blockedReason: string | null;
  enabled: boolean;
  intervalMinutes: number;
  minimumIntervalMinutes: number;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastStatus: string;
  lastError: string | null;
  consecutiveFailures: number;
  activeRunId: string | null;
};

type SyncRun = {
  id: string;
  supplierCode: string;
  trigger: string;
  state: string;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  created: number | null;
  updated: number | null;
  processed: number | null;
  summary: string | null;
  error: string | null;
};

type Preferences = { enabled: boolean; intervalMinutes: number };
const states: Record<string, string> = {
  idle: "Ещё не запускался",
  queued: "В очереди",
  running: "Обновляется",
  completed: "Завершено",
  failed: "Ошибка",
  interrupted: "Прервано",
  cancelled: "Отменено",
  blocked: "Нужна настройка",
  active: "Запуск активен",
};

function dateLabel(value: string | null, empty = "—") {
  if (!value) return empty;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return empty;
  return date.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function intervalLabel(minutes: number) {
  return minutes % 60 === 0 ? `${minutes / 60} ч` : `${minutes} мин`;
}

function Status({ state }: { state: string }) {
  const tone = ["failed", "interrupted", "blocked"].includes(state)
    ? "attention" : state === "completed" ? "success"
      : ["running", "queued", "active"].includes(state) ? "active" : "neutral";
  return <span className={`sync-status sync-status-${tone}`}><i aria-hidden="true" />{states[state] ?? "Статус уточняется"}</span>;
}

export function SupplierSync({ onImported }: { onImported: () => void }) {
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Preferences>>({});
  const [pending, setPending] = useState<{ code: string; action: "save" | "run" } | null>(null);
  const [feedback, setFeedback] = useState<{ code: string; text: string; error: boolean } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const mutationRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const completedRef = useRef<Set<string> | null>(null);
  const importedRef = useRef(onImported);

  useEffect(() => { importedRef.current = onImported; }, [onImported]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | null = null;

    async function refresh() {
      if (stopped) return;
      if (mutationRef.current) {
        timer = setTimeout(() => void refresh(), 10_000);
        return;
      }
      controller = new AbortController();
      requestRef.current = controller;
      const signal = controller.signal;
      try {
        const nextSchedules = await api<Schedule[]>("/admin/supplier-sync", { signal });
        const nextRuns = await api<SyncRun[]>("/admin/supplier-sync/runs?limit=20", { signal });
        if (stopped || signal.aborted) return;
        setSchedules(nextSchedules);
        setRuns(nextRuns);
        setLoadError("");
        setUpdatedAt(new Date().toISOString());
        const completed = nextRuns.filter((run) => run.state === "completed").map((run) => run.id);
        const hasNewCompletion = completedRef.current !== null && completed.some((id) => !completedRef.current!.has(id));
        completedRef.current = new Set(completed);
        if (hasNewCompletion) importedRef.current();
      } catch (error) {
        if (!stopped && !signal.aborted) setLoadError(errorMessage(error));
      } finally {
        if (!stopped) timer = setTimeout(() => void refresh(), 10_000);
      }
    }

    void refresh();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      controller?.abort();
    };
  }, [revision]);

  function change(schedule: Schedule, update: Partial<Preferences>) {
    setDrafts((current) => ({
      ...current,
      [schedule.code]: { ...(current[schedule.code] ?? schedule), ...update },
    }));
    if (feedback?.code === schedule.code) setFeedback(null);
  }

  async function perform(schedule: Schedule, action: "save" | "run") {
    if (mutationRef.current || (action === "run" && (!schedule.ready || schedule.activeRunId))) return;
    mutationRef.current = true;
    requestRef.current?.abort();
    setPending({ code: schedule.code, action });
    setFeedback(null);
    try {
      if (action === "save") {
        const values = drafts[schedule.code] ?? schedule;
        const result = await api<Schedule>(`/admin/supplier-sync/${encodeURIComponent(schedule.code)}`, {
          method: "PATCH", body: JSON.stringify({ enabled: values.enabled, intervalMinutes: values.intervalMinutes }),
        });
        setSchedules((current) => current?.map((item) => item.code === result.code ? result : item) ?? null);
        setDrafts((current) => {
          const next = { ...current };
          delete next[schedule.code];
          return next;
        });
        setFeedback({ code: schedule.code, text: result.enabled ? "Расписание сохранено." : "Расписание отключено.", error: false });
      } else {
        const result = await api<SyncRun>(`/admin/supplier-sync/${encodeURIComponent(schedule.code)}/run`, { method: "POST" });
        setRuns((current) => [result, ...current.filter((item) => item.id !== result.id)].slice(0, 20));
        setSchedules((current) => current?.map((item) => item.code === schedule.code ? { ...item, activeRunId: result.id } : item) ?? null);
        setFeedback({ code: schedule.code, text: "Запуск добавлен в очередь. Следите за результатом в журнале.", error: false });
      }
    } catch (error) {
      setFeedback({ code: schedule.code, text: errorMessage(error), error: true });
    } finally {
      mutationRef.current = false;
      setPending(null);
      setRevision((value) => value + 1);
    }
  }

  const enabledCount = schedules?.filter((source) => source.enabled).length ?? 0;
  const activeCount = schedules?.filter((source) => source.activeRunId).length ?? 0;
  const successfulCount = schedules?.filter((source) => source.lastSuccessAt).length ?? 0;

  return (
    <section className="supplier-sync" id="supplier-sync" aria-labelledby="supplier-sync-title">
      <header className="sync-heading">
        <div>
          <span className="eyebrow">АССОРТИМЕНТ НА СВЯЗИ</span>
          <h2 id="supplier-sync-title">Поставщики обновляются сами.</h2>
          <p>Свежие цены и наличие по расписанию. Новые товары появляются в черновиках; ваши описания и публикации сохраняются.</p>
        </div>
        <ArrowUpRight size={30} strokeWidth={1.2} aria-hidden="true" />
      </header>
      <div className="sync-overview" aria-label="Состояние автоматических обновлений">
        <div><strong>{schedules === null ? "—" : enabledCount}</strong><span>расписаний включено</span></div>
        <div><strong>{schedules === null ? "—" : activeCount}</strong><span>в очереди и в работе</span></div>
        <div><strong>{schedules === null ? "—" : successfulCount}</strong><span>источников с успешным запуском</span></div>
      </div>
      <div className="sync-explanation">
        <p>Настроенный доступ позволяет запустить проверку. Успешное подключение подтверждается завершённым обновлением.</p>
        <span><Clock3 size={13} aria-hidden="true" />Статусы каждые 10 секунд{updatedAt && ` · ${dateLabel(updatedAt)}`}</span>
      </div>
      {loadError && <div className="sync-load-error" role="alert"><p>{loadError}</p><button type="button" className="button button-outline" disabled={!!pending} onClick={() => setRevision((value) => value + 1)}>Повторить загрузку</button></div>}
      {schedules === null && !loadError && <p className="sync-empty" role="status">Загружаем расписания…</p>}
      {schedules?.length === 0 && <p className="sync-empty">Источники для автоматического обновления ещё не добавлены.</p>}
      <div className="sync-sources">
        {schedules?.map((schedule) => {
          const preferences = drafts[schedule.code] ?? schedule;
          const dirty = preferences.enabled !== schedule.enabled || preferences.intervalMinutes !== schedule.intervalMinutes;
          const activeRun = runs.find((run) => run.id === schedule.activeRunId);
          const status = schedule.activeRunId ? activeRun?.state ?? (schedule.lastStatus === "running" ? "running" : "active") : schedule.lastStatus;
          const intervals = [...new Set([360, 720, 1440, preferences.intervalMinutes, schedule.minimumIntervalMinutes])]
            .filter((minutes) => minutes >= schedule.minimumIntervalMinutes && (minutes >= 360 || minutes === preferences.intervalMinutes)).sort((a, b) => a - b);
          const rowFeedback = feedback?.code === schedule.code ? feedback : null;
          return (
            <article className="sync-source" key={schedule.code} aria-labelledby={`sync-name-${schedule.code}`}>
              <div className="sync-source-heading">
                <div><h3 id={`sync-name-${schedule.code}`}>{schedule.name}</h3><span className="sync-readiness">{schedule.ready ? "Доступен запуск" : "Подключение требует настройки"}</span></div>
                <Status state={status} />
              </div>
              {!schedule.ready && schedule.blockedReason && <p className="sync-blocked">{schedule.blockedReason}</p>}
              <div className="sync-preferences">
                <label className="sync-toggle">
                  <input type="checkbox" role="switch" checked={preferences.enabled} disabled={!!pending || (!schedule.ready && !preferences.enabled)} onChange={(event) => change(schedule, { enabled: event.target.checked })} aria-label={`Автообновление ${schedule.name}`} />
                  <span aria-hidden="true" /><strong>{preferences.enabled ? "Включено" : "Выключено"}</strong>
                </label>
                <label className="sync-interval">Обновлять
                  <select aria-label={`Интервал обновления ${schedule.name}`} value={preferences.intervalMinutes} disabled={!!pending || !schedule.ready} onChange={(event) => change(schedule, { intervalMinutes: Number(event.target.value) })}>
                    {intervals.map((minutes) => <option key={minutes} value={minutes}>Раз в {intervalLabel(minutes)}</option>)}
                  </select>
                </label>
                <button className="button button-outline sync-save" type="button" disabled={!dirty || !!pending} onClick={() => void perform(schedule, "save")}><Save size={14} aria-hidden="true" />{pending?.code === schedule.code && pending.action === "save" ? "Сохраняем…" : "Сохранить"}</button>
              </div>
              <p className="sync-schedule-hint">{dirty ? "Изменения расписания ещё не сохранены." : `Минимальный интервал обновления: ${intervalLabel(schedule.minimumIntervalMinutes)}.`}</p>
              {schedule.enabled && !preferences.enabled && <p className="sync-stop-hint">После сохранения новые запуски по расписанию остановятся. Выполняющееся обновление завершится.</p>}
              <dl className="sync-dates">
                <div><dt>Последний успех</dt><dd>{dateLabel(schedule.lastSuccessAt, "Ещё не было")}</dd></div>
                <div><dt>Следующий запуск</dt><dd>{schedule.enabled ? dateLabel(schedule.nextRunAt, "После текущего запуска") : "Расписание выключено"}</dd></div>
              </dl>
              {schedule.lastError && <p className="sync-last-error"><strong>Последняя ошибка{schedule.consecutiveFailures > 1 ? ` · подряд ${schedule.consecutiveFailures}` : ""}</strong>{schedule.lastError}</p>}
              <div className="sync-source-footer">
                <button type="button" className="sync-run-button" disabled={!schedule.ready || !!schedule.activeRunId || !!pending} onClick={() => void perform(schedule, "run")}><RefreshCw size={14} aria-hidden="true" />{pending?.code === schedule.code && pending.action === "run" ? "Добавляем в очередь…" : schedule.activeRunId ? "Запуск уже активен" : "Обновить сейчас"}</button>
                <span>{schedule.lastRunAt ? `Последний запуск ${dateLabel(schedule.lastRunAt)}` : "Запусков ещё не было"}</span>
              </div>
              {rowFeedback && <p className={`sync-feedback${rowFeedback.error ? " sync-feedback-error" : ""}`} role={rowFeedback.error ? "alert" : "status"}>{rowFeedback.text}</p>}
            </article>
          );
        })}
      </div>
      <details className="sync-history" open>
        <summary>Журнал обновлений <span>Последние 20 запусков</span></summary>
        {runs.length === 0 ? <p className="sync-empty">Запуски появятся здесь после первого обновления.</p> : (
          <div className="sync-history-scroll" tabIndex={0} role="region" aria-label="Журнал обновлений поставщиков">
            <table>
              <caption className="sr-only">Последние запуски обновления поставщиков</caption>
              <thead><tr><th scope="col">Поставщик / запуск</th><th scope="col">Состояние</th><th scope="col">Обработано</th><th scope="col">Результат</th></tr></thead>
              <tbody>{runs.map((run) => <tr key={run.id}>
                <td><strong>{schedules?.find((source) => source.code === run.supplierCode)?.name ?? run.supplierCode}</strong><span>{dateLabel(run.requestedAt)} · {run.trigger === "scheduled" ? "По расписанию" : "Вручную"}</span></td>
                <td><Status state={run.state} />{run.finishedAt && <span>{dateLabel(run.finishedAt)}</span>}</td>
                <td>{run.processed === null ? "—" : run.processed.toLocaleString("ru-RU")}{run.created !== null && <span>Новых: {run.created.toLocaleString("ru-RU")}</span>}{run.updated !== null && <span>Обновлено: {run.updated.toLocaleString("ru-RU")}</span>}</td>
                <td className={run.error ? "sync-history-error" : ""}>{run.error || run.summary || (run.state === "queued" ? "Ожидает свободного обработчика." : run.state === "running" ? "Получаем и проверяем данные поставщика." : "—")}</td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  );
}
