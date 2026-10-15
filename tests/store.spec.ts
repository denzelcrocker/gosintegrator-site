import { test, expect } from "@playwright/test";
import path from "node:path";
async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin");
  await page
    .getByLabel("Электронная почта", { exact: true })
    .fill("e2e@example.invalid");
  await page
    .getByLabel("Пароль", { exact: true })
    .fill("Test-Only-E2E-Password-9Z!");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Всё начинается здесь." }),
  ).toBeVisible();
}
test("home, images and responsive layout", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Сильная основа. Большие возможности." }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(4);
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("home.png"),
    fullPage: true,
  });
});
test("catalog search, filter, comparison and favorites", async ({ page }) => {
  await page.goto("/catalog");
  await page
    .getByRole("textbox", { name: "Поиск по названию, артикулу или бренду" })
    .fill("ГРАВИТОН");
  await page.getByRole("button", { name: "Найти", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Сравнить: Гравитон KV-3 Автор", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "В избранное: Гравитон KV-3 Автор",
      exact: true,
    })
    .click();
  await page.goto("/compare");
  await expect(page.locator(".compare-table")).toContainText(
    "Гравитон KV-3 Автор",
  );
  await page.goto("/favorites");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.goto("/catalog?category=laptops");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.goto("/catalog?registryOnly=true");
  await expect(
    page.getByRole("heading", { name: "Ничего не найдено" }),
  ).toBeVisible();
});
test("quote checkout persists and reaches administration", async ({
  page,
}, testInfo) => {
  await page.goto("/catalog/icl-raybook-s1420");
  await page
    .getByRole("button", { name: "Добавить в заявку", exact: true })
    .click();
  await page.getByRole("link", { name: "Корзина", exact: true }).click();
  await page
    .getByLabel("Количество ICL Raybook S1420", { exact: true })
    .fill("2");
  await page.reload();
  await expect(
    page.getByLabel("Количество ICL Raybook S1420", { exact: true }),
  ).toHaveValue("2");
  await page
    .getByLabel("Организация", { exact: true })
    .fill(`E2E ${testInfo.project.name}`);
  await page.getByLabel("ИНН", { exact: true }).fill("7707083893");
  await page
    .getByLabel("Контактное лицо", { exact: true })
    .fill("Тестовый менеджер");
  await page.getByLabel("Телефон", { exact: true }).fill("+70000000000");
  await page
    .getByLabel("Электронная почта", { exact: true })
    .fill("test@example.invalid");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Получить предложение", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Спасибо. Задача принята." }),
  ).toBeVisible();
  await login(page);
  await page.getByRole("button", { name: /^Заявки/ }).click();
  await expect(
    page
      .locator(".quote-row")
      .filter({ hasText: `E2E ${testInfo.project.name}` }),
  ).toBeVisible();
  await page
    .locator(".quote-row")
    .filter({ hasText: `E2E ${testInfo.project.name}` })
    .locator("summary")
    .click();
  const row = page
    .locator(".quote-row")
    .filter({ hasText: `E2E ${testInfo.project.name}` });
  await row
    .getByLabel("Статус заявки", { exact: true })
    .selectOption("processing");
  await expect(row.locator("summary")).toContainText("В работе");
});
test("administrator creates edits and archives a product", async ({
  page,
}, testInfo) => {
  await login(page);
  await page.getByRole("button", { name: "Товары", exact: true }).click();
  await page
    .getByRole("button", { name: "Добавить товар", exact: true })
    .click();
  const suffix = `${testInfo.project.name}-${Date.now()}`;
  const name = `E2E Workstation ${suffix}`;
  await page.getByLabel("Название", { exact: true }).fill(name);
  await page.getByLabel("Артикул", { exact: true }).fill(`E2E-${suffix}`);
  await page
    .getByLabel("Адрес карточки", { exact: false })
    .fill(`e2e-${suffix}`);
  await page
    .getByLabel("Короткое описание", { exact: true })
    .fill("Тестовая рабочая станция");
  await page
    .getByLabel("Полное описание", { exact: true })
    .fill("Проверка создания карточки и публикации");
  await page.getByLabel("Значение 1", { exact: true }).fill("Intel Core i5");
  await page.getByLabel("Значение 2", { exact: true }).fill("16 ГБ");
  await page.getByLabel("Цена, ₽", { exact: true }).fill("50000");
  await page.getByLabel("Показывать в каталоге", { exact: true }).check();
  await page
    .getByRole("button", { name: "Сохранить товар", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ваше оборудование." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Редактировать ${name}`, exact: true })
    .click();
  await page.getByLabel("Цена, ₽", { exact: true }).fill("51000");
  await page
    .getByRole("button", { name: "Сохранить товар", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ваше оборудование." }),
  ).toBeVisible();
  await page.goto(`/catalog/e2e-${suffix}`);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.locator(".detail-price")).toContainText("51 000");
  await page.goto("/admin");
  await page.getByRole("button", { name: "Товары", exact: true }).click();
  await page
    .getByRole("button", { name: `Снять с публикации ${name}`, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Снять с публикации", exact: true })
    .click();
  await expect(page.locator("tr").filter({ hasText: name })).toContainText(
    "Черновик",
  );
  await page.goto(`/catalog/e2e-${suffix}`);
  await expect(
    page.getByRole("heading", { name: "Товар недоступен" }),
  ).toBeVisible();
});
test("supplier import validates previews and commits", async ({ page }) => {
  await login(page);
  await page
    .getByRole("button", { name: "Поставщики и реестр", exact: true })
    .click();
  await expect(page.getByText("Не подключён", { exact: true })).toHaveCount(4);
  await page
    .getByLabel("Файл", { exact: true })
    .setInputFiles(path.resolve("public/templates/supplier.json"));
  await page
    .getByRole("button", { name: "Проверить файл", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Проверка завершена" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Применить импорт", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Импорт выполнен" }),
  ).toBeVisible();
});
