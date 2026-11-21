import type { ReportData } from "./report.js";

export function formatReport(data: ReportData): string {
  const site = [
    data.heading,
    "",
    "Сайт",
    `${people(data.siteUsers)} · ${data.siteNewUsers} нові`,
    `Instagram ${data.instagram} · Facebook ${data.facebook} · Threads ${data.threads}`,
    data.viewDownload > 0 ? `Перегляд блоку «Завантаж Jingle Plan» — ${people(data.viewDownload)}` : null,
    data.androidClicks > 0 || data.apkStarts > 0 ? androidLine(data.androidClicks, data.apkStarts) : null,
    data.appStoreClicks > 0 ? `Нажали «Завантажити з App Store» — ${people(data.appStoreClicks)}` : null,
    data.buyClicks > 0 ? `Нажали «Купити підписку» — ${people(data.buyClicks)}` : null,
    `Оплата — ${uah(data.siteRevenueUah)}`,
    "",
    "Додаток",
    `${people(data.appUsers)} · ${data.appNewUsers} нові`,
    data.appUsers > 0
      ? `Android ${data.androidUsers} (${data.androidNewUsers} нові) · iOS ${data.iosUsers} (${data.iosNewUsers} нові)`
      : null,
    data.dayOpened > 0 ? `Відкрито день — ${people(data.dayOpened)}` : null,
    data.dayCompleted > 0 ? `Завершено день — ${people(data.dayCompleted)}` : null,
    data.paywall > 0 ? `Paywall — ${people(data.paywall)}` : null,
    data.onboardingComplete > 0 || data.onboardingSkipped > 0
      ? `Онбординг: завершили ${data.onboardingComplete} · пропустили ${data.onboardingSkipped}`
      : null,
    data.subscriptionStarted > 0 ? `Підписка стартувала — ${people(data.subscriptionStarted)}` : null,
    data.promocode > 0 ? `Промокод — ${people(data.promocode)}` : null,
    `Оплата — ${usd(data.appRevenueUsd)}`,
  ];
  return site.filter((line) => line !== null).join("\n");
}

function people(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} людина`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} людини`;
  return `${count} людей`;
}

function androidLine(clicked: number, started: number): string {
  const verb = clicked === 1 ? "натиснула" : "натиснули";
  return `Кнопку Android ${verb} ${people(clicked)}, завантаження почалося у ${started}`;
}

function uah(amount: number): string {
  if (amount === 0) return "0 грн";
  const formatted = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} грн`;
}

function usd(amount: number): string {
  if (amount === 0) return "$0";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `$${formatted}`;
}
