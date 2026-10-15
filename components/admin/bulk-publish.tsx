"use client";

import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";

type DraftSummary = { drafts: number; withoutPrice: number };
type PublishResult = { published: number };
type Props = { revision: number; onPublished: () => void };

const count = (value: number) => value.toLocaleString("ru-RU");

export function BulkPublish({ revision, onPublished }: Props) {
  const [summary, setSummary] = useState<DraftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [published, setPublished] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const publishingRef = useRef(false);
  const mounted = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSummaryError("");
    api<DraftSummary | null | undefined>("/admin/products/drafts/summary", {
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;
        if (
          !response ||
          !Number.isSafeInteger(response.drafts) ||
          !Number.isSafeInteger(response.withoutPrice) ||
          response.drafts < 0 ||
          response.withoutPrice < 0 ||
          response.withoutPrice > response.drafts
        )
          throw new Error("Не удалось получить количество черновиков.");
        setSummary(response);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setSummary(null);
        setSummaryError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision, refresh]);

  useEffect(() => {
    if (confirming) confirmationHeadingRef.current?.focus();
  }, [confirming]);

  function refreshSummary() {
    setLoading(true);
    setRefresh((value) => value + 1);
  }

  function openConfirmation() {
    if (publishingRef.current || loading || !summary?.drafts) return;
    setPublished(null);
    setPublishError("");
    setConfirming(true);
    refreshSummary();
  }

  async function publish() {
    if (
      publishingRef.current ||
      !confirming ||
      loading ||
      summaryError ||
      !summary?.drafts
    )
      return;
    publishingRef.current = true;
    setPublishing(true);
    setPublishError("");
    try {
      const result = await api<PublishResult | null | undefined>(
        "/admin/products/drafts/publish",
        { method: "POST" },
      );
      if (
        !result ||
        !Number.isSafeInteger(result.published) ||
        result.published < 0
      )
        throw new Error(
          "Сервер не подтвердил результат публикации. Проверьте количество оставшихся черновиков.",
        );
      onPublished();
      if (!mounted.current) return;
      setPublished(result.published);
      setConfirming(false);
      refreshSummary();
      headingRef.current?.focus();
    } catch (e) {
      if (!mounted.current) return;
      setPublishError(errorMessage(e));
      refreshSummary();
    } finally {
      publishingRef.current = false;
      if (mounted.current) setPublishing(false);
    }
  }

  return (
    <section className="bulk-publish" aria-labelledby="bulk-publish-heading">
      <div className="bulk-publish-header">
        <div>
          <h2 id="bulk-publish-heading" ref={headingRef} tabIndex={-1}>
            Публикация черновиков
          </h2>
          <p role="status">
            {loading
              ? "Проверяем весь каталог…"
              : summary
                ? summary.drafts === 0
                  ? "Неопубликованных товаров нет."
                  : `Черновиков: ${count(summary.drafts)}. Без цены: ${count(summary.withoutPrice)}.`
                : "Количество черновиков пока недоступно."}
          </p>
        </div>
        <button
          type="button"
          className="button button-outline"
          aria-expanded={confirming}
          aria-controls="bulk-publish-confirmation"
          disabled={loading || publishing || confirming || !summary?.drafts}
          onClick={openConfirmation}
        >
          Опубликовать все черновики
          {summary && !loading ? ` · ${count(summary.drafts)}` : ""}
        </button>
      </div>
      {summaryError && (
        <div className="bulk-publish-error">
          <p className="error" role="alert">
            {summaryError}
          </p>
          <button
            type="button"
            className="button button-outline"
            disabled={loading || publishing}
            onClick={refreshSummary}
          >
            Повторить загрузку количества
          </button>
        </div>
      )}
      {publishError && (
        <p className="error" role="alert">
          {publishError}
        </p>
      )}
      {published !== null && (
        <p className="bulk-publish-success" role="status">
          {published > 0
            ? `Опубликовано товаров: ${count(published)}. Они доступны в магазине.`
            : "Неопубликованных товаров уже нет. Каталог не изменён."}
        </p>
      )}
      {confirming && (
        <div
          id="bulk-publish-confirmation"
          className="archive-confirm bulk-publish-confirmation"
          role="group"
          aria-labelledby="bulk-publish-confirmation-heading"
        >
          <h3
            id="bulk-publish-confirmation-heading"
            ref={confirmationHeadingRef}
            tabIndex={-1}
          >
            Опубликовать весь каталог черновиков?
          </h3>
          {loading ? (
            <p role="status">Обновляем количество перед подтверждением…</p>
          ) : summary ? (
            summary.drafts > 0 ? (
              <>
                <p>
                  Сейчас неопубликованных товаров:{" "}
                  <strong>{count(summary.drafts)}</strong>. Действие охватит все
                  категории, независимо от поиска и текущей страницы. В том
                  числе снова появятся карточки, которые вы ранее сняли с
                  публикации.
                </p>
                <p>
                  Товаров без цены:{" "}
                  <strong>{count(summary.withoutPrice)}</strong>. В магазине они
                  будут отображаться с ценой «По запросу». Публикуются все
                  черновики, существующие на момент подтверждения.
                </p>
              </>
            ) : (
              <p>Черновиков больше нет. Публиковать нечего.</p>
            )
          ) : (
            <p>
              Сначала обновите количество черновиков, чтобы подтвердить
              публикацию.
            </p>
          )}
          <div className="bulk-publish-confirmation-actions">
            <button
              type="button"
              className="button"
              disabled={
                loading || publishing || !!summaryError || !summary?.drafts
              }
              onClick={publish}
            >
              {publishing
                ? "Публикуем…"
                : `Да, опубликовать все${summary && !loading ? ` · ${count(summary.drafts)}` : ""}`}
            </button>
            <button
              type="button"
              className="button button-outline"
              disabled={publishing}
              onClick={() => {
                setConfirming(false);
                setPublishError("");
                headingRef.current?.focus();
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
