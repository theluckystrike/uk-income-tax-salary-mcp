// One tool registry shared by the stdio and Cloudflare Worker entries.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  AS_OF, DISCLAIMER, InputError, LOAN_PLANS, NI_CATEGORIES, PENSION_METHODS, REGIONS, SOURCES, TAX_YEARS,
  YEARS, calculateTakeHome, compareSalaries, getBands, marginalRate, moreUrl, type TakeHomeInput, type TaxYear,
} from "./core.js";

export const SERVER_NAME = "uk-income-tax-salary-mcp";
export const SERVER_VERSION = "1.0.0";

const gbp = (n: number) => {
  const d = Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2;
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};
const pct = (n: number) => `${(Math.round(n * 10000) / 100).toString()}%`;

const salary = z.number().min(0).max(100_000_000).describe("Annual gross salary in pounds (GBP), before any deductions.");
const taxYear = z.enum(TAX_YEARS).optional().describe("UK tax year, 6 April to 5 April. 2025/26 or 2026/27 (default 2026/27).");
const region = z.enum(REGIONS).optional().describe("Where you live for tax. england, wales, northern_ireland (same bands) or scotland (six Scottish bands). Default england, or taken from an S or C tax code.");
const common = {
  tax_year: taxYear,
  region,
  tax_code: z.string().max(16).optional().describe("PAYE tax code, default 1257L. Supports nnnnL/M/N/T, S and C prefixes, K codes, BR, D0, D1, SBR, SD0-SD3, 0T, NT and W1/M1/X suffixes."),
  pension_method: z.enum(PENSION_METHODS).optional().describe("relief_at_source (you pay 80%, provider adds 20%, higher-rate relief claimed back) or salary_sacrifice (cuts pay before tax, NI and student loan). Default salary_sacrifice if a pension is given."),
  pension_percent: z.number().min(0).max(100).optional().describe("Employee pension contribution as a percent of gross salary, e.g. 5. For relief at source this is the gross (grossed-up) contribution."),
  pension_amount: z.number().min(0).max(100_000_000).optional().describe("Employee pension contribution in pounds a year (gross). Use this OR pension_percent."),
  student_loan_plans: z.array(z.enum(LOAN_PLANS)).max(5).optional().describe("Student loan plans you repay: plan_1, plan_2, plan_4 (Scotland), plan_5, postgraduate. Several are allowed, as gov.uk describes."),
  ni_category: z.enum(NI_CATEGORIES).optional().describe("National Insurance category letter, default A. C = over State Pension age (no employee NI)."),
};

type Payload = Record<string, unknown>;
function reply(summary: string, data: Payload, source: string, morePath: string) {
  const body = { ...data, summary, as_of: AS_OF, source, more: moreUrl(morePath), disclaimer: DISCLAIMER };
  return {
    content: [
      { type: "text" as const, text: `${summary}\n\n${DISCLAIMER}` },
      { type: "text" as const, text: JSON.stringify(body, null, 2) },
    ],
    structuredContent: body,
  };
}

function run(fn: () => ReturnType<typeof reply>) {
  try {
    return fn();
  } catch (e) {
    const msg = e instanceof InputError ? e.message : `Unexpected error: ${(e as Error).message}`;
    return { isError: true, content: [{ type: "text" as const, text: msg }] };
  }
}

function sourcesFor(year: TaxYear | undefined, scot: boolean, loans: boolean): string {
  const y = year ?? "2026/27";
  const s = [YEARS[y].employerSource, scot ? YEARS[y].scotlandSource : SOURCES.incomeTax, SOURCES.ni];
  if (loans) s.push(SOURCES.studentLoan);
  return s.join(" ; ");
}

const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export function registerTools(server: McpServer): void {
  server.registerTool(
    "calculate_uk_take_home",
    {
      title: "UK take-home pay",
      description:
        "Calculates UK take-home pay for an employee in tax year 2025/26 or 2026/27 from HMRC's published rates: income tax by band (England, Wales and NI, or the six Scottish bands incl. the 2026/27 Scottish starter and basic bands), employee Class 1 National Insurance (8% / 2%), student loan repayments (Plan 1, 2, 4, 5 and Postgraduate, with 2026/27 thresholds), and pension by salary sacrifice or relief at source. Applies the Personal Allowance taper above £100,000 (£1 per £2, the 60% trap) and reads tax codes such as 1257L, S1257L, K475, BR and D0. Returns net pay a year, a month and a week. Figures copied from gov.uk and HMRC in Oct 2026.",
      inputSchema: { gross_salary: salary, ...common },
      annotations: { ...RO, title: "UK take-home pay" },
    },
    async (a) => run(() => {
      const r = calculateTakeHome(a as TakeHomeInput);
      const where = r.region === "scotland" ? "Scotland" : "England, Wales or NI";
      const parts = [
        `On ${gbp(r.gross_salary)} in ${r.tax_year} (${where}, code ${r.tax_code}) take-home pay is ${gbp(r.net.annual)} a year, ${gbp(r.net.monthly)} a month or ${gbp(r.net.weekly)} a week.`,
        `Income tax ${gbp(r.income_tax.total)}, National Insurance ${gbp(r.national_insurance.total)}${r.student_loan.total > 0 ? `, student loan ${gbp(r.student_loan.total)}` : ""}${r.pension.gross_contribution > 0 ? `, pension ${gbp(r.pension.gross_contribution)} (${r.pension.method.replace(/_/g, " ")})` : ""}.`,
        r.allowance_lost_to_taper > 0 ? `The £100,000 taper removes ${gbp(r.allowance_lost_to_taper)} of Personal Allowance, leaving ${gbp(r.personal_allowance)}.` : "",
      ];
      const page = r.allowance_lost_to_taper > 0 ? "/calculators/100k-tax-trap/" : r.pension.method === "salary_sacrifice" && r.pension.gross_contribution > 0 ? "/calculators/salary-sacrifice/" : "/calculators/take-home-pay/";
      const src = sourcesFor(a.tax_year, r.region === "scotland", r.student_loan.plans.length > 0) + (r.pension.method === "relief_at_source" ? ` ; ${SOURCES.pensionRelief}` : "");
      return reply(parts.filter(Boolean).join(" "), r, src, page);
    }),
  );

  server.registerTool(
    "get_uk_tax_bands",
    {
      title: "UK income tax bands and thresholds",
      description:
        "Returns the official UK income tax bands for 2025/26 or 2026/27, for England, Wales and Northern Ireland or for Scotland (starter 19%, basic 20%, intermediate 21%, higher 42%, advanced 45%, top 48%), both as taxable-income bands from HMRC's employer tables and as gross-salary bands with the standard £12,570 allowance. Also returns the £100,000 allowance taper, Class 1 NI thresholds and employee rates by category letter, and student loan thresholds for each plan. A figure that is not published is marked unannounced, never guessed. Copied from gov.uk and HMRC in Oct 2026.",
      inputSchema: {
        tax_year: z.enum(TAX_YEARS).describe("UK tax year: 2025/26 or 2026/27."),
        region: z.enum(REGIONS).describe("england, wales, northern_ireland, england_wales_ni or scotland."),
      },
      annotations: { ...RO, title: "UK income tax bands and thresholds" },
    },
    async (a) => run(() => {
      const r = getBands(a.tax_year, a.region);
      const bands = r.bands_on_gross_with_standard_allowance;
      const list = bands ? bands.slice(1).map((b) => `${b.band} ${pct(b.rate)} from ${gbp(b.from)}${b.to ? ` to ${gbp(b.to)}` : " up"}`).join("; ") : "not announced";
      const sl = r.student_loans;
      const s = `${r.region === "scotland" ? "Scottish" : "England, Wales and NI"} income tax for ${r.tax_year}, on gross pay with the standard ${gbp(r.personal_allowance)} allowance: ${list}. The allowance falls by £1 for every £2 over £100,000 and is gone at ${gbp(r.allowance_taper.allowance_gone_at)}. Employee NI is 8% from ${gbp(r.national_insurance.primary_threshold)} to ${gbp(r.national_insurance.upper_earnings_limit)} and 2% above. Student loan thresholds: Plan 1 ${gbp(sl.plan_1.threshold ?? 0)}, Plan 2 ${gbp(sl.plan_2.threshold ?? 0)}, Plan 4 ${gbp(sl.plan_4.threshold ?? 0)}, Plan 5 ${sl.plan_5.threshold ? gbp(sl.plan_5.threshold) : "none this year"}, Postgraduate ${gbp(sl.postgraduate.threshold ?? 0)}.`;
      return reply(s, r, sourcesFor(a.tax_year, r.region === "scotland", true), "/calculators/take-home-pay/");
    }),
  );

  server.registerTool(
    "compare_salaries",
    {
      title: "Compare UK salaries after tax",
      description:
        "Compares 1 to 5 UK gross salaries after income tax, National Insurance, student loan and pension for 2025/26 or 2026/27, with the same region, tax code and options for each. Shows net pay a year, month and week, effective and marginal rates, and how much of each pay rise you keep compared with the first salary. Shows when a rise lands in the £100,000 to £125,140 Personal Allowance taper (60% in England, 69.5% in Scotland in 2026/27 with NI). Uses HMRC 2025/26 and 2026/27 rates fetched in Oct 2026.",
      inputSchema: { salaries: z.array(salary).min(1).max(5).describe("1 to 5 annual gross salaries in pounds. The first is the baseline."), ...common },
      annotations: { ...RO, title: "Compare UK salaries after tax" },
    },
    async (a) => run(() => {
      const { salaries, ...rest } = a;
      const r = compareSalaries(salaries, rest as Omit<TakeHomeInput, "gross_salary">);
      const lines = r.rows.map((x) => `${gbp(x.gross_salary)} gives ${gbp(x.net_annual)} (${gbp(x.net_monthly)} a month)`).join("; ");
      const kept = r.vs_first.map((v) => `going from ${gbp(r.rows[0].gross_salary)} to ${gbp(v.gross_salary)} adds ${gbp(v.extra_net)} net${v.share_kept !== null ? `, ${pct(v.share_kept)} of the rise` : ""}`).join("; ");
      const s = `Take-home pay for ${r.tax_year}: ${lines}.${kept ? ` ${kept[0].toUpperCase()}${kept.slice(1)}.` : ""}`;
      const trap = r.rows.some((x) => x.in_allowance_taper);
      return reply(s, r, sourcesFor(a.tax_year, a.region === "scotland" || /^S/i.test(a.tax_code ?? ""), (a.student_loan_plans ?? []).length > 0), trap ? "/calculators/100k-tax-trap/" : "/calculators/take-home-pay/");
    }),
  );

  server.registerTool(
    "marginal_rate_at_income",
    {
      title: "UK marginal tax rate at a salary",
      description:
        "Returns the true UK marginal rate on the next pounds of salary in 2025/26 or 2026/27: income tax band rate, employee NI and student loan together, plus the Personal Allowance taper between £100,000 and £125,140 that makes it 60% plus NI in England, Wales and NI and 67.5% plus NI in Scotland's advanced band. Handles salary sacrifice, relief at source, Scottish bands and tax codes. Measured as the change in deductions over the next `step` pounds (default £100). Rates from gov.uk and HMRC, fetched Oct 2026.",
      inputSchema: {
        gross_salary: salary,
        ...common,
        step: z.number().min(1).max(10000).optional().describe("Size of the pay rise to measure over, in pounds (default 100)."),
      },
      annotations: { ...RO, title: "UK marginal tax rate at a salary" },
    },
    async (a) => run(() => {
      const { step, ...rest } = a;
      const r = marginalRate(rest as TakeHomeInput, step ?? 100);
      const c = r.components;
      const s = `At ${gbp(r.gross_salary)} in ${r.tax_year} (${r.region === "scotland" ? "Scotland" : "England, Wales or NI"}) the marginal rate on the next ${gbp(r.step)} is ${pct(r.marginal_rate)}: income tax ${pct(c.income_tax)}, National Insurance ${pct(c.national_insurance)}${c.student_loan > 0 ? `, student loan ${pct(c.student_loan)}` : ""}. ${r.in_allowance_taper ? `This income is inside the £100,000 to £125,140 taper: each extra £1 also removes ${gbp(r.allowance_lost_per_pound)} of Personal Allowance, so the ${pct(r.current_band.rate)} band works out at ${pct(c.income_tax)}. ` : ""}You keep ${gbp(r.kept_per_100_pounds)} of each extra £100${r.pension_per_pound > 0 ? " after pension" : ""}.`;
      return reply(s, r, sourcesFor(a.tax_year, r.region === "scotland", (a.student_loan_plans ?? []).length > 0) + ` ; ${SOURCES.adjustedNetIncome}`, r.in_allowance_taper ? "/calculators/100k-tax-trap/" : "/calculators/marginal-tax-rate/");
    }),
  );
}

export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerTools(server);
  return server;
}
