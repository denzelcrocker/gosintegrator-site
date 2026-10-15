import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
export const metadata = { title: "Каталог оборудования" };
export default function Page() {
  return (
    <Suspense fallback={<div className="loading">Загрузка каталога…</div>}>
      <Catalog />
    </Suspense>
  );
}
