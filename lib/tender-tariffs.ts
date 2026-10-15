export const tenderTariffs = [
  {
    id: "one-off",
    name: "Один тендер",
    label: "ДЛЯ КОНКРЕТНОЙ ЗАКУПКИ",
    price: "9 900 ₽",
    unit: "за подготовку одной заявки",
    percentage: "+ 1% после заключения контракта",
    feeNote: "Вознаграждение за результат: от 10 000 до 100 000 ₽ за контракт.",
    description: "Когда вы уже нашли закупку и хотите пройти её с командой.",
    items: [
      "Анализ документации и расчёт участия",
      "Подготовка и подача одной заявки",
      "Торги в согласованных пределах",
      "Сопровождение заключения контракта",
    ],
  },
  {
    id: "monthly",
    name: "Тендерный отдел",
    label: "ДЛЯ РЕГУЛЯРНОГО УЧАСТИЯ",
    price: "29 900 ₽",
    unit: "в месяц · до 5 поданных заявок",
    percentage: "+ 0,5% после заключения контракта",
    feeNote: "Вознаграждение за результат: от 5 000 до 75 000 ₽ за контракт.",
    description:
      "Системная работа с закупками без собственного тендерного отдела.",
    items: [
      "Поиск закупок под профиль компании",
      "Календарь процедур и отчёт по статусам",
      "Подготовка заявок и участие в торгах",
      "Сопровождение заключения контрактов",
    ],
  },
  {
    id: "full-cycle",
    name: "До поставки",
    label: "ВЕСЬ ЦИКЛ В ОДНИХ РУКАХ",
    price: "от 3%",
    unit: "от суммы заключённого контракта",
    percentage: "Минимальное вознаграждение — 50 000 ₽",
    feeNote: "Единая плата за сопровождение. Без доплаты по другим тарифам.",
    description:
      "От оценки тендера до закупки оборудования и передачи заказчику.",
    items: [
      "Заявка, торги и заключение контракта",
      "Подбор, переговоры и закупка у поставщиков",
      "Организация доставки и контроль сроков",
      "Документы для приёмки и закрытия поставки",
    ],
  },
] as const;

export type TenderTariffId = (typeof tenderTariffs)[number]["id"];

export function estimateTenderFee(
  tariff: TenderTariffId,
  contractValue: number,
) {
  if (tariff === "one-off") {
    const resultFee = Math.min(100_000, Math.max(10_000, contractValue * 0.01));
    return { base: 9_900, resultFee, total: 9_900 + resultFee };
  }
  if (tariff === "monthly") {
    const resultFee = Math.min(75_000, Math.max(5_000, contractValue * 0.005));
    return { base: 29_900, resultFee, total: 29_900 + resultFee };
  }
  const total = Math.max(50_000, contractValue * 0.03);
  return { base: 0, resultFee: total, total };
}

export function tariffName(id: string) {
  return tenderTariffs.find((tariff) => tariff.id === id)?.name ?? id;
}
