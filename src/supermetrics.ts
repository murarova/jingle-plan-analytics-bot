import type { DateRange } from "./dates.js";

const API_URL = "https://api.supermetrics.com/query/data/json";
const STATUS_URL = "https://api.supermetrics.com/query/status";

type QueryResponse = {
  meta?: {
    status_code?: string;
    request_id?: string;
    schedule_id?: string;
    error?: { message?: string };
  };
  data?: unknown;
};

export type Table = {
  columns: string[];
  rows: string[][];
};

export class Supermetrics {
  constructor(private readonly apiKey: string) {}

  async query(accountId: string, fields: string[], range: DateRange, filter?: string): Promise<Table> {
    const response = await this.post({
      ds_id: "GAWA",
      ds_accounts: accountId,
      fields: fields.join(","),
      date_range_type: "custom",
      start_date: range.start,
      end_date: range.end,
      timezone: "Europe/Kyiv",
      max_rows: 1000,
      sync_timeout: 90,
      ...(filter ? { filter } : {}),
    });
    return toTable(response.data, fields);
  }

  private async post(query: Record<string, unknown>): Promise<QueryResponse> {
    let response = await this.request(query);
    const pending = response.meta?.status_code;
    if ((pending === "RUNNING" || pending === "SCHEDULED" || pending === "QUEUED") && response.meta?.schedule_id) {
      response = await this.wait(response.meta.schedule_id);
    }
    if (response.meta?.status_code !== "SUCCESS") {
      const message = response.meta?.error?.message ?? response.meta?.status_code ?? "query failed";
      throw new Error(message);
    }
    return response;
  }

  private async wait(scheduleId: string): Promise<QueryResponse> {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await delay(5000);
      const response = await fetch(`${STATUS_URL}?schedule_id=${encodeURIComponent(scheduleId)}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      const body = (await response.json()) as QueryResponse;
      if (body.meta?.status_code && body.meta.status_code !== "RUNNING") return body;
    }
    throw new Error("query still running");
  }

  private async request(query: Record<string, unknown>): Promise<QueryResponse> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });
    if (response.status === 429 || response.status >= 500) {
      await delay(2000);
      return this.requestOnce(query);
    }
    if (!response.ok && response.status !== 202) {
      throw new Error(await errorMessage(response));
    }
    return (await response.json()) as QueryResponse;
  }

  private async requestOnce(query: Record<string, unknown>): Promise<QueryResponse> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });
    if (!response.ok && response.status !== 202) {
      throw new Error(await errorMessage(response));
    }
    return (await response.json()) as QueryResponse;
  }
}

async function errorMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message ?? `Supermetrics HTTP ${response.status}`;
}

function toTable(data: unknown, fields: string[]): Table {
  if (!Array.isArray(data) || data.length === 0) return { columns: fields, rows: [] };
  if (!Array.isArray(data[0]) && typeof data[0] === "object" && data[0] !== null) {
    const rows = data.map((item) => fields.map((field) => cell((item as Record<string, unknown>)[field])));
    return { columns: fields, rows };
  }
  const rows = data.filter((row): row is string[] => Array.isArray(row)).map((row) => row.map(cell));
  if (rows.length === 0) return { columns: fields, rows: [] };
  const header = rows[0].map((value) => value.trim());
  const headerMatchesFields = fields.some((field) => header.includes(field));
  const headerIsLabels = header.every((value) => value !== "" && Number.isNaN(Number(value)));
  if (headerMatchesFields) return { columns: header, rows: rows.slice(1) };
  if (headerIsLabels) return { columns: fields, rows: rows.slice(1) };
  return { columns: fields, rows };
}

function cell(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function numberAt(table: Table, column: string, rowIndex = 0): number {
  const index = table.columns.indexOf(column);
  const raw = table.rows[rowIndex]?.[index] ?? "";
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function columnMap(table: Table, keyColumn: string, valueColumn: string): Map<string, number> {
  const keyIndex = table.columns.indexOf(keyColumn);
  const valueIndex = table.columns.indexOf(valueColumn);
  const map = new Map<string, number>();
  for (const row of table.rows) {
    const key = row[keyIndex] ?? "";
    const value = Number(row[valueIndex] ?? "");
    if (!key || !Number.isFinite(value)) continue;
    map.set(key, value);
  }
  return map;
}
