import type { DateRange } from "./dates.js";
import { formatHeading } from "./dates.js";
import { Supermetrics, columnMap, numberAt, type Table } from "./supermetrics.js";

const EVENTS = "eventName,eventCount,totalUsers";

export type ReportData = {
  heading: string;
  siteUsers: number;
  siteNewUsers: number;
  instagram: number;
  facebook: number;
  threads: number;
  viewDownload: number;
  androidClicks: number;
  apkStarts: number;
  buyClicks: number;
  appStoreClicks: number;
  siteRevenueUah: number;
  appUsers: number;
  appNewUsers: number;
  androidUsers: number;
  androidNewUsers: number;
  iosUsers: number;
  iosNewUsers: number;
  dayOpened: number;
  dayCompleted: number;
  paywall: number;
  onboardingComplete: number;
  onboardingSkipped: number;
  subscriptionStarted: number;
  promocode: number;
  appRevenueUsd: number;
};

export async function loadReport(
  client: Supermetrics,
  webPropertyId: string,
  appPropertyId: string,
  range: DateRange,
): Promise<ReportData> {
  const [
    site,
    instagram,
    facebook,
    threads,
    siteEvents,
    siteMoney,
    app,
    platforms,
    appEvents,
    appMoney,
  ] = await Promise.all([
    client.query(webPropertyId, ["activeUsers", "newUsers"], range),
    client.query(webPropertyId, ["activeUsers"], range, "sessionSource =@ instagram OR sessionSource == ig OR sessionMedium =@ instagram"),
    client.query(webPropertyId, ["activeUsers"], range, "sessionSource =@ facebook OR sessionMedium =@ facebook"),
    client.query(webPropertyId, ["activeUsers"], range, "sessionSource =@ threads OR sessionMedium =@ threads"),
    client.query(webPropertyId, EVENTS.split(","), range),
    client.query(webPropertyId, ["currencyCode", "purchaseRevenue"], range, "eventName == purchase"),
    client.query(appPropertyId, ["activeUsers", "newUsers"], range),
    client.query(appPropertyId, ["platform", "activeUsers", "newUsers"], range),
    client.query(appPropertyId, EVENTS.split(","), range),
    client.query(appPropertyId, ["currencyCode", "purchaseRevenue"], range, "eventName == purchase"),
  ]);

  const siteEventUsers = columnMap(siteEvents, "eventName", "totalUsers");
  const appEventUsers = columnMap(appEvents, "eventName", "totalUsers");
  const platformRows = platforms.rows.map((row) => ({
    name: valueAt(platforms, "platform", row).toLowerCase(),
    users: Number(valueAt(platforms, "activeUsers", row)) || 0,
    fresh: Number(valueAt(platforms, "newUsers", row)) || 0,
  }));
  const android = platformRows.find((row) => row.name === "android");
  const ios = platformRows.find((row) => row.name === "ios");

  return {
    heading: formatHeading(range),
    siteUsers: numberAt(site, "activeUsers"),
    siteNewUsers: numberAt(site, "newUsers"),
    instagram: numberAt(instagram, "activeUsers"),
    facebook: numberAt(facebook, "activeUsers"),
    threads: numberAt(threads, "activeUsers"),
    viewDownload: siteEventUsers.get("view_download") ?? 0,
    androidClicks: siteEventUsers.get("click_android_download") ?? 0,
    apkStarts: siteEventUsers.get("apk_download_started") ?? 0,
    buyClicks: siteEventUsers.get("click_buy_subscription") ?? 0,
    appStoreClicks: siteEventUsers.get("click_app_store") ?? 0,
    siteRevenueUah: revenue(siteMoney, "UAH"),
    appUsers: numberAt(app, "activeUsers"),
    appNewUsers: numberAt(app, "newUsers"),
    androidUsers: android?.users ?? 0,
    androidNewUsers: android?.fresh ?? 0,
    iosUsers: ios?.users ?? 0,
    iosNewUsers: ios?.fresh ?? 0,
    dayOpened: appEventUsers.get("day_opened") ?? 0,
    dayCompleted: appEventUsers.get("day_completed") ?? 0,
    paywall: appEventUsers.get("paywall_view") ?? 0,
    onboardingComplete: appEventUsers.get("onboarding_complete") ?? 0,
    onboardingSkipped: appEventUsers.get("skip_onboarding") ?? 0,
    subscriptionStarted: appEventUsers.get("subscription_started") ?? 0,
    promocode: appEventUsers.get("promocode_applied") ?? 0,
    appRevenueUsd: revenue(appMoney, "USD"),
  };
}

function valueAt(table: Table, column: string, row: string[]): string {
  return row[table.columns.indexOf(column)] ?? "";
}

function revenue(table: Table, currency: string): number {
  const currencyIndex = table.columns.indexOf("currencyCode");
  const amountIndex = table.columns.indexOf("purchaseRevenue");
  return table.rows.reduce((sum, row) => {
    if ((row[currencyIndex] ?? "").toUpperCase() !== currency) return sum;
    const amount = Number(row[amountIndex] ?? "");
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}
