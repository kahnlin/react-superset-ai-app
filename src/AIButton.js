import React, { useState } from "react";
import html2canvas from "html2canvas";

function AIButton() {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  const handleAskAI = async () => {
    setLoading(true);
    setAnswer("");

    try {
      // 截圖整個 body（可改成指定區塊：document.getElementById("content")）
      const canvas = await html2canvas(document.body);
      const imgData = canvas.toDataURL("image/png");

      // 呼叫後端 API
      const response = await fetch("http://localhost:8000/ask_ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshot: imgData })
      });

      const result = await response.json();
      setAnswer(result.answer);
    } catch (error) {
      console.error("Error asking AI:", error);
      setAnswer("❌ 發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
      <button
        onClick={handleAskAI}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        {loading ? "⌛ AI 分析中..." : "📸 問 AI"}
      </button>

      {answer && (
        <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
          <strong>AI 回覆：</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default AIButton;
