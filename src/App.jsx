import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDKZmUarqWqNEfI8fnh2bvQ4LhQnhD0jOc",
  authDomain: "travel-wallet-27f51.firebaseapp.com",
  databaseURL: "https://travel-wallet-27f51-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "travel-wallet-27f51",
  storageBucket: "travel-wallet-27f51.firebasestorage.app",
  messagingSenderId: "641467425230",
  appId: "1:641467425230:web:eff53c8d41ce62358c4b9f"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const CURRENCIES = [
  { code: "MYR", flag: "🇲🇾", nameZh: "马币", name: "Malaysian Ringgit" },
  { code: "THB", flag: "🇹🇭", nameZh: "泰铢", name: "Thai Baht" },
  { code: "JPY", flag: "🇯🇵", nameZh: "日元", name: "Japanese Yen" },
  { code: "USD", flag: "🇺🇸", nameZh: "美元", name: "US Dollar" },
  { code: "EUR", flag: "🇪🇺", nameZh: "欧元", name: "Euro" },
  { code: "SGD", flag: "🇸🇬", nameZh: "新元", name: "Singapore Dollar" },
  { code: "GBP", flag: "🇬🇧", nameZh: "英镑", name: "British Pound" },
  { code: "AUD", flag: "🇦🇺", nameZh: "澳元", name: "Australian Dollar" },
  { code: "CNY", flag: "🇨🇳", nameZh: "人民币", name: "Chinese Yuan" },
  { code: "KRW", flag: "🇰🇷", nameZh: "韩元", name: "Korean Won" },
  { code: "IDR", flag: "🇮🇩", nameZh: "印尼盾", name: "Indonesian Rupiah" },
  { code: "TWD", flag: "🇹🇼", nameZh: "台币", name: "Taiwan Dollar" },
];

const T = {
  en: {
    appTitle: "Currency Wallet", setupTitle: "Wallet Setup", topUpTitle: "Top Up Balance",
    yourCurrency: "Your Currency", exchangeCurrency: "Exchange Currency",
    myrAmt: "Amount (your currency)", foreignAmt: "Amount (foreign)",
    rate: "Rate", avgRateLabel: "Avg rate after top-up",
    confirm: "Confirm", cancel: "Cancel", createWallet: "Create Wallet",
    spent: "Spent", total: "Total", currentBalance: "Current Balance",
    recordExpense: "Record Expense", amount: "Amount", note: "What did you buy?",
    addExpense: "+ Add", noEntries: "No records yet 🛍️",
    topUp: "Top Up", topUpLabel: "Top Up",
    allRecords: "Expense Records", noWallet: "Set up your wallet to get started.",
    syncing: "Syncing...", synced: "Synced ✓", showAll: "Show all", collapse: "Collapse",
    quickAdd: "Quick add",
  },
  zh: {
    appTitle: "货币钱包", setupTitle: "钱包设置", topUpTitle: "增加余额",
    yourCurrency: "你的货币", exchangeCurrency: "兑换货币",
    myrAmt: "金额（你的货币）", foreignAmt: "外币金额",
    rate: "汇率", avgRateLabel: "补充后的平均汇率",
    confirm: "确认", cancel: "取消", createWallet: "建立钱包",
    spent: "已消费", total: "总额", currentBalance: "当前余额",
    recordExpense: "记录消费", amount: "金额", note: "备注",
    addExpense: "+ 添加消费", noEntries: "还没有记录 🛍️",
    topUp: "充值", topUpLabel: "补充余额",
    allRecords: "消费记录", noWallet: "请先设置钱包开始使用。",
    syncing: "同步中...", synced: "已同步 ✓", showAll: "展开全部", collapse: "收起",
    quickAdd: "快捷金额",
  }
};

const fmt = (n, d = 2) => Number(n).toLocaleString("en-MY", { minimumFractionDigits: d, maximumFractionDigits: d });
const getCurr = (code) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
const fmtDate = (ts) => {
  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;
};

const Modal = ({ show, onClose, title, children, th }) => {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:th.card, borderRadius:20, padding:"24px 20px 28px", width:"100%", maxWidth:400, boxSizing:"border-box", animation:"popIn 0.22s ease" }}>
        <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        {title && <div style={{ fontWeight:700, fontSize:17, color:th.text, marginBottom:18 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("tw_lang") || "zh");
  const [dark, setDark] = useState(() => localStorage.getItem("tw_dark") === "true");
  const [showSetup, setShowSetup] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [synced, setSynced] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [setupMyCurr, setSetupMyCurr] = useState("MYR");
  const [setupForeignCurr, setSetupForeignCurr] = useState("THB");
  const [setupMyAmt, setSetupMyAmt] = useState("");
  const [setupForeignAmt, setSetupForeignAmt] = useState("");
  const [topUpMyAmt, setTopUpMyAmt] = useState("");
  const [topUpForeignAmt, setTopUpForeignAmt] = useState("");
  const [expAmt, setExpAmt] = useState("");
  const [expNote, setExpNote] = useState("");
  const [quickAmts, setQuickAmts] = useState([]);
  const [quickInput, setQuickInput] = useState("");

  const t = T[lang];
  const th = {
    bg: dark ? "#1a1a1a" : "#f5f0e8",
    card: dark ? "#2a2a2a" : "#ffffff",
    border: dark ? "#3a3a3a" : "#e8e0d0",
    text: dark ? "#f0f0f0" : "#1a1a1a",
    sub: dark ? "#999" : "#888",
    input: dark ? "#333" : "#fafafa",
    inputBorder: dark ? "#444" : "#e0d8cc",
    rowBorder: dark ? "#333" : "#f0ebe0",
    accent: "#c8963e",
    accentLight: dark ? "#3a2e1a" : "#fdf6ea",
    green: "#2D6A4F", red: "#dc2626",
  };
  const inp = { padding:"11px 14px", borderRadius:12, border:`1.5px solid ${th.inputBorder}`, fontSize:15, background:th.input, color:th.text, boxSizing:"border-box", width:"100%", outline:"none" };
  const sel = { ...inp, background: dark ? "#333" : "#fafafa" };

  useEffect(() => { localStorage.setItem("tw_lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("tw_dark", dark); }, [dark]);

  useEffect(() => {
    const dataRef = ref(db, "shared");
    const unsub = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setWallet(data.wallet || null);
        setEntries(data.entries || []);
        if (!data.wallet) setShowSetup(true);
      } else {
        setShowSetup(true);
      }
      setLoaded(true);
      setSynced(true);
    });
    return () => unsub();
  }, []);

  const saveToFirebase = (w, e) => {
    setSynced(false);
    set(ref(db, "shared"), { wallet: w, entries: e }).then(() => setSynced(true));
  };

  const handleSetupWallet = () => {
    const myAmt = parseFloat(setupMyAmt), foreignAmt = parseFloat(setupForeignAmt);
    if (!myAmt || !foreignAmt || myAmt <= 0 || foreignAmt <= 0) return;
    const w = { totalMy: myAmt, foreignAmt, remaining: foreignAmt, rate: myAmt / foreignAmt, myCurr: setupMyCurr, foreignCurr: setupForeignCurr };
    setWallet(w); setEntries([]);
    setSetupMyAmt(""); setSetupForeignAmt("");
    setShowSetup(false);
    saveToFirebase(w, []);
  };

  const handleTopUp = () => {
    const addMy = parseFloat(topUpMyAmt), addForeign = parseFloat(topUpForeignAmt);
    if (!addMy || !addForeign || addMy <= 0 || addForeign <= 0) return;
    const newTotalMy = wallet.totalMy + addMy;
    const newForeignAmt = wallet.foreignAmt + addForeign;
    const w = { ...wallet, totalMy: newTotalMy, foreignAmt: newForeignAmt, remaining: wallet.remaining + addForeign, rate: newTotalMy / newForeignAmt };
    const e = [{ id: Date.now(), type:"topup", addMy, addForeign, myCurr: wallet.myCurr, foreignCurr: wallet.foreignCurr, flag: getCurr(wallet.foreignCurr).flag, ts: Date.now() }, ...entries];
    setWallet(w); setEntries(e);
    setTopUpMyAmt(""); setTopUpForeignAmt("");
    setShowTopUpModal(false);
    saveToFirebase(w, e);
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expAmt);
    if (!amt || amt <= 0 || !wallet) return;
    const entry = { id: Date.now(), type:"expense", foreign: amt, my: amt * wallet.rate, note: expNote || (lang === "zh" ? "消费" : "Expense"), foreignCurr: wallet.foreignCurr, myCurr: wallet.myCurr, flag: getCurr(wallet.foreignCurr).flag, ts: Date.now() };
    const w = { ...wallet, remaining: wallet.remaining - amt };
    const e = [entry, ...entries];
    setWallet(w); setEntries(e);
    setExpAmt(""); setExpNote(""); setQuickAmts([]);
    saveToFirebase(w, e);
  };

  const handleDeleteEntry = (id) => {
    const entry = entries.find(x => x.id === id);
    if (!entry) return;
    let w;
    if (entry.type === "expense") w = { ...wallet, remaining: wallet.remaining + entry.foreign };
    else {
      const newTotalMy = wallet.totalMy - entry.addMy;
      const newForeignAmt = wallet.foreignAmt - entry.addForeign;
      w = { ...wallet, totalMy: newTotalMy, foreignAmt: newForeignAmt, remaining: wallet.remaining - entry.addForeign, rate: newTotalMy / newForeignAmt };
    }
    const e = entries.filter(x => x.id !== id);
    setWallet(w); setEntries(e);
    saveToFirebase(w, e);
  };

  const handleReset = () => {
    setWallet(null); setEntries([]); setShowSetup(true);
    saveToFirebase(null, []);
  };

  const addQuickAmt = () => {
    const v = parseFloat(quickInput);
    if (!v || v <= 0) return;
    setQuickAmts(prev => [...prev, v]);
    setQuickInput("");
  };

  const spent = wallet ? wallet.foreignAmt - wallet.remaining : 0;
  const spentPct = wallet ? Math.min((spent / wallet.foreignAmt) * 100, 100) : 0;
  const topUpPreviewRate = () => {
    const a = parseFloat(topUpMyAmt), b = parseFloat(topUpForeignAmt);
    return (wallet && a && b) ? (wallet.totalMy + a) / (wallet.foreignAmt + b) : null;
  };
  const visibleEntries = showAllEntries ? entries : entries.slice(0, 5);

  if (!loaded) return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:th.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:28 }}>✈️</div>
      <div style={{ color:th.accent, fontSize:15, fontWeight:600 }}>{t.syncing}</div>
    </div>
  );

  return (
<div style={{ fontFamily:"'Inter',sans-serif", background:th.bg, minHeight:"100vh", paddingBottom:32 }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px 10px" }}>
        <button onClick={() => setLang(l => l === "zh" ? "en" : "zh")} style={{ background:th.accentLight, border:`1px solid ${th.accent}`, borderRadius:8, padding:"5px 12px", fontSize:12, cursor:"pointer", color:th.accent, fontWeight:700 }}>
          {lang === "zh" ? "EN" : "中"}
        </button>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
          <span style={{ fontWeight:700, fontSize:16, color:th.text }}>{t.appTitle}</span>
          <span style={{ fontSize:10, color: synced ? th.green : th.accent }}>{synced ? t.synced : t.syncing}</span>
        </div>
        <button onClick={() => setDark(d => !d)} style={{ background:th.accentLight, border:`1px solid ${th.accent}`, borderRadius:8, padding:"5px 10px", fontSize:14, cursor:"pointer" }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Wallet card */}
        {wallet && (
          <div style={{ borderRadius:20, padding:"20px 20px 16px", color:"#fff", position:"relative", background: dark ? "linear-gradient(135deg, #3a2000, #6b4a00, #c8963e)" : "linear-gradient(135deg, #7a4f10, #c8963e, #f0b445)", boxShadow:"0 4px 20px rgba(200,150,62,0.3)" }}>
            <button onClick={handleReset} style={{ position:"absolute", top:12, right:12, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:8, width:28, height:28, color:"#fff", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            <div style={{ fontSize:12, opacity:0.85, marginBottom:4 }}>{getCurr(wallet.foreignCurr).flag} {t.currentBalance}</div>
            <div style={{ fontSize:36, fontWeight:800, marginBottom:2, letterSpacing:-1 }}>{wallet.foreignCurr} {fmt(wallet.remaining)}</div>
            <div style={{ fontSize:14, opacity:0.8, marginBottom:16 }}>≈ {wallet.myCurr} {fmt(wallet.remaining * wallet.rate)}</div>
            <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:5 }}>
              <div style={{ width:`${spentPct}%`, background:"#fff", borderRadius:99, height:5, transition:"width 0.4s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, opacity:0.75, marginTop:6, marginBottom:12 }}>
              <span>{t.spent} {wallet.foreignCurr} {fmt(spent)}</span>
              <span>{t.total} {wallet.foreignCurr} {fmt(wallet.foreignAmt)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.2)" }}>
              <span style={{ fontSize:12, opacity:0.8 }}>汇率建立 1 {wallet.foreignCurr} = {wallet.myCurr} {fmt(wallet.rate,4)}</span>
              <button onClick={() => setShowTopUpModal(true)} style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"5px 14px", color:"#fff", fontSize:12, cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                ＋ {t.topUp} ›
              </button>
            </div>
          </div>
        )}

        {/* Record expense */}
        {wallet && (
          <div style={{ background:th.card, borderRadius:20, padding:18, border:`1px solid ${th.border}` }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:th.text }}>✏️ {t.recordExpense}</div>

            {/* Amount */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <label style={{ fontSize:12, color:th.sub, fontWeight:500 }}>{t.amount}</label>
                <span style={{ fontSize:12, color:th.sub }}>{wallet.foreignCurr}</span>
              </div>
              <input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)} style={{ ...inp, fontSize:18, fontWeight:600 }} placeholder="0" />
              {expAmt && parseFloat(expAmt) > 0 && (
                <div style={{ fontSize:12, color:th.green, marginTop:6, fontWeight:500 }}>≈ {wallet.myCurr} {fmt(parseFloat(expAmt)*wallet.rate)}</div>
              )}
            </div>

            {/* Quick amounts */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                {quickAmts.map((q, i) => (
                  <button key={i} onClick={() => setExpAmt(String(q))} style={{ background:th.accentLight, border:`1px solid ${th.accent}`, borderRadius:20, padding:"4px 12px", fontSize:13, color:th.accent, cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                    +{q}
                    <span onClick={e => { e.stopPropagation(); setQuickAmts(prev => prev.filter((_,j)=>j!==i)); }} style={{ color:th.sub, fontSize:11, marginLeft:2 }}>✕</span>
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input type="number" value={quickInput} onChange={e => setQuickInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addQuickAmt()} placeholder={t.quickAdd} style={{ ...inp, fontSize:13, padding:"8px 12px", flex:1 }} />
                <button onClick={addQuickAmt} style={{ background:th.accentLight, border:`1px solid ${th.accent}`, borderRadius:12, padding:"8px 14px", color:th.accent, fontWeight:700, cursor:"pointer", fontSize:13, whiteSpace:"nowrap" }}>＋</button>
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:th.sub, fontWeight:500, display:"block", marginBottom:6 }}>{t.note}</label>
              <input placeholder={lang === "zh" ? "买了什么？" : "What did you buy?"} value={expNote} onChange={e => setExpNote(e.target.value)} style={inp} />
            </div>

            <button onClick={handleAddExpense} style={{ width:"100%", padding:"13px", background:"#2D6A4F", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", letterSpacing:0.3 }}>
              {t.addExpense}
            </button>
          </div>
        )}

        {/* Expense records - collapsible */}
        {wallet && (
          <div style={{ background:th.card, borderRadius:20, border:`1px solid ${th.border}`, overflow:"hidden" }}>
            <button onClick={() => setShowAllEntries(s => !s)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 18px", background:"none", border:"none", cursor:"pointer" }}>
              <span style={{ fontWeight:700, fontSize:15, color:th.text }}>🗂 {t.allRecords}</span>
              <span style={{ color:th.accent, fontSize:13 }}>{showAllEntries ? "▲" : "▼"}</span>
            </button>
            <div style={{ padding:"0 18px 16px" }}>
              {entries.length === 0 && <div style={{ textAlign:"center", color:th.sub, padding:"20px 0", fontSize:13 }}>{t.noEntries}</div>}
              {visibleEntries.map((e, i) => (
                <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom: i < visibleEntries.length-1 ? `1px solid ${th.rowBorder}` : "none" }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background: e.type==="topup" ? "#dcfce7" : th.accentLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                    {e.type==="topup" ? "＋" : "💸"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:th.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {e.type==="topup" ? `${t.topUpLabel}: ${e.myCurr} ${fmt(e.addMy)}` : e.note}
                    </div>
                    <div style={{ fontSize:11, color:th.sub, marginTop:1 }}>
                      {fmtDate(e.ts)}{e.type==="expense" && <span style={{ marginLeft:6 }}>≈ {e.myCurr} {fmt(e.my)}</span>}
                    </div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:14, color: e.type==="topup" ? "#16a34a" : th.red, whiteSpace:"nowrap" }}>
                    {e.type==="topup" ? "+" : "-"}{e.flag} {fmt(e.type==="topup" ? e.addForeign : e.foreign)}
                  </div>
                  <button onClick={() => handleDeleteEntry(e.id)} style={{ background:"none", border:"none", cursor:"pointer", color:th.sub, fontSize:14, padding:4, flexShrink:0 }}>✕</button>
                </div>
              ))}
              {entries.length > 5 && (
                <button onClick={() => setShowAllEntries(s => !s)} style={{ width:"100%", marginTop:10, padding:"8px", background:th.accentLight, border:`1px solid ${th.border}`, borderRadius:10, color:th.accent, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  {showAllEntries ? t.collapse : `${t.showAll} (${entries.length})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Wallet setup - collapsible, at bottom */}
        <div style={{ background:th.card, borderRadius:20, border:`1px solid ${th.border}`, overflow:"hidden" }}>
          <button onClick={() => setShowSetup(s => !s)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 18px", background:"none", border:"none", cursor:"pointer" }}>
            <span style={{ fontWeight:700, fontSize:15, color:th.text }}>💼 {t.setupTitle}</span>
            <span style={{ color:th.accent, fontSize:13 }}>{showSetup ? "▲" : "▼"}</span>
          </button>
          {showSetup && (
            <div style={{ padding:"0 18px 18px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:6 }}>{t.yourCurrency}</label>
                  <select value={setupMyCurr} onChange={e => setSetupMyCurr(e.target.value)} style={sel}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></div>
                <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:6 }}>{t.exchangeCurrency}</label>
                  <select value={setupForeignCurr} onChange={e => setSetupForeignCurr(e.target.value)} style={sel}>{CURRENCIES.filter(c => c.code !== setupMyCurr).map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:6 }}>{getCurr(setupMyCurr).flag} {t.myrAmt}</label>
                <input type="number" value={setupMyAmt} onChange={e => setSetupMyAmt(e.target.value)} style={inp} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:6 }}>{getCurr(setupForeignCurr).flag} {t.foreignAmt}</label>
                <input type="number" value={setupForeignAmt} onChange={e => setSetupForeignAmt(e.target.value)} style={inp} />
              </div>
              {setupMyAmt && setupForeignAmt && parseFloat(setupForeignAmt) > 0 && (
                <div style={{ fontSize:12, color:th.accent, marginBottom:12, fontWeight:500 }}>{t.rate}: 1 {setupForeignCurr} = {setupMyCurr} {fmt(parseFloat(setupMyAmt)/parseFloat(setupForeignAmt),4)}</div>
              )}
              <button onClick={handleSetupWallet} style={{ width:"100%", padding:"13px", borderRadius:14, border:"none", background:"linear-gradient(135deg, #e0a84a, #c8963e, #a87830)", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 2px 10px rgba(200,150,62,0.35)" }}>
                {t.createWallet}
              </button>
            </div>
          )}
        </div>

        {!wallet && <div style={{ textAlign:"center", color:th.sub, fontSize:13 }}>{t.noWallet}</div>}
      </div>

      {/* Top Up Modal */}
      <Modal show={showTopUpModal} onClose={() => setShowTopUpModal(false)} title={t.topUpTitle} th={th}>
        {wallet && <>
          <div style={{ fontSize:12, color:th.sub, marginBottom:14 }}>{lang==="zh" ? "当前汇率" : "Current rate"}: 1 {wallet.foreignCurr} = {wallet.myCurr} {fmt(wallet.rate,4)}</div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:6 }}>{getCurr(wallet.myCurr).flag} {wallet.myCurr}</label>
            <input type="number" value={topUpMyAmt} onChange={e => setTopUpMyAmt(e.target.value)} style={inp} />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:6 }}>{getCurr(wallet.foreignCurr).flag} {wallet.foreignCurr}</label>
            <input type="number" value={topUpForeignAmt} onChange={e => setTopUpForeignAmt(e.target.value)} style={inp} />
          </div>
          {topUpPreviewRate() && <div style={{ fontSize:12, color:th.accent, marginBottom:14, fontWeight:500 }}>{t.avgRateLabel}: 1 {wallet.foreignCurr} = {wallet.myCurr} {fmt(topUpPreviewRate(),4)}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button onClick={() => setShowTopUpModal(false)} style={{ padding:"12px", borderRadius:12, border:`1px solid ${th.border}`, background:"none", color:th.sub, fontSize:14, cursor:"pointer" }}>{t.cancel}</button>
            <button onClick={handleTopUp} style={{ padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg, #e0a84a, #c8963e, #a87830)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>{t.confirm}</button>
          </div>
        </>}
      </Modal>
    </div>
  );
}