import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import { TenderRequest } from "@/components/tender-request";
import { ParsettingServices } from "@/components/parsetting-services";

export const metadata = {
  title: "Тендерное сопровождение для бизнеса",
  description:
    "Тендерный отдел для вашей компании: поиск закупок, подготовка заявок, торги, закупка оборудования и организация поставки. Тарифы и расчёт стоимости сопровождения.",
};

const stages = [
  {
    title: "Находим и считаем",
    text: "Подбираем закупки, разбираем требования и сроки. Считаем закупочную стоимость, расходы и плановую прибыль до решения об участии.",
  },
  {
    title: "Готовим и подаём",
    text: "Собираем документы, проверяем характеристики оборудования, готовим запросы разъяснений и подаём заявку в установленный срок.",
  },
  {
    title: "Торгуемся",
    text: "Согласуем минимальную цену и стратегию. Участвуем в торгах и переторжках в пределах вашего бюджета, сопровождаем заключение контракта.",
  },
  {
    title: "Закупаем и поставляем",
    text: "Согласуем предложения поставщиков, организуем резерв и закупку оборудования, доставку, приёмку и комплект закрывающих документов.",
  },
];

export default function TenderSupportPage() {
  return (
    <div className="page-container tender-page">
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Тендерное сопровождение</span>
      </div>
      <section className="tender-hero">
        <div className="tender-hero-copy">
          <span className="eyebrow">
            ДЛЯ КОМПАНИЙ, КОТОРЫЕ УЧАСТВУЮТ В ЗАКУПКАХ
          </span>
          <h1>
            Ваш бизнес.
            <br />
            Наш тендерный
            <br />
            <span>отдел.</span>
          </h1>
          <p>
            Берём на себя работу с тендерами — от первой заявки до поставки. Вы
            принимаете решения. Мы ведём процесс.
          </p>
          <div className="tender-hero-actions">
            <a href="#tender-request" className="button">
              Обсудить задачу <ArrowUpRight size={17} />
            </a>
            <a href="#tender-tariffs" className="underlined">
              Смотреть тарифы <ArrowDown size={16} />
            </a>
            <a href="#implementation" className="underlined">
              Внедрение Parsetting <ArrowDown size={16} />
            </a>
          </div>
          <div className="tender-specialization">
            Компьютеры / Серверы / Комплектующие / Периферия
          </div>
        </div>
        <div
          className="tender-route"
          aria-label="Этапы сопровождения: задача, заявка, торги, поставка"
        >
          <div className="tender-route-top">
            <span>АЙТИ ИНТЕГРАТОР</span>
            <span>ПОЛНЫЙ ЦИКЛ</span>
          </div>
          <div className="tender-route-line">
            {["Задача", "Заявка", "Торги", "Поставка"].map((title, i) => (
              <div key={title}>
                <span className="tender-route-node">
                  {i === 3 ? <Check size={19} /> : `0${i + 1}`}
                </span>
                <strong>{title}</strong>
                {i === 3 && (
                  <small>
                    До результата в документах
                    <br />и оборудования у заказчика.
                  </small>
                )}
              </div>
            ))}
          </div>
          <p>
            Одна команда.
            <br />
            На каждом этапе.
          </p>
        </div>
      </section>
      <section className="tender-scope" aria-labelledby="tender-scope-heading">
        <div className="tender-section-head">
          <span className="eyebrow">01 / ЧТО МЫ ДЕЛАЕМ</span>
          <h2 id="tender-scope-heading">
            От возможности
            <br />к исполненному контракту.
          </h2>
          <p>
            Работаем с закупками по 44-ФЗ, 223-ФЗ и коммерческими процедурами.
            Объём сопровождения зависит от выбранного тарифа.
          </p>
        </div>
        <div className="tender-stages">
          {stages.map((stage, index) => (
            <article key={stage.title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{stage.title}</h3>
                <p>{stage.text}</p>
              </div>
              <ArrowUpRight size={22} strokeWidth={1.25} />
            </article>
          ))}
        </div>
      </section>
      <TenderRequest />
      <section className="tender-faq" aria-labelledby="tender-faq-heading">
        <div>
          <span className="eyebrow">04 / ПЕРЕД СТАРТОМ</span>
          <h2 id="tender-faq-heading">
            Договоримся
            <br />
            на берегу.
          </h2>
        </div>
        <div>
          <details>
            <summary>Кто решает, участвовать ли в тендере?</summary>
            <p>
              Вы. Мы готовим расчёт, отмечаем требования и риски, а вы
              утверждаете участие, бюджет и минимальную цену в торгах. Действуем
              от имени вашей компании в пределах оформленных полномочий.
            </p>
          </details>
          <details>
            <summary>Что оплачивается отдельно?</summary>
            <p>
              Оборудование, перевозка, страхование, услуги электронных площадок,
              обеспечение заявки и контракта, банковские гарантии и
              финансирование оплачиваются отдельно по согласованной смете. Тариф
              «До поставки» покрывает работу команды по организации этих
              процессов.
            </p>
          </details>
          <details>
            <summary>Когда начисляется процент?</summary>
            <p>
              В тарифах «Один тендер» и «Тендерный отдел» — только после
              заключения контракта. База расчёта — его итоговая сумма с НДС,
              если он предусмотрен контрактом, а не начальная цена закупки.
              Подготовка заявки и ежемесячная работа оплачиваются независимо от
              результата.
            </p>
          </details>
          <details>
            <summary>Как считается месяц сопровождения?</summary>
            <p>
              В тариф «Тендерный отдел» входит до пяти поданных заявок за
              календарный месяц. Неиспользованные заявки не переносятся.
              Дополнительные процедуры и неполный первый месяц согласуем
              отдельно до начала работ.
            </p>
          </details>
          <details>
            <summary>Как оплачивается полный цикл?</summary>
            <p>
              Стоимость начинается от 3% итоговой суммы контракта, минимум 50
              000 ₽. Точная ставка, объём работ и поэтапный график оплаты
              фиксируются в предложении и договоре. Платы за подготовку и
              дополнительных процентов из других тарифов нет.
            </p>
          </details>
          <details>
            <summary>Можно передать вам уже найденную закупку?</summary>
            <p>
              Да. Пришлите ссылку на процедуру, сроки и краткое описание задачи.
              Сначала проверим, успеваем ли подготовить документы и обеспечить
              поставку. Победу в торгах обещать нельзя; план работ и условия
              оплаты закрепим до старта.
            </p>
          </details>
        </div>
      </section>
      <ParsettingServices />
    </div>
  );
}
