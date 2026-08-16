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

  // remote 동기화는 화면을 막지 않도록 백그라운드로 돌려요.
  // 병합 결과가 local 에도 반영되므로 끝나면 다시 읽어요.
  const syncRemote = useCallback(
    (removedIds?: string[]) => {
      saveFuelLogRemote(removedIds)
        .then(reload)
        .catch((error) => console.warn("remote 동기화에 실패했어요.", error));
    },
    [reload],
  );

  const addLog = useCallback(
    async (log: FuelLog) => {
      await addFuelLog(log);
      await reload();
      syncRemote();
    },
    [reload, syncRemote],
  );

  const updateLog = useCallback(
    async (log: FuelLog) => {
      await updateFuelLog(log);
      await reload();
      syncRemote();
    },
    [reload, syncRemote],
  );

  const removeLog = useCallback(
    async (id: string) => {
      await removeFuelLog(id);
      await reload();
      // 삭제한 기록이 remote 에서 다시 딸려오지 않도록 알려줘요.
      syncRemote([id]);
    },
    [reload, syncRemote],
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
