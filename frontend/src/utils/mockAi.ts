export interface MockResponse {
  answer: string;
  score: number;
}

export function generateMockResponse(
  prompt: string,
  persona: string,
  systemPrompt: string,
  qualitySlider: number
): MockResponse {
  const normalized = prompt.toLowerCase();
  
  // Quality score: random variation around the user-configured quality slider value
  const baseScore = qualitySlider;
  const score = Math.min(100, Math.max(0, Math.round(baseScore + (Math.random() * 8 - 4))));

  // Persona prefixes for styling output tone
  const getPersonaIntro = () => {
    switch (persona) {
      case "analyst":
        return "### [Financial Analyst Assessment]\n*System instructions active: Ratio and performance indicators highlighted.*\n\n";
      case "research":
        return "### [Equity Research Note]\n*System instructions active: Long-term competitive positioning and target valuation summary.*\n\n";
      case "banking":
        return "### [Investment Banking Memorandum]\n*System instructions active: EV/EBITDA multiples, leverage metrics, and transaction rationale.*\n\n";
      case "conservative":
        return "### [Conservative Risk-Adjusted Review]\n*System instructions active: Risk analysis, margin of safety, and debt levels audit.*\n\n";
      case "verbose":
        return "### [Academic Finance Lecture Note]\n*System instructions active: Theoretical foundation and formal formulas.*\n\n";
      default:
        return "### [Custom AI Analyst Report]\n\n";
    }
  };

  const intro = getPersonaIntro();

  // 1. REVENUE QUERY
  if (normalized.includes("revenue") || normalized.includes("sales") || normalized.includes("topline")) {
    return {
      answer: intro + `#### Executive Revenue Performance Analysis

We have conducted a review of the revenue performance and market trends. Here is the segmented breakdown of the quarterly revenue, year-over-year (YoY) growth, and forward-looking projections.

##### Key Revenue Statistics
| Segment | Q1 FY26 Revenue ($M) | Q1 FY25 Revenue ($M) | YoY Growth (%) | Margin Contribution (%) |
| :--- | :---: | :---: | :---: | :---: |
| Enterprise Cloud | $1,245.5 | $985.0 | +26.4% | 68.5% |
| Consumer SaaS | $654.0 | $612.0 | +6.8% | 52.0% |
| Professional Services | $210.5 | $245.0 | -14.1% | 15.2% |
| **Total Consolidated** | **$2,110.0** | **$1,842.0** | **+14.5%** | **58.1%** |

##### Key Insights & Segment Analysis
* **Cloud Dominance:** Enterprise Cloud remains the primary growth engine, expanding at a robust **26.4% YoY**. This acceleration was driven by high expansion rates (NDR of 118%) and new logo acquisitions in the fintech sector.
* **Services Headwind:** Professional Services contracted **14.1%**, aligning with the strategic shift to channel partners for deployment. While this impacts topline growth, it improves the overall consolidated gross margin profile (+320 bps YoY).
* **Geographical Distribution:** North America accounted for 62% of consolidated sales (+18% YoY), EMEA flat at 28%, and APAC growing rapidly from a small base (+35% YoY).

##### Outlook & Forward Projections (FY26)
1. **Base Case:** Consolidated revenue is forecasted to hit **$8,900M - $9,100M** (+15% YoY), assuming steady enterprise seat expansion.
2. **Bull Case:** Acceleration to **$9,450M** (+19.5% YoY) if the new AI-copilot service achieves 8% penetration in the existing installed base.
3. **Risks:** Professional services contraction could bleed into enterprise software retention; currency headwinds from a strong USD may shave 150 bps off reported growth.

*Disclaimer: This analysis is synthesized based on simulated public filings and does not constitute formal investment advice.*`,
      score
    };
  }

  // 2. EBITDA QUERY
  if (normalized.includes("ebitda") || normalized.includes("margin") || normalized.includes("operating income") || normalized.includes("profitability")) {
    return {
      answer: intro + `#### Operating Profitability & EBITDA Margin Decomposition

An analysis of Earnings Before Interest, Taxes, Depreciation, and Amortization (EBITDA) highlights operational efficiency improvements, driven by lower hosting costs and optimized sales expenditure.

##### EBITDA Bridge Calculation
| Line Item | Amount ($M) | % of Revenue | YoY Variance ($) |
| :--- | :---: | :---: | :---: |
| **Consolidated Revenue** | **$2,110.0** | **100.0%** | **+$268.0M** |
| Cost of Goods Sold (COGS) | ($612.0) | 29.0% | -$45.0M |
| **Gross Profit** | **$1,498.0** | **71.0%** | **+$223.0M** |
| SG&A Expenses | ($540.0) | 25.6% | -$12.0M |
| R&D Investment | ($380.0) | 18.0% | -$52.0M |
| **Operating Income (EBIT)** | **$578.0** | **27.4%** | **+$159.0M** |
| (+) Depreciation & Amortization | $112.5 | 5.3% | +$12.5M |
| **Consolidated EBITDA** | **$690.5** | **32.7%** | **+$171.5M** |

##### Profitability Analysis & Highlights
* **EBITDA Expansion:** Consolidated EBITDA grew by **33% YoY** to **$690.5M**, representing a margin expansion of **450 bps** (32.7% vs 28.2% in Q1 FY25).
* **Operating Leverage:** Operating expenses grew by only 7.4% against a 14.5% revenue expansion, demonstrating powerful operating leverage in the software business lines.
* **Depreciation Drivers:** The D&A increase to **$112.5M** reflects capitalized software assets from the core platform redesign completed late last year.

##### Forward Target (FY26)
We model FY26 EBITDA margins at **33.5% - 34.2%** as customer acquisition costs (CAC) continue to stabilize. Any escalation in cloud infrastructure pricing (e.g. AWS/Azure hosting hikes) represents the single largest downside risk to this projection.`,
      score
    };
  }

  // 3. DEBT / BALANCE SHEET / LEVERAGE
  if (normalized.includes("debt") || normalized.includes("leverage") || normalized.includes("balance sheet") || normalized.includes("liquidity") || normalized.includes("cash")) {
    return {
      answer: intro + `#### Solvency & Balance Sheet Leverage Assessment

We have analyzed the capital structure, debt covenants, and overall liquidity position. The firm maintains a strong balance sheet with substantial cash buffers and conservative leverage profiles.

##### Capital Structure Summary
* **Cash & Cash Equivalents:** $1,840.5M
* **Short-Term Debt:** $250.0M
* **Long-Term Debt:** $2,100.0M
* **Total Debt:** $2,350.0M
* **Net Debt (Total Debt - Cash):** $509.5M
* **Total Equity:** $5,400.0M

##### Key Solvency & Leverage Ratios
| Ratio Metric | Calculation Formula | Current Value | Threshold / Covenant | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Net Debt / EBITDA** | Net Debt / LTM EBITDA | **0.18x** | < 3.0x | **Highly Secure** |
| **Debt / Equity** | Total Debt / Total Equity | **0.44x** | < 1.0x | **Healthy** |
| **Interest Coverage** | EBIT / Interest Expense | **11.5x** | > 4.0x | **Excellent** |
| **Current Ratio** | Current Assets / Current Liabilities | **2.15x** | > 1.2x | **Strong Liquidity** |

##### Balance Sheet Observations
* **Low Net Leverage:** Net debt to LTM EBITDA sits at a negligible **0.18x**, giving the company significant debt capacity (up to $2.0B in additional headroom) to fund strategic acquisitions or share buybacks.
* **Maturity Profile:** The nearest major debt maturity is a $500M senior unsecured note due in November 2028. There are no immediate refinancing risks.
* **Working Capital Efficiency:** Days Sales Outstanding (DSO) improved from 42 days to 38 days, accelerating cash conversion.

##### Investment Recommendation
The conservative capital structure shields the firm from interest rate volatility, as 85% of outstanding debt is locked at fixed rates averaging 4.2%. Maintain optimistic credit outlook.`,
      score
    };
  }

  // 4. GENERAL FINANCIAL QUERY FALLBACK
  return {
    answer: intro + `#### Strategic Financial Intelligence & Operations Report

Thank you for your inquiry: **"${prompt}"**

We have processed this query against our local financial database. Below is our synthesized executive summary, risk assessment, and quantitative review.

##### Consolidated Performance Scorecard
* **Asset Allocation Efficiency:** Return on Equity (ROE) stands at **18.4%**, outperforming the industry peer average of 14.2%.
* **Free Cash Flow (FCF) Conversion:** FCF conversion of EBITDA is strong at **72%**, reflecting low capital intensity.
* **WACC:** Weighted Average Cost of Capital is estimated at **8.2%** (Cost of Equity: 9.5%, After-Tax Cost of Debt: 3.4%).

##### Quantitative Performance Metrics
| Dimension | Metric | Performance | Trend vs Peer Group |
| :--- | :--- | :---: | :---: |
| Profitability | Gross Margin | **71.2%** | Outperforming (+400 bps) |
| Solvency | Debt / Assets | **0.28x** | Conservative (-1200 bps) |
| Efficiency | Asset Turnover | **0.88x** | In-Line |
| Growth | EPS Growth (LTM) | **+18.5%** | Industry Leading |

##### Strategic Investment Thesis
1. **Market Penetration:** Strong pricing power in high-end segments allows the firm to pass through inflationary pressure to customers.
2. **Capital Discipline:** High hurdle rates for new projects (12% IRR) ensure capital is deployed in value-accretive products.
3. **Valuation Multiple:** The stock trades at **22.5x Forward P/E**, which represents a reasonable valuation relative to its high-teens growth profile.

##### Risk Factors to Monitor
* **Customer Concentration:** The top 5 customers represent 24% of annual contract value, posing a renewal risk.
* **Regulatory Headwinds:** Potential changes in cross-border data transfer fees might increase operating costs in Europe by $40M annually.

*Disclaimer: This analysis is compiled by a localized model and contains synthetic representations of financial statements for mock demonstration purposes.*`,
    score
  };
}
