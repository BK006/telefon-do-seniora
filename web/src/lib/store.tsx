import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { buildDataset, STAFF_NAME, type AlertRecord, type Dataset } from "./demo";
import type { AlertStatus } from "./levels";

export type Role = "staff" | "family" | null;

interface Store {
  data: Dataset;
  alerts: AlertRecord[];
  role: Role;
  signIn: (role: Exclude<Role, null>) => void;
  signOut: () => void;
  transition: (alertId: string, to: AlertStatus, note?: string) => void;
}

const Ctx = createContext<Store | null>(null);

// Browser storage is only a per-viewer convenience here (demo role + demo alert workflow).
// It may be unavailable (private mode), so every access is guarded.
const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const data = useMemo(() => buildDataset(), []);
  const [role, setRole] = useState<Role>(() => read<Role>("tds.role", null));
  const [overrides, setOverrides] = useState<Record<string, Pick<AlertRecord, "status" | "events">>>(() =>
    read(`tds.alerts.${data.today}`, {}),
  );

  const alerts = useMemo(
    () => data.alerts.map((a) => (overrides[a.id] ? { ...a, ...overrides[a.id] } : a)),
    [data.alerts, overrides],
  );

  const transition = useCallback(
    (alertId: string, to: AlertStatus, note?: string) => {
      setOverrides((prev) => {
        const current = alerts.find((a) => a.id === alertId);
        if (!current) return prev;
        const now = new Date();
        const at = `${data.today}T${now.toTimeString().slice(0, 5)}`;
        const next = {
          ...prev,
          [alertId]: {
            status: to,
            events: [...current.events, { at, actor: STAFF_NAME, from: current.status, to, note: note?.trim() || undefined }],
          },
        };
        write(`tds.alerts.${data.today}`, next);
        return next;
      });
    },
    [alerts, data.today],
  );

  const value: Store = {
    data,
    alerts,
    role,
    signIn: (r) => {
      setRole(r);
      write("tds.role", r);
    },
    signOut: () => {
      setRole(null);
      write("tds.role", null);
    },
    transition,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}
