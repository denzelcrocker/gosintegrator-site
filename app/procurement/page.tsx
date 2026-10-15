import Link from "next/link";
import { ShieldCheck, FileText, SlidersHorizontal } from "lucide-react";
export const metadata = { title: "Оборудование для закупок" };
export default function Page() {
  return (
    <div className="page-container">
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Государственным заказчикам</span>
      </div>
      <section className="editorial-hero">
        <div>
          <span className="eyebrow">
            ОТ ТЕХНИЧЕСКОГО ЗАДАНИЯ ДО КОМПЛЕКТАЦИИ
          </span>
          <h1>
            Хорошая закупка
            <br />
            начинается
            <br />
            <span>с точного подбора.</span>
          </h1>
          <p>
            Компьютеры, серверы и периферия для рабочих мест, учреждений и
            инфраструктуры.
          </p>
          <Link href="/catalog" className="button">
            Собрать заявку
          </Link>
        </div>
        <div className="editorial-number">
          <span>ТЗ</span>
          <p>
            Ваши требования.
            <br />
            Основа нашего решения.
          </p>
        </div>
      </section>
      <div className="process-grid">
        {[
          {
            n: "01",
            title: "Соберите оборудование",
            text: "Выберите товары из каталога, укажите количество и добавьте требования закупки в комментарий.",
            Icon: SlidersHorizontal,
          },
          {
            n: "02",
            title: "Уточните документы",
            text: "Реестровая запись проверяется для конкретной модели и комплектации. Статус и дата сверки видны в карточке.",
            Icon: ShieldCheck,
          },
          {
            n: "03",
            title: "Получите предложение",
            text: "После отправки заявки менеджер подготовит спецификацию, стоимость и условия поставки.",
            Icon: FileText,
          },
        ].map(({ n, title, text, Icon }) => (
          <article key={n}>
            <div>
              <span>{n}</span>
              <Icon strokeWidth={1.3} />
            </div>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <aside className="tender-procurement-link">
        <div>
          <span className="eyebrow">УЧАСТВУЕТЕ В ТЕНДЕРАХ КАК ПОСТАВЩИК?</span>
          <h2>Передайте работу с закупками нашей команде.</h2>
        </div>
        <Link href="/tender-support" className="button button-outline">
          Тендерное сопровождение
        </Link>
      </aside>
      <section className="registry-explanation">
        <h2>Реестр — это конкретная запись.</h2>
        <p>
          Российский бренд сам по себе не подтверждает включение товара в
          реестр. Мы показываем номер записи отдельно от статуса проверки. Перед
          закупкой необходимо сверить актуальность записи и соответствие
          комплектации требованиям документации.
        </p>
        <a
          href="https://portfolio.gisp.gov.ru/pp719v2/pub/prod/"
          target="_blank"
          rel="noreferrer"
          className="underlined"
        >
          Открыть официальный реестр ГИСП
        </a>
      </section>
    </div>
  );
}
