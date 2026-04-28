import Papa from "papaparse";
import crypto from "crypto";

export interface ParsedTransaction {
  accountingDate: Date;
  valueDate: Date;
  description: string;
  merchant: string;
  merchantCountry: string;
  accountNumber: string;
  transactionType: string;
  reference: string;
  debit: number | null;
  credit: number | null;
  category: string;
  transactionDate: Date;
  transactionTime: string;
  importHash: string;
}

export interface ParsedCSV {
  iban: string;
  label: string;
  currency: string;
  transactions: ParsedTransaction[];
}

function parseEuropeanFloat(val: string): number | null {
  if (!val || val.trim() === "") return null;
  // "1.234,56" -> 1234.56  or  "240,93" -> 240.93
  const cleaned = val.trim().replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDate(val: string): Date {
  // "02.03.2026" -> Date
  const [d, m, y] = val.trim().split(".");
  return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
}

function stripHtml(val: string): string {
  return val.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim();
}

function extractCountry(merchant: string): { country: string; name: string } {
  // "BGR SOFIA FANTASTICO GROUP LTD" -> country: "BGR", name: "SOFIA FANTASTICO GROUP LTD"
  const match = merchant.match(/^([A-Z]{2,3})\s+(.+)$/);
  if (match) {
    return { country: match[1], name: match[2].trim() };
  }
  return { country: "", name: merchant.trim() };
}

const CATEGORY_RULES: { match: RegExp; category: string }[] = [
  { match: /КОМУНАЛНИ|ВИВАКОМ|VIVACOM|ТЕЛЕКОМУНИКАЦИЯ|ЕЛЕКТРО|ВИК|ВОДА|ТЕЦ|ТОПЛОФ|GAS|UTILITY/i, category: "Utilities" },
  { match: /ЗАЕМ|КРЕДИТ|LOAN|MORTGAGE/i, category: "Loan" },
  { match: /ТЕГЛЕНЕ|ATM|CASH/i, category: "Cash" },
  { match: /REVOLUT|P2P/i, category: "Transfers" },
  { match: /APPLE|NETFLIX|SPOTIFY|YOUTUBE|GOOGLE|MICROSOFT|ADOBE|AMAZON|SUBSCRIPTION/i, category: "Subscriptions" },
  { match: /PETROL|FUEL|БЕНЗИН|SHELL|OMV|BP |REPSOL|ГАЗ/i, category: "Fuel" },
  { match: /TRANSIT|METRO|BUS|ТАКСИ|TAXI|UBER|BOLT|TRAIN|RAILWAY|MOSKO/i, category: "Transport" },
  { match: /SUPERMARKET|KAUFLAND|LIDL|BILLA|FANTASTICO|SPAR|CARREFOUR|MARKET|МАГАЗИН|ХРАНИТ/i, category: "Groceries" },
  { match: /RESTAURANT|CAFE|COFFEE|BAR|FOOD|PIZZA|БИСТРО|РЕСТОРАН|GOZBA|BUREK|BISTRO|PAVILLON/i, category: "Dining" },
  { match: /PHARMACY|АПТЕКА|DOCTOR|HOSPITAL|MEDICAL/i, category: "Health" },
  { match: /INSURANCE|ЗАСТРАХОВ|ГЕНЕРАЛИ|ALLIANZ|DZI/i, category: "Insurance" },
  { match: /ТАКСА|FEE|CHARGE/i, category: "Bank Fees" },
  { match: /HOTEL|AIRBNB|BOOKING\.COM|HOSTEL/i, category: "Accommodation" },
  { match: /TRAVEL|FLIGHT|AIRLINE|RYANAIR|WIZZAIR|EASYJET/i, category: "Travel" },
  { match: /TRANSFER|ПРЕВОД/i, category: "Transfers" },
];

function categorize(description: string, merchant: string, type: string, holderName: string): string {
  // Own-name merchant = transfer to own account, not an expense
  if (holderName && merchant.toUpperCase() === holderName.toUpperCase()) {
    return "Internal Transfer";
  }
  const text = `${description} ${merchant} ${type}`.toUpperCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(text)) return rule.category;
  }
  return "Other";
}

export function parseCSV(csvText: string): ParsedCSV {
  const result = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  const rows = result.data as string[][];

  // Extract metadata from header rows
  let iban = "";
  let currency = "EUR";
  let holderName = "";

  for (const row of rows.slice(0, 13)) {
    const key = row[0]?.trim() ?? "";
    const val = row[1]?.trim() ?? "";
    if (key === "Сметка" || key.toLowerCase() === "сметка") {
      const parts = val.split(" ");
      iban = parts[0] ?? val;
      currency = parts[1] ?? "EUR";
    }
    if (key === "ИМЕ НА ТИТУЛЯР" || key.toUpperCase().includes("ТИТУЛЯР")) {
      holderName = val;
    }
  }

  if (!iban) {
    throw new Error("Could not find account IBAN in CSV header");
  }

  // Row at index 13 (0-based) is the column header row
  // Transactions start at index 14
  const transactions: ParsedTransaction[] = [];

  for (const row of rows.slice(14)) {
    if (!row[0] || row[0].trim() === "") continue;

    const accountingDateStr = row[0]?.trim() ?? "";
    const valueDateStr = row[1]?.trim() ?? "";
    const rawDescription = row[2]?.trim() ?? "";
    const rawMerchant = row[3]?.trim() ?? "";
    const accountNumber = row[4]?.trim() ?? "";
    const transactionType = row[5]?.trim() ?? "";
    const reference = row[6]?.trim() ?? "";
    const debitStr = row[9]?.trim() ?? "";
    const creditStr = row[10]?.trim() ?? "";
    const dateStr = row[11]?.trim() ?? "";
    const timeStr = row[12]?.trim() ?? "";

    const description = stripHtml(rawDescription);
    const { country: merchantCountry, name: merchant } = extractCountry(rawMerchant);
    const debit = parseEuropeanFloat(debitStr);
    const credit = parseEuropeanFloat(creditStr);

    let accountingDate: Date;
    let valueDate: Date;
    let transactionDate: Date;

    try {
      accountingDate = parseDate(accountingDateStr);
      valueDate = parseDate(valueDateStr);
      transactionDate = parseDate(dateStr || accountingDateStr);
    } catch {
      continue;
    }

    const category = categorize(description, merchant, transactionType, holderName);

    const hashSource = `${accountingDateStr}|${rawDescription}|${debitStr}|${creditStr}|${iban}`;
    const importHash = crypto.createHash("sha256").update(hashSource).digest("hex");

    transactions.push({
      accountingDate,
      valueDate,
      description,
      merchant,
      merchantCountry,
      accountNumber,
      transactionType,
      reference,
      debit,
      credit,
      category,
      transactionDate,
      transactionTime: timeStr,
      importHash,
    });
  }

  const label = `${iban.slice(0, 4)}...${iban.slice(-4)} ${currency}`;

  return { iban, label, currency, transactions };
}
