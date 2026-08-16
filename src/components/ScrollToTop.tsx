import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * SPA 라우팅에서는 화면이 바뀌어도 문서 스크롤 위치가 그대로 남아요.
 * 새로 진입하는 화면(PUSH/REPLACE)은 항상 최상단부터 보이게 하고,
 * 뒤로가기(POP)는 보던 위치를 유지하도록 그대로 둬요.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}
