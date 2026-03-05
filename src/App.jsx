import { useState, useEffect } from "react";

const CURRENCIES = [
  { code: "MYR", name: "Malaysian Ringgit", nameZh: "马币", flag: "🇲🇾" },
  { code: "THB", name: "Thai Baht", nameZh: "泰铢", flag: "🇹🇭" },
  { code: "JPY", name: "Japanese Yen", nameZh: "日元", flag: "🇯🇵" },
  { code: "USD", name: "US Dollar", nameZh: "美元", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", nameZh: "欧元", flag: "🇪🇺" },
  { code: "SGD", name: "Singapore Dollar", nameZh: "新元", flag: "🇸🇬" },
  { code: "GBP", name: "British Pound", nameZh: "英镑", flag: "🇬🇧" },
  { code: "AUD", name: "Australian Dollar", nameZh: "澳元", flag: "🇦🇺" },
  { code: "CNY", name: "Chinese Yuan", nameZh: "人民币", flag: "🇨🇳" },
  { code: "KRW", name: "Korean Won", nameZh: "韩元", flag: "🇰🇷" },
  { code: "IDR", name: "Indonesian Rupiah", nameZh: "印尼盾", flag: "🇮🇩" },
  { code: "TWD", name: "Taiwan Dollar", nameZh: "台币", flag: "🇹🇼" },
];

const T = {
  en: {
    appTitle: "Currency Wallet",
    setupTitle: "Wallet Setup", topUpTitle: "Top Up Balance",
    yourCurrency: "Your Currency", exchangeCurrency: "Exchange Currency",
    myrAmt: "Amount (your currency)", foreignAmt: "Amount (foreign)",
    rate: "Rate", avgRate: "Avg rate after top-up",
    confirm: "Confirm", cancel: "Cancel", createWallet: "Create Wallet",
    spent: "Spent", total: "Total", currentBalance: "Current Balance",
    recordExpense: "Record Expense", amount: "Amount", note: "What did you buy?",
    addExpense: "+ Add Expense", noEntries: "No records yet 🛍️",
    topUp: "Top Up", topUpLabel: "Top Up",
    commonRates: "Reference Rates (vs MYR)",
    betterRate: "✅ Better than market", worseRate: "⚠️ Worse than market",
    allRecords: "Expense Records", noWallet: "Set up your wallet to get started.",
  },
  zh: {
    appTitle: "货币钱包",
    setupTitle: "设置钱包", topUpTitle: "增加余额",
    yourCurrency: "你的货币", exchangeCurrency: "兑换货币",
    myrAmt: "金额（你的货币）", foreignAmt: "外币金额",
    rate: "汇率", avgRate: "补充后的平均汇率",
    confirm: "确认", cancel: "取消", createWallet: "建立钱包",
    spent: "已花费", total: "共", currentBalance: "现有余额",
    recordExpense: "记录消费", amount: "金额", note: "买了什么？",
    addExpense: "+ 添加消费", noEntries: "还没有记录 🛍️",
    topUp: "增加余额", topUpLabel: "补充余额",
    commonRates: "参考汇率 (vs MYR)",
    betterRate: "✅ 汇率比市场好", worseRate: "⚠️ 汇率比市场差",
    allRecords: "消费记录", noWallet: "请先设置钱包开始使用。",
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
  const [lang, setLang] = useState("zh");
  const [dark, setDark] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [liveRates, setLiveRates] = useState({});

  const [setupMyCurr, setSetupMyCurr] = useState("MYR");
  const [setupForeignCurr, setSetupForeignCurr] = useState("THB");
  const [setupMyAmt, setSetupMyAmt] = useState("");
  const [setupForeignAmt, setSetupForeignAmt] = useState("");
  const [topUpMyAmt, setTopUpMyAmt] = useState("");
  const [topUpForeignAmt, setTopUpForeignAmt] = useState("");
  const [expAmt, setExpAmt] = useState("");
  const [expNote, setExpNote] = useState("");

  const t = T[lang];
  const th = {
    bg: dark ? "#1a1a1a" : "#f5f0e8",
    card: dark ? "#2a2a2a" : "#ffffff",
    border: dark ? "#3a3a3a" : "#e8e0d0",
    text: dark ? "#f0f0f0" : "#1a1a1a",
    sub: dark ? "#999" : "#777",
    input: dark ? "#333" : "#fff",
    inputBorder: dark ? "#444" : "#ddd6c8",
    rowBorder: dark ? "#333" : "#f0ebe0",
    accent: "#c8963e",
    accentLight: dark ? "#3a2e1a" : "#fdf3e0",
    green: "#2D6A4F", red: "#dc2626",
  };
  const inp = { padding:"9px 10px", borderRadius:12, border:`1px solid ${th.inputBorder}`, fontSize:14, background:th.input, color:th.text, boxSizing:"border-box", width:"100%" };
  const sel = { ...inp, background: dark ? "#333" : "#fff" };

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/MYR")
      .then(r => r.json()).then(d => { if (d.rates) setLiveRates(d.rates); })
      .catch(() => fetch("https://api.frankfurter.app/latest?from=MYR")
        .then(r => r.json()).then(d => setLiveRates({ ...d.rates, MYR: 1 }))
        .catch(() => {}));
  }, []);

  const handleSetupWallet = () => {
    const myAmt = parseFloat(setupMyAmt), foreignAmt = parseFloat(setupForeignAmt);
    if (!myAmt || !foreignAmt || myAmt <= 0 || foreignAmt <= 0) return;
    setWallet({ totalMy: myAmt, foreignAmt, remaining: foreignAmt, rate: myAmt / foreignAmt, myCurr: setupMyCurr, foreignCurr: setupForeignCurr });
    setEntries([]);
    setSetupMyAmt(""); setSetupForeignAmt("");
    setShowSetup(false);
  };

  const handleTopUp = () => {
    const addMy = parseFloat(topUpMyAmt), addForeign = parseFloat(topUpForeignAmt);
    if (!addMy || !addForeign || addMy <= 0 || addForeign <= 0) return;
    setWallet(prev => {
      const newTotalMy = prev.totalMy + addMy;
      const newForeignAmt = prev.foreignAmt + addForeign;
      return { ...prev, totalMy: newTotalMy, foreignAmt: newForeignAmt, remaining: prev.remaining + addForeign, rate: newTotalMy / newForeignAmt };
    });
    setEntries(prev => [{ id: Date.now(), type:"topup", addMy, addForeign, myCurr: wallet.myCurr, foreignCurr: wallet.foreignCurr, flag: getCurr(wallet.foreignCurr).flag, ts: Date.now() }, ...prev]);
    setTopUpMyAmt(""); setTopUpForeignAmt("");
    setShowTopUpModal(false);
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expAmt);
    if (!amt || amt <= 0 || !wallet) return;
    setEntries(prev => [{ id: Date.now(), type:"expense", foreign: amt, my: amt * wallet.rate, note: expNote || (lang === "zh" ? "消费" : "Expense"), foreignCurr: wallet.foreignCurr, myCurr: wallet.myCurr, flag: getCurr(wallet.foreignCurr).flag, ts: Date.now() }, ...prev]);
    setWallet(prev => ({ ...prev, remaining: prev.remaining - amt }));
    setExpAmt(""); setExpNote("");
  };

  const handleDeleteEntry = (id) => {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    if (e.type === "expense") setWallet(prev => ({ ...prev, remaining: prev.remaining + e.foreign }));
    else setWallet(prev => {
      const newTotalMy = prev.totalMy - e.addMy;
      const newForeignAmt = prev.foreignAmt - e.addForeign;
      return { ...prev, totalMy: newTotalMy, foreignAmt: newForeignAmt, remaining: prev.remaining - e.addForeign, rate: newTotalMy / newForeignAmt };
    });
    setEntries(prev => prev.filter(x => x.id !== id));
  };

  const spent = wallet ? wallet.foreignAmt - wallet.remaining : 0;
  const spentPct = wallet ? Math.min((spent / wallet.foreignAmt) * 100, 100) : 0;

  const topUpPreviewRate = () => {
    if (!wallet || !topUpMyAmt || !topUpForeignAmt) return null;
    const a = parseFloat(topUpMyAmt), b = parseFloat(topUpForeignAmt);
    return (a && b) ? (wallet.totalMy + a) / (wallet.foreignAmt + b) : null;
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:th.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", paddingBottom:28 }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px" }}>
        <button onClick={() => setLang(l => l === "zh" ? "en" : "zh")} style={{ background:th.accentLight, border:`1px solid ${th.accent}`, borderRadius:8, padding:"5px 12px", fontSize:12, cursor:"pointer", color:th.accent, fontWeight:700 }}>
          {lang === "zh" ? "EN" : "中"}
        </button>
        <span style={{ fontWeight:700, fontSize:16, color:th.text, letterSpacing:0.3 }}>{t.appTitle}</span>
        <button onClick={() => setDark(d => !d)} style={{ background:th.accentLight, border:`1px solid ${th.accent}`, borderRadius:8, padding:"5px 10px", fontSize:14, cursor:"pointer" }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      <div style={{ padding:"0 14px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Setup card — collapsible */}
        <div style={{ background:th.card, borderRadius:19, border:`1px solid ${th.border}`, overflow:"hidden" }}>
          <button onClick={() => setShowSetup(s => !s)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:"none", border:"none", cursor:"pointer" }}>
            <span style={{ fontWeight:600, fontSize:14, color:th.text }}>💼 {t.setupTitle}</span>
            <span style={{ color:th.accent, fontSize:13 }}>{showSetup ? "▲" : "▼"}</span>
          </button>
          {showSetup && (
            <div style={{ padding:"0 16px 16px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:4 }}>{t.yourCurrency}</label>
                  <select value={setupMyCurr} onChange={e => setSetupMyCurr(e.target.value)} style={sel}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></div>
                <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:4 }}>{t.exchangeCurrency}</label>
                  <select value={setupForeignCurr} onChange={e => setSetupForeignCurr(e.target.value)} style={sel}>{CURRENCIES.filter(c => c.code !== setupMyCurr).map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:4 }}>{getCurr(setupMyCurr).flag} {t.myrAmt}</label>
                  <input type="number" value={setupMyAmt} onChange={e => setSetupMyAmt(e.target.value)} style={inp} /></div>
                <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:4 }}>{getCurr(setupForeignCurr).flag} {t.foreignAmt}</label>
                  <input type="number" value={setupForeignAmt} onChange={e => setSetupForeignAmt(e.target.value)} style={inp} /></div>
              </div>
              {setupMyAmt && setupForeignAmt && parseFloat(setupForeignAmt) > 0 && (
                <div style={{ fontSize:12, color:th.accent, marginBottom:12 }}>{t.rate}: 1 {setupForeignCurr} = {setupMyCurr} {fmt(parseFloat(setupMyAmt)/parseFloat(setupForeignAmt),4)}</div>
              )}
              <button onClick={handleSetupWallet} style={{ width:"100%", padding:"11px", borderRadius:14, border:"none", background:"linear-gradient(135deg, #e0a84a, #c8963e, #a87830)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 2px 8px rgba(200,150,62,0.3)" }}>
                {t.createWallet}
              </button>
            </div>
          )}
        </div>

        {!wallet && <div style={{ textAlign:"center", color:th.sub, fontSize:13, padding:"4px 0" }}>{t.noWallet}</div>}

        {wallet && <>
          {/* Wallet balance card */}
          <div style={{ borderRadius:19, padding:20, color:"#fff", position:"relative", background: dark ? "linear-gradient(135deg, #3a2000, #6b4a00, #c8963e)" : "linear-gradient(135deg, #7a4f10, #c8963e, #f0b445)" }}>
            {/* X button top right */}
            <button onClick={() => { setWallet(null); setEntries([]); setShowSetup(true); }} style={{ position:"absolute", top:12, right:12, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, width:28, height:28, color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>

            <div style={{ fontSize:12, opacity:0.85, marginBottom:2 }}>{getCurr(wallet.foreignCurr).flag} {t.currentBalance}</div>
            <div style={{ fontSize:32, fontWeight:700, marginBottom:2 }}>{wallet.foreignCurr} {fmt(wallet.remaining)}</div>
            <div style={{ fontSize:14, opacity:0.85, marginBottom:14 }}>≈ {wallet.myCurr} {fmt(wallet.remaining * wallet.rate)}</div>

            <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:6, height:6 }}>
              <div style={{ width:`${spentPct}%`, background:"#fff", borderRadius:6, height:6, transition:"width 0.4s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, opacity:0.8, marginTop:6 }}>
              <span>{t.spent}: {wallet.foreignCurr} {fmt(spent)}</span>
              <span>{t.total}: {wallet.foreignCurr} {fmt(wallet.foreignAmt)}</span>
            </div>
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.25)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, opacity:0.8 }}>1 {wallet.foreignCurr} = {wallet.myCurr} {fmt(wallet.rate,4)}</span>
              <button onClick={() => setShowTopUpModal(true)} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"5px 12px", color:"#fff", fontSize:12, cursor:"pointer", fontWeight:600 }}>＋ {t.topUp}</button>
            </div>
          </div>

          {/* Record expense */}
          <div style={{ background:th.card, borderRadius:19, padding:16, border:`1px solid ${th.border}` }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:12, color:th.text }}>✏️ {t.recordExpense}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
              <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:4 }}>{getCurr(wallet.foreignCurr).flag} {t.amount}</label>
                <input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)} style={inp} /></div>
              <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:4 }}>{t.note}</label>
                <input placeholder={t.note} value={expNote} onChange={e => setExpNote(e.target.value)} style={inp} /></div>
            </div>
            {expAmt && <div style={{ fontSize:12, color:th.green, marginBottom:8 }}>≈ {wallet.myCurr} {fmt(parseFloat(expAmt)*wallet.rate)}</div>}
            <button onClick={handleAddExpense} style={{ width:"100%", padding:"10px", background:"#2D6A4F", color:"#fff", border:"none", borderRadius:14, fontSize:14, fontWeight:600, cursor:"pointer" }}>
              {t.addExpense}
            </button>
          </div>

          {/* Expense records */}
          <div style={{ background:th.card, borderRadius:19, padding:16, border:`1px solid ${th.border}` }}>
            <div style={{ fontWeight:600, fontSize:14, color:th.text, marginBottom:12 }}>{t.allRecords}</div>
            {entries.length === 0 && <div style={{ textAlign:"center", color:th.sub, padding:"20px 0", fontSize:13 }}>{t.noEntries}</div>}
            {entries.map((e, i) => (
              <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom: i < entries.length-1 ? `1px solid ${th.rowBorder}` : "none" }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background: e.type==="topup" ? "#dcfce7" : th.accentLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>
                  {e.type==="topup" ? "＋" : "💸"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:th.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {e.type==="topup" ? `${t.topUpLabel}: ${e.myCurr} ${fmt(e.addMy)}` : e.note}
                  </div>
                  <div style={{ fontSize:11, color:th.sub, marginTop:1 }}>
                    {fmtDate(e.ts)}
                    {e.type==="expense" && <span style={{ marginLeft:6 }}>≈ {e.myCurr} {fmt(e.my)}</span>}
                  </div>
                </div>
                <div style={{ fontWeight:700, fontSize:14, color: e.type==="topup" ? "#16a34a" : th.red, whiteSpace:"nowrap" }}>
                  {e.type==="topup" ? "+" : "-"}{e.flag} {e.type==="topup" ? fmt(e.addForeign) : fmt(e.foreign)}
                </div>
                <button onClick={() => handleDeleteEntry(e.id)} style={{ background:"none", border:"none", cursor:"pointer", color:th.sub, fontSize:14, padding:4, flexShrink:0 }}>✕</button>
              </div>
            ))}
          </div>
        </>}


      </div>

      {/* Top Up Modal */}
      <Modal show={showTopUpModal} onClose={() => setShowTopUpModal(false)} title={t.topUpTitle} th={th}>
        {wallet && <>
          <div style={{ fontSize:12, color:th.sub, marginBottom:14 }}>{lang==="zh" ? "当前汇率" : "Current rate"}: 1 {wallet.foreignCurr} = {wallet.myCurr} {fmt(wallet.rate,4)}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:4 }}>{getCurr(wallet.myCurr).flag} {wallet.myCurr}</label>
              <input type="number" value={topUpMyAmt} onChange={e => setTopUpMyAmt(e.target.value)} style={inp} /></div>
            <div><label style={{ fontSize:12, color:th.sub, display:"block", marginBottom:4 }}>{getCurr(wallet.foreignCurr).flag} {wallet.foreignCurr}</label>
              <input type="number" value={topUpForeignAmt} onChange={e => setTopUpForeignAmt(e.target.value)} style={inp} /></div>
          </div>
          {topUpPreviewRate() && <div style={{ fontSize:12, color:th.accent, marginBottom:12 }}>{t.avgRate}: 1 {wallet.foreignCurr} = {wallet.myCurr} {fmt(topUpPreviewRate(),4)}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button onClick={() => setShowTopUpModal(false)} style={{ padding:"11px", borderRadius:12, border:`1px solid ${th.border}`, background:"none", color:th.sub, fontSize:14, cursor:"pointer" }}>{t.cancel}</button>
            <button onClick={handleTopUp} style={{ padding:"11px", borderRadius:12, border:"none", background:"linear-gradient(135deg, #e0a84a, #c8963e, #a87830)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>{t.confirm}</button>
          </div>
        </>}
      </Modal>
    </div>
  );
}