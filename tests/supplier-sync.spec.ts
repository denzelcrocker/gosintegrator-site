import { test, expect, type Page } from "@playwright/test";

type FixtureSource = {
  code: string; name: string; ready: boolean; blockedReason: string | null;
  enabled: boolean; intervalMinutes: number; minimumIntervalMinutes: number;
  nextRunAt: string | null; lastRunAt: string | null; lastSuccessAt: string | null;
  lastStatus: string; lastError: string | null; consecutiveFailures: number; activeRunId: string | null;
};

function source(code: string, name: string, extras: Partial<FixtureSource> = {}): FixtureSource {
  return { code, name, ready: true, blockedReason: null, enabled: false,
    intervalMinutes: 360, minimumIntervalMinutes: 360, nextRunAt: null,
    lastRunAt: null, lastSuccessAt: null, lastStatus: "idle", lastError: null,
    consecutiveFailures: 0, activeRunId: null, ...extras };
}

async function setup(page: Page) {
  const state = {
    sources: [source("merlion", "MERLION"), source("treolan", "Треолан", {
      intervalMinutes: 1440, minimumIntervalMinutes: 1440, lastStatus: "failed",
      lastRunAt: "2026-10-12T10:00:00Z", lastError: "Поставщик временно недоступен. Повторим по расписанию.",
    }), source("absolut-trade", "Absolut Trade / ELKO", { ready: false, blockedReason: "Поставщик должен разрешить доступ к API." })],
    runs: [] as Record<string, unknown>[],
    reads: 0,
    failRead: false,
    failSave: false,
    saved: null as Record<string, unknown> | null,
    csrf: "",
  };
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/auth/me") return json({ email: "sync-test@example.invalid" });
    if (path === "/api/auth/csrf") return json({ token: "test-csrf" });
    if (path === "/api/admin/products") return json({ items: [], total: 0, page: 1, pageSize: 1 });
    if (path === "/api/admin/quotes" || path === "/api/admin/imports/suppliers") return json([]);
    if (path === "/api/admin/supplier-sync" && request.method() === "GET") {
      state.reads += 1;
      return state.failRead ? json({ detail: "Не удалось прочитать расписания." }, 503) : json(state.sources);
    }
    if (path === "/api/admin/supplier-sync/runs") return json(state.runs);
    if (path === "/api/admin/supplier-sync/merlion" && request.method() === "PATCH") {
      if (state.failSave) return json({ detail: "Расписание не сохранено. Повторите попытку." }, 409);
      state.saved = request.postDataJSON();
      state.csrf = request.headers()["x-csrf-token"];
      state.sources[0] = { ...state.sources[0], ...state.saved };
      return json(state.sources[0]);
    }
    if (path === "/api/admin/supplier-sync/merlion/run" && request.method() === "POST") {
      const run = { id: "run-test", supplierCode: "merlion", trigger: "manual", state: "queued",
        requestedAt: "2026-10-12T12:00:00Z", startedAt: null, finishedAt: null,
        created: null, updated: null, processed: null, summary: null, error: null };
      state.runs = [run];
      state.sources[0].activeRunId = run.id;
      return json(run, 202);
    }
    return json(null);
  });
  await page.clock.install();
  await page.goto("/admin");
  await page.getByRole("button", { name: "Поставщики и реестр", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Поставщики обновляются сами." })).toBeVisible();
  await expect(page.locator(".sync-source")).toHaveCount(3);
  return state;
}

test("supplier schedule edits survive polling and save with CSRF", async ({ page }) => {
  const state = await setup(page);
  const card = page.locator(".sync-source").filter({ has: page.getByRole("heading", { name: "MERLION", exact: true }) });
  await card.getByRole("switch").check();
  await card.getByRole("combobox").selectOption("720");
  await page.clock.fastForward(10_050);
  await expect.poll(() => state.reads).toBeGreaterThan(1);
  await expect(card.getByRole("switch")).toBeChecked();
  await expect(card.getByRole("combobox")).toHaveValue("720");
  await expect(card).toContainText("Изменения расписания ещё не сохранены.");
  await card.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(card).toContainText("Расписание сохранено.");
  expect(state.saved).toEqual({ enabled: true, intervalMinutes: 720 });
  expect(state.csrf).toBe("test-csrf");
  await expect(card.getByRole("button", { name: "Сохранить", exact: true })).toBeDisabled();
  await card.getByRole("switch").uncheck();
  await expect(card).toContainText("Выполняющееся обновление завершится.");
});

test("supplier update stays queued until the worker reports completion", async ({ page }) => {
  const state = await setup(page);
  const card = page.locator(".sync-source").filter({ has: page.getByRole("heading", { name: "MERLION", exact: true }) });
  await card.getByRole("button", { name: "Обновить сейчас", exact: true }).click();
  await expect(card).toContainText("Запуск добавлен в очередь.");
  await expect(card.getByRole("button", { name: "Запуск уже активен", exact: true })).toBeDisabled();
  await expect(card).toContainText("Ещё не было");
  await expect(page.locator(".sync-history tbody")).toContainText("В очереди");
  state.runs[0] = { ...state.runs[0], state: "completed", finishedAt: "2026-10-12T12:01:00Z", processed: 300, created: 20, updated: 280, summary: "Каталог успешно обновлён." };
  state.sources[0] = { ...state.sources[0], activeRunId: null, lastStatus: "completed", lastSuccessAt: "2026-10-12T12:01:00Z" };
  await page.clock.fastForward(10_050);
  await expect(page.locator(".sync-history tbody")).toContainText("Каталог успешно обновлён.");
  await expect(card.getByRole("button", { name: "Обновить сейчас", exact: true })).toBeEnabled();
});

test("supplier failures preserve settings and panel fits the viewport", async ({ page }, testInfo) => {
  const state = await setup(page);
  const card = page.locator(".sync-source").filter({ has: page.getByRole("heading", { name: "MERLION", exact: true }) });
  const blocked = page.locator(".sync-source").filter({ has: page.getByRole("heading", { name: "Absolut Trade / ELKO", exact: true }) });
  await expect(blocked.getByRole("switch")).toBeDisabled();
  await expect(blocked.getByRole("button", { name: "Обновить сейчас" })).toBeDisabled();
  const slow = page.getByRole("combobox", { name: "Интервал обновления Треолан" });
  await expect(slow.locator("option")).toHaveCount(1);
  await expect(slow).toHaveValue("1440");
  await card.getByRole("switch").check();
  state.failSave = true;
  await card.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(card).toContainText("Расписание не сохранено.");
  await expect(card.getByRole("switch")).toBeChecked();
  state.failRead = true;
  await page.clock.fastForward(10_050);
  await expect(page.locator(".sync-load-error")).toContainText("Не удалось прочитать расписания.");
  await expect(card.getByRole("switch")).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("supplier-sync.png"), fullPage: true });
});
