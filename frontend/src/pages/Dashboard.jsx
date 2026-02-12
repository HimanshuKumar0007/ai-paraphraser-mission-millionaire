import { useState } from "react";
import API from "../api";

export default function Dashboard() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [error, setError] = useState("");

  const paraphrase = async () => {
    setError("");
    try {
      const res = await API.post("/api/paraphrase", { text });
      setResult(res.data.result);
    } catch (err) {
      const e = err.response?.data;
      if (e?.error === "UPGRADE_REQUIRED") {
        setShowUpgrade(true);
      } else {
        setError(e?.message || "Failed");
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: 700, margin: "50px auto" }}>
      <h2>AI Paraphraser</h2>
      <textarea
        rows="5"
        placeholder="Enter text (max 300 words)"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <br />
      <button onClick={paraphrase}>Paraphrase</button>
      <button onClick={logout} style={{ marginLeft: 10 }}>Logout</button>

      {result && <p><b>Result:</b> {result}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {showUpgrade && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)"
        }}>
          <div style={{
            background: "#fff",
            padding: 20,
            maxWidth: 400,
            margin: "120px auto"
          }}>
            <h3>Upgrade Required</h3>
            <p>Free users cannot paraphrase.</p>
            <p><b>₹399 / month</b></p>
            <button>Upgrade Now</button>
            <button onClick={() => setShowUpgrade(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
