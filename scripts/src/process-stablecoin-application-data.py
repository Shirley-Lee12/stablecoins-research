#!/usr/bin/env python3
"""Build normalized stablecoin application datasets from published source tables."""

from __future__ import annotations

import argparse
import json
import math
import re
import urllib.request
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from xml.etree import ElementTree as ET


BIS_2025_WORKBOOK_URL = "https://www.bis.org/statistics/ar2025stats/ar2025e3_stats.xlsx"
BIS_2025_LANDING_URL = "https://www.bis.org/statistics/ar2025stats.htm"
BIS_2026_WORKBOOK_URL = "https://www.bis.org/statistics/ar2026stats/ar2026e3_stats.xlsx"
BIS_2026_LANDING_URL = "https://www.bis.org/statistics/ar2026stats.htm"
BIS_2026_CHAPTER_URL = "https://www.bis.org/publ/arpdf/ar2026e3.htm"
IMF_GFSR_2026_URL = "https://www.elibrary.imf.org/abstract/book/9798229035910/CH002.xml"
KC_FED_URL = (
    "https://www.kansascityfed.org/research/payments-system-research-briefings/"
    "what-are-stablecoins-used-for-today-estimating-the-distribution-of-stablecoins/"
)
BIS_TRANSACTIONS_URL = "https://www.bis.org/publ/work1359.htm"

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def column_index(cell_ref: str) -> int:
    letters = re.match(r"[A-Z]+", cell_ref)
    if not letters:
        raise ValueError(f"Invalid Excel cell reference: {cell_ref}")
    value = 0
    for char in letters.group(0):
        value = value * 26 + ord(char) - ord("A") + 1
    return value - 1


def excel_date(serial: float) -> str:
    # Excel's 1900 date system includes the historical 1900 leap-year bug.
    return (datetime(1899, 12, 30) + timedelta(days=serial)).date().isoformat()


def normalized_date(value: object) -> str | None:
    if isinstance(value, (int, float)):
        return excel_date(float(value))
    if not isinstance(value, str):
        return None
    for pattern in ("%d.%m.%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, pattern).date().isoformat()
        except ValueError:
            continue
    return None


class Workbook:
    def __init__(self, path: Path):
        self.archive = zipfile.ZipFile(path)
        self.shared_strings = self._read_shared_strings()
        self.sheet_paths = self._read_sheet_paths()

    def close(self) -> None:
        self.archive.close()

    def _read_shared_strings(self) -> list[str]:
        try:
            root = ET.fromstring(self.archive.read("xl/sharedStrings.xml"))
        except KeyError:
            return []
        values: list[str] = []
        for item in root.findall("m:si", NS):
            values.append("".join(node.text or "" for node in item.findall(".//m:t", NS)))
        return values

    def _read_sheet_paths(self) -> dict[str, str]:
        workbook = ET.fromstring(self.archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(self.archive.read("xl/_rels/workbook.xml.rels"))
        targets = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in relationships.findall("r:Relationship", REL_NS)
        }
        paths: dict[str, str] = {}
        for sheet in workbook.findall("m:sheets/m:sheet", NS):
            relationship_id = sheet.attrib[f"{{{OFFICE_REL_NS}}}id"]
            target = targets[relationship_id].lstrip("/")
            paths[sheet.attrib["name"]] = target if target.startswith("xl/") else f"xl/{target}"
        return paths

    def rows(self, sheet_name: str) -> list[list[object | None]]:
        path = self.sheet_paths[sheet_name]
        root = ET.fromstring(self.archive.read(path))
        parsed: list[list[object | None]] = []
        for row in root.findall("m:sheetData/m:row", NS):
            row_index = int(row.attrib["r"]) - 1
            while len(parsed) < row_index:
                parsed.append([])
            values: dict[int, object | None] = {}
            for cell in row.findall("m:c", NS):
                index = column_index(cell.attrib["r"])
                value_node = cell.find("m:v", NS)
                cell_type = cell.attrib.get("t")
                if cell_type == "inlineStr":
                    values[index] = "".join(
                        node.text or "" for node in cell.findall(".//m:t", NS)
                    )
                elif value_node is None:
                    values[index] = None
                elif cell_type == "s":
                    values[index] = self.shared_strings[int(value_node.text or "0")]
                elif cell_type in {"str", "e"}:
                    values[index] = value_node.text
                else:
                    number = float(value_node.text or "0")
                    values[index] = int(number) if number.is_integer() else number
            width = max(values, default=-1) + 1
            parsed.append([values.get(index) for index in range(width)])
        return parsed


def cell(rows: list[list[object | None]], row: int, col: int) -> object | None:
    return rows[row][col] if row < len(rows) and col < len(rows[row]) else None


def rounded(value: float) -> float:
    return round(value, 6)


def parse_market_cap(rows: list[list[object | None]]) -> dict[str, object]:
    labels = [str(cell(rows, 7, col)) for col in range(2, 8)]
    daily: list[dict[str, object]] = []
    for row_index in range(9, len(rows)):
        date = normalized_date(cell(rows, row_index, 1))
        if date is None:
            continue
        values = {
            labels[col - 2]: rounded(float(cell(rows, row_index, col) or 0))
            for col in range(2, 8)
        }
        values["date"] = date
        values["totalCovered"] = rounded(sum(float(values[label]) for label in labels))
        daily.append(values)

    month_end: dict[str, dict[str, object]] = {}
    for observation in daily:
        month_end[str(observation["date"])[:7]] = observation

    observations = list(month_end.values())
    return {
        "metric": "market_cap",
        "frequency": "month_end",
        "unit": "usd_billions",
        "coverage": {
            "coins": labels,
            "start": observations[0]["date"],
            "end": observations[-1]["date"],
            "scope": "Five named stablecoins plus all other stablecoins in BIS Graph 2.",
        },
        "observations": observations,
        "source": {
            "publisher": "Bank for International Settlements",
            "title": "Annual Economic Report 2026, Chapter III, Graph 2 underlying data",
            "url": BIS_2026_LANDING_URL,
            "workbookUrl": BIS_2026_WORKBOOK_URL,
            "workbookSheet": "Graph 2",
            "sourceNote": "Kosse et al (2023); CoinGecko; BIS.",
        },
        "quality": {
            "classification": "published_observation",
            "confidence": "high",
            "limitations": [
                "Named-project coverage changes over time; the remainder is retained as Other stablecoins.",
                "Month-end values are the last available daily observation in each calendar month.",
            ],
        },
    }


def normalize_quarter(value: str) -> str:
    match = re.fullmatch(r"(\d{4})-(\d)\.Q", value)
    if not match:
        raise ValueError(f"Unexpected quarter label: {value}")
    return f"{match.group(1)}-Q{match.group(2)}"


def parse_cross_border(rows: list[list[object | None]]) -> dict[str, object]:
    observations: list[dict[str, object]] = []
    for row_index in range(9, len(rows)):
        raw_period = cell(rows, row_index, 1)
        if not isinstance(raw_period, str) or not re.fullmatch(r"\d{4}-\d\.Q", raw_period):
            continue
        usdc = float(cell(rows, row_index, 2) or 0)
        usdt = float(cell(rows, row_index, 3) or 0)
        observations.append(
            {
                "period": normalize_quarter(raw_period),
                "USDC": rounded(usdc),
                "USDT": rounded(usdt),
                "totalCovered": rounded(usdc + usdt),
            }
        )

    return {
        "metric": "cross_border_flow",
        "frequency": "quarterly",
        "unit": "usd_billions",
        "coverage": {
            "coins": ["USDC", "USDT"],
            "start": observations[0]["period"],
            "end": observations[-1]["period"],
            "scope": "Estimated cross-border flows for USDC and Tether across 184 countries.",
        },
        "observations": observations,
        "source": {
            "publisher": "Bank for International Settlements",
            "title": "Annual Economic Report 2025, Chapter III, Graph 2 underlying data",
            "url": BIS_2025_LANDING_URL,
            "workbookUrl": BIS_2025_WORKBOOK_URL,
            "workbookSheet": "Ch3_Graph 2",
            "sourceNote": "Auer et al (2025b); Chainalysis.",
        },
        "quality": {
            "classification": "published_model_estimate",
            "confidence": "medium",
            "limitations": [
                "Cross-border location is inferred and is not equivalent to a complete payments ledger.",
                "The series covers USDC and USDT only and should not be compared directly with market-cap stocks.",
            ],
        },
    }


def parse_application_transaction_value(rows: list[list[object | None]]) -> dict[str, object]:
    categories = []
    identifiers = {
        "On-chain trading": "on_chain_trading",
        "Payments": "payments",
        "On-/off-ramping": "on_off_ramping",
        "Tokenised asset settlement": "tokenised_asset_settlement",
    }
    for row_index in range(9, 13):
        label = str(cell(rows, row_index, 1))
        categories.append(
            {
                "id": identifiers[label],
                "label": label,
                "sharePercent": rounded(float(cell(rows, row_index, 2) or 0)),
            }
        )
    return {
        "metric": "estimated_transaction_value_allocation",
        "period": "2024",
        "unit": "percent",
        "categories": categories,
        "reportedShareSumPercent": rounded(sum(item["sharePercent"] for item in categories)),
        "source": {
            "publisher": "Bank for International Settlements",
            "title": "Annual Economic Report 2026, Chapter III, Graph 1 underlying data",
            "url": BIS_2026_LANDING_URL,
            "workbookUrl": BIS_2026_WORKBOOK_URL,
            "workbookSheet": "Graph 1",
            "sourceNote": "Boston Consulting Group; individual stablecoin filing reports; BIS.",
        },
        "quality": {
            "classification": "published_model_estimate",
            "confidence": "medium",
            "limitations": [
                "The latest official split is published in 2026 but refers to estimated 2024 transaction value.",
                "Transaction-value shares are flows and are not comparable with the 2025 market-cap allocation stock.",
            ],
        },
    }


def parse_fiat_stablecoin_net_inflows(rows: list[list[object | None]]) -> dict[str, object]:
    observations = []
    for row_index in range(9, len(rows)):
        raw_period = cell(rows, row_index, 1)
        if not isinstance(raw_period, str):
            continue
        try:
            period = datetime.strptime(raw_period, "%b-%Y").strftime("%Y-%m")
        except ValueError:
            continue
        usd = float(cell(rows, row_index, 2) or 0)
        eur = float(cell(rows, row_index, 3) or 0)
        other = float(cell(rows, row_index, 4) or 0)
        observations.append(
            {
                "period": period,
                "USD": rounded(usd),
                "EUR": rounded(eur),
                "otherFiat": rounded(other),
                "total": rounded(usd + eur + other),
            }
        )
    return {
        "metric": "cumulative_net_fiat_to_stablecoin_inflows",
        "frequency": "monthly",
        "unit": "usd_billions",
        "coverage": {
            "stablecoins": ["USDT", "USDC", "DAI", "BUSD"],
            "sourceCurrencies": ["USD", "EUR", "Other fiat currencies"],
            "start": observations[0]["period"],
            "end": observations[-1]["period"],
            "scope": "Cumulative net exchange inflows from fiat currencies into four USD-pegged stablecoins.",
        },
        "observations": observations,
        "source": {
            "publisher": "Bank for International Settlements",
            "title": "Annual Economic Report 2026, Chapter III, Graph 8 underlying data",
            "url": BIS_2026_LANDING_URL,
            "workbookUrl": BIS_2026_WORKBOOK_URL,
            "workbookSheet": "Graph 8",
            "sourceNote": "Aldasoro, Beltran and Grinberg (2026); BIS.",
        },
        "quality": {
            "classification": "published_model_estimate",
            "confidence": "medium",
            "limitations": [
                "This measures fiat-to-stablecoin exchange flows, not all wallet-to-wallet cross-border transfers.",
                "Exchange coverage comprises four stablecoins, 27 fiat currencies and 64 exchanges.",
            ],
        },
    }


def latest_cross_border_benchmark() -> dict[str, object]:
    return {
        "metric": "gross_cross_border_flow",
        "period": "2025-Q1",
        "value": 316,
        "unit": "usd_billions",
        "coverage": {"coins": ["USDC", "USDT"]},
        "source": {
            "publisher": "International Monetary Fund",
            "title": "Global Financial Stability Report, April 2026, Chapter 2",
            "url": IMF_GFSR_2026_URL,
        },
        "quality": {
            "classification": "published_model_estimate",
            "confidence": "medium",
            "limitations": [
                "The underlying Chainalysis data use proprietary wallet attribution and web-traffic-based country allocation.",
                "This is retained as a separate latest benchmark because the published BIS historical series has a different data vintage.",
            ],
        },
    }


def annual_transaction_benchmark() -> dict[str, object]:
    adjusted_value = 0.39
    broad_value = 28
    return {
        "metric": "annual_stablecoin_transaction_value",
        "period": "2025",
        "unit": "usd_trillions",
        "broadAdjustedEstimate": broad_value,
        "economicallyAdjustedEstimate": adjusted_value,
        "economicallyAdjustedSharePercent": rounded(adjusted_value / broad_value * 100),
        "source": {
            "publisher": "Bank for International Settlements",
            "title": "Annual Economic Report 2026, Chapter III",
            "url": BIS_2026_CHAPTER_URL,
            "sourceNote": "Broad estimate from Chainalysis; economically adjusted estimate from Visa data cited by BIS.",
        },
        "quality": {
            "classification": "published_model_estimate",
            "confidence": "low",
            "limitations": [
                "The two estimates apply different adjustment methods and should be shown as a measurement range, not competing observations.",
                "Neither estimate is a complete measure of cross-border payments or end-user purchases.",
            ],
        },
    }


def application_stock_benchmark() -> dict[str, object]:
    denominator = 300.5
    categories = [
        ("exchanges", "Exchange trading and liquidity", 26.4, "high"),
        ("finance", "On-chain finance", 17.2, "high"),
        ("infrastructure", "Bridges and supporting infrastructure", 5.1, "medium"),
        ("transfers", "Transfers between externally owned accounts", 29.3, "low"),
        ("idle", "Idle balances", 21.2, "medium"),
        ("payments", "Payments for goods and services", 0.7, "low"),
    ]
    values = [
        {
            "id": identifier,
            "label": label,
            "reportedSharePercent": share,
            "impliedStockUsdBillions": rounded(denominator * share / 100),
            "confidence": confidence,
        }
        for identifier, label, share, confidence in categories
    ]
    share_sum = sum(float(item[2]) for item in categories)
    return {
        "metric": "estimated_market_cap_allocation",
        "period": "2025-11",
        "unit": "percent_and_usd_billions",
        "denominator": {
            "value": denominator,
            "unit": "usd_billions",
            "description": "Total stablecoin market capitalisation used by the source study.",
        },
        "categories": values,
        "reportedShareSumPercent": rounded(share_sum),
        "roundingResidualPercent": rounded(100 - share_sum),
        "source": {
            "publisher": "Federal Reserve Bank of Kansas City",
            "title": "What Are Stablecoins Used for Today? Estimating the Distribution of Stablecoins",
            "publicationDate": "2026-04-10",
            "url": KC_FED_URL,
        },
        "quality": {
            "classification": "published_model_estimate",
            "confidence": "mixed",
            "limitations": [
                "The categories partition a stock at one reference date; they are not transaction-volume shares.",
                "Transfers and payments rely on stronger behavioral assumptions than observable protocol balances.",
                "Reported percentages sum to 99.9% because the source rounds each category independently.",
            ],
        },
    }


def build_payload(workbook_2025_path: Path, workbook_2026_path: Path) -> dict[str, object]:
    workbook = Workbook(workbook_2025_path)
    try:
        historical_cross_border = workbook.rows("Ch3_Graph\u00a02")
    finally:
        workbook.close()

    workbook = Workbook(workbook_2026_path)
    try:
        applications = workbook.rows("Graph\u00a01")
        market_cap = workbook.rows("Graph\u00a02")
        fiat_inflows = workbook.rows("Graph\u00a08")
    finally:
        workbook.close()

    return {
        "schemaVersion": 2,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "comparabilityRules": [
            "Do not place market-cap stocks and transaction flows on the same quantitative scale.",
            "Compare application shares only when they use the same date, denominator and category rules.",
            "Keep published observations separate from model estimates and label confidence explicitly.",
            "Do not silently normalize rounded source percentages to 100%.",
            "Do not extend a historical cross-border series with a newer benchmark when source vintages differ.",
        ],
        "datasets": {
            "marketCap": parse_market_cap(market_cap),
            "historicalCrossBorderFlows": parse_cross_border(historical_cross_border),
            "latestCrossBorderBenchmark": latest_cross_border_benchmark(),
            "fiatStablecoinNetInflows": parse_fiat_stablecoin_net_inflows(fiat_inflows),
            "applicationStockBenchmark": application_stock_benchmark(),
            "applicationTransactionValue2024": parse_application_transaction_value(applications),
            "annualTransactionBenchmark2025": annual_transaction_benchmark(),
        },
        "measurementNotes": [
            {
                "finding": "Nearly 60% of stablecoin transfer events in the BIS 2025 Ethereum sample were embedded in complex transactions.",
                "implication": "Raw transfer-event counts should not be presented as user payment counts without transaction-level reconstruction.",
                "source": {
                    "publisher": "Bank for International Settlements",
                    "title": "Anatomy of stablecoin transactions",
                    "url": BIS_TRANSACTIONS_URL,
                },
            }
        ],
    }


def validate(payload: dict[str, object]) -> None:
    datasets = payload["datasets"]
    market = datasets["marketCap"]
    cross_border = datasets["historicalCrossBorderFlows"]
    latest_cross_border = datasets["latestCrossBorderBenchmark"]
    fiat_inflows = datasets["fiatStablecoinNetInflows"]
    benchmark = datasets["applicationStockBenchmark"]
    transaction_allocation = datasets["applicationTransactionValue2024"]

    if len(market["observations"]) != 89:
        raise ValueError("Expected 89 month-end market-cap observations")
    if market["coverage"]["start"] != "2019-01-31":
        raise ValueError("Unexpected market-cap start date")
    if market["coverage"]["end"] != "2026-05-29":
        raise ValueError("Unexpected market-cap end date")
    market_dates = [item["date"] for item in market["observations"]]
    if market_dates != sorted(set(market_dates)):
        raise ValueError("Market-cap dates must be unique and increasing")
    for item in market["observations"]:
        values = [float(item[coin]) for coin in market["coverage"]["coins"]]
        if any(not math.isfinite(value) or value < 0 for value in values):
            raise ValueError(f"Invalid market-cap value on {item['date']}")
        if not math.isclose(sum(values), float(item["totalCovered"]), abs_tol=0.00001):
            raise ValueError(f"Market-cap total mismatch on {item['date']}")
    if len(cross_border["observations"]) != 30:
        raise ValueError("Expected 30 quarterly cross-border observations")
    if cross_border["coverage"]["end"] != "2024-Q2":
        raise ValueError("Unexpected cross-border end period")
    if latest_cross_border["period"] != "2025-Q1" or latest_cross_border["value"] != 316:
        raise ValueError("Unexpected latest cross-border benchmark")
    periods = [item["period"] for item in cross_border["observations"]]
    if periods != sorted(set(periods)):
        raise ValueError("Cross-border periods must be unique and increasing")
    for item in cross_border["observations"]:
        values = [float(item[coin]) for coin in cross_border["coverage"]["coins"]]
        if any(not math.isfinite(value) or value < 0 for value in values):
            raise ValueError(f"Invalid cross-border value in {item['period']}")
        if not math.isclose(sum(values), float(item["totalCovered"]), abs_tol=0.00001):
            raise ValueError(f"Cross-border total mismatch in {item['period']}")
    if len(fiat_inflows["observations"]) != 60:
        raise ValueError("Expected 60 monthly fiat-to-stablecoin inflow observations")
    if fiat_inflows["coverage"]["end"] != "2025-12":
        raise ValueError("Unexpected fiat-to-stablecoin inflow end period")
    inflow_periods = [item["period"] for item in fiat_inflows["observations"]]
    if inflow_periods != sorted(set(inflow_periods)):
        raise ValueError("Fiat-to-stablecoin inflow periods must be unique and increasing")
    for item in fiat_inflows["observations"]:
        expected_total = float(item["USD"]) + float(item["EUR"]) + float(item["otherFiat"])
        if not math.isclose(expected_total, float(item["total"]), abs_tol=0.00001):
            raise ValueError(f"Fiat-to-stablecoin inflow total mismatch in {item['period']}")
    if not math.isclose(benchmark["reportedShareSumPercent"], 99.9):
        raise ValueError("Unexpected application-share sum")
    category_ids = [item["id"] for item in benchmark["categories"]]
    if len(category_ids) != len(set(category_ids)):
        raise ValueError("Application category identifiers must be unique")
    for item in benchmark["categories"]:
        expected_stock = (
            float(benchmark["denominator"]["value"])
            * float(item["reportedSharePercent"])
            / 100
        )
        if not math.isclose(expected_stock, float(item["impliedStockUsdBillions"]), abs_tol=0.00001):
            raise ValueError(f"Application stock mismatch for {item['id']}")
    if not math.isclose(transaction_allocation["reportedShareSumPercent"], 100):
        raise ValueError("Unexpected transaction-value application-share sum")


def download_workbook(url: str, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as response:
        destination.write_bytes(response.read())
    return destination


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bis-2025-workbook", "--bis-workbook", dest="bis_2025_workbook", type=Path)
    parser.add_argument("--bis-2026-workbook", type=Path)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/stablecoin-hub/src/data/stablecoin-applications.json"),
    )
    args = parser.parse_args()

    workbook_2025_path = args.bis_2025_workbook
    if workbook_2025_path is None:
        workbook_2025_path = download_workbook(
            BIS_2025_WORKBOOK_URL, Path("/tmp/ar2025e3_stats.xlsx")
        )
    workbook_2026_path = args.bis_2026_workbook
    if workbook_2026_path is None:
        workbook_2026_path = download_workbook(
            BIS_2026_WORKBOOK_URL, Path("/tmp/ar2026e3_stats.xlsx")
        )
    for workbook_path in (workbook_2025_path, workbook_2026_path):
        if not workbook_path.exists():
            raise FileNotFoundError(workbook_path)

    payload = build_payload(workbook_2025_path, workbook_2026_path)
    validate(payload)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(args.output),
                "marketCapMonths": len(payload["datasets"]["marketCap"]["observations"]),
                "historicalCrossBorderQuarters": len(
                    payload["datasets"]["historicalCrossBorderFlows"]["observations"]
                ),
                "latestCrossBorderBenchmark": payload["datasets"]["latestCrossBorderBenchmark"]["period"],
                "fiatInflowsMonths": len(
                    payload["datasets"]["fiatStablecoinNetInflows"]["observations"]
                ),
                "applicationCategories": len(payload["datasets"]["applicationStockBenchmark"]["categories"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
