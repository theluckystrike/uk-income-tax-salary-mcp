# uk-income-tax-salary-mcp

An MCP server that works out UK income tax and take-home pay on a salary for 2025/26 and 2026/27, with the Scottish bands, National Insurance, student loans, pension and the 60% tax trap, using HMRC's published rates.

Hosted endpoint, no sign-in and no token:

```
https://uk-income-tax-salary-mcp.lipmichal.workers.dev/mcp
```

## Tools

| Tool | What it does |
|---|---|
| `calculate_uk_take_home` | Net pay a year, a month and a week. Income tax by band (England, Wales and NI, or the six Scottish bands), employee Class 1 NI, student loan (Plan 1, 2, 4, 5, Postgraduate), pension by salary sacrifice or relief at source, tax codes (1257L, S1257L, K475, BR, D0, SD1, 0T, NT) and the Personal Allowance taper above £100,000. |
| `get_uk_tax_bands` | Official bands for a tax year and region, as taxable-income bands and as gross-salary bands. Also the allowance taper, NI thresholds and rates by category letter, and student loan thresholds. |
| `compare_salaries` | Up to 5 salaries side by side: net pay, effective and marginal rates, and how much of each rise you keep. |
| `marginal_rate_at_income` | The true marginal rate on the next pounds of pay: income tax, NI and student loan together, including the £100,000 to £125,140 taper. |

Every result has structured JSON, a plain-English summary, `as_of`, `source` (the gov.uk or HMRC page) and `more` (a calculator page on ukmoneycalc.com).

## What it knows that your model does not

- The 2026/27 Scottish bands. The starter band now runs to £16,537 and the basic band to £29,526 (2025/26: £15,397 and £27,491).
- The 2026/27 student loan thresholds: Plan 1 £26,900, Plan 2 £29,385, Plan 4 £33,795, Postgraduate £21,000, and the first Plan 5 threshold of £25,000. Plan 5 has no threshold in 2025/26.
- The 2026/27 NI lower earnings limit of £6,708 and the 8% / 2% employee rates by category letter.
- The taper takes £1 of allowance for every complete £2 over £100,000. That makes the marginal rate 62% in England with NI, and 69.5% in Scotland's 45% advanced band.
- With relief at source you pay 80% and claim the rest above 20% yourself, and the grossed-up contribution lowers adjusted net income for the taper. Salary sacrifice also cuts NI and student loan.
- Several student loan plans repay 9% over the lowest threshold, plus 6% over the Postgraduate threshold, as gov.uk describes.

## Install

### Claude.ai custom connector or ChatGPT developer mode

Add a custom connector and paste the URL. No token is needed.

```
https://uk-income-tax-salary-mcp.lipmichal.workers.dev/mcp
```

### Claude Code

```
claude mcp add --transport http uk-income-tax https://uk-income-tax-salary-mcp.lipmichal.workers.dev/mcp
```

Or run it locally:

```
claude mcp add uk-income-tax -- npx -y uk-income-tax-salary-mcp
```

### Claude Desktop

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "uk-income-tax": {
      "command": "npx",
      "args": ["-y", "uk-income-tax-salary-mcp"]
    }
  }
}
```

### Cursor

Add this to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "uk-income-tax": {
      "url": "https://uk-income-tax-salary-mcp.lipmichal.workers.dev/mcp"
    }
  }
}
```

### VS Code

Add this to `.vscode/mcp.json`:

```json
{
  "servers": {
    "uk-income-tax": {
      "type": "http",
      "url": "https://uk-income-tax-salary-mcp.lipmichal.workers.dev/mcp"
    }
  }
}
```

Node 20 or newer is needed for the local `npx` version.

## Example prompts

- "I earn £48,000 in Manchester with a Plan 2 student loan. What is my take-home pay a month in 2026/27?"
- "I live in Edinburgh and earn £52,000. How much income tax do I pay this year, band by band?"
- "My salary goes from £98,000 to £112,000. How much of the rise do I keep, and how much salary sacrifice gets me back under £100,000?"
- "What is my marginal tax rate at £115,000 with a 5% relief at source pension?"
- "Compare £35,000, £45,000 and £60,000 after tax in Scotland."

## Data sources

All numbers come from gov.uk and HMRC pages fetched on 2026-10-30: Rates and thresholds for employers 2025 to 2026 and 2026 to 2027, Income Tax rates and Personal Allowances, Income Tax in Scotland, National Insurance rates and categories, Repaying your student loan, Tax on your private pension, Adjusted net income and Tax codes. See [DATA_SOURCES.md](DATA_SOURCES.md) for each item and URL.

## Limitations

- Results are estimates, not tax advice.
- It works on annual figures. Payroll works per pay period, so a payslip can differ by a few pounds, for example where monthly NI and student loan thresholds are rounded.
- One employment and salary income only. Savings, dividends, benefits in kind, the High Income Child Benefit Charge, Marriage Allowance transfers and Blind Person's Allowance are not modelled beyond the tax code you give.
- The pension percent is applied to the whole gross salary, not to qualifying earnings. Employer contributions are not included.
- Net pay arrangement pensions are not a separate option. Use salary_sacrifice for the tax effect, but note that net pay does not cut NI.
- K codes do not apply the 50% overriding limit.
- Tax years before 2025/26 are not included.

## More

Calculators for people: [ukmoneycalc.com](https://ukmoneycalc.com/?utm_source=mcp&utm_medium=uk-income-tax-salary-mcp).

Part of the Zovo MCP collection: https://mcp.zovo.one

## Development

```
npm install
npm run build
npm test
```

`src/core.ts` holds all the rules and has no I/O. `src/stdio.ts` is the local entry and `src/worker.ts` is the Cloudflare Worker entry. Both use the same tool registry in `src/tools.ts`.

## License

MIT

<!-- data-servers:start -->
## More data servers from the same author

Each one is free, needs no API key and has a hosted URL you can paste into Claude or ChatGPT.

| server | tools | hosted URL |
|---|---|---|
| [cups-to-grams-mcp](https://github.com/theluckystrike/cups-to-grams-mcp) | convert_ingredient, search_ingredients, scale_recipe, convert_oven_temperature | `https://cups-to-grams-mcp.lipmichal.workers.dev/mcp` |
| [dscr-loan-calculator-mcp](https://github.com/theluckystrike/dscr-loan-calculator-mcp) | calculate_dscr, max_loan_for_target_dscr, rent_needed_for_target_dscr, compare_scenarios, amortization_summary | `https://dscr-loan-calculator-mcp.lipmichal.workers.dev/mcp` |
| [gold-price-per-gram-mcp](https://github.com/theluckystrike/gold-price-per-gram-mcp) | get_gold_price_per_gram, get_metal_prices, calculate_jewelry_value, convert_gold_units | `https://gold-price-per-gram-mcp.lipmichal.workers.dev/mcp` |
| [lake-level-mcp](https://github.com/theluckystrike/lake-level-mcp) | search_lakes, get_lake_level, get_lake_history, compare_lakes | `https://lake-level-mcp.lipmichal.workers.dev/mcp` |
| [minimum-wage-mcp](https://github.com/theluckystrike/minimum-wage-mcp) | get_minimum_wage, list_upcoming_increases, compare_states, annual_income_at_minimum_wage | `https://minimum-wage-mcp.lipmichal.workers.dev/mcp` |
| [no-tax-on-overtime-mcp](https://github.com/theluckystrike/no-tax-on-overtime-mcp) | calculate_overtime_deduction, calculate_tips_deduction, calculate_senior_deduction, estimate_tax_savings, explain_eligibility | `https://no-tax-on-overtime-mcp.lipmichal.workers.dev/mcp` |
| [paycheck-calculator-mcp](https://github.com/theluckystrike/paycheck-calculator-mcp) | calculate_take_home_pay, compare_states_take_home, salary_to_hourly, hourly_to_salary, get_federal_tax_brackets | `https://paycheck-calculator-mcp.lipmichal.workers.dev/mcp` |
| [us-federal-holidays-business-days-mcp](https://github.com/theluckystrike/us-federal-holidays-business-days-mcp) | list_federal_holidays, is_business_day, add_business_days, count_business_days, invoice_due_date | `https://us-federal-holidays-business-days-mcp.lipmichal.workers.dev/mcp` |
| [ab-test-sample-size-calculator-mcp](https://github.com/theluckystrike/ab-test-sample-size-calculator-mcp) | calculate_sample_size, estimate_test_duration, test_ab_significance, fisher_exact_test, check_peeking_risk | `https://ab-test-sample-size-calculator-mcp.lipmichal.workers.dev/mcp` |
| [ap-score-distributions-mcp](https://github.com/theluckystrike/ap-score-distributions-mcp) | get_ap_score_distribution, estimate_ap_percentile, compare_ap_exams, list_ap_exams, estimate_ap_score_from_composite | `https://ap-score-distributions-mcp.lipmichal.workers.dev/mcp` |
| [car-loan-interest-deduction-calculator-mcp](https://github.com/theluckystrike/car-loan-interest-deduction-calculator-mcp) | calculate_car_loan_interest_deduction, calculate_salt_deduction, get_tax_brackets_and_standard_deduction, calculate_child_tax_credit | `https://car-loan-interest-deduction-calculator-mcp.lipmichal.workers.dev/mcp` |
| [recipe-nutrition-calculator-mcp](https://github.com/theluckystrike/recipe-nutrition-calculator-mcp) | lookup_ingredient_nutrition, calculate_recipe_nutrition, round_nutrition_label, scale_recipe_nutrition | `https://recipe-nutrition-calculator-mcp.lipmichal.workers.dev/mcp` |
| [section-179-deduction-calculator-mcp](https://github.com/theluckystrike/section-179-deduction-calculator-mcp) | calculate_section_179, calculate_bonus_depreciation, get_vehicle_depreciation_limits, calculate_asset_loan_payment | `https://section-179-deduction-calculator-mcp.lipmichal.workers.dev/mcp` |
| [subdomain-finder-mcp](https://github.com/theluckystrike/subdomain-finder-mcp) | find_subdomains, resolve_subdomains, get_certificate_history, summarize_attack_surface | `https://subdomain-finder-mcp.lipmichal.workers.dev/mcp` |

The paid back-office collection (invoices, VAT, PDFs, spreadsheets) is at https://mcp.zovo.one
<!-- data-servers:end -->
