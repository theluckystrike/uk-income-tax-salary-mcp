// Pure UK income tax / take-home engine. No I/O. Every figure below was copied from
// gov.uk or HMRC pages fetched on 2026-10-30 (see DATA_SOURCES.md).
export const AS_OF = "2026-10-30";
export const SITE = "https://ukmoneycalc.com";
export const REPO = "uk-income-tax-salary-mcp";
export const DISCLAIMER = "Estimate for one employment, worked out on annual figures. Payroll works per pay period, so a payslip can differ by a few pounds. Not tax advice.";
export const SOURCES = {
    incomeTax: "https://www.gov.uk/income-tax-rates",
    incomeTaxPrevious: "https://www.gov.uk/income-tax-rates/previous-tax-years",
    scottish: "https://www.gov.uk/scottish-income-tax",
    scottish2025: "https://www.gov.uk/scottish-income-tax/2025-to-2026-tax-year",
    ni: "https://www.gov.uk/national-insurance-rates-letters",
    studentLoan: "https://www.gov.uk/repaying-your-student-loan/what-you-pay",
    employers2025: "https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026",
    employers2026: "https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027",
    pensionRelief: "https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief",
    adjustedNetIncome: "https://www.gov.uk/guidance/adjusted-net-income",
    taxCodes: "https://www.gov.uk/tax-codes",
};
export function moreUrl(path) {
    return `${SITE}${path}?utm_source=mcp&utm_medium=${REPO}`;
}
export class InputError extends Error {
}
export const TAX_YEARS = ["2025/26", "2026/27"];
export const REGIONS = ["england", "wales", "northern_ireland", "england_wales_ni", "scotland"];
export const LOAN_PLANS = ["plan_1", "plan_2", "plan_4", "plan_5", "postgraduate"];
export const NI_CATEGORIES = ["A", "B", "C", "H", "J", "M", "V", "Z"];
export const PENSION_METHODS = ["none", "relief_at_source", "salary_sacrifice"];
const RUK = [
    { name: "basic", rate: 0.2, upTo: 37700 },
    { name: "higher", rate: 0.4, upTo: 125140 },
    { name: "additional", rate: 0.45, upTo: null },
];
export const YEARS = {
    "2025/26": {
        year: "2025/26",
        employerSource: SOURCES.employers2025,
        personalAllowance: 12570,
        taperStart: 100000,
        rUK: RUK,
        scotland: [
            { name: "starter", rate: 0.19, upTo: 2827 },
            { name: "basic", rate: 0.2, upTo: 14921 },
            { name: "intermediate", rate: 0.21, upTo: 31092 },
            { name: "higher", rate: 0.42, upTo: 62430 },
            { name: "advanced", rate: 0.45, upTo: 125140 },
            { name: "top", rate: 0.48, upTo: null },
        ],
        scotlandSource: SOURCES.scottish2025,
        ni: { lel: 6500, pt: 12570, uel: 50270, weekly: { pt: 242, uel: 967 }, monthly: { pt: 1048, uel: 4189 } },
        loans: {
            plan_1: { threshold: 26065, rate: 0.09, status: "published" },
            plan_2: { threshold: 28470, rate: 0.09, status: "published" },
            plan_4: { threshold: 32745, rate: 0.09, status: "published" },
            plan_5: { threshold: null, rate: 0.09, status: "not_set", note: "HMRC's 2025 to 2026 employer rates list no Plan 5 threshold, so no Plan 5 deductions are taken in 2025/26. The first Plan 5 threshold (£25,000) is in the 2026 to 2027 table." },
            postgraduate: { threshold: 21000, rate: 0.06, status: "published" },
        },
    },
    "2026/27": {
        year: "2026/27",
        employerSource: SOURCES.employers2026,
        personalAllowance: 12570,
        taperStart: 100000,
        rUK: RUK,
        scotland: [
            { name: "starter", rate: 0.19, upTo: 3967 },
            { name: "basic", rate: 0.2, upTo: 16956 },
            { name: "intermediate", rate: 0.21, upTo: 31092 },
            { name: "higher", rate: 0.42, upTo: 62430 },
            { name: "advanced", rate: 0.45, upTo: 125140 },
            { name: "top", rate: 0.48, upTo: null },
        ],
        scotlandSource: SOURCES.scottish,
        ni: { lel: 6708, pt: 12570, uel: 50270, weekly: { pt: 242, uel: 967 }, monthly: { pt: 1048, uel: 4189 } },
        loans: {
            plan_1: { threshold: 26900, rate: 0.09, status: "published" },
            plan_2: { threshold: 29385, rate: 0.09, status: "published" },
            plan_4: { threshold: 33795, rate: 0.09, status: "published" },
            plan_5: { threshold: 25000, rate: 0.09, status: "published" },
            postgraduate: { threshold: 21000, rate: 0.06, status: "published" },
        },
    },
};
/** Employee (primary) Class 1 rates: [PT to UEL, above UEL]. From the HMRC employer tables. */
export const NI_RATES = {
    A: { main: 0.08, upper: 0.02, note: "standard rate" },
    B: { main: 0.0185, upper: 0.02, note: "married women and widows reduced rate" },
    C: { main: 0, upper: 0, note: "over State Pension age, no employee NI" },
    H: { main: 0.08, upper: 0.02, note: "apprentice under 25" },
    J: { main: 0.02, upper: 0.02, note: "deferment" },
    M: { main: 0.08, upper: 0.02, note: "under 21" },
    V: { main: 0.08, upper: 0.02, note: "veteran" },
    Z: { main: 0.02, upper: 0.02, note: "under 21, deferment" },
};
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export function yearData(y) {
    const d = YEARS[y];
    if (!d)
        throw new InputError(`Unknown tax year "${y}". Use one of: ${TAX_YEARS.join(", ")}.`);
    return d;
}
export function normaliseRegion(r) {
    if (r === undefined)
        return undefined;
    return r === "scotland" ? "scotland" : "rUK";
}
export function bandsFor(d, region) {
    if (region === "rUK")
        return d.rUK;
    if (!d.scotland)
        throw new InputError(`Scottish income tax bands for ${d.year} are unannounced. They are not invented here.`);
    return d.scotland;
}
/** Personal Allowance after the taper: £1 off for every complete £2 of adjusted net income over £100,000. */
export function taperedAllowance(allowance, adjustedNetIncome, taperStart = 100000) {
    if (allowance <= 0 || adjustedNetIncome <= taperStart)
        return allowance;
    const reduction = Math.floor((adjustedNetIncome - taperStart) / 2);
    return Math.max(0, allowance - reduction);
}
const FLAT = {
    BR: { band: "basic" }, D0: { band: "higher" }, D1: { band: "additional" },
    CBR: { band: "basic", region: "rUK" }, CD0: { band: "higher", region: "rUK" }, CD1: { band: "additional", region: "rUK" },
    SBR: { band: "basic", region: "scotland" }, SD0: { band: "intermediate", region: "scotland" },
    SD1: { band: "higher", region: "scotland" }, SD2: { band: "advanced", region: "scotland" }, SD3: { band: "top", region: "scotland" },
};
export function parseTaxCode(raw) {
    let code = raw.toUpperCase().replace(/\s+/g, "");
    let emergency = false;
    const em = code.match(/^(.*?)(W1|M1|X|NONCUM)$/);
    if (em && em[1].length > 0) {
        code = em[1];
        emergency = true;
    }
    if (FLAT[code]) {
        const f = FLAT[code];
        return { code, kind: "flat", allowance: 0, flatBand: f.band, region: f.region, emergency, meaning: `All income from this job is taxed at the ${f.band} rate, with no allowance.` };
    }
    let region;
    let body = code;
    if (/^[SC]/.test(code) && code.length > 1 && !/^[SC]$/.test(code)) {
        region = code[0] === "S" ? "scotland" : "rUK";
        body = code.slice(1);
    }
    if (body === "NT")
        return { code, kind: "no_tax", allowance: 0, region, emergency, meaning: "No tax is taken from this income." };
    if (body === "0T")
        return { code, kind: "zero_t", allowance: 0, region, emergency, meaning: "No Personal Allowance on this job; all income is taxed through the normal bands." };
    let m = body.match(/^(\d{1,5})([LMNT])$/);
    if (m) {
        const allowance = Number(m[1]) * 10;
        const letter = { L: "standard Personal Allowance", M: "Marriage Allowance received", N: "Marriage Allowance transferred out", T: "other adjustments" }[m[2]];
        return { code, kind: "allowance", allowance, region, emergency, meaning: `Tax-free amount £${allowance.toLocaleString("en-GB")} a year (${letter}).` };
    }
    m = body.match(/^K(\d{1,5})$/);
    if (m) {
        const add = Number(m[1]) * 10;
        return { code, kind: "k", allowance: -add, region, emergency, meaning: `K code: £${add.toLocaleString("en-GB")} is added to taxable pay.` };
    }
    throw new InputError(`Tax code "${raw}" is not recognised. Examples: 1257L, S1257L, C1257L, K475, BR, D0, SD1, 0T, NT, 1257L M1.`);
}
/** Income tax on taxable income over the bands, with a per-band split. */
export function taxOverBands(taxable, bands) {
    let prev = 0;
    let total = 0;
    const rows = [];
    for (const b of bands) {
        const top = b.upTo ?? Infinity;
        const inBand = Math.max(0, Math.min(taxable, top) - prev);
        const tax = inBand * b.rate;
        total += tax;
        rows.push({ band: b.name, rate: b.rate, from: prev, to: b.upTo, income_in_band: r2(inBand), tax: r2(tax) });
        prev = top;
    }
    return { total, rows };
}
/** Employee Class 1 NI on annual earnings (annual thresholds). */
export function annualNi(earnings, d, cat = "A") {
    const r = NI_RATES[cat];
    const main = Math.max(0, Math.min(earnings, d.ni.uel) - d.ni.pt) * r.main;
    const upper = Math.max(0, earnings - d.ni.uel) * r.upper;
    return main + upper;
}
/** Employee Class 1 NI for one pay period with the period thresholds. */
export function periodNi(earnings, period, y, cat = "A") {
    const d = yearData(y);
    const t = period === "week" ? d.ni.weekly : d.ni.monthly;
    const r = NI_RATES[cat];
    return r2(Math.max(0, Math.min(earnings, t.uel) - t.pt) * r.main + Math.max(0, earnings - t.uel) * r.upper);
}
/** 9% over the lowest undergraduate threshold held, plus 6% over the postgraduate threshold (gov.uk). */
export function studentLoans(earnings, plans, d) {
    const uniq = [...new Set(plans)];
    const rows = [];
    const ug = uniq.filter((p) => p !== "postgraduate");
    for (const p of uniq) {
        const l = d.loans[p];
        if (l.threshold === null)
            throw new InputError(`${p.replace("_", " ")} has no repayment threshold for ${d.year}: ${l.note ?? "not published"}`);
    }
    if (ug.length > 0) {
        const lowest = ug.reduce((a, b) => (d.loans[a].threshold <= d.loans[b].threshold ? a : b));
        const t = d.loans[lowest].threshold;
        rows.push({ plan: lowest, threshold: t, rate: 0.09, repayment: r2(Math.max(0, earnings - t) * 0.09) });
    }
    if (uniq.includes("postgraduate")) {
        const t = d.loans.postgraduate.threshold;
        rows.push({ plan: "postgraduate", threshold: t, rate: 0.06, repayment: r2(Math.max(0, earnings - t) * 0.06) });
    }
    return { total: rows.reduce((s, x) => s + Math.max(0, earnings - x.threshold) * x.rate, 0), rows };
}
/** Extra relief a relief-at-source saver claims: (rate - 20%) on the top slices of income taxed above 20%. */
export function rasExtraRelief(rows, grossContribution) {
    let left = grossContribution;
    let relief = 0;
    for (let i = rows.length - 1; i >= 0 && left > 0; i--) {
        const row = rows[i];
        if (row.rate <= 0.2 || row.income_in_band <= 0)
            continue;
        const slice = Math.min(left, row.income_in_band);
        relief += slice * (row.rate - 0.2);
        left -= slice;
    }
    return relief;
}
export function calculateTakeHome(input) {
    const gross = input.gross_salary;
    if (!Number.isFinite(gross) || gross < 0)
        throw new InputError("gross_salary must be a number of pounds, 0 or more.");
    const year = input.tax_year ?? "2026/27";
    const d = yearData(year);
    const notes = [];
    const code = parseTaxCode(input.tax_code ?? "1257L");
    if (code.emergency)
        notes.push("Emergency code suffix (W1/M1/X) ignored: this is an annual calculation, as if pay were cumulative.");
    const askedRegion = normaliseRegion(input.region);
    if (askedRegion && code.region && askedRegion !== code.region) {
        throw new InputError(`Tax code ${code.code} is a ${code.region === "scotland" ? "Scottish (S)" : "Welsh (C)"} code but region is "${input.region}". Make them match.`);
    }
    const region = askedRegion ?? code.region ?? "rUK";
    const bands = bandsFor(d, region);
    const method = input.pension_method ?? (input.pension_percent || input.pension_amount ? "salary_sacrifice" : "none");
    if (input.pension_percent !== undefined && input.pension_amount !== undefined)
        throw new InputError("Give pension_percent or pension_amount, not both.");
    const pensionGross = method === "none" ? 0
        : input.pension_amount !== undefined ? input.pension_amount
            : gross * (input.pension_percent ?? 0) / 100;
    if (pensionGross > gross)
        throw new InputError("The pension contribution cannot be more than the gross salary.");
    const sacrifice = method === "salary_sacrifice" ? pensionGross : 0;
    const ras = method === "relief_at_source" ? pensionGross : 0;
    const pay = gross - sacrifice; // salary sacrifice cuts pay for tax, NI and student loan
    const ani = pay - ras; // relief at source: take off the grossed-up contribution
    let allowance = code.allowance;
    let taperReduction = 0;
    if (code.kind === "allowance") {
        allowance = taperedAllowance(code.allowance, ani, d.taperStart);
        taperReduction = code.allowance - allowance;
        if (taperReduction > 0)
            notes.push(`Adjusted net income £${r2(ani).toLocaleString("en-GB")} is over £100,000, so the allowance falls by £${taperReduction.toLocaleString("en-GB")} (£1 for every £2).`);
    }
    let taxable = 0;
    let tax = { total: 0, rows: [] };
    if (code.kind === "no_tax") {
        notes.push("NT code: no income tax.");
    }
    else if (code.kind === "flat") {
        const b = bands.find((x) => x.name === code.flatBand);
        if (!b)
            throw new InputError(`Tax code ${code.code} uses the ${code.flatBand} band, which does not exist in ${region === "scotland" ? "Scotland" : "England, Wales and NI"}.`);
        taxable = pay;
        tax = { total: pay * b.rate, rows: [{ band: b.name, rate: b.rate, from: 0, to: null, income_in_band: r2(pay), tax: r2(pay * b.rate) }] };
    }
    else {
        taxable = Math.max(0, pay - allowance);
        tax = taxOverBands(taxable, bands);
    }
    const extraRelief = ras > 0 && code.kind !== "flat" && code.kind !== "no_tax" ? rasExtraRelief(tax.rows, ras) : 0;
    const incomeTax = tax.total - extraRelief;
    const cat = input.ni_category ?? "A";
    const ni = annualNi(pay, d, cat);
    const loans = studentLoans(pay, input.student_loan_plans ?? [], d);
    const rasNetPaid = ras * 0.8; // you pay 80%, the provider claims 20% (relief at source)
    const net = pay - incomeTax - ni - loans.total - rasNetPaid;
    if (ras > 0)
        notes.push(`Relief at source: you pay £${r2(rasNetPaid).toLocaleString("en-GB")}, your provider adds 20%, total £${r2(ras).toLocaleString("en-GB")}.${extraRelief > 0 ? ` You claim the extra £${r2(extraRelief).toLocaleString("en-GB")} through Self Assessment or your tax code; it is included in net pay here.` : ""}`);
    if (sacrifice > 0)
        notes.push("Salary sacrifice lowers the pay used for income tax, NI and student loan.");
    return {
        tax_year: year,
        region: region === "scotland" ? "scotland" : "england_wales_ni",
        tax_code: code.code,
        tax_code_meaning: code.meaning,
        gross_salary: r2(gross),
        pension: {
            method,
            gross_contribution: r2(pensionGross),
            salary_sacrificed: r2(sacrifice),
            relief_at_source_paid_from_net_pay: r2(rasNetPaid),
            relief_at_source_extra_relief: r2(extraRelief),
        },
        pay_after_salary_sacrifice: r2(pay),
        adjusted_net_income: r2(ani),
        personal_allowance: code.kind === "allowance" ? allowance : code.kind === "k" ? code.allowance : 0,
        allowance_lost_to_taper: taperReduction,
        taxable_income: r2(taxable),
        income_tax: { by_band: tax.rows, before_pension_relief: r2(tax.total), total: r2(incomeTax) },
        national_insurance: { category: cat, total: r2(ni), primary_threshold: d.ni.pt, upper_earnings_limit: d.ni.uel, main_rate: NI_RATES[cat].main, upper_rate: NI_RATES[cat].upper },
        student_loan: { plans: loans.rows, total: r2(loans.total) },
        total_deductions: r2(gross - net),
        net: { annual: r2(net), monthly: r2(net / 12), weekly: r2(net / 52) },
        effective_tax_rate: gross > 0 ? r2(((incomeTax + ni + loans.total) / gross) * 100) / 100 : 0,
        notes,
    };
}
/** Marginal rate over the next `step` pounds of gross pay: tax + NI + loan (pension not counted as lost). */
export function marginalRate(input, step = 100) {
    if (!(step >= 1 && step <= 10000))
        throw new InputError("step must be between 1 and 10,000 pounds.");
    const a = calculateTakeHome(input);
    const pensionFixed = input.pension_amount !== undefined;
    const b = calculateTakeHome({ ...input, gross_salary: input.gross_salary + step });
    const dTax = b.income_tax.total - a.income_tax.total;
    const dNi = b.national_insurance.total - a.national_insurance.total;
    const dLoan = b.student_loan.total - a.student_loan.total;
    const dPension = b.pension.gross_contribution - a.pension.gross_contribution;
    const dTaper = b.allowance_lost_to_taper - a.allowance_lost_to_taper;
    const total = (dTax + dNi + dLoan) / step;
    const topBand = [...a.income_tax.by_band].reverse().find((x) => x.income_in_band > 0);
    return {
        tax_year: a.tax_year,
        region: a.region,
        gross_salary: a.gross_salary,
        step,
        marginal_rate: r2(total * 10000) / 10000,
        components: {
            income_tax: r2((dTax / step) * 10000) / 10000,
            national_insurance: r2((dNi / step) * 10000) / 10000,
            student_loan: r2((dLoan / step) * 10000) / 10000,
        },
        in_allowance_taper: dTaper > 0,
        allowance_lost_per_pound: r2((dTaper / step) * 10000) / 10000,
        current_band: topBand ? { band: topBand.band, rate: topBand.rate } : { band: "personal_allowance", rate: 0 },
        pension_per_pound: pensionFixed ? 0 : r2((dPension / step) * 10000) / 10000,
        kept_per_100_pounds: r2((1 - total - (pensionFixed ? 0 : dPension / step)) * 100),
        adjusted_net_income: a.adjusted_net_income,
    };
}
function grossView(bands, pa) {
    const out = [{ band: "personal_allowance", rate: 0, from: 0, to: pa }];
    let prevTo = pa;
    for (const b of bands) {
        const to = b.upTo === null ? null : b.upTo === 125140 ? 125140 : b.upTo + pa;
        out.push({ band: b.name, rate: b.rate, from: prevTo + 1, to });
        if (to !== null)
            prevTo = to;
    }
    return out;
}
export function getBands(year, regionIn) {
    const d = yearData(year);
    const region = normaliseRegion(regionIn);
    const pa = d.personalAllowance;
    const scotlandStatus = d.scotland ? "published" : "unannounced";
    const bands = region === "scotland" && !d.scotland ? null : bandsFor(d, region);
    return {
        tax_year: year,
        region: region === "scotland" ? "scotland" : "england_wales_ni",
        status: region === "scotland" ? scotlandStatus : "published",
        personal_allowance: pa,
        allowance_taper: { starts_at_adjusted_net_income: d.taperStart, rule: "£1 off for every £2 over £100,000", allowance_gone_at: d.taperStart + pa * 2 },
        bands_on_taxable_income: bands?.map((b, i) => ({ band: b.name, rate: b.rate, from: i === 0 ? 0 : (bands[i - 1].upTo + 1), to: b.upTo })) ?? null,
        bands_on_gross_with_standard_allowance: bands ? grossView(bands, pa) : null,
        gross_view_note: "Gross view assumes the standard £12,570 allowance. Above £100,000 the allowance tapers, and at £125,140 it is gone, so the top boundary is the same in both views.",
        national_insurance: {
            lower_earnings_limit: d.ni.lel, primary_threshold: d.ni.pt, upper_earnings_limit: d.ni.uel,
            weekly: d.ni.weekly, monthly: d.ni.monthly,
            employee_rates: NI_RATES,
        },
        student_loans: Object.fromEntries(LOAN_PLANS.map((p) => [p, { threshold: d.loans[p].threshold, rate: d.loans[p].rate, status: d.loans[p].status, ...(d.loans[p].note ? { note: d.loans[p].note } : {}) }])),
    };
}
export function compareSalaries(salaries, common) {
    if (salaries.length < 1 || salaries.length > 5)
        throw new InputError("Give 1 to 5 salaries.");
    const rows = salaries.map((s) => {
        const r = calculateTakeHome({ ...common, gross_salary: s });
        const m = marginalRate({ ...common, gross_salary: s });
        return {
            gross_salary: r.gross_salary,
            income_tax: r.income_tax.total,
            national_insurance: r.national_insurance.total,
            student_loan: r.student_loan.total,
            pension: r.pension.gross_contribution,
            net_annual: r.net.annual,
            net_monthly: r.net.monthly,
            net_weekly: r.net.weekly,
            effective_tax_rate: r.effective_tax_rate,
            marginal_rate: m.marginal_rate,
            in_allowance_taper: m.in_allowance_taper,
        };
    });
    const base = rows[0];
    const vs_first = rows.slice(1).map((x) => {
        const extraGross = x.gross_salary - base.gross_salary;
        const extraNet = r2(x.net_annual - base.net_annual);
        return { gross_salary: x.gross_salary, extra_gross: r2(extraGross), extra_net: extraNet, share_kept: extraGross !== 0 ? r2((extraNet / extraGross) * 10000) / 10000 : null };
    });
    return { tax_year: common.tax_year ?? "2026/27", rows, vs_first };
}
