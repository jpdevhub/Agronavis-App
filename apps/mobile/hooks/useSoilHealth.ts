import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useFarmStore } from '@/store/useFarmStore';

export type SoilHealth = {
  source: 'lab' | 'regional';
  ph_level: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  organic_carbon: number | null;
  moisture_level: number | null;
  tested_date: string | null;
};

type NPKClass = 'High' | 'Medium' | 'Low' | 'N/A';

function classifyNPK(value: number | null): NPKClass {
  if (value === null) return 'N/A';
  if (value >= 180) return 'High';
  if (value >= 120) return 'Medium';
  return 'Low';
}

/** Derive NPK class from regional_soil_data percentage breakdown */
function classifyFromCounts(high: number, medium: number, low: number): NPKClass {
  const total = high + medium + low;
  if (total === 0) return 'N/A';
  const pHigh = high / total;
  const pMed  = medium / total;
  if (pHigh >= 0.4) return 'High';
  if (pMed  >= 0.4) return 'Medium';
  return 'Low';
}

async function fetchSoilHealth(fieldId: string): Promise<SoilHealth | null> {
  // 1. Try direct lab test from soil_health_history
  const { data: lab } = await supabase
    .from('soil_health_history')
    .select('ph_level, nitrogen, phosphorus, potassium, organic_carbon, moisture_level, tested_date')
    .eq('field_id', fieldId)
    .order('tested_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lab) return { source: 'lab', ...lab };

  // 2. Fallback: pull from regional_soil_data using farmer's district
  const { data: fieldData } = await supabase
    .from('farm_fields')
    .select('farms!inner(farmers!inner(state, district))')
    .eq('id', fieldId)
    .maybeSingle();

  const farmer = (fieldData?.farms as any)?.farmers;
  if (!farmer?.district) return null;

  const { data: regional } = await supabase
    .from('regional_soil_data')
    .select('n_High, n_Medium, n_Low, p_High, p_Medium, p_Low, k_High, k_Medium, k_Low, "pH_Alkaline", "pH_Acidic", "pH_Neutral"')
    .filter('"District"', 'ilike', farmer.district.trim())
    .maybeSingle();

  if (!regional) return null;

  // Derive a representative numeric value from the dominant class
  const nClass = classifyFromCounts(regional.n_High, regional.n_Medium, regional.n_Low);
  const pClass = classifyFromCounts(regional.p_High, regional.p_Medium, regional.p_Low);
  const kClass = classifyFromCounts(regional.k_High, regional.k_Medium, regional.k_Low);

  const classToValue: Record<NPKClass, number | null> = {
    High: 220, Medium: 150, Low: 80, 'N/A': null,
  };

  return {
    source: 'regional',
    ph_level: regional.pH_Alkaline > regional.pH_Acidic ? 7.8 : regional.pH_Acidic > regional.pH_Neutral ? 6.2 : 7.0,
    nitrogen:      classToValue[nClass],
    phosphorus:    classToValue[pClass],
    potassium:     classToValue[kClass],
    organic_carbon: null,
    moisture_level: null,
    tested_date:    null,
  };
}

export function useSoilHealth() {
  const { activeFieldId } = useFarmStore();

  const query = useQuery({
    queryKey: ['soil', activeFieldId],
    queryFn:  () => fetchSoilHealth(activeFieldId!),
    enabled:  !!activeFieldId,
    staleTime: 1000 * 60 * 60, // 1 hour — soil changes rarely
  });

  const data = query.data;
  const npk: Record<string, NPKClass> = {
    nitrogen:   classifyNPK(data?.nitrogen   ?? null),
    phosphorus: classifyNPK(data?.phosphorus ?? null),
    potassium:  classifyNPK(data?.potassium  ?? null),
  };

  return { ...query, npk, isRegional: data?.source === 'regional' };
}
