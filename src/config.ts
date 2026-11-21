import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

export type Config = {
  telegramToken: string;
  allowedUserIds: number[];
  supermetricsApiKey: string;
  webPropertyId: string;
  appPropertyId: string;
  timezone: string;
  dailyCron: string;
  port: number;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function loadConfig(): Config {
  const allowedUserIds = (process.env.TELEGRAM_ALLOWED_USER_IDS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item));

  return {
    telegramToken: required("TELEGRAM_BOT_TOKEN"),
    allowedUserIds,
    supermetricsApiKey: required("SUPERMETRICS_API_KEY"),
    webPropertyId: process.env.GA_WEB_PROPERTY_ID?.trim() || "564210434",
    appPropertyId: process.env.GA_APP_PROPERTY_ID?.trim() || "453785140",
    timezone: process.env.REPORT_TIMEZONE?.trim() || "Europe/Kyiv",
    dailyCron: process.env.DAILY_REPORT_CRON?.trim() || "30 9 * * *",
    port: Number(process.env.PORT ?? 8080),
  };
}
