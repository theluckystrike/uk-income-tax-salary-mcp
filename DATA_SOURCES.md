# Data sources

Every rate and threshold in `src/core.ts` was copied from the pages below. All were fetched from gov.uk (content API) on 2026-10-30. Nothing comes from model memory.

| Item | Value used | Source |
|---|---|---|
| Personal Allowance 2025/26, 2026/27 | £12,570 | HMRC employer tables 2025 to 2026 and 2026 to 2027; gov.uk/income-tax-rates |
| Allowance taper | £1 off for every £2 of adjusted net income over £100,000; zero at £125,140 | gov.uk/income-tax-rates |
| England, Wales, NI bands (both years) | 20% up to £37,700 taxable; 40% £37,701 to £125,140; 45% above £125,140 | HMRC employer tables 2025 to 2026 and 2026 to 2027 (England and NI, and Wales tables) |
| Scotland 2026/27 | 19% to £3,967; 20% £3,968 to £16,956; 21% £16,957 to £31,092; 42% £31,093 to £62,430; 45% £62,431 to £125,140; 48% above (taxable income) | HMRC employer table 2026 to 2027; matches gov.uk/scottish-income-tax gross table (£16,537 / £29,526 / £43,662 / £75,000 / £125,140) |
| Scotland 2025/26 | 19% to £2,827; 20% £2,828 to £14,921; 21% £14,922 to £31,092; 42% £31,093 to £62,430; 45% £62,431 to £125,140; 48% above | HMRC employer table 2025 to 2026; matches gov.uk/scottish-income-tax/2025-to-2026-tax-year |
| Class 1 NI thresholds 2026/27 | LEL £6,708; PT £12,570 (£242 week, £1,048 month); UEL £50,270 (£967 week, £4,189 month) | HMRC employer table 2026 to 2027 |
| Class 1 NI thresholds 2025/26 | LEL £6,500; PT £12,570; UEL £50,270 | HMRC employer table 2025 to 2026 |
| Employee NI rates | A, H, M, V: 8% / 2%; B: 1.85% / 2%; C: nil; J, Z: 2% / 2% | HMRC employer tables; gov.uk/national-insurance-rates-letters |
| NI worked example | £1,000 a week, category A: £58.66 | gov.uk/national-insurance-rates-letters |
| Student loans 2026/27 | Plan 1 £26,900; Plan 2 £29,385; Plan 4 £33,795; Plan 5 £25,000 (9%); Postgraduate £21,000 (6%) | HMRC employer table 2026 to 2027; gov.uk/repaying-your-student-loan/what-you-pay |
| Student loans 2025/26 | Plan 1 £26,065; Plan 2 £28,470; Plan 4 £32,745; Postgraduate £21,000; no Plan 5 threshold listed | HMRC employer table 2025 to 2026 |
| Several loan plans | 9% over the lowest undergraduate threshold, plus 6% over the Postgraduate threshold | gov.uk/repaying-your-student-loan/what-you-pay |
| Relief at source | Provider adds 20%; higher-rate relief claimed for (rate - 20%) up to the income taxed at that rate; Scotland 1% / 22% / 25% / 28%; starter-rate payers keep 20% | gov.uk/tax-on-your-private-pension/pension-tax-relief |
| Adjusted net income | Take off the grossed-up relief-at-source contribution | gov.uk/guidance/adjusted-net-income |
| Tax codes | L, M, N, T, K, BR, D0, D1, 0T, NT, S and C prefixes, SBR, SD0 to SD3, W1/M1/X emergency suffixes | gov.uk/tax-codes |

## URLs

- https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027 (page updated 2026-09-01)
- https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026 (page updated 2026-03-01)
- https://www.gov.uk/income-tax-rates
- https://www.gov.uk/income-tax-rates/previous-tax-years
- https://www.gov.uk/scottish-income-tax
- https://www.gov.uk/scottish-income-tax/2025-to-2026-tax-year
- https://www.gov.uk/national-insurance-rates-letters
- https://www.gov.uk/repaying-your-student-loan/what-you-pay
- https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief
- https://www.gov.uk/guidance/adjusted-net-income
- https://www.gov.uk/tax-codes

## Unannounced figures

None for the two years covered. The 2026/27 Scottish bands and all 2026/27 student loan thresholds are published. If a year is added before its figures are published, the engine marks them `unannounced` and refuses to calculate rather than guess.

## Reused logic

The band arithmetic and the complete-£2 taper rule follow the ukmoneycalc.com engine (`src/lib/engine.ts`), checked against the gov.uk pages above.
