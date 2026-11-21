import type { ReportData } from "./report.js";

export function formatReport(data: ReportData): string {
  const site = [
    bold(data.heading),
    "",
    bold("Сайт"),
    escapeHtml(`${people(data.siteUsers)} · ${data.siteNewUsers} нові`),
    escapeHtml(`Instagram ${data.instagram} · Facebook ${data.facebook} · Threads ${data.threads}`),
    data.viewDownload > 0 ? escapeHtml(`Перегляд блоку «Завантаж Jingle Plan» — ${people(data.viewDownload)}`) : null,
    data.androidClicks > 0 || data.apkStarts > 0 ? escapeHtml(androidLine(data.androidClicks, data.apkStarts)) : null,
    data.appStoreClicks > 0 ? escapeHtml(`Нажали «Завантажити з App Store» — ${people(data.appStoreClicks)}`) : null,
    data.buyClicks > 0 ? escapeHtml(`Нажали «Купити підписку» — ${people(data.buyClicks)}`) : null,
    escapeHtml(`Оплата — ${uah(data.siteRevenueUah)}`),
    "",
    bold("Додаток"),
    escapeHtml(`${people(data.appUsers)} · ${data.appNewUsers} нові`),
    data.appUsers > 0
      ? escapeHtml(`Android ${data.androidUsers} (${data.androidNewUsers} нові) · iOS ${data.iosUsers} (${data.iosNewUsers} нові)`)
      : null,
    data.dayOpened > 0 ? escapeHtml(`Відкрито день — ${people(data.dayOpened)}`) : null,
    data.dayCompleted > 0 ? escapeHtml(`Завершено день — ${people(data.dayCompleted)}`) : null,
    data.paywall > 0 ? escapeHtml(`Paywall — ${people(data.paywall)}`) : null,
    data.onboardingComplete > 0 || data.onboardingSkipped > 0
      ? escapeHtml(`Онбординг: завершили ${data.onboardingComplete} · пропустили ${data.onboardingSkipped}`)
      : null,
    data.subscriptionStarted > 0 ? escapeHtml(`Підписка стартувала — ${people(data.subscriptionStarted)}`) : null,
    data.promocode > 0 ? escapeHtml(`Промокод — ${people(data.promocode)}`) : null,
    escapeHtml(`Оплата — ${usd(data.appRevenueUsd)}`),
  ];
  return site.filter((line) => line !== null).join("\n");
}

function bold(value: string): string {
  return `<b>${escapeHtml(value)}</b>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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
