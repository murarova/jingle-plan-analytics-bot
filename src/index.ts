import { createServer } from "node:http";
import { createBot, scheduleDailyReport } from "./bot.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const bot = createBot(config);

createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("ok");
}).listen(config.port);

scheduleDailyReport(bot, config);

bot.start({
  onStart: () => {
    console.log(`bot listening, daily cron ${config.dailyCron} ${config.timezone}`);
  },
});
