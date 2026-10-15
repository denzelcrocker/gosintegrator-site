import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-container">
      <div className="empty">
        <span className="eyebrow">404</span>
        <h1 className="page-title">Здесь пока ничего нет.</h1>
        <p>Страница не найдена. Продолжите выбор оборудования в каталоге.</p>
        <Link href="/catalog" className="button">
          Открыть каталог
        </Link>
      </div>
    </div>
  );
}
