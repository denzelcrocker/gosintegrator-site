import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store-provider";
import { Header, Footer } from "@/components/chrome";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://gosintegrator.ru"),
  title: {
    default: "Айти Интегратор — оборудование для ваших задач",
    template: "%s · Айти Интегратор",
  },
  description:
    "Компьютеры, серверы и инфраструктура для бизнеса и государственных заказчиков. Подбор оборудования и запрос коммерческого предложения.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <StoreProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
