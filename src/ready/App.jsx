// src/App.jsx
import { useEffect, useRef } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import "./App.css"; // 引入 App.css

// --- 您的設定 ---
// ❗ **關鍵**：請將這裡的 UUID 換成您要嵌入的儀表板 ID
const DASHBOARD_UUID = "ee9c1af3-7dd7-41af-97db-89893e0d5d94";
const SUPERSET_DOMAIN = "http://localhost:8088";
const BACKEND_API_URL = "http://localhost:8000/api/guest-token";
// ----------------

function App() {
  const dashboardMountPoint = useRef(null);

  const fetchGuestToken = async () => {
    try {
      const response = await fetch(BACKEND_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard_uuid: DASHBOARD_UUID }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch guest token: ${response.statusText}`);
      }
      const { token } = await response.json();
      return token;
    } catch (error) {
      console.error("Error fetching guest token:", error);
      return null;
    }
  };

  useEffect(() => {
    if (dashboardMountPoint.current) {
      embedDashboard({
        id: DASHBOARD_UUID,
        supersetDomain: SUPERSET_DOMAIN,
        mountPoint: dashboardMountPoint.current,
        fetchGuestToken: fetchGuestToken,
        dashboardUiConfig: {
          hideTitle: true,
          hideChartControls: false,
          hideTab: true,
        },
      });
    }
  }, []); // 空依賴陣列，確保只執行一次

  return (
    <div className="app-container">
      <h1>DEMO用途 React JS + Superset Embedded via SDK</h1>
      <div
        ref={dashboardMountPoint}
        className="dashboard-container"
        // --- 在這裡加入 style 屬性 ---
        style={{
          width: '195vw',        // 設定寬度為 95% 的視窗寬度
          height: '85vh',       // 設定高度為 85% 的視窗高度
          margin: '0 auto',     // (可選) 讓容器水平置中
          border: '1px solid #444' // (可選) 加上邊框以利辨識
        }}
        // -------------------------
      />
    </div>
  );
}

export default App;