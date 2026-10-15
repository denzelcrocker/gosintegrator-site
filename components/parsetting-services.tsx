import { ArrowUpRight, Check, Settings2 } from "lucide-react";
import styles from "./parsetting-services.module.css";

const services = [
  {
    id: "install",
    title: "Стандартная установка",
    price: "4 900 ₽",
    period: "один раз · до 2 часов",
    description: "Для команды с подготовленным сервером, которой нужно быстро начать работу.",
    items: ["Установка и подключение Parsetting", "Проверка первого запуска", "Короткое обучение сотрудников"],
    action: "Заказать установку",
  },
  {
    id: "implementation",
    title: "Подготовка к работе",
    price: "от 14 900 ₽",
    period: "один раз · до 6 часов",
    description: "Поможем перенести данные и настроить систему под вашу команду.",
    items: ["Стандартная установка уже включена", "Перенос данных в согласованном объёме", "Роли, справочники и обучение"],
    action: "Обсудить внедрение",
  },
  {
    id: "hourly",
    title: "Помощь по задаче",
    price: "2 500 ₽",
    period: "за час дополнительных работ",
    description: "Разберём конкретный вопрос или поможем освоить новые возможности.",
    items: ["Консультации по работе с системой", "Настройка существующих возможностей", "Обучение новых сотрудников"],
    action: "Описать задачу",
  },
  {
    id: "support",
    title: "Поддержка команды",
    price: "11 900 ₽",
    period: "5 дополнительных часов · 30 дней",
    description: "Для команд, которым нужна регулярная помощь с настройками и обучением.",
    items: ["Дополнительно к консультациям в лицензии", "Настройки, консультации и обучение", "Объём каждой задачи согласуем заранее"],
    action: "Подключить поддержку",
  },
];

export function ParsettingServices() {
  return (
    <section id="implementation" className={styles.section} aria-labelledby="implementation-heading">
      <div className={styles.header}>
        <span className="eyebrow">05 / ВНЕДРЕНИЕ И ПОДДЕРЖКА</span>
        <div className={styles.headingRow}>
          <h2 id="implementation-heading">Внедрение Parsetting<br />и поддержка команды.</h2>
          <p>Ведёте тендеры своими силами? Подготовим рабочую базу, поможем освоить систему и будем рядом, когда понадобится помощь.</p>
        </div>
        <div className={styles.productRow}>
          <span><Settings2 size={17} aria-hidden="true" /> Услуги оплачиваются отдельно от лицензии Parsetting</span>
          <a href="https://parsetting.ru/">О программе <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
      </div>
      <div className={styles.cards}>
        {services.map((service) => (
          <article key={service.id} className={`${styles.card} ${service.id === "implementation" ? styles.featured : ""}`}>
            <h3>{service.title}</h3>
            <p className={styles.description}>{service.description}</p>
            <p className={styles.price}>{service.price}</p>
            <p className={styles.period}>{service.period}</p>
            <ul>
              {service.items.map((item) => <li key={item}><Check size={15} aria-hidden="true" /><span>{item}</span></li>)}
            </ul>
            <a className={styles.action} href={`https://parsetting.ru/?service=${service.id}#implementation`}>
              {service.action}<ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
      <div className={styles.conditions}>
        <div>
          <h3>Что уже входит в подписку</h3>
          <p>В «Команде» — 30 минут консультаций в месяц, в «Отделах» — 60 минут. Дополнительные часы нужны сверх этого объёма. Разбор и исправление ошибок программы не расходуют время консультаций.</p>
        </div>
        <div>
          <h3>Сначала договоримся об объёме</h3>
          <p>До начала работ оцениваем данные и согласуем задачи. Сервер с нуля, VPN, трудоёмкая очистка данных и разработка новых функций — по отдельной смете. Для стандартной установки нужен подготовленный сервер.</p>
        </div>
        <div>
          <h3>Как работает пакет поддержки</h3>
          <p>Пять часов действуют 30 дней с согласованной даты начала. Остаток не переносится, автоматического продления нет. Отвечаем в рабочие дни; ориентир первого ответа — следующий рабочий день. Срок выполнения зависит от задачи.</p>
        </div>
      </div>
    </section>
  );
}
