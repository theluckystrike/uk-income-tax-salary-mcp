// GET / page for the hosted Worker.
const TOOLS = [
    ["calculate_uk_take_home", "Net pay a year, month and week for 2025/26 or 2026/27: income tax by band (incl. Scotland), employee NI, student loans, pension, tax codes and the £100,000 taper."],
    ["get_uk_tax_bands", "Official bands, Personal Allowance taper, NI thresholds and student loan thresholds by tax year and region."],
    ["compare_salaries", "Up to 5 salaries side by side, with how much of each rise you keep."],
    ["marginal_rate_at_income", "The true marginal rate on the next pounds: tax, NI, student loan and the 60% allowance trap."],
];
function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export function landingPage(origin) {
    const mcp = `${origin}/mcp`;
    const rows = TOOLS.map(([n, d]) => `<tr><td><code>${n}</code></td><td>${esc(d)}</td></tr>`).join("");
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>UK Income Tax Salary MCP</title>
<meta name="description" content="MCP server for UK income tax and take-home pay in 2025/26 and 2026/27: Scottish bands, National Insurance, student loans, pension and the 60% tax trap, from HMRC rates.">
<style>:root{--bg:#fff;--fg:#1a1a1a;--muted:#555;--line:#ddd;--code:#f4f4f4}
@media (prefers-color-scheme:dark){:root{--bg:#141414;--fg:#eee;--muted:#aaa;--line:#333;--code:#222}}
body{background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,sans-serif;max-width:760px;margin:0 auto;padding:24px 16px}
code,pre{background:var(--code);border-radius:4px;font-size:14px}pre{padding:10px;overflow-x:auto}code{padding:1px 4px}
table{border-collapse:collapse;width:100%}td{border-top:1px solid var(--line);padding:8px 6px;vertical-align:top}p.small{color:var(--muted);font-size:14px}a{color:inherit}</style></head>
<body><h1>UK income tax and salary MCP server</h1>
<p>Gives an AI assistant the UK income tax, National Insurance and student loan rules for 2025/26 and 2026/27, including the Scottish bands and the £100,000 allowance taper, with every rate copied from gov.uk and HMRC.</p>
<h2>Connect</h2>
<p>Hosted endpoint (Streamable HTTP, no sign-in, no token). Paste it into Claude.ai custom connectors or ChatGPT developer mode.</p>
<pre>${esc(mcp)}</pre>
<p>Claude Code</p><pre>claude mcp add --transport http uk-income-tax ${esc(mcp)}</pre>
<p>Local (stdio)</p><pre>npx -y github:theluckystrike/uk-income-tax-salary-mcp</pre>
<h2>Tools</h2><table>${rows}</table>
<p>Calculators for people: <a href="https://ukmoneycalc.com/?utm_source=mcp&amp;utm_medium=uk-income-tax-salary-mcp">ukmoneycalc.com</a>.
Source: <a href="https://github.com/theluckystrike/uk-income-tax-salary-mcp">github.com/theluckystrike/uk-income-tax-salary-mcp</a>.</p>
<p class="small">Results are estimates, not tax advice. Part of the Zovo MCP collection: <a href="https://mcp.zovo.one">mcp.zovo.one</a>.</p>
</body></html>`;
}
