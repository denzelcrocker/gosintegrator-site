import Link from "next/link";
export const metadata = { title: "О компании" };
export default function Page() {
  return (
    <div className="page-container">
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>О компании</span>
      </div>
      <section className="editorial-hero">
        <div>
          <span className="eyebrow">АЙТИ ИНТЕГРАТОР</span>
          <h1>
            Технологии.
            <br />С пониманием
            <br />
            <span>вашей задачи.</span>
          </h1>
          <p>
            Интернет-магазин компьютерного и серверного оборудования для
            организаций и государственных заказчиков.
          </p>
          <Link href="/catalog" className="button">
            Каталог оборудования
          </Link>
        </div>
        <div className="about-image">
          <img src="/images/desktop.png" alt="Компьютерное оборудование" />
        </div>
      </section>
      <section className="registry-explanation">
        <h2>Основа вашей инфраструктуры.</h2>
        <p>
          Рабочие места, вычислительные системы, сетевое оборудование и
          комплектующие. Соберите нужную конфигурацию в каталоге и передайте
          требования в заявке.
        </p>
        <p>
          Реквизиты, адрес и контакты компании будут добавлены владельцем перед
          открытием магазина. Сейчас сайт работает с демонстрационным каталогом.
        </p>
        <Link href="/cart" className="underlined">
          Перейти к заявке
        </Link>
      </section>
    </div>
  );
}
