import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { rfmService, StockVelocityRow } from "../services/rfmService";
import { useGlobalData } from "../contexts/DataContext";

export function useStockVelocity() {
  const { profile } = useAuth();
  const { products, stockMovements } = useGlobalData();
  const [velocity, setVelocity] = useState<StockVelocityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.business_id) {
      setLoading(true);
      rfmService.getStockVelocity(profile.business_id)
        .then(data => setVelocity(data || []))
        .catch(err => console.error("Stock velocity loading failed:", err))
        .finally(() => setLoading(false));
    }
  }, [profile?.business_id, products, stockMovements]);

  const critical = velocity.filter(v => v.velocity_label === 'Critical');
  const low = velocity.filter(v => v.velocity_label === 'Low');

  return { data: velocity, velocity, critical, low, loading };
}
