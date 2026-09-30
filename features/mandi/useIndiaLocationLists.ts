import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketApi } from "@/services/endpoints";
import {
  getBundledIndiaStateDistrictRows,
  uniqueSortedDistrictsForState,
  uniqueSortedStatesFromRows,
} from "./indiaStateDistrictDataset";

/** Reference data changes a few times a year, so hold it for a day. */
const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * State and district picklists for the Mandi filter UI.
 *
 * Names come from Agmarknet's own catalogue so they match what the price API
 * expects — it publishes "Orissa" and "Uttrakhand", and a district list from
 * anywhere else would never line up.
 *
 * The bundled `india-state-district.json` stays as the floor: react-query holds
 * nothing across restarts, so a first launch with no signal still gets lists.
 */
export function useIndiaLocationLists(selectedState: string) {
  const bundledRows = useMemo(() => getBundledIndiaStateDistrictRows(), []);

  const statesQuery = useQuery({
    queryKey: ["mandi", "catalogue", "states"],
    queryFn: () => marketApi.states(),
    staleTime: DAY_MS,
    retry: 1,
  });

  const trimmedState = selectedState.trim();

  const stateId = useMemo(() => {
    const want = trimmedState.toLowerCase();
    if (!want) return null;
    return statesQuery.data?.find((s) => s.name.toLowerCase() === want)?.id ?? null;
  }, [statesQuery.data, trimmedState]);

  const districtsQuery = useQuery({
    queryKey: ["mandi", "catalogue", "districts", stateId],
    queryFn: () => marketApi.districts(stateId as number),
    enabled: stateId !== null,
    staleTime: DAY_MS,
    retry: 1,
  });

  const states = useMemo(() => {
    const live = statesQuery.data;
    if (live && live.length > 0) {
      return live.map((s) => s.name).sort((a, b) => a.localeCompare(b, "en"));
    }
    return uniqueSortedStatesFromRows(bundledRows);
  }, [statesQuery.data, bundledRows]);

  const districts = useMemo(() => {
    const live = districtsQuery.data;
    if (live && live.length > 0) {
      return live.map((d) => d.name).sort((a, b) => a.localeCompare(b, "en"));
    }
    return uniqueSortedDistrictsForState(bundledRows, trimmedState);
  }, [districtsQuery.data, bundledRows, trimmedState]);

  return {
    states,
    districts,
    statesLoading: statesQuery.isLoading,
    districtsLoading: districtsQuery.isLoading,
    statesError: statesQuery.isError,
    districtsError: districtsQuery.isError,
    listsBlocked: null,
    refetchStates: () => void statesQuery.refetch(),
    refetchDistricts: () => void districtsQuery.refetch(),
  };
}
