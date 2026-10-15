"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import {
  estimateTenderFee,
  tenderTariffs,
  type TenderTariffId,
} from "@/lib/tender-tariffs";

const rubles = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function TenderRequest() {
  const [tariff, setTariff] = useState<TenderTariffId>("monthly");
  const [contractValue, setContractValue] = useState("3000000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; number: string } | null>(
    null,
  );
  const inFlight = useRef(false);
  const lastRequest = useRef<{ body: string; key: string } | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const amount = Number(contractValue);
  const validAmount =
    contractValue.trim() !== "" &&
    Number.isFinite(amount) &&
    amount >= 1 &&
    amount <= 1_000_000_000;
  const estimate = validAmount ? estimateTenderFee(tariff, amount) : null;
  const isFullCycle = tariff === "full-cycle";

  useEffect(() => {
    if (result) successRef.current?.focus();
  }, [result]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      company: String(form.get("company") ?? "").trim(),
      contactName: String(form.get("contactName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      tariff,
      tenderUrl: String(form.get("tenderUrl") ?? "").trim() || null,
      comment: String(form.get("comment") ?? "").trim() || null,
      consent: form.get("consent") === "on",
    };
    const body = JSON.stringify(payload);
    if (lastRequest.current?.body !== body)
      lastRequest.current = { body, key: crypto.randomUUID() };
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await api<{ id: string; number: string }>(
        "/tender-inquiries",
        {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            idempotencyKey: lastRequest.current!.key,
          }),
        },
      );
      setResult(response);
      lastRequest.current = null;
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }

  return (
    <>
      <section
        id="tender-tariffs"
        className="tender-pricing"
        aria-labelledby="tender-tariffs-heading"
      >
        <div className="tender-section-head">
          <span className="eyebrow">02 / ФОРМАТ СОТРУДНИЧЕСТВА</span>
          <h2 id="tender-tariffs-heading">
            Одна процедура.
            <br />
            Или целый отдел.
          </h2>
          <p>
            Понятная стоимость подготовки и вознаграждение за заключённый
            контракт. Выберите объём работы под свою компанию.
          </p>
        </div>
        <div className="tender-tariffs">
          {tenderTariffs.map((item, index) => (
            <article
              key={item.id}
              className={
                item.id === "monthly"
                  ? "tender-tariff featured"
                  : "tender-tariff"
              }
            >
              <div className="tender-tariff-top">
                <span>0{index + 1}</span>
                <span>{item.label}</span>
              </div>
              <h3>{item.name}</h3>
              <p className="tender-tariff-description">{item.description}</p>
              <div className="tender-tariff-price">{item.price}</div>
              <span className="tender-tariff-unit">{item.unit}</span>
              <div className="tender-tariff-percentage">
                <strong>{item.percentage}</strong>
                <p>{item.feeNote}</p>
              </div>
              <ul>
                {item.items.map((text) => (
                  <li key={text}>
                    <Check size={15} strokeWidth={1.5} />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#tender-request"
                className={`button ${item.id === "monthly" ? "button-white" : "button-outline"}`}
                onClick={() => setTariff(item.id)}
              >
                Обсудить этот тариф <ArrowUpRight size={16} />
              </a>
            </article>
          ))}
        </div>
        <p className="tender-pricing-note">
          Ориентировочные тарифы. Итоговую стоимость услуг, налоги и график
          оплаты фиксируем в коммерческом предложении и договоре. Оборудование и
          внешние расходы в тарифы не входят.
        </p>
        <div className="tender-calculator">
          <div>
            <span className="eyebrow">ПРОВЕРИМ НА ВАШИХ ЦИФРАХ</span>
            <h3>
              Сколько стоит <br />
              сопровождение?
            </h3>
            <p>
              Расчёт для одного заключённого контракта. Для отдела учитываем
              один месяц работы.
            </p>
          </div>
          <div className="tender-calculator-fields">
            <label>
              Формат работы
              <select
                value={tariff}
                onChange={(event) =>
                  setTariff(event.target.value as TenderTariffId)
                }
              >
                {tenderTariffs.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Итоговая сумма контракта, ₽
              <input
                type="number"
                inputMode="decimal"
                min="1"
                max="1000000000"
                step="0.01"
                value={contractValue}
                onChange={(event) => setContractValue(event.target.value)}
                aria-describedby="tender-calculation-note"
              />
            </label>
            <small id="tender-calculation-note">
              С НДС, если он предусмотрен контрактом. От 1 до 1 млрд ₽.
            </small>
          </div>
          <div
            className="tender-calculator-result"
            aria-live="polite"
            aria-atomic="true"
          >
            {estimate ? (
              <>
                <span>
                  {isFullCycle
                    ? "Ориентир по ставке 3%"
                    : "Стоимость сопровождения"}
                </span>
                <strong>
                  {isFullCycle ? "от " : ""}
                  {rubles.format(estimate.total)}
                </strong>
                <p>
                  {isFullCycle
                    ? "Точную ставку и этапы оплаты согласуем после оценки задачи."
                    : `${rubles.format(estimate.base)} ${tariff === "monthly" ? "за месяц" : "за подготовку"} + ${rubles.format(estimate.resultFee)} за заключённый контракт.`}
                </p>
                {tariff === "monthly" && (
                  <small>
                    За каждый дополнительный заключённый контракт вознаграждение
                    рассчитывается отдельно.
                  </small>
                )}
              </>
            ) : (
              <p>
                Укажите сумму контракта от 1 до 1 млрд ₽, чтобы увидеть расчёт.
              </p>
            )}
          </div>
        </div>
      </section>
      <section
        id="tender-request"
        className="tender-request"
        aria-labelledby="tender-request-heading"
      >
        <div className="tender-request-copy">
          <span className="eyebrow">03 / НАЧНЁМ С ВАШЕЙ ЗАДАЧИ</span>
          <h2 id="tender-request-heading">
            Есть закупка?
            <br />
            <span>Разберём вместе.</span>
          </h2>
          <p>
            Оставьте ссылку на тендер или расскажите о планах. Подготовим
            предложение с объёмом работ, бюджетом и условиями сопровождения.
          </p>
          <div className="tender-request-hint">
            <ArrowUpRight size={24} strokeWidth={1.3} />
            <p>Если срок подачи близко, укажите дату и время в комментарии.</p>
          </div>
        </div>
        {result ? (
          <div
            className="tender-success"
            ref={successRef}
            tabIndex={-1}
            role="status"
          >
            <Check size={30} />
            <span className="eyebrow">ЗАЯВКА СОХРАНЕНА</span>
            <h3>{result.number}</h3>
            <p>
              Мы получили ваш запрос на тендерное сопровождение. Контактные
              данные и выбранный тариф переданы команде.
            </p>
            <button
              className="button button-outline"
              onClick={() => setResult(null)}
            >
              Отправить ещё одну заявку
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="tender-request-form">
            <fieldset disabled={busy}>
              <div className="form-grid">
                <label className="full">
                  Название компании
                  <input
                    name="company"
                    required
                    maxLength={200}
                    autoComplete="organization"
                    placeholder="ООО «Компания»"
                  />
                </label>
                <label>
                  Как к вам обращаться
                  <input
                    name="contactName"
                    required
                    maxLength={120}
                    autoComplete="name"
                    placeholder="Имя и фамилия"
                  />
                </label>
                <label>
                  Телефон
                  <input
                    type="tel"
                    name="phone"
                    required
                    minLength={6}
                    maxLength={30}
                    autoComplete="tel"
                    placeholder="+7 000 000-00-00"
                  />
                </label>
                <label>
                  Электронная почта
                  <input
                    type="email"
                    name="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                    placeholder="name@company.ru"
                  />
                </label>
                <label>
                  Интересующий тариф
                  <select
                    name="tariff"
                    value={tariff}
                    onChange={(event) =>
                      setTariff(event.target.value as TenderTariffId)
                    }
                  >
                    {tenderTariffs.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  Ссылка на тендер{" "}
                  <span className="tender-optional">Необязательно</span>
                  <input
                    type="url"
                    name="tenderUrl"
                    maxLength={2000}
                    pattern="https?://.*"
                    placeholder="https://zakupki.gov.ru/…"
                  />
                </label>
                <label className="full">
                  Расскажите о задаче{" "}
                  <span className="tender-optional">Необязательно</span>
                  <textarea
                    name="comment"
                    rows={4}
                    maxLength={5000}
                    placeholder="Что поставляете, какой объём закупок планируете, нужна ли помощь с оборудованием и доставкой"
                  />
                </label>
              </div>
              <label className="check-label consent">
                <input name="consent" type="checkbox" required />
                <span>
                  Согласен на{" "}
                  <Link href="/privacy" target="_blank">
                    обработку данных заявки
                  </Link>{" "}
                  для подготовки предложения и связи со мной.
                </span>
              </label>
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              <button className="button" type="submit" disabled={busy}>
                {busy ? "Отправляем…" : "Обсудить сопровождение"}
                <ArrowRight size={17} />
              </button>
              <p className="tender-form-note">
                Отправка заявки не обязывает заключать договор или оплачивать
                услуги.
              </p>
            </fieldset>
          </form>
        )}
      </section>
    </>
  );
}
