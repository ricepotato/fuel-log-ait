import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAnonymousKey } from "@apps-in-toss/web-framework";
import { analyzeReceipt } from "../api/fuellog";
import { useToast } from "../hooks/useToast";

interface LocationState {
  base64: string;
  contentType: string;
}

export function ReceiptLoadingPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { base64, contentType } = (state ?? {}) as LocationState;
  const { show } = useToast();

  useEffect(() => {
    if (!base64) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      const anonymousKey = await getAnonymousKey();
      if (cancelled) return;
      if (!anonymousKey || anonymousKey === "ERROR") {
        navigate("/", { replace: true });
        return;
      }
      try {
        const result = await analyzeReceipt(
          anonymousKey.hash,
          base64,
          contentType,
        );
        if (!cancelled) {
          show({ text: "영수증을 인식했어요", duration: 2000 });
          navigate("/add", { replace: true, state: { receipt: result } });
        }
      } catch {
        if (!cancelled) {
          navigate("/", { replace: true, state: { receiptError: true } });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 24,
        backgroundColor: "white",
      }}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "4px solid #E5E8EB",
          borderTopColor: "#3182F6",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 17, fontWeight: 600, color: "#191F28", margin: 0 }}>
          영수증을 분석하고 있어요
        </p>
        <p style={{ fontSize: 14, color: "#8B95A1", margin: "8px 0 0" }}>
          잠시만 기다려 주세요
        </p>
      </div>
    </div>
  );
}
