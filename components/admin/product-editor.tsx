"use client";
import { useEffect, useState } from "react";
import { Plus, X, Upload } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import {
  type Product,
  type Specification,
  type SupplierOffersResponse,
  categoryNames,
} from "@/lib/types";
import { SupplierOffers } from "./supplier-offers";
export function ProductEditor({
  product,
  onCancel,
  onSaved,
}: {
  product: Product | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [specs, setSpecs] = useState<Specification[]>(
    product?.specifications ?? [
      { name: "Процессор", value: "" },
      { name: "Оперативная память", value: "" },
    ],
  );
  const [image, setImage] = useState(
    product?.imageUrl ?? "/images/desktop.png",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [useSupplierPrice, setUseSupplierPrice] = useState(
    product?.useSupplierPrice ?? false,
  );
  const [manualPrice, setManualPrice] = useState(
    product?.price?.toString() ?? "",
  );
  const [manualStock, setManualStock] = useState(String(product?.stock ?? 0));
  const [offers, setOffers] = useState<SupplierOffersResponse | null>(null);
  const [offersLoading, setOffersLoading] = useState(!!product);
  const [offersError, setOffersError] = useState("");
  const [offersRevision, setOffersRevision] = useState(0);
  const eligibleOffers =
    offers?.offers
      .filter((offer) => offer.isEligible && offer.price !== null)
      .sort((a, b) => a.price! - b.price!) ?? [];
  const selectedOffer =
    eligibleOffers.find((offer) => offer.isSelected) ?? eligibleOffers[0];
  const autoPrice = offers
    ? (selectedOffer?.price ?? null)
    : product?.useSupplierPrice
      ? product.price
      : null;
  const freshStocks =
    offers?.offers.filter((offer) => {
      const observedAt = offer.observedAt ? Date.parse(offer.observedAt) : 0;
      return (
        offer.stock !== null &&
        observedAt >= Date.now() - 24 * 60 * 60 * 1000 &&
        observedAt <= Date.now()
      );
    }) ?? [];
  const autoStock = offers
    ? (selectedOffer?.stock ??
      freshStocks.reduce(
        (maximum, offer) => Math.max(maximum, offer.stock ?? 0),
        0,
      ))
    : product?.useSupplierPrice
      ? product.stock
      : 0;

  useEffect(() => {
    if (!product) return;
    const controller = new AbortController();
    setOffersLoading(true);
    setOffersError("");
    api<SupplierOffersResponse | null | undefined>(
      `/admin/products/${product.id}/offers`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        if (!response || !Array.isArray(response.offers))
          throw new Error("Не удалось прочитать предложения поставщиков.");
        setOffers(response);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setOffersError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setOffersLoading(false);
      });
    return () => controller.abort();
  }, [product?.id, offersRevision]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const payload = {
      name: f.get("name"),
      slug: f.get("slug"),
      sku: f.get("sku"),
      brand: f.get("brand"),
      manufacturerPartNumber: f.get("manufacturerPartNumber"),
      category: f.get("category"),
      summary: f.get("summary"),
      description: f.get("description"),
      price: manualPrice === "" ? null : Number(manualPrice),
      stock: Number(manualStock),
      useSupplierPrice,
      imageUrl: image,
      isOwn: f.get("isOwn") === "on",
      isPublished: f.get("isPublished") === "on",
      isDemo: f.get("isDemo") === "on",
      registryNumber: f.get("registryNumber") || null,
      specifications: specs.filter((s) => s.name.trim() || s.value.trim()),
      version: product?.version ?? 0,
    };
    try {
      await api(product ? `/admin/products/${product.id}` : "/admin/products", {
        method: product ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const result = await api<{ url: string }>("/admin/media", {
        method: "POST",
        body: data,
      });
      setImage(result.url);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="editor-back" onClick={onCancel}>
        ‹ Вернуться к товарам
      </button>
      <div className="admin-heading">
        <div>
          <span className="eyebrow muted">КАРТОЧКА ОБОРУДОВАНИЯ</span>
          <h1>{product ? "Редактирование товара" : "Новый товар."}</h1>
        </div>
      </div>
      <form onSubmit={save} className="product-editor">
        <div className="editor-main">
          <section>
            <h2>Основная информация</h2>
            <div className="form-grid">
              <label className="full">
                Название
                <input
                  name="name"
                  required
                  maxLength={160}
                  defaultValue={product?.name}
                  placeholder="АИ Workstation Pro"
                />
              </label>
              <label>
                Артикул
                <input
                  name="sku"
                  required
                  maxLength={80}
                  defaultValue={product?.sku}
                  placeholder="AI-WS-001"
                />
              </label>
              <label>
                Адрес карточки
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={120}
                  defaultValue={product?.slug}
                  placeholder="ai-workstation-pro"
                />
                <small>Латиница, цифры и дефисы</small>
              </label>
              <label>
                Производитель
                <input
                  name="brand"
                  required
                  maxLength={80}
                  defaultValue={product?.brand ?? "Айти Интегратор"}
                />
              </label>
              <label>
                Категория
                <select
                  name="category"
                  defaultValue={product?.category ?? "computers"}
                >
                  {Object.entries(categoryNames).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="full">
                Код производителя (MPN)
                <input
                  name="manufacturerPartNumber"
                  maxLength={500}
                  defaultValue={product?.manufacturerPartNumber ?? ""}
                  placeholder="Точный артикул производителя"
                />
                <small>
                  Используется вместе с производителем для сопоставления
                  одинакового оборудования.
                </small>
              </label>
              <label className="full">
                Короткое описание
                <input
                  name="summary"
                  required
                  maxLength={240}
                  defaultValue={product?.summary}
                  placeholder="Основное назначение и ключевые характеристики"
                />
              </label>
              <label className="full">
                Полное описание
                <textarea
                  name="description"
                  required
                  maxLength={10000}
                  rows={5}
                  defaultValue={product?.description}
                />
              </label>
            </div>
          </section>
          {product && (
            <SupplierOffers
              response={offers}
              loading={offersLoading}
              error={offersError}
              onRefresh={() => setOffersRevision((value) => value + 1)}
            />
          )}
          <section>
            <div className="editor-section-heading">
              <h2>Характеристики</h2>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setSpecs([...specs, { name: "", value: "" }])}
              >
                <Plus size={15} />
                Добавить
              </button>
            </div>
            {specs.map((spec, i) => (
              <div className="spec-input-row" key={i}>
                <input
                  aria-label={`Характеристика ${i + 1}`}
                  placeholder="Название"
                  value={spec.name}
                  onChange={(e) =>
                    setSpecs(
                      specs.map((s, j) =>
                        j === i ? { ...s, name: e.target.value } : s,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`Значение ${i + 1}`}
                  placeholder="Значение"
                  value={spec.value}
                  onChange={(e) =>
                    setSpecs(
                      specs.map((s, j) =>
                        j === i ? { ...s, value: e.target.value } : s,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Удалить характеристику ${i + 1}`}
                  onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </section>
          <section>
            <h2>Сведения о реестре</h2>
            <label>
              Номер реестровой записи
              <input
                name="registryNumber"
                defaultValue={product?.registryNumber ?? ""}
                maxLength={80}
                placeholder="Если товар включён в реестр"
              />
            </label>
            <p className="editor-note">
              Изменение номера сбрасывает проверку. Подтверждение статуса
              выполняется отдельно через импорт реестра.
            </p>
          </section>
        </div>
        <aside className="editor-aside">
          <section>
            <h2>Изображение</h2>
            <div className="editor-image">
              <img src={image} alt="Предпросмотр изображения товара" />
            </div>
            <label className="upload-button">
              <Upload size={17} />
              Загрузить фотографию
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => upload(e.target.files?.[0])}
                disabled={busy}
              />
            </label>
            <label>
              Или ссылка на изображение
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                required
                maxLength={500}
              />
            </label>
            <p className="editor-note">
              PNG, JPG или WebP, до 5 МБ. Для публикации используйте собственные
              фотографии или разрешённые материалы.
            </p>
          </section>
          <section>
            <h2>Стоимость и наличие</h2>
            <label className="check-label supplier-price-toggle">
              <input
                type="checkbox"
                name="useSupplierPrice"
                checked={useSupplierPrice}
                disabled={busy}
                onChange={(e) => setUseSupplierPrice(e.target.checked)}
              />
              Автоматически выбирать минимальную цену поставщиков
            </label>
            <label>
              Цена, ₽
              <input
                type="number"
                name="price"
                min="0"
                max="1000000000"
                step="0.01"
                value={useSupplierPrice ? (autoPrice ?? "") : manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                readOnly={useSupplierPrice}
                placeholder="Пусто — по запросу"
              />
            </label>
            <label>
              Остаток, шт.
              <input
                type="number"
                name="stock"
                min="0"
                max="1000000"
                step="1"
                value={useSupplierPrice ? autoStock : manualStock}
                onChange={(e) => setManualStock(e.target.value)}
                readOnly={useSupplierPrice}
              />
            </label>
            <p className="editor-note">
              {useSupplierPrice
                ? "Цена без наценки и остаток берутся из одного подходящего предложения. В магазине цена отмечена как минимальная; для большей партии она может измениться."
                : "Цена и остаток задаются вручную и сохраняются при обновлении предложений поставщиков."}
            </p>
            {useSupplierPrice && autoPrice === null && (
              <p className="editor-note">
                Свежей положительной цены в RUB при наличии сейчас нет: в
                магазине будет «По запросу». Показан наибольший свежий известный
                остаток одного предложения, без суммирования.
              </p>
            )}
            {useSupplierPrice !== (product?.useSupplierPrice ?? false) && (
              <p className="editor-note">
                Новый режим применится после сохранения карточки.
              </p>
            )}
          </section>
          <section>
            <h2>Публикация</h2>
            <label className="check-label">
              <input
                type="checkbox"
                name="isOwn"
                defaultChecked={product?.isOwn ?? true}
              />
              Собственная продукция
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                name="isPublished"
                defaultChecked={product?.isPublished ?? false}
              />
              Показывать в каталоге
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                name="isDemo"
                defaultChecked={product?.isDemo ?? false}
              />
              Демонстрационный товар
            </label>
          </section>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="button save-product" disabled={busy}>
            {busy ? "Сохраняем…" : "Сохранить товар"}
          </button>
          <button
            type="button"
            className="button button-outline save-product"
            onClick={onCancel}
          >
            Отмена
          </button>
        </aside>
      </form>
    </>
  );
}
