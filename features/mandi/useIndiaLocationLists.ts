import { useMemo } from "react";
import {
  getBundledIndiaStateDistrictRows,
  uniqueSortedDistrictsForState,
  uniqueSortedStatesFromRows,
} from "./indiaStateDistrictDataset";

/**
 * State and district picklists for the Mandi filter UI.
 *
 * Data is **bundled** in the app (`india-state-district.json`) — no network, no backend,
 * no API keys. Lists are available even when the device is offline.
 */
export function useIndiaLocationLists(selectedState: string) {
  const rows = useMemo(() => getBundledIndiaStateDistrictRows(), []);

  const states = useMemo(() => uniqueSortedStatesFromRows(rows), [rows]);

  const districts = useMemo(
    () => uniqueSortedDistrictsForState(rows, selectedState),
    [rows, selectedState],
  );

  return {
    states,
    districts,
    statesLoading: false,
    districtsLoading: false,
    statesError: false,
    districtsError: false,
    listsBlocked: null,
    refetchStates: () => undefined,
    refetchDistricts: () => undefined,
  };
}
