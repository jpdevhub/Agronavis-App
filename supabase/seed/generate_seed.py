import csv
from collections import defaultdict

data = defaultdict(lambda: defaultdict(int))

with open('/Volumes/T7/Agronavis/backend/db/all_states.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        state = row['State'].title()
        district = row['District'].title()
        key = (state, district)
        
        try:
            data[key]['n_High'] += int(row.get('n_High') or 0)
            data[key]['n_Medium'] += int(row.get('n_Medium') or 0)
            data[key]['n_Low'] += int(row.get('n_Low') or 0)
            
            data[key]['p_High'] += int(row.get('p_High') or 0)
            data[key]['p_Medium'] += int(row.get('p_Medium') or 0)
            data[key]['p_Low'] += int(row.get('p_Low') or 0)
            
            data[key]['k_High'] += int(row.get('k_High') or 0)
            data[key]['k_Medium'] += int(row.get('k_Medium') or 0)
            data[key]['k_Low'] += int(row.get('k_Low') or 0)
            
            data[key]['pH_Alkaline'] += int(row.get('pH_Alkaline') or 0)
            data[key]['pH_Acidic'] += int(row.get('pH_Acidic') or 0)
            data[key]['pH_Neutral'] += int(row.get('pH_Neutral') or 0)
            
            data[key]['OC_High'] += int(row.get('OC_High') or 0)
            data[key]['OC_Medium'] += int(row.get('OC_Medium') or 0)
            data[key]['OC_Low'] += int(row.get('OC_Low') or 0)
        except ValueError:
            continue

sql_statements = []
sql_statements.append("-- v3: Seed regional_soil_data with real data aggregated by District")
sql_statements.append("DELETE FROM public.regional_soil_data;")
sql_statements.append("INSERT INTO public.regional_soil_data")
sql_statements.append('  ("State", "District", n_High, n_Medium, n_Low, p_High, p_Medium, p_Low, k_High, k_Medium, k_Low, "pH_Alkaline", "pH_Acidic", "pH_Neutral", "OC_High", "OC_Medium", "OC_Low")')
sql_statements.append("VALUES")

values = []
for (state, district), counts in data.items():
    val = f"('{state}', '{district}', {counts['n_High']}, {counts['n_Medium']}, {counts['n_Low']}, {counts['p_High']}, {counts['p_Medium']}, {counts['p_Low']}, {counts['k_High']}, {counts['k_Medium']}, {counts['k_Low']}, {counts['pH_Alkaline']}, {counts['pH_Acidic']}, {counts['pH_Neutral']}, {counts['OC_High']}, {counts['OC_Medium']}, {counts['OC_Low']})"
    values.append(val)

sql_statements.append(",\n".join(values) + ";")

with open('/Volumes/T7/Agronavis/apps/mobile/supabase/migrations/v3_npk_district_seed.sql', 'w') as f:
    f.write("\n".join(sql_statements) + "\n")

print(f"Generated {len(data)} district records.")
