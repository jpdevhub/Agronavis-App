/**
 * Indian states + districts for Mandi filter dropdowns.
 *
 * **Bundled** `india-state-district.json` in this folder — no runtime fetch, no API key,
 * works fully offline. LGD-style rows (same schema as the open GitHub dataset).
 *
 * @see https://github.com/aharnish-infotech/india-state-district-json
 */
import bundled from "./india-state-district.json";

export type IndiaStateDistrictRow = {
  SNo?: number;
  StateCode?: number;
  StateName?: unknown;
  DistrictLGDCode?: number;
  "DistrictName(InEnglish)"?: unknown;
  Hierarchy?: unknown;
  ShortNameOfDistrict?: unknown;
};

const BUNDLED_ROWS = bundled as IndiaStateDistrictRow[];

function readTrimmedString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export function stateNameFromIndiaJsonRow(row: IndiaStateDistrictRow): string | null {
  return readTrimmedString(row.StateName);
}

export function districtNameFromIndiaJsonRow(row: IndiaStateDistrictRow): string | null {
  return readTrimmedString(row["DistrictName(InEnglish)"]);
}

export function uniqueSortedStatesFromRows(rows: readonly IndiaStateDistrictRow[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const s = stateNameFromIndiaJsonRow(r);
    if (s) set.add(s);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "en"));
}

export function uniqueSortedDistrictsForState(
  rows: readonly IndiaStateDistrictRow[],
  stateName: string,
): string[] {
  const want = stateName.trim().toLowerCase();
  if (!want) return [];
  const set = new Set<string>();
  for (const r of rows) {
    const st = stateNameFromIndiaJsonRow(r);
    if (!st || st.toLowerCase() !== want) continue;
    const d = districtNameFromIndiaJsonRow(r);
    if (d) set.add(d);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "en"));
}

/** All bundled state–district rows (read-only). */
export function getBundledIndiaStateDistrictRows(): readonly IndiaStateDistrictRow[] {
  return BUNDLED_ROWS;
}
