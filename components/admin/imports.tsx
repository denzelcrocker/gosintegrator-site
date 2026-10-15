"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { categoryNames } from "@/lib/types";
import { BulkImport } from "./bulk-import";
import { SupplierSync } from "./supplier-sync";
type Supplier = {
  code: string;
  name: string;
  website: string;
  configured: boolean;
  format: string;
  setupHint?: string | null;
  documentationUrl?: string | null;
  credentialsConfigured?: boolean;
  connectionMethod?: "native-api" | "api" | "feed" | "partner-request";
  adapterImplemented?: boolean;
  fromPartnerList?: boolean;
  setupSteps?: string[] | null;
  accessNote?: string | null;
  importedOffers?: number;
  lastCatalogSnapshotAt?: string | null;
};
type SupplierFilter = "all" | "partners" | "api" | "feed" | "request";
const supplierFilters: { value: SupplierFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "partners", label: "Из таблицы" },
  { value: "api", label: "API" },
  { value: "feed", label: "Прайсы" },
  { value: "request", label: "Нужны условия" },
];

function matchesSupplierFilter(supplier: Supplier, filter: SupplierFilter) {
  switch (filter) {
    case "partners":
      return supplier.fromPartnerList === true;
    case "api":
      return ["native-api", "api"].includes(supplier.connectionMethod ?? "");
    case "feed":
      return supplier.connectionMethod === "feed";
    case "request":
      return (
        !supplier.connectionMethod ||
        supplier.connectionMethod === "partner-request"
      );
    default:
      return true;
  }
}

function connectionMethodLabel(supplier: Supplier) {
  switch (supplier.connectionMethod) {
    case "native-api":
    case "api":
      return "API поставщика";
    case "feed":
      return "Прайс / товарный фид";
    default:
      return "Условия по запросу";
  }
}

function configurationLabel(supplier: Supplier) {
  if (supplier.importedOffers) return "Каталог загружен";
  if (supplier.configured) return "Настроен";
  if (supplier.credentialsConfigured)
    return supplier.connectionMethod === "native-api"
      ? "Нужны категории"
      : "Настройка не завершена";
  return "Не настроен";
}
type SupplierCategory = { code: string; name: string };
type Result = {
  created: number;
  updated: number;
  matched: number;
  dryRun: boolean;
  warnings: string[];
};

function NativeSupplierSetup({ supplier }: { supplier: Supplier }) {
  const isItPartner = supplier.code === "it-partner";
  const configurationPrefix = isItPartner ? "ItPartner" : "AbsolutTrade";
  const externalCategoryKey = isItPartner ? "EXTERNAL_ID" : "EXTERNAL_CODE";
  const [categories, setCategories] = useState<SupplierCategory[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const filteredCategories = categories?.filter((category) =>
    `${category.code} ${category.name}`
      .toLocaleLowerCase("ru")
      .includes(normalizedQuery),
  );
  const visibleCategories = filteredCategories?.slice(0, 100);

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      setCategories(
        await api<SupplierCategory[]>(
          `/admin/imports/suppliers/${supplier.code}/categories`,
        ),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="supplier-setup">
      <h3>Настройка каталога на сервере</h3>
      <ol>
        {isItPartner ? (
          <>
            <li>
              В API IT Partner 2.17 используются логин и пароль существующего
              кабинета B2B. Доступ к каталогу зависит от прав вашей учётной
              записи.
            </li>
            <li>
              Сохраните учётные данные только в закрытом файле сервера{" "}
              <code>.env</code>: параметры{" "}
              <code>Suppliers__ItPartner__Login</code> и{" "}
              <code>Suppliers__ItPartner__Password</code>. Перезапустите API и
              обновите страницу. Не публикуйте пароль в чате или репозитории.
            </li>
          </>
        ) : (
          <>
            <li>
              Попросите менеджера отдельно разрешить API для вашей компании.
              После подтверждения доступа получите действующий токен или
              согласуйте порядок его выпуска. Доступ к B2B/eCom сам по себе не
              означает, что API разрешён.
            </li>
            <li>
              Сохраните токен в закрытой конфигурации сервера, в параметре{" "}
              <code>Suppliers__AbsolutTrade__BearerToken</code>, и перезапустите
              API. Для компании действует один токен: выпуск нового отзывает
              предыдущий. Согласуйте его замену с ответственными за другие
              интеграции. Не публикуйте токен в чате или репозитории.
            </li>
          </>
        )}
        <li>
          Загрузите категории поставщика и сопоставьте нужные с категориями
          магазина. Добавьте отдельную строку для каждого соответствия в
          закрытую конфигурацию сервера:
          <code className="supplier-config-example">
            {`Suppliers__${configurationPrefix}__CategoryMappings__${externalCategoryKey}=computers`}
          </code>
          Вместо <code>{externalCategoryKey}</code> укажите код из таблицы,
          справа — категорию магазина из списка ниже.
        </li>
        <li>
          Перезапустите API и обновите страницу. Нажмите «Проверить каталог»,
          изучите предупреждения и затем «Применить импорт». Настройка сервера
          ещё не подтверждает доступ к API поставщика.
        </li>
      </ol>
      <div className="supplier-category-loader">
        {supplier.credentialsConfigured ? (
          <button
            className="button button-outline"
            type="button"
            disabled={loading}
            onClick={loadCategories}
          >
            {loading ? "Загружаем категории…" : "Загрузить категории"}
          </button>
        ) : (
          <p>
            Загрузка категорий станет доступна после настройки доступа на
            сервере.
          </p>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {categories !== null && (
          <>
            <label className="supplier-category-search">
              Поиск категории поставщика
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название или код"
              />
            </label>
            <p role="status">
              Найдено: {filteredCategories?.length ?? 0} из {categories.length}
            </p>
            {!!filteredCategories?.length && (
              <div className="supplier-category-table">
                <table>
                  <caption>Категории {supplier.name}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Код</th>
                      <th scope="col">Название</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCategories?.map((category) => (
                      <tr key={category.code}>
                        <td>
                          <code>{category.code}</code>
                        </td>
                        <td>{category.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(filteredCategories?.length ?? 0) > 100 && (
              <p>
                Показаны первые 100 категорий. Уточните поиск по названию или
                коду.
              </p>
            )}
          </>
        )}
      </div>
      <h3>Категории магазина</h3>
      <dl className="supplier-local-categories">
        {Object.entries(categoryNames).map(([code, name]) => (
          <div key={code}>
            <dt>
              <code>{code}</code>
            </dt>
            <dd>{name}</dd>
          </div>
        ))}
      </dl>
      <p>
        Новые товары поступают в черновики с автоматическим выбором минимальной
        цены поставщиков без наценки. В расчёт входят положительные цены в RUB
        при наличии и проверке за последние 24 часа. Без подходящей цены
        показывается «По запросу». Налоговая база НДС не пересчитывается.
      </p>
      <p>
        В автоматическом режиме цена и остаток обновляются по предложениям. В
        ручном режиме заданные вами цена и остаток сохраняются. Описания и
        другие отредактированные поля не перезаписываются.
      </p>
      {!isItPartner && (
        <p>
          Товары с неизвестной категорией или остатком, части комплектов и
          позиции EOL пропускаются с предупреждением.
        </p>
      )}
      <p>
        Отсутствующие в ответе товары не обнуляются. Сведения реестра
        загружаются отдельно.
      </p>
      {isItPartner && (
        <p>
          Каталог и категории кэшируются на 24 часа, остатки и выборка импорта —
          на 6 минут, с учётом лимита API 10 запросов в час. Предварительная
          проверка и применение в течение 6 минут используют одну выборку.
          Сопоставляйте конечные категории по точному идентификатору. Для
          первого импорта можно ограничить выборку параметром{" "}
          <code>Suppliers__ItPartner__ProductIds</code>; предел{" "}
          <code>Suppliers__ItPartner__MaxProducts</code> по умолчанию — 100.
        </p>
      )}
    </section>
  );
}

export function Imports({ onImported }: { onImported: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersError, setSuppliersError] = useState("");
  const [supplierQuery, setSupplierQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilter>("all");
  const [kind, setKind] = useState("products");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const normalizedSupplierQuery = supplierQuery.trim().toLocaleLowerCase("ru");
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      matchesSupplierFilter(supplier, supplierFilter) &&
      `${supplier.name} ${supplier.format} ${supplier.code}`
        .toLocaleLowerCase("ru")
        .includes(normalizedSupplierQuery),
  );

  async function loadSuppliers() {
    setSuppliersLoading(true);
    setSuppliersError("");
    try {
      setSuppliers(await api<Supplier[]>("/admin/imports/suppliers"));
    } catch (e) {
      setSuppliersError(errorMessage(e));
    } finally {
      setSuppliersLoading(false);
    }
  }

  useEffect(() => {
    void loadSuppliers();
  }, []);
  useEffect(() => {
    if (result || error)
      feedbackRef.current?.scrollIntoView({ block: "nearest" });
  }, [result, error]);
  async function run(dryRun: boolean, code: string | null = null) {
    setError("");
    setResult(null);
    setBusy(true);
    try {
      let response: Result;
      if (code) {
        response = await api(
          `/admin/imports/suppliers/${code}/sync?dryRun=${dryRun}`,
          { method: "POST" },
        );
      } else {
        if (!file) throw new Error("Выберите файл для импорта.");
        if (file.size > 10 * 1024 * 1024)
          throw new Error("Максимальный размер файла — 10 МБ.");
        if (kind === "registry" && file.name.toLowerCase().endsWith(".xlsx")) {
          const data = new FormData();
          data.append("file", file);
          response = await api(
            `/admin/imports/registry-file?dryRun=${dryRun}`,
            { method: "POST", body: data },
          );
        } else {
          const data = JSON.parse(await file.text());
          response = await api(`/admin/imports/${kind}`, {
            method: "POST",
            body: JSON.stringify({ ...data, dryRun }),
          });
        }
      }
      setResult(response);
      setSource(code);
      if (!dryRun) onImported();
    } catch (e) {
      setResult(null);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow muted">ИСТОЧНИКИ ДАННЫХ</span>
          <h1>Каталог, который растёт.</h1>
        </div>
      </div>
      <SupplierSync onImported={() => { onImported(); void loadSuppliers(); }} />
      <details className="supplier-advanced-settings">
        <summary>Ручной импорт и настройки подключений</summary>
        <p className="admin-intro">
          Подключайте источники ассортимента и остатков. Правила обновления цен
          зависят от поставщика. Сведения о реестре загружаются и проверяются
          отдельно.
        </p>
        <BulkImport
          credentialsConfigured={suppliers.some(
            (supplier) => supplier.code === "it-partner" && supplier.credentialsConfigured,
          )}
          credentialsLoading={suppliersLoading}
          onImported={onImported}
        />
        <section className="supplier-directory" aria-label="Поставщики">
          <div className="supplier-directory-toolbar">
            <label className="supplier-directory-search">
              <span>Найти поставщика</span>
              <span>
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  value={supplierQuery}
                  onChange={(e) => setSupplierQuery(e.target.value)}
                  placeholder="Название или формат данных"
                />
              </span>
            </label>
            <p className="supplier-directory-count" role="status">
              {suppliersLoading
                ? "Загружаем поставщиков…"
                : `Показано ${filteredSuppliers.length} из ${suppliers.length}`}
            </p>
          </div>
          <div
            className="supplier-directory-filters"
            aria-label="Фильтр поставщиков"
          >
            {supplierFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={supplierFilter === filter.value}
                onClick={() => setSupplierFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <p className="supplier-directory-legend">
            Возможности поставщика и готовность нашего адаптера указаны
            отдельно. Статус «Настроен» означает, что параметры заданы на
            сервере; доступ проверяется при запросе каталога.
          </p>
          {suppliersError && (
            <div className="supplier-directory-empty" role="alert">
              <p>{suppliersError}</p>
              <button className="button button-outline" onClick={loadSuppliers}>
                Повторить загрузку
              </button>
            </div>
          )}
          {!suppliersLoading &&
            !suppliersError &&
            filteredSuppliers.length === 0 && (
              <div className="supplier-directory-empty">
                <h2>Поставщики не найдены</h2>
                <p>Попробуйте другое название или измените фильтр.</p>
                <button
                  className="button button-outline"
                  onClick={() => {
                    setSupplierQuery("");
                    setSupplierFilter("all");
                  }}
                >
                  Сбросить поиск
                </button>
              </div>
            )}
          <div className="supplier-directory-list">
            {filteredSuppliers.map((supplier) => (
              <details key={supplier.code} className="supplier-row">
                <summary>
                  <span className="supplier-row-main">
                    <strong>{supplier.name}</strong>
                    <span className="supplier-row-capabilities">
                      <span>{connectionMethodLabel(supplier)}</span>
                      <span
                        className={
                          supplier.adapterImplemented
                            ? "supplier-adapter-ready"
                            : ""
                        }
                      >
                        {supplier.importedOffers && !supplier.adapterImplemented
                          ? "Импорт из прайса"
                          : supplier.adapterImplemented
                            ? "Адаптер готов"
                            : "Требуется разработка"}
                      </span>
                      {supplier.fromPartnerList && <span>Из таблицы</span>}
                    </span>
                  </span>
                  <span
                    className={`badge ${supplier.configured || supplier.importedOffers ? "blue" : "gray"}`}
                  >
                    {configurationLabel(supplier)}
                  </span>
                  <ChevronDown
                    className="supplier-row-chevron"
                    size={18}
                    aria-hidden="true"
                  />
                </summary>
                <div className="supplier-row-details">
                  {!!supplier.importedOffers && (
                    <p className="supplier-access-note">
                      Загружено предложений:{" "}
                      {supplier.importedOffers.toLocaleString("ru-RU")}.
                      {supplier.lastCatalogSnapshotAt && (
                        <>
                          {" "}
                          Последний снимок каталога:{" "}
                          {new Date(
                            supplier.lastCatalogSnapshotAt,
                          ).toLocaleString("ru-RU")}
                          .
                        </>
                      )}{" "}
                      Это количество предложений поставщика, включая совпадения
                      с товарами других источников.
                      {" "}<a href="#supplier-sync">Расписание и результаты автообновлений — в панели выше.</a>
                    </p>
                  )}
                  <p>
                    {supplier.setupHint ||
                      (supplier.configured
                        ? "Источник задан в конфигурации сервера. Проверьте данные перед импортом."
                        : "Для подключения согласуйте способ получения каталога и права доступа с поставщиком.")}
                  </p>
                  <p className="supplier-format">
                    Формат данных: {supplier.format}
                  </p>
                  {supplier.accessNote && (
                    <p className="supplier-access-note">
                      {supplier.accessNote}
                    </p>
                  )}
                  <h3>Как подключить</h3>
                  <ol className="supplier-connection-steps">
                    {(supplier.setupSteps?.length
                      ? supplier.setupSteps
                      : [
                          "Запросите у менеджера условия доступа к каталогу и актуальную документацию.",
                          supplier.adapterImplemented
                            ? "Передайте согласованные параметры в закрытую конфигурацию сервера и перезапустите API."
                            : "Подготовьте адаптер под согласованный формат данных и способ авторизации.",
                          "Проверьте выборку и правила цен до применения импорта.",
                        ]
                    ).map((step, index) => (
                      <li key={`${supplier.code}-${index}`}>{step}</li>
                    ))}
                  </ol>
                  <div className="supplier-row-actions">
                    <span className="supplier-card-links">
                      {supplier.website && (
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Партнёрский портал
                        </a>
                      )}
                      {supplier.documentationUrl && (
                        <a
                          href={supplier.documentationUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Документация API
                        </a>
                      )}
                    </span>
                    {supplier.configured && (
                      <button
                        className="button button-outline"
                        disabled={busy}
                        onClick={() => run(true, supplier.code)}
                      >
                        Проверить каталог
                      </button>
                    )}
                  </div>
                  {["absolut-trade", "it-partner"].includes(supplier.code) && (
                    <NativeSupplierSetup supplier={supplier} />
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
        <section className="import-panel">
          <h2>Импорт из файла</h2>
          <p>
            Сначала проверьте содержимое. Изменения сохраняются только после
            нажатия «Применить импорт».
          </p>
          <div className="form-grid">
            <label>
              Что загружаем
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setFile(null);
                  setResult(null);
                  setSource(null);
                  setError("");
                }}
              >
                <option value="products">Товары поставщика — JSON</option>
                <option value="registry">Записи реестра — JSON / XLSX</option>
              </select>
            </label>
            <label>
              Файл
              <input
                key={kind}
                type="file"
                accept={kind === "products" ? ".json" : ".json,.xlsx"}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setResult(null);
                  setSource(null);
                }}
              />
            </label>
          </div>
          <div className="import-links">
            <a
              href={
                kind === "products"
                  ? "/templates/supplier.json"
                  : "/templates/registry.json"
              }
              download
            >
              Скачать пример JSON
            </a>
            {kind === "registry" && (
              <a href="/templates/registry.xlsx" download>
                Скачать шаблон XLSX
              </a>
            )}
            <a
              href="https://portfolio.gisp.gov.ru/pp719v2/pub/prod/"
              target="_blank"
              rel="noreferrer"
            >
              Официальный реестр ГИСП
            </a>
          </div>
          <p className="editor-note">
            {kind === "products"
              ? "Новые товары загружаются как черновики. Существующие сопоставляются по коду поставщика и внешнему идентификатору. Собственная продукция защищена от перезаписи."
              : "Используйте шаблон и перенесите проверенные данные из официальной выгрузки: number, status, validUntil, sourceUrl. Формат произвольной выгрузки ГИСП может потребовать преобразования. Этот импорт не обращается к ГИСП автоматически."}
          </p>
          <button
            className="button"
            disabled={busy || !file}
            onClick={() => run(true)}
          >
            {busy ? "Проверяем…" : "Проверить файл"}
          </button>
          {error && (
            <div className="error" role="alert" ref={feedbackRef}>
              {error}
            </div>
          )}
          {result && (
            <div
              className={result.dryRun ? "import-result" : "success"}
              role="status"
              ref={feedbackRef}
            >
              <h3>
                {result.dryRun ? "Проверка завершена" : "Импорт выполнен"}
              </h3>
              <p>
                Источник:{" "}
                {source
                  ? (suppliers.find((supplier) => supplier.code === source)
                      ?.name ?? source)
                  : (file?.name ?? "Загруженный файл")}
              </p>
              <div>
                <span>
                  Новых товаров<strong>{result.created}</strong>
                </span>
                <span>
                  Обновлений<strong>{result.updated}</strong>
                </span>
                <span>
                  Совпадений реестра<strong>{result.matched}</strong>
                </span>
              </div>
              {result.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
              {result.dryRun && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => run(false, source)}
                >
                  Применить импорт
                </button>
              )}
            </div>
          )}
        </section>
      </details>
    </>
  );
}
