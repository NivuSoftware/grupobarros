import { useEffect, useState } from "react";
import { sorteoApi, neApi, type Sorteo, type NumeroEspecial, type Estadisticas } from "./api";

export interface SorteoActivoData {
  sorteo: Sorteo;
  ne: NumeroEspecial[];
  stats: Estadisticas["estadisticas"];
}

export function useSorteoActivo() {
  const [data, setData] = useState<SorteoActivoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sorteos = await sorteoApi.listar("ACTIVO");
        const sorteo = sorteos[0];
        if (!sorteo || cancelled) return;

        const [ne, statsRes] = await Promise.all([
          neApi.listar(sorteo.id),
          sorteoApi.estadisticas(sorteo.id),
        ]);

        if (!cancelled) setData({ sorteo, ne, stats: statsRes.estadisticas });
      } catch {
        // No active sorteo — leave data null, sections render static fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}
