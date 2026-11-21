import { Bot } from "grammy";
import cron from "node-cron";
import type { Config } from "./config.js";
import { parseRange, yesterday } from "./dates.js";
import { formatReport } from "./format.js";
import { loadReport } from "./report.js";
import { Supermetrics } from "./supermetrics.js";

const waitingForPeriod = new Set<number>();

export function createBot(config: Config): Bot {
  const bot = new Bot(config.telegramToken);
  const client = new Supermetrics(config.supermetricsApiKey);

  bot.command("start", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    if (!isAllowed(config, userId)) {
      await ctx.reply(denied(config, userId));
      return;
    }
    await ctx.reply(
      [
        "Щоденний звіт приходить о 9:30 за вчора.",
        "Свій звіт: /yesterday",
        "За період: /period 16.11.2026 20.11.2026",
      ].join("\n"),
    );
  });

  bot.command(["yesterday", "report"], async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAllowed(config, userId)) {
      if (userId) await ctx.reply(denied(config, userId));
      return;
    }
    await sendReport(ctx.api, config, client, ctx.chat.id, yesterday(config.timezone));
  });

  bot.command("period", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAllowed(config, userId)) {
      if (userId) await ctx.reply(denied(config, userId));
      return;
    }
    const range = parseRange(ctx.match, config.timezone);
    if (!range) {
      waitingForPeriod.add(userId);
      await ctx.reply("Надішліть дві дати, наприклад 16.11.2026 20.11.2026. Максимум 92 дні, не пізніше за сьогодні.");
      return;
    }
    waitingForPeriod.delete(userId);
    await sendReport(ctx.api, config, client, ctx.chat.id, range);
  });

  bot.on("message:text", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !waitingForPeriod.has(userId) || !isAllowed(config, userId)) return;
    const range = parseRange(ctx.message.text, config.timezone);
    if (!range) {
      await ctx.reply("Не бачу двох дат. Приклад: 16.11.2026 20.11.2026");
      return;
    }
    waitingForPeriod.delete(userId);
    await sendReport(ctx.api, config, client, ctx.chat.id, range);
  });

  bot.catch((error) => {
    console.error("telegram", error.message);
  });

  return bot;
}

export function scheduleDailyReport(bot: Bot, config: Config): void {
  const client = new Supermetrics(config.supermetricsApiKey);
  cron.schedule(
    config.dailyCron,
    async () => {
      const range = yesterday(config.timezone);
      for (const userId of config.allowedUserIds) {
        await sendReport(bot.api, config, client, userId, range);
      }
    },
    { timezone: config.timezone, noOverlap: true },
  );
}

async function sendReport(
  api: Bot["api"],
  config: Config,
  client: Supermetrics,
  chatId: number,
  range: { start: string; end: string },
): Promise<void> {
  await api.sendMessage(chatId, "Збираю звіт…").catch(() => undefined);
  try {
    const data = await loadReport(client, config.webPropertyId, config.appPropertyId, range);
    await api.sendMessage(chatId, formatReport(data));
  } catch (error) {
    console.error("report", error instanceof Error ? error.message : error);
    await api.sendMessage(chatId, "Не вдалося зібрати звіт. Спробуйте ще раз за хвилину.").catch(() => undefined);
  }
}

function isAllowed(config: Config, userId: number): boolean {
  return config.allowedUserIds.includes(userId);
}

function denied(config: Config, userId: number): string {
  if (config.allowedUserIds.length === 0) {
    return `Ваш Telegram id: ${userId}. Доступ ще не налаштований.`;
  }
  return "Немає доступу.";
}
