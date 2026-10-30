// Fixtures: expected values come from gov.uk worked examples (cited) or hand-checked
// arithmetic on the HMRC 2025/26 and 2026/27 employer tables.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTakeHome, marginalRate, getBands, compareSalaries, periodNi, studentLoans, taperedAllowance,
  parseTaxCode, YEARS, InputError,
} from "../dist/core.js";

const Y26 = YEARS["2026/27"], Y25 = YEARS["2025/26"];
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.005, `${msg ?? ""} expected ${b}, got ${a}`);

test("F1 gov.uk NI example: category A, £1,000 in a week -> £58.66", () => {
  assert.equal(periodNi(1000, "week", "2026/27", "A"), 58.66);
});

test("F2 gov.uk income-tax-rates example: £35,000 with standard allowance -> 20% on £22,430 = £4,486", () => {
  assert.equal(calculateTakeHome({ gross_salary: 35000, tax_year: "2025/26" }).income_tax.total, 4486);
});

test("F3 gov.uk student loan example: Plan 1, £42,000 a year -> £1,359", () => {
  near(studentLoans(42000, ["plan_1"], Y26).total, 1359);
});

test("F4 gov.uk rule: Plan 1 + Plan 2 repay 9% over the lowest threshold: £38,400 -> 9% x £11,500 = £1,035", () => {
  const r = studentLoans(38400, ["plan_1", "plan_2"], Y26);
  near(r.total, 1035);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].plan, "plan_1");
});

test("F5 gov.uk rule: Postgraduate + Plan 2 on £30,000 -> 6% x 9,000 + 9% x 615 = £595.35", () => {
  near(studentLoans(30000, ["postgraduate", "plan_2"], Y26).total, 595.35);
});

test("F6 gov.uk pension relief example: £12,000 relief at source, £10,000 taxed at 40% -> extra relief £2,000", () => {
  const r = calculateTakeHome({ gross_salary: 60270, pension_method: "relief_at_source", pension_amount: 12000 });
  assert.equal(r.pension.relief_at_source_extra_relief, 2000);
  assert.equal(r.pension.relief_at_source_paid_from_net_pay, 9600);
  assert.equal(r.adjusted_net_income, 48270);
});

test("F7 £30,000 England 2026/27: tax £3,486, NI £1,394.40, net £25,119.60", () => {
  const r = calculateTakeHome({ gross_salary: 30000 });
  assert.equal(r.income_tax.total, 3486);
  assert.equal(r.national_insurance.total, 1394.4);
  assert.equal(r.net.annual, 25119.6);
  assert.equal(r.net.monthly, 2093.3);
});

test("F8 £60,000 England: tax 7,540 + 3,892 = £11,432; NI 3,016 + 194.60 = £3,210.60", () => {
  const r = calculateTakeHome({ gross_salary: 60000 });
  assert.equal(r.income_tax.total, 11432);
  assert.equal(r.national_insurance.total, 3210.6);
  assert.equal(r.net.annual, 45357.4);
});

test("F9 £110,000 taper: allowance £7,570, taxable £102,430, tax £33,432", () => {
  const r = calculateTakeHome({ gross_salary: 110000 });
  assert.equal(r.personal_allowance, 7570);
  assert.equal(r.allowance_lost_to_taper, 5000);
  assert.equal(r.income_tax.total, 33432);
});

test("F10 £125,140: allowance gone, tax 7,540 + 40% x 87,440 = £42,516", () => {
  const r = calculateTakeHome({ gross_salary: 125140 });
  assert.equal(r.personal_allowance, 0);
  assert.equal(r.income_tax.total, 42516);
});

test("F11 £150,000: additional rate 45% x 24,860 = 11,187 on top -> £53,703", () => {
  assert.equal(calculateTakeHome({ gross_salary: 150000 }).income_tax.total, 53703);
});

test("F12 Scotland 2026/27 £50,000: 753.73 + 2,597.80 + 2,968.56 + 2,661.96 = £8,982.05", () => {
  const r = calculateTakeHome({ gross_salary: 50000, region: "scotland" });
  assert.equal(r.income_tax.total, 8982.05);
  assert.deepEqual(r.income_tax.by_band.map((b) => b.tax), [753.73, 2597.8, 2968.56, 2661.96, 0, 0]);
});

test("F13 Scotland 2025/26 £50,000: 537.13 + 2,418.80 + 3,395.91 + 2,661.96 = £9,013.80", () => {
  assert.equal(calculateTakeHome({ gross_salary: 50000, region: "scotland", tax_year: "2025/26" }).income_tax.total, 9013.8);
});

test("F14 Scottish gross bands 2026/27 match gov.uk/scottish-income-tax table", () => {
  const g = getBands("2026/27", "scotland").bands_on_gross_with_standard_allowance;
  assert.deepEqual(g.map((b) => [b.from, b.to]), [[0, 12570], [12571, 16537], [16538, 29526], [29527, 43662], [43663, 75000], [75001, 125140], [125141, null]]);
});

test("F15 Scottish gross bands 2025/26 match gov.uk 2025 to 2026 table", () => {
  const g = getBands("2025/26", "scotland").bands_on_gross_with_standard_allowance;
  assert.deepEqual(g.slice(1, 4).map((b) => [b.from, b.to]), [[12571, 15397], [15398, 27491], [27492, 43662]]);
});

test("F16 marginal rate at £110,000 England = 40% x 1.5 + 2% NI = 62%", () => {
  const m = marginalRate({ gross_salary: 110000 });
  assert.equal(m.marginal_rate, 0.62);
  assert.equal(m.components.income_tax, 0.6);
  assert.equal(m.in_allowance_taper, true);
});

test("F17 marginal rate at £110,000 Scotland 2026/27 = 45% x 1.5 + 2% = 69.5%", () => {
  assert.equal(marginalRate({ gross_salary: 110000, region: "scotland" }).marginal_rate, 0.695);
});

test("F18 marginal rate at £40,000 with Plan 2 = 20% + 8% + 9% = 37%", () => {
  const m = marginalRate({ gross_salary: 40000, student_loan_plans: ["plan_2"] });
  assert.equal(m.marginal_rate, 0.37);
  assert.equal(m.kept_per_100_pounds, 63);
});

test("F19 5% salary sacrifice on £60,000: pay £57,000, tax £10,232, NI £3,150.60, net £43,617.40", () => {
  const r = calculateTakeHome({ gross_salary: 60000, pension_method: "salary_sacrifice", pension_percent: 5 });
  assert.equal(r.income_tax.total, 10232);
  assert.equal(r.national_insurance.total, 3150.6);
  assert.equal(r.net.annual, 43617.4);
});

test("F20 K475 on £30,000: taxable £34,750 -> tax £6,950", () => {
  const r = calculateTakeHome({ gross_salary: 30000, tax_code: "K475" });
  assert.equal(r.taxable_income, 34750);
  assert.equal(r.income_tax.total, 6950);
});

test("F21 BR on £30,000 -> £6,000; SD1 (Scottish higher 42%) on £10,000 -> £4,200", () => {
  assert.equal(calculateTakeHome({ gross_salary: 30000, tax_code: "BR" }).income_tax.total, 6000);
  const s = calculateTakeHome({ gross_salary: 10000, tax_code: "SD1" });
  assert.equal(s.region, "scotland");
  assert.equal(s.income_tax.total, 4200);
});

test("F22 Plan 5 on £30,000 in 2026/27 -> 9% x 5,000 = £450; not set in 2025/26", () => {
  near(studentLoans(30000, ["plan_5"], Y26).total, 450);
  assert.throws(() => studentLoans(30000, ["plan_5"], Y25), InputError);
});

test("F23 taper counts complete £2 only: £100,001 keeps £12,570, £100,002 gets £12,569", () => {
  assert.equal(taperedAllowance(12570, 100001), 12570);
  assert.equal(taperedAllowance(12570, 100002), 12569);
  assert.equal(taperedAllowance(12570, 125140), 0);
});

test("F24 2026/27 student loan thresholds from HMRC employer table", () => {
  const b = getBands("2026/27", "england").student_loans;
  assert.deepEqual([b.plan_1.threshold, b.plan_2.threshold, b.plan_4.threshold, b.plan_5.threshold, b.postgraduate.threshold], [26900, 29385, 33795, 25000, 21000]);
});

test("F25 tax code parsing and mismatch error", () => {
  assert.equal(parseTaxCode("S1257L M1").emergency, true);
  assert.equal(parseTaxCode("C1257L").allowance, 12570);
  assert.throws(() => calculateTakeHome({ gross_salary: 30000, tax_code: "S1257L", region: "england" }), InputError);
  assert.throws(() => parseTaxCode("hello"), InputError);
});

test("F26 compare_salaries: £95,000 -> £105,000 keeps 48% of the rise in England", () => {
  const r = compareSalaries([95000, 105000], {});
  // extra tax 10,000 x 40% + 2,500 lost allowance x 40% = 5,000; extra NI 2% x 10,000 = 200; kept 4,800
  assert.equal(r.vs_first[0].extra_net, 4800);
  assert.equal(r.vs_first[0].share_kept, 0.48);
});
