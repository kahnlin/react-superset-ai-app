import { useEffect, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import "./App.css";

// --- Superset 設定 ---
const DASHBOARD_UUID = "b2a08dce-db25-4ed9-aebf-e6490ede7441";
const SUPERSET_DOMAIN = "http://35.229.177.102:8088";
const BACKEND_API_URL = "http://35.229.177.102:8000/api/guest-token";

// --- 你的 AI 後端 API (FastAPI/Flask) ---
const AI_API_URL = "http://localhost:8000/ask_ai";

function App() {
  const dashboardMountPoint = useRef(null);
  const [filterState] = useState("MA");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null); // 預覽截圖
  const [screenStream, setScreenStream] = useState(null); // 🔑 儲存 MediaStream
  const [showAnswer, setShowAnswer] = useState(false); // 🔑 控制折疊/展開

  const fetchGuestToken = async (currentState) => {
    try {
      const rls_rules = [
        {
          clause: `state = '${currentState}'`,
          dataset: 19,
        },
      ];

      const response = await fetch(BACKEND_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboard_uuid: DASHBOARD_UUID,
          rls_rules: rls_rules,
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

  useEffect(() => {
    const embed = async () => {
      if (dashboardMountPoint.current) {
        embedDashboard({
          id: DASHBOARD_UUID,
          supersetDomain: SUPERSET_DOMAIN,
          mountPoint: dashboardMountPoint.current,
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
  }, [filterState]);

  // ✅ 初始化螢幕分享，只會詢問一次
  const initScreenCapture = async () => {
    if (!screenStream) {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      return stream;
    }
    return screenStream;
  };

  // ✅ 使用同一個 stream 擷取畫面
  const handleAskAI = async () => {
    setLoading(true);
    setAnswer("");
    setShowAnswer(false);

    try {
      const stream = await initScreenCapture();
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);

      const bitmap = await imageCapture.grabFrame();

      // 畫到 canvas，轉成 Base64
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      const imgData = canvas.toDataURL("image/png");

      //setPreview(imgData);

      // 傳到後端 API
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshot: imgData,
          question: question,
        }),
      });

      const result = await response.json();
      setAnswer(result.answer);
    } catch (error) {
      console.error("Error asking AI:", error);
      setAnswer("⚠️ 發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>React JS + Superset Embedded via SDK+ AI Assistant </h1>

      {/* --- AI 問答區塊 --- */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="輸入你的問題..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            padding: "0.5rem",
            width: "1000px",
            marginRight: "10px",
          }}
        />
        <button
          onClick={handleAskAI}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading ? "⌛ AI 分析中..." : "📸 Screenshot + Ask AI"}
        </button>
      </div>

      {/* --- 折疊 AI 回覆 --- */}
      {answer && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "6px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => setShowAnswer(!showAnswer)}
          >
            <h3 style={{ margin: 0 }}>AI 回覆</h3>
            <span>{showAnswer ? "🔼 收起" : "🔽 展開"}</span>
          </div>

          {showAnswer && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ whiteSpace: "pre-wrap" }}>{answer}</p>
            </div>
          )}
        </div>
      )}

      {/* --- 預覽截圖 --- */}
      {preview && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>📸 截圖預覽：</h3>
          <img
            src={preview}
            alt="screenshot preview"
            style={{ maxWidth: "100%", border: "1px solid #ccc" }}
          />
        </div>
      )}

      {/* --- Superset Dashboard --- */}
      <div
        ref={dashboardMountPoint}
        className="dashboard-container"
        style={{
          width: "195vw",
          height: "85vh",
          margin: "0 auto",
          border: "1px solid #444",
        }}
      />
    </div>
  );
}

export default App;
