import { useEffect, useRef, useState } from "react";

const FASTAPI_URL     = "http://localhost:8000/superset/guest_token";
const SUPERSET_DOMAIN = "http://localhost:8088";
const DASHBOARD_UUID  = "7c19f64b-c2aa-4889-8597-49698255f182"; // 你的 dashboard_uuid
const EMBEDDED_ID     = "27aee318-107d-4888-aecd-4f062820cdbc"; // Embed 對話框顯示的 ID

export default function App() {
  const [guestToken, setGuestToken] = useState("");
  const [status, setStatus] = useState("init");
  const [error, setError] = useState("");
  const iframeRef = useRef(null);

  // 取 guest token
  const fetchGuestToken = async () => {
    setError("");
    setStatus("fetching-token");
    const res = await fetch(FASTAPI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboard_uuid: DASHBOARD_UUID }),
    });
    if (!res.ok) throw new Error(`guest_token API ${res.status}: ${await res.text()}`);
    const { token } = await res.json();
    setGuestToken(token);
    return token;
  };

  // 設定 iframe 來源（只用 guest_token）
  const loadIframe = (token) => {
    if (!iframeRef.current) return;
    const url = `${SUPERSET_DOMAIN}/embedded/${EMBEDDED_ID}?guest_token=${encodeURIComponent(
      token
    )}&uiConfig=8`;
    iframeRef.current.src = url;
    setStatus("loading-iframe");
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await fetchGuestToken();
        loadIframe(token);
      } catch (e) {
        setError(e.message);
        setStatus("error");
      }
    })();
  }, []);

  return (
    <div style={{ padding: 12, background: "#111", color: "#eee", minHeight: "100vh" }}>
      <div style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
        <strong>Guest Token:</strong>{" "}
        <span style={{ opacity: 0.7 }}>{guestToken || "(取得中…)"}</span>
      </div>

      {error && (
        <div style={{ color: "#ff6b6b", marginBottom: 12, whiteSpace: "pre-wrap" }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 8, fontSize: 12 }}>
        <strong>Status:</strong> {status}
      </div>

      <iframe
        ref={iframeRef}
        title="Superset Embedded Dashboard"
        onLoad={() => setStatus("embedded-ok")}
        style={{ width: "100%", height: "85vh", border: 0, background: "#222" }}
        allow="clipboard-write *"
      />
    </div>
  );
}
