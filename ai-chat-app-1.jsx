import React, { useState, useRef, useEffect } from "react";

const UNSPLASH_SEARCH = "https://source.unsplash.com/800x500/?";

function extractImageRequest(text) {
  const patterns = [
    /(?:génère|crée|montre|affiche|dessine|fais|donne|cherche|trouve|image de|photo de|image d'|photo d')\s+(?:moi\s+)?(?:une?|des?|du|de la|de l')?\s*(.+)/i,
    /(?:generate|create|show|display|draw|make|give|search|find|image of|photo of)\s+(?:me\s+)?(?:a|an|the|some)?\s*(.+)/i,
    /^(?:image|photo|picture|illustration)\s*[:\-]?\s*(.+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().replace(/[.,!?]+$/, "");
  }
  return null;
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#e07820",
          animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

function ShulLogo({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c45c10"/>
          <stop offset="50%" stopColor="#e07820"/>
          <stop offset="100%" stopColor="#3b6ea8"/>
        </linearGradient>
        <linearGradient id="sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#ffd9a8" stopOpacity="0.85"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="46" height="46" rx={size > 40 ? 12 : 8} fill="url(#bgGrad)"/>
      <circle cx="38" cy="8" r="14" fill="rgba(255,255,255,0.06)"/>
      <circle cx="6" cy="40" r="10" fill="rgba(0,0,0,0.1)"/>
      <text x="23" y="35" textAnchor="middle" fontFamily="Georgia, serif"
        fontWeight="900" fontSize="38" fill="url(#sGrad)" filter="url(#glow)" letterSpacing="-2">S</text>
      <line x1="0" y1="0" x2="46" y2="46" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
    </svg>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 10, marginBottom: 18,
      animation: "fadeSlideIn 0.35s ease",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: isUser ? "linear-gradient(135deg, #7c3aed, #a78bfa)" : "transparent",
        border: isUser ? "none" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, overflow: "hidden",
      }}>
        {isUser ? "👤" : <ShulLogo size={36} />}
      </div>

      <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: 8 }}>
        {msg.typing ? (
          <div style={{
            background: "rgba(15,23,42,0.9)", border: "1px solid #1e293b",
            borderRadius: "4px 18px 18px 18px", padding: "12px 18px",
          }}>
            <TypingDots />
          </div>
        ) : (
          <>
            {msg.text && (
              <div style={{
                background: isUser ? "linear-gradient(135deg, #5b21b6, #7c3aed)" : "rgba(15,23,42,0.9)",
                border: isUser ? "none" : "1px solid #1e293b",
                borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                padding: "12px 18px", color: "#e2e8f0", fontSize: 15,
                lineHeight: 1.6, whiteSpace: "pre-wrap",
              }}>
                {msg.text}
              </div>
            )}
            {msg.image && (
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #334155", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                <img src={msg.image} alt={msg.imageQuery}
                  style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "cover" }}
                  onError={(e) => { e.target.src = `https://picsum.photos/seed/${encodeURIComponent(msg.imageQuery)}/800/500`; }}
                />
                <div style={{ background: "rgba(15,23,42,0.95)", padding: "8px 14px", fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🖼️</span>
                  <span>Image : <em style={{ color: "#e07820" }}>{msg.imageQuery}</em></span>
                </div>
              </div>
            )}
          </>
        )}
        <span style={{ fontSize: 11, color: "#475569", textAlign: isUser ? "right" : "left", paddingLeft: 4 }}>
          {msg.time}
        </span>
      </div>
    </div>
  );
}

function ApiKeyScreen({ onConnect }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);

  async function handleConnect() {
    if (!key.trim().startsWith("AIza")) {
      setError("Clé invalide. Elle doit commencer par 'AIza...'");
      return;
    }
    setTesting(true);
    setError("");
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] }),
        }
      );
      if (res.ok) {
        onConnect(key.trim());
      } else {
        const d = await res.json();
        setError("Clé invalide ou expirée. Vérifiez sur aistudio.google.com");
      }
    } catch {
      setError("Erreur de connexion. Vérifiez votre internet.");
    }
    setTesting(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1a0a2e 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(15,23,42,0.95)", border: "1px solid #1e293b",
        borderRadius: 24, padding: 36,
        boxShadow: "0 0 60px rgba(224,120,32,0.15)",
        animation: "fadeSlideIn 0.5s ease",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: "0 0 30px rgba(224,120,32,0.5)" }}>
            <ShulLogo size={72} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 28,
              background: "linear-gradient(90deg, #e07820, #f5a54a, #3b8fd4)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}>SHULI AI</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Connectez votre clé API Gemini</div>
          </div>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#94a3b8", fontSize: 13, display: "block", marginBottom: 8 }}>
            🔑 Clé API Google Gemini
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(""); }}
              placeholder="AIzaSy..."
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              style={{
                width: "100%", padding: "12px 44px 12px 16px",
                background: "rgba(2,6,23,0.8)", border: `1px solid ${error ? "#ef4444" : "#334155"}`,
                borderRadius: 12, color: "#e2e8f0", fontSize: 14,
                fontFamily: "'Inter', sans-serif", outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button onClick={() => setShow(!show)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b",
            }}>{show ? "🙈" : "👁️"}</button>
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>⚠️ {error}</div>}
        </div>

        <div style={{ background: "rgba(224,120,32,0.08)", border: "1px solid rgba(224,120,32,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
          🔒 Votre clé reste dans votre navigateur uniquement. Elle n'est jamais envoyée ailleurs.
          <br/>Obtenez une clé gratuite sur <a href="https://aistudio.google.com" target="_blank" style={{ color: "#e07820" }}>aistudio.google.com</a>
        </div>

        <button onClick={handleConnect} disabled={!key.trim() || testing} style={{
          width: "100%", padding: "14px",
          background: key.trim() ? "linear-gradient(135deg, #c45c10, #e07820)" : "rgba(51,65,85,0.5)",
          border: "none", borderRadius: 12, color: "#fff",
          fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15,
          cursor: key.trim() ? "pointer" : "not-allowed",
          transition: "all 0.2s",
          boxShadow: key.trim() ? "0 0 20px rgba(224,120,32,0.4)" : "none",
        }}>
          {testing ? "⏳ Vérification..." : "🚀 Lancer SHULI AI"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Bonjour ! Je suis SHULI AI 👋 Je peux discuter avec vous et afficher des images. Essayez : « Montre-moi une image de plage » ✨",
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      id: 0,
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!apiKey) return <ApiKeyScreen onConnect={setApiKey} />;

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { role: "user", text: userText, time: now, id: Date.now() }]);
    setLoading(true);

    const typingId = Date.now() + 1;
    setMessages((prev) => [...prev, { role: "assistant", typing: true, id: typingId, time: "" }]);

    const imageQuery = extractImageRequest(userText);
    const newHistory = [...history, { role: "user", parts: [{ text: userText }] }];

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: "Tu es SHULI AI, un assistant intelligent, chaleureux et expressif. Tu parles en français par défaut. Si l'utilisateur demande une image, confirme que tu la génères. Sois concis et naturel. Utilise parfois des emojis." }] },
            contents: newHistory,
          }),
        }
      );
      const data = await res.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu répondre.";
      const replyTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

      setHistory([...newHistory, { role: "model", parts: [{ text: aiText }] }]);
      setMessages((prev) => prev.filter((m) => m.id !== typingId));

      const aiMsg = { role: "assistant", text: aiText, time: replyTime, id: Date.now() + 2 };
      if (imageQuery) {
        aiMsg.image = `${UNSPLASH_SEARCH}${encodeURIComponent(imageQuery)}`;
        aiMsg.imageQuery = imageQuery;
      }
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      setMessages((prev) => [...prev, {
        role: "assistant", text: "⚠️ Erreur de connexion. Vérifiez votre clé API.",
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), id: Date.now() + 3,
      }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  const suggestions = [
    "Montre-moi une image de coucher de soleil 🌅",
    "Quelle est la capitale du Sénégal ?",
    "Génère une image de forêt tropicale 🌿",
    "Raconte-moi une blague 😄",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #020617; }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-6px); } }
        textarea:focus { outline: none; } textarea { resize: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .suggestion-btn:hover { background: rgba(224,120,32,0.15) !important; border-color: #e07820 !important; color: #f5a54a !important; }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 0 20px rgba(224,120,32,0.6); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        input { outline: none; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1a0a2e 100%)", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>

        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(51,65,85,0.5)", background: "rgba(2,6,23,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 0 20px rgba(224,120,32,0.4), 0 0 0 2px #e07820", flexShrink: 0 }}>
              <ShulLogo size={46} />
            </div>
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 18, background: "linear-gradient(90deg, #e07820, #f5a54a, #3b8fd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SHULI AI
              </div>
              <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Gemini · Chat · Images
              </div>
            </div>
          </div>
          <button onClick={() => { setMessages([{ role: "assistant", text: "Conversation réinitialisée ✨", time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), id: Date.now() }]); setHistory([]); }}
            style={{ background: "rgba(51,65,85,0.4)", border: "1px solid #334155", color: "#94a3b8", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
            ↺ Reset
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px", maxWidth: 760, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column" }}>
          {messages.map((msg) => <Message key={msg.id} msg={msg} />)}

          {messages.length === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, animation: "fadeSlideIn 0.5s 0.3s both ease" }}>
              {suggestions.map((s, i) => (
                <button key={i} className="suggestion-btn" onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #1e293b", color: "#94a3b8", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Inter', sans-serif", transition: "all 0.2s", lineHeight: 1.4 }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "16px 16px 20px", borderTop: "1px solid rgba(51,65,85,0.4)", background: "rgba(2,6,23,0.9)", backdropFilter: "blur(12px)", maxWidth: 760, width: "100%", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(15,23,42,0.9)", border: "1px solid #334155", borderRadius: 16, padding: "10px 12px" }}>
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Écrivez un message ou demandez une image..."
              rows={1}
              style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontSize: 15, lineHeight: 1.5, fontFamily: "'Inter', sans-serif", maxHeight: 120, overflowY: "auto" }}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading} className="send-btn"
              style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #c45c10, #e07820)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "all 0.2s", boxShadow: "0 0 12px rgba(224,120,32,0.3)" }}>
              ➤
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#334155" }}>Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</div>
        </div>
      </div>
    </>
  );
}
