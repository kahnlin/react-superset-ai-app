// src/App.jsx
import { useEffect, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import "./App.css";




// --- 您的設定 (保持不變) ---
// --- DASHBOARD_UUID 為 510(k) Sample Dashboards ==> 263ba561-54b8-4ad3-b5d5-2a98bf68979f  ---
// --- DASHBOARD_UUID 為 510k_Dashboards ==> b2a08dce-db25-4ed9-aebf-e6490ede7441  ---
// --- DASHBOARD_UUID 為 data quality ==> a64e89f2-ce3e-49a2-8760-3c3b736a5084  ---
const DASHBOARD_UUID = "b2a08dce-db25-4ed9-aebf-e6490ede7441"; 
const SUPERSET_DOMAIN = "https://superset.medtech-db.online/";  //"http://35.229.177.102:8088";
const BACKEND_API_URL =  "https://api.medtech-db.online/api/guest-token" //"http://35.229.177.102:8000/api/guest-token";




function App() {
  const dashboardMountPoint = useRef(null);
  // --- 修改點：使用 state 來儲存要篩選的州別 ---
  const [filterState] = useState("MA"); // 預設篩選 MA，目前無作用




  const fetchGuestToken = async (currentState) => {
    try {
      // --- 修改點：建立 RLS 規則並傳送到後端 ---
      const rls_rules = [
        {
          clause: `state = '${currentState}'`,
          dataset: 19, // 假設您的資料集 ID 是 19
        }
      ];

      const response = await fetch(BACKEND_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboard_uuid: DASHBOARD_UUID,
          rls_rules: rls_rules, // <--- 將規則加入請求中
        }),
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

  // --- 修改點：讓 useEffect 監聽 filterState 的變化 ---
  useEffect(() => {
    const embed = async () => {
      if (dashboardMountPoint.current) {
        embedDashboard({
          id: DASHBOARD_UUID,
          supersetDomain: SUPERSET_DOMAIN,
          mountPoint: dashboardMountPoint.current,
          // 每次都用最新的 filterState 去獲取 token
          fetchGuestToken: () => fetchGuestToken(filterState),
          dashboardUiConfig: {
            hideTitle: true,
            hideChartControls: false,
            hideTab: true,
          },
        });
      }
    };
    embed();
  }, [filterState]); // <--- 當 filterState 改變時，重新執行 embed

  return (
    <div className="app-container">
      <h1>React JS + Superset Embedded via SDK (WISPRO 510k Dashboards)</h1>
      



      <div 
        ref={dashboardMountPoint}
        className="dashboard-container"
        style={{
          width: '195vw',
          height: '85vh',
          margin: '0 auto',
          border: '1px solid #444'
        }}
      />

    </div>
  );
}

export default App;