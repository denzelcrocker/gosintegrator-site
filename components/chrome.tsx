"use client";
import Link from "next/link";
import { demoMode } from "@/lib/config";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  ChartNoAxesColumn,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "./store-provider";
export function Header() {
  const { cart, compare } = useStore();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <>
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <div className="utility">
        <span>Оборудование для бизнеса и государственных заказчиков</span>
        <Link href="/procurement">Работа с закупками</Link>
        <Link href="/about">О компании</Link>
        <Link href="/admin">Личный кабинет</Link>
      </div>
      <header className="header">
        <Link href="/" className="brand" aria-label="Айти Интегратор — главная">
          <span className="brand-mark">
            и<span>т</span>
          </span>
          <span>
            айти
            <br />
            интегратор<span className="brand-period">.</span>
          </span>
        </Link>
        <nav
          className={open ? "main-nav open" : "main-nav"}
          aria-label="Основная навигация"
        >
          <Link
            className={path === "/catalog" ? "active" : ""}
            href="/catalog"
            onClick={() => setOpen(false)}
          >
            Каталог
          </Link>
          <Link href="/catalog?ownOnly=true" onClick={() => setOpen(false)}>
            Наше производство
          </Link>
          <Link href="/procurement" onClick={() => setOpen(false)}>
            Госзакупки
          </Link>
          <Link
            href="/tender-support"
            className={path === "/tender-support" ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Тендерное сопровождение
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="/catalog?search=" aria-label="Поиск оборудования">
            <Search size={21} />
          </Link>
          <Link href="/favorites" aria-label="Избранное">
            <Heart size={21} />
          </Link>
          <Link href="/compare" aria-label="Сравнение">
            <ChartNoAxesColumn size={21} />
            {compare.length > 0 && <b>{compare.length}</b>}
          </Link>
          <Link href="/cart" className="bag-link" aria-label="Корзина">
            <ShoppingBag size={21} />
            <span>Заявка</span>
            <b>{cart.reduce((s, i) => s + i.quantity, 0)}</b>
          </Link>
          <button
            className="mobile-menu icon-button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link href="/" className="footer-logo">
          айти интегратор<span>.</span>
        </Link>
        <p>
          Технологии, на которые
          <br />
          можно положиться.
        </p>
        <div>
          <Link href="/catalog">Каталог оборудования</Link>
          <Link href="/procurement">Государственным заказчикам</Link>
          <Link href="/tender-support">Тендерное сопровождение</Link>
          <Link href="/about">О компании</Link>
        </div>
        <div>
          <Link href="/cart">Запросить предложение</Link>
          <Link href="/admin">Управление магазином</Link>
          <Link href="/privacy">Обработка данных</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Айти Интегратор</span>
        <span>
          {demoMode
            ? "Демонстрационный каталог. Цены и наличие требуют подтверждения."
            : "Цены и сроки поставки подтверждаются в коммерческом предложении."}
        </span>
        <span>Создаём основу для большего</span>
      </div>
    </footer>
  );
}
