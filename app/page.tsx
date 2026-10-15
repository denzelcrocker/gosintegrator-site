import Link from "next/link";
import {
  Cpu,
  Server,
  Laptop,
  Monitor,
  Network,
  Keyboard,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
  FileCheck2,
  ArrowUpRight,
} from "lucide-react";
import { FeaturedProducts } from "@/components/featured-products";
const categories = [
  { slug: "computers", name: "Компьютеры", Icon: Cpu },
  { slug: "servers", name: "Серверы и СХД", Icon: Server },
  { slug: "laptops", name: "Ноутбуки", Icon: Laptop },
  { slug: "monitors", name: "Мониторы", Icon: Monitor },
  { slug: "networking", name: "Сети", Icon: Network },
  { slug: "peripherals", name: "Периферия", Icon: Keyboard },
  { slug: "components", name: "Комплектующие", Icon: Layers },
];
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="line" />
            ТЕХНОЛОГИИ ДЛЯ ВАШИХ ЗАДАЧ
          </div>
          <h1>
            Сильная основа.
            <br />
            <span>Большие возможности.</span>
          </h1>
          <p>
            Компьютеры, серверы и инфраструктура.
            <br />
            От одного рабочего места до целой системы.
          </p>
          <div className="hero-buttons">
            <Link href="/catalog" className="button button-white">
              Выбрать оборудование
            </Link>
            <Link href="/procurement" className="text-link">
              Подобрать под закупку
            </Link>
          </div>
          <div className="hero-index">
            <span>01 / ИНФРАСТРУКТУРА</span>
            <span className="hero-index-line" />
          </div>
        </div>
        <div className="hero-object">
          <span className="object-caption">
            ИНЖЕНЕРИЯ. НАДЁЖНОСТЬ. МАСШТАБ.
          </span>
          <img
            src="/images/server.png"
            alt="Сервер ICL teamRAY"
            fetchPriority="high"
          />
          <div className="object-bottom">
            <span>
              Серверные системы
              <br />
              <strong>ICL teamRAY</strong>
            </span>
            <Link href="/catalog?category=servers">
              Изучить серию <span>+</span>
            </Link>
          </div>
        </div>
      </section>
      <section className="category-strip" aria-label="Категории оборудования">
        {categories.map(({ slug, name, Icon }) => (
          <Link href={`/catalog?category=${slug}`} key={slug}>
            <Icon strokeWidth={1.25} />
            <span>{name}</span>
          </Link>
        ))}
      </section>
      <section className="section">
        <div className="section-heading">
          <div className="eyebrow">КАТАЛОГ / ВЫБОР ИНТЕГРАТОРА</div>
          <div className="section-title">
            <h2>Техника с назначением.</h2>
            <Link href="/catalog" className="underlined">
              Весь каталог <span>+</span>
            </Link>
          </div>
        </div>
        <FeaturedProducts />
      </section>
      <section className="procurement-band">
        <div>
          <span className="eyebrow">ДЛЯ ГОСУДАРСТВЕННЫХ ЗАКАЗЧИКОВ</span>
          <h2>
            Ваша задача.
            <br />
            Наша комплектация.
          </h2>
          <p>
            Подберём оборудование под техническое задание, подготовим
            спецификацию и коммерческое предложение.
          </p>
          <Link href="/procurement" className="button button-white">
            Обсудить закупку
          </Link>
        </div>
        <div className="procurement-points">
          <article>
            <ShieldCheck />
            <div>
              <h3>Проверяем происхождение</h3>
              <p>
                Реестровая запись, срок действия и источник проверки в карточке
                оборудования.
              </p>
            </div>
          </article>
          <article>
            <SlidersHorizontal />
            <div>
              <h3>Собираем под задачу</h3>
              <p>
                Готовые платформы и собственные конфигурации для вашей
                инфраструктуры.
              </p>
            </div>
          </article>
          <article>
            <FileCheck2 />
            <div>
              <h3>Готовим спецификацию</h3>
              <p>
                Соберите заявку из каталога и передайте требования менеджеру.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section className="tender-home-band">
        <div>
          <span className="eyebrow">ТЕНДЕРНОЕ СОПРОВОЖДЕНИЕ ДЛЯ БИЗНЕСА</span>
          <h2>
            Ваш следующий контракт.
            <br />
            <span>Наша общая работа.</span>
          </h2>
        </div>
        <div>
          <p>
            Находим закупки, готовим заявки, торгуемся и организуем поставку
            оборудования. От одной процедуры до внешнего тендерного отдела.
          </p>
          <Link href="/tender-support" className="underlined">
            Форматы работы и тарифы <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="brands-section">
        <span className="eyebrow">ОБОРУДОВАНИЕ РОССИЙСКИХ ПРОИЗВОДИТЕЛЕЙ</span>
        <div>
          <Link href="/catalog?brand=ICL">
            ICL<span>ТЕХНО</span>
          </Link>
          <Link href="/catalog?brand=Аквариус">aquarius</Link>
          <Link href="/catalog?brand=Гравитон">ГРАВИТОН</Link>
          <Link href="/catalog?ownOnly=true">
            АИ<span>ИНТЕГРАТОР</span>
          </Link>
        </div>
      </section>
    </>
  );
}
