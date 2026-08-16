import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { FuelLog } from "../types/fuelLog";
import {
  addFuelLog,
  clearFuelLogs,
  getFuelLogs,
  mergeRemoteFuelLogs,
  removeFuelLog,
  saveFuelLogRemote,
  updateFuelLog,
} from "../repository";

interface FuelLogState {
  logs: FuelLog[];
  /** Storage 에서 최초 로드가 끝났는지 여부. false 면 아직 빈 목록인지 알 수 없어요. */
  loaded: boolean;
  addLog: (log: FuelLog) => Promise<void>;
  updateLog: (log: FuelLog) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  mergeRemoteLogs: (remoteLogs: FuelLog[]) => Promise<void>;
}

const FuelLogContext = createContext<FuelLogState | null>(null);

export function FuelLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 쓰기 작업 후 Storage 를 다시 읽어 전역 상태를 맞춰요.
  const reload = useCallback(async () => {
    setLogs(await getFuelLogs());
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addLog = useCallback(
    async (log: FuelLog) => {
      await addFuelLog(log);
      await reload();
      saveFuelLogRemote();
    },
    [reload],
  );

  const updateLog = useCallback(
    async (log: FuelLog) => {
      await updateFuelLog(log);
      await reload();
      saveFuelLogRemote();
    },
    [reload],
  );

  const removeLog = useCallback(
    async (id: string) => {
      await removeFuelLog(id);
      await reload();
      saveFuelLogRemote();
    },
    [reload],
  );

  // 로컬 데이터만 지우는 테스트용 기능이라 remote 로는 반영하지 않아요.
  const clearLogs = useCallback(async () => {
    await clearFuelLogs();
    await reload();
  }, [reload]);

  const mergeRemoteLogs = useCallback(
    async (remoteLogs: FuelLog[]) => {
      await mergeRemoteFuelLogs(remoteLogs);
      await reload();
    },
    [reload],
  );

  return (
    <FuelLogContext.Provider
      value={{
        logs,
        loaded,
        addLog,
        updateLog,
        removeLog,
        clearLogs,
        mergeRemoteLogs,
      }}
    >
      {children}
    </FuelLogContext.Provider>
  );
}

export function useFuelLogs() {
  const ctx = useContext(FuelLogContext);
  if (!ctx) throw new Error("FuelLogProvider가 필요합니다.");
  return ctx;
}
