import { ListRow, Switch, Top } from "@toss/tds-mobile";
import { useEffect, useState } from "react";
import {
  getCloudSyncEnabled,
  saveCloudSyncEnabled,
  saveToCloud,
} from "../cloudSync";
import { useToast } from "../hooks/useToast";

const NOTICES = [
  "동기화를 켜지 않으면 기록은 이 기기에만 저장돼요.",
  "휴대폰을 바꾸거나 앱/앱 데이터를 지우면 기록은 다시 불러올 수 없어요.",
  "클라우드에 저장한 데이터로는 사용자를 특정할 수 없어요.",
  "민감한 개인 정보는 적지 마세요.",
];

export function CloudSyncPage() {
  const { show } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCloudSyncEnabled().then((value) => {
      setEnabled(value);
      setLoaded(true);
    });
  }, []);

  async function toggleSync(checked: boolean) {
    if (!checked) {
      setEnabled(false);
      await saveCloudSyncEnabled(false);
      return;
    }

    // 저장에 실패하면 꺼진 상태로 돌려놔요.
    setEnabled(true);
    setSaving(true);
    try {
      await saveToCloud();
      await saveCloudSyncEnabled(true);
      show({ text: "현재 데이터를 클라우드에 저장했어요", duration: 2000 });
    } catch (error) {
      console.error("클라우드 저장에 실패했어요:", error);
      setEnabled(false);
      show({ text: "클라우드에 저장하지 못했어요", duration: 2000 });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <Top
        upperGap={0}
        lowerGap={0}
        title={<Top.TitleParagraph size={28}>동기화</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            기록을 클라우드에 저장해 둘 수 있어요
          </Top.SubtitleParagraph>
        }
      />

      <ListRow
        border="none"
        contents={<ListRow.Texts type="1RowTypeA" top="데이터 동기화" />}
        right={
          <Switch
            checked={enabled}
            disabled={!loaded || saving}
            onChange={(_, checked) => toggleSync(checked)}
          />
        }
      />

      <div style={{ padding: "0 20px" }}>
        <ul
          style={{
            margin: 0,
            padding: 20,
            listStyle: "none",
            backgroundColor: "#F9FAFB",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {NOTICES.map((notice) => (
            <li
              key={notice}
              style={{
                display: "flex",
                gap: 8,
                fontSize: 15,
                lineHeight: 1.6,
                color: "#4E5968",
              }}
            >
              <span aria-hidden>•</span>
              <span>{notice}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
