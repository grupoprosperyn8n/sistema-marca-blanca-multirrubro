import { useCallback, useEffect, useState } from "react";
import { ROLES, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

export const CART_UPDATED_EVENT = "cart-updated";

export function notifyCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export default function useCartSummary() {
  const { role, usuario } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!usuario || role !== ROLES.CLIENTE) {
      setCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/carrito`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setCount(0);
        return;
      }
      const data = await res.json();
      setCount(Number(data.total_items || 0));
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [role, usuario]);

  useEffect(() => {
    load();
    window.addEventListener(CART_UPDATED_EVENT, load);
    return () => window.removeEventListener(CART_UPDATED_EVENT, load);
  }, [load]);

  return { count, loading, reload: load };
}
