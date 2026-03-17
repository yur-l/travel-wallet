import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

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
const auth = getAuth(firebaseApp);

const C = {
  bg: '#F6F1E8', card: '#FFFFFF', text: '#1F1F1F', sub: '#6F6A62',
  line: '#EAE2D4', gold1: '#E4C78F', gold2: '#D2A055', goldDeep: '#B88435',
  green: '#3F7D5C', greenDark: '#2F6549', danger: '#8A4B34',
};
const DARK = {
  bg: '#1a1a1a', card: '#2a2a2a', text: '#f0f0f0', sub: '#999',
  line: '#333', gold1: '#c8963e', gold2: '#a87830', goldDeep: '#c8963e',
  green: '#3F7D5C', greenDark: '#2F6549', danger: '#dc2626',
};

const CURRENCIES = [
  { code: "MYR", flag: "🇲🇾", nameZh: "马币" },
  { code: "THB", flag: "🇹🇭", nameZh: "泰铢" },
  { code: "JPY", flag: "🇯🇵", nameZh: "日元" },
  { code: "USD", flag: "🇺🇸", nameZh: "美元" },
  { code: "EUR", flag: "🇪🇺", nameZh: "欧元" },
  { code: "SGD", flag: "🇸🇬", nameZh: "新元" },
  { code: "GBP", flag: "🇬🇧", nameZh: "英镑" },
  { code: "AUD", flag: "🇦🇺", nameZh: "澳元" },
  { code: "CNY", flag: "🇨🇳", nameZh: "人民币" },
  { code: "KRW", flag: "🇰🇷", nameZh: "韩元" },
  { code: "IDR", flag: "🇮🇩", nameZh: "印尼盾" },
  { code: "TWD", flag: "🇹🇼", nameZh: "台币" },
];

const T = {
  en: {
    appTitle: "Currency Wallet", setupTitle: "Wallet Setup", topUpTitle: "Top Up",
    yourCurrency: "Your Currency", exchangeCurrency: "Exchange Currency",
    myrAmt: "Your Currency Amount", foreignAmt: "Foreign Amount",
    rate: "Rate", avgRateLabel: "Avg rate after top-up",
    confirm: "Confirm", cancel: "Cancel", createWallet: "Create Wallet",
    spent: "Spent", total: "Total", currentBalance: "Current Balance",
    recordExpense: "Record Expense", amount: "Amount", note: "Note",
    addExpense: "Add Expense", noEntries: "No records yet 🛍️",
    topUp: "Top Up", topUpLabel: "Top Up", allRecords: "Expense Records",
    noWallet: "Set up your wallet to get started.",
    syncing: "Syncing...", synced: "Synced ✓",
    showAll: "Show all", collapse: "Collapse", quickAdd: "Quick add",
    rateBuilt: "Rate built at",
    login: "Sign In", register: "Register", email: "Email", password: "Password",
    loginError: "Login failed. Check your email and password.",
    registerError: "Registration failed. Try a different email.",
    logout: "Sign Out", switchToRegister: "No account? Register", switchToLogin: "Have an account? Sign In",
  },
  zh: {
    appTitle: "货币钱包", setupTitle: "钱包设置", topUpTitle: "增加余额",
    yourCurrency: "你的货币", exchangeCurrency: "兑换货币",
    myrAmt: "金额（你的货币）", foreignAmt: "外币金额",
    rate: "汇率", avgRateLabel: "补充后的平均汇率",
    confirm: "确认", cancel: "取消", createWallet: "建立钱包",
    spent: "已消费", total: "总预算", currentBalance: "当前余额",
    recordExpense: "记录消费", amount: "金额", note: "备注",
    addExpense: "添加消费", noEntries: "暂无消费记录 🛍️",
    topUp: "充值", topUpLabel: "补充余额", allRecords: "消费记录",
    noWallet: "请先设置钱包开始使用。",
    syncing: "同步中...", synced: "已同步 ✓",
    showAll: "展开全部", collapse: "收起", quickAdd: "快捷金额",
    rateBuilt: "汇率建立",
    login: "登入", register: "注册", email: "电子邮件", password: "密码",
    loginError: "登入失败，请检查你的邮件和密码。",
    registerError: "注册失败，请尝试其他邮件。",
    logout: "登出", switchToRegister: "没有账号？注册", switchToLogin: "已有账号？登入",
  }
};

const fmt = (n, d = 2) => Number(n).toLocaleString("en-MY", { minimumFractionDigits: d, maximumFractionDigits: d });
const getCurr = (code) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
const fmtDate = (ts) => {
  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2,"0")} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getFullYear()}`;
};

const Modal = ({ show, onClose, title, children, c }) => {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:c.card, borderRadius:24, padding:"24px 20px 28px", width:"100%", maxWidth:400, boxSizing:"border-box", animation:"popIn 0.22s ease", border:`1px solid ${c.line}` }}>
        <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        {title && <div style={{ fontWeight:700, fontSize:17, color:c.text, marginBottom:18 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
};

function LoginScreen({ lang, dark }) {
  const c = dark ? DARK : C;
  const t = T[lang];
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    width:"100%", height:48, padding:"0 16px", borderRadius:12,
    border:`1.5px solid ${c.line}`, fontSize:15, background: dark ? "#333" : "#FCFAF7",
    color:c.text, boxSizing:"border-box", outline:"none",
  };

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch {
      setError(isRegister ? t.registerError : t.loginError);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily:"system-ui,-apple-system,sans-serif", background:c.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>✈️</div>
          <div style={{ fontSize:22, fontWeight:900, color:c.text, letterSpacing:-0.5 }}>{t.appTitle}</div>
        </div>
        <div style={{ background:c.card, borderRadius:24, padding:"28px 24px", border:`1px solid ${c.line}`, boxShadow: dark ? "none" : "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:800, fontSize:18, color:c.text, marginBottom:24 }}>
            {isRegister ? t.register : t.login}
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>{t.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="you@email.com" />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>{t.password}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={inp} placeholder="••••••••" />
          </div>
          {error && <div style={{ fontSize:13, color:c.danger, marginBottom:14, fontWeight:600 }}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:"14px", background:`linear-gradient(135deg, ${C.gold1}, ${C.gold2}, ${C.goldDeep})`, color:"#fff", border:"none", borderRadius:18, fontSize:15, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 14px rgba(200,150,62,0.35)", opacity: loading ? 0.7 : 1 }}>
            {loading ? "..." : (isRegister ? t.register : t.login)}
          </button>
          <button onClick={() => { setIsRegister(r => !r); setError(""); }} style={{ width:"100%", marginTop:14, padding:"10px", background:"none", border:"none", color:c.goldDeep, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            {isRegister ? t.switchToLogin : t.switchToRegister}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("tw_lang") || "zh");
  const [dark, setDark] = useState(() => localStorage.getItem("tw_dark") === "true");
  const [user, setUser] = useState(undefined);
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
  const c = dark ? DARK : C;

  const inp = {
    width:"100%", height:48, padding:"0 16px", borderRadius:12,
    border:`1.5px solid ${c.line}`, fontSize:15, background: dark ? "#333" : "#FCFAF7",
    color:c.text, boxSizing:"border-box", outline:"none",
  };
  const sel = { ...inp };

  useEffect(() => { localStorage.setItem("tw_lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("tw_dark", dark); }, [dark]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { setLoaded(false); return; }
    const dataRef = ref(db, "shared");
    const unsub = onValue(dataRef, (snap) => {
      const data = snap.val();
      if (data) {
        setWallet(data.wallet || null);
        setEntries(data.entries || []);
        if (!data.wallet) setShowSetup(true);
      } else { setShowSetup(true); }
      setLoaded(true); setSynced(true);
    });
    return () => unsub();
  }, [user]);

  const save = (w, e) => {
    setSynced(false);
    set(ref(db, "shared"), { wallet: w, entries: e }).then(() => setSynced(true));
  };

  const handleSetupWallet = () => {
    const myAmt = parseFloat(setupMyAmt), foreignAmt = parseFloat(setupForeignAmt);
    if (!myAmt || !foreignAmt || myAmt <= 0 || foreignAmt <= 0) return;
    const w = { totalMy: myAmt, foreignAmt, remaining: foreignAmt, rate: myAmt / foreignAmt, myCurr: setupMyCurr, foreignCurr: setupForeignCurr };
    setWallet(w); setEntries([]);
    setSetupMyAmt(""); setSetupForeignAmt("");
    setShowSetup(false); save(w, []);
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
    setShowTopUpModal(false); save(w, e);
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expAmt);
    if (!amt || amt <= 0 || !wallet) return;
    const entry = { id: Date.now(), type:"expense", foreign: amt, my: amt * wallet.rate, note: expNote || (lang === "zh" ? "未命名消费" : "Expense"), foreignCurr: wallet.foreignCurr, myCurr: wallet.myCurr, flag: getCurr(wallet.foreignCurr).flag, ts: Date.now() };
    const w = { ...wallet, remaining: wallet.remaining - amt };
    const e = [entry, ...entries];
    setWallet(w); setEntries(e);
    setExpAmt(""); setExpNote(""); setQuickAmts([]); save(w, e);
  };

  const handleDeleteEntry = (id) => {
    const entry = entries.find(x => x.id === id);
    if (!entry) return;
    let w;
    if (entry.type === "expense") w = { ...wallet, remaining: wallet.remaining + entry.foreign };
    else {
      const nm = wallet.totalMy - entry.addMy, nf = wallet.foreignAmt - entry.addForeign;
      w = { ...wallet, totalMy: nm, foreignAmt: nf, remaining: wallet.remaining - entry.addForeign, rate: nm / nf };
    }
    const e = entries.filter(x => x.id !== id);
    setWallet(w); setEntries(e); save(w, e);
  };

  const handleReset = () => { setWallet(null); setEntries([]); setShowSetup(true); save(null, []); };

  const addQuickAmt = () => {
    const v = parseFloat(quickInput);
    if (!v || v <= 0) return;
    setQuickAmts(prev => [...prev, v]); setQuickInput("");
  };

  const spent = wallet ? wallet.foreignAmt - wallet.remaining : 0;
  const spentPct = wallet ? Math.min(spent / wallet.foreignAmt, 1) : 0;
  const topUpPreviewRate = () => {
    const a = parseFloat(topUpMyAmt), b = parseFloat(topUpForeignAmt);
    return (wallet && a && b) ? (wallet.totalMy + a) / (wallet.foreignAmt + b) : null;
  };
  const visibleEntries = showAllEntries ? entries : entries.slice(0, 5);

  if (user === undefined) return (
    <div style={{ background:c.bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, fontFamily:"system-ui,sans-serif" }}>
      <div style={{ fontSize:36 }}>✈️</div>
      <div style={{ color:c.goldDeep, fontSize:15, fontWeight:600 }}>{t.syncing}</div>
    </div>
  );

  if (!user) return <LoginScreen lang={lang} dark={dark} />;

  if (!loaded) return (
    <div style={{ background:c.bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, fontFamily:"system-ui,sans-serif" }}>
      <div style={{ fontSize:36 }}>✈️</div>
      <div style={{ color:c.goldDeep, fontSize:15, fontWeight:600 }}>{t.syncing}</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"system-ui,-apple-system,sans-serif", background:c.bg, minHeight:"100vh", color:c.text }}>
      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", display:"flex", flexDirection:"column" }}>

        <header style={{ padding:"20px 24px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:c.bg, zIndex:10 }}>
          <button onClick={() => setLang(l => l === "zh" ? "en" : "zh")} style={{ padding:"8px 14px", background:"none", border:`1px solid ${c.line}`, borderRadius:12, fontSize:13, cursor:"pointer", color:c.goldDeep, fontWeight:700 }}>
            {lang === "zh" ? "EN" : "中"}
          </button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:-0.5, color:c.text }}>{t.appTitle}</div>
            <div style={{ fontSize:10, color: synced ? c.green : c.goldDeep, fontWeight:600 }}>{synced ? t.synced : t.syncing}</div>
          </div>
          <button onClick={() => setDark(d => !d)} style={{ padding:"8px 10px", background:"none", border:`1px solid ${c.line}`, borderRadius:12, fontSize:16, cursor:"pointer" }}>
            {dark ? "☀️" : "🌙"}
          </button>
        </header>

        <main style={{ flex:1, padding:"0 20px 32px", display:"flex", flexDirection:"column", gap:20 }}>

          {wallet && (
            <div style={{ borderRadius:28, padding:"24px 24px 20px", color:"#fff", position:"relative", overflow:"hidden", background:`linear-gradient(135deg, ${c.gold2}, ${c.goldDeep})`, boxShadow:"0 10px 30px -5px rgba(184,132,53,0.4)" }}>
              <button onClick={handleReset} style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:10, width:30, height:30, color:"#fff", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              <div style={{ position:"absolute", right:-16, bottom:-16, opacity:0.08, fontSize:120, lineHeight:1 }}>🪙</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, opacity:0.9 }}>
                <span style={{ fontSize:18 }}>{getCurr(wallet.foreignCurr).flag}</span>
                <span style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{t.currentBalance}</span>
              </div>
              <div style={{ marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:600, opacity:0.8, marginRight:6 }}>{wallet.foreignCurr}</span>
                <span style={{ fontSize:38, fontWeight:900, letterSpacing:-1 }}>{fmt(wallet.remaining)}</span>
              </div>
              <div style={{ fontSize:16, opacity:0.8, marginBottom:20 }}>≈ {wallet.myCurr} {fmt(wallet.remaining * wallet.rate)}</div>
              <div style={{ marginBottom:16 }}>
                <div style={{ height:6, background:"rgba(255,255,255,0.2)", borderRadius:99, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ height:"100%", width:`${spentPct*100}%`, background:"#fff", borderRadius:99, transition:"width 0.6s ease" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, opacity:0.8, fontWeight:700 }}>
                  <div><div style={{ opacity:0.7, fontSize:10, textTransform:"uppercase", letterSpacing:0.5 }}>{t.spent}</div><div>{fmt(spent)} {wallet.foreignCurr}</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ opacity:0.7, fontSize:10, textTransform:"uppercase", letterSpacing:0.5 }}>{t.total}</div><div>{fmt(wallet.foreignAmt)} {wallet.foreignCurr}</div></div>
                </div>
              </div>
              <div style={{ paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:10, opacity:0.65, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 }}>{t.rateBuilt}</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>1 {wallet.foreignCurr} = {wallet.myCurr} {fmt(wallet.rate, 4)}</div>
                </div>
                <button onClick={() => setShowTopUpModal(true)} style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"7px 16px", color:"#fff", fontSize:13, cursor:"pointer", fontWeight:700, backdropFilter:"blur(4px)" }}>
                  ＋ {t.topUp} ›
                </button>
              </div>
            </div>
          )}

          {wallet && (
            <div style={{ background:c.card, borderRadius:28, padding:"20px 20px 20px", border:`1px solid ${dark ? c.line : "#EFE7DB"}`, boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight:800, fontSize:17, marginBottom:18, color:c.text, display:"flex", alignItems:"center", gap:8 }}>🧾 {t.recordExpense}</div>
              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", letterSpacing:0.5 }}>{t.amount}</label>
                  <span style={{ fontSize:11, fontWeight:700, color:c.goldDeep }}>{wallet.foreignCurr}</span>
                </div>
                <input type="number" step="0.01" value={expAmt} onChange={e => setExpAmt(e.target.value)} placeholder="0.00" style={{ ...inp, fontSize:20, fontWeight:700 }} />
                {expAmt && parseFloat(expAmt) > 0 && (
                  <div style={{ fontSize:12, color:c.green, marginTop:6, fontWeight:600 }}>≈ {wallet.myCurr} {fmt(parseFloat(expAmt)*wallet.rate)}</div>
                )}
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>{t.note}</label>
                <input type="text" value={expNote} onChange={e => setExpNote(e.target.value)} placeholder={lang === "zh" ? "例如：买芒果糯米饭" : "e.g. Mango sticky rice"} style={inp} />
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                  {quickAmts.map((q, i) => (
                    <button key={i} onClick={() => setExpAmt(prev => String((parseFloat(prev)||0)+q))} style={{ padding:"5px 14px", borderRadius:99, background: dark ? "#3a2e1a" : "#F7F1E8", border:`1px solid ${c.line}`, color:c.goldDeep, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                      +{q}
                      <span onClick={e => { e.stopPropagation(); setQuickAmts(p => p.filter((_,j)=>j!==i)); }} style={{ color:c.sub, fontSize:11 }}>✕</span>
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input type="number" value={quickInput} onChange={e => setQuickInput(e.target.value)} onKeyDown={e => e.key==="Enter" && addQuickAmt()} placeholder={t.quickAdd} style={{ ...inp, flex:1, fontSize:13, height:40 }} />
                  <button onClick={addQuickAmt} style={{ height:40, padding:"0 16px", background: dark ? "#3a2e1a" : "#F7F1E8", border:`1px solid ${c.line}`, borderRadius:12, color:c.goldDeep, fontWeight:800, fontSize:16, cursor:"pointer" }}>＋</button>
                </div>
              </div>
              <button onClick={handleAddExpense} style={{ width:"100%", padding:"14px", background:`linear-gradient(135deg, ${c.green}, ${c.greenDark})`, color:"#fff", border:"none", borderRadius:18, fontSize:15, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(63,125,92,0.3)", letterSpacing:0.3 }}>
                ＋ {t.addExpense}
              </button>
            </div>
          )}

          {wallet && (
            <div style={{ background:c.card, borderRadius:28, border:`1px solid ${dark ? c.line : "#EFE7DB"}`, overflow:"hidden", boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,0.04)" }}>
              <button onClick={() => setShowAllEntries(s => !s)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px", background:"none", border:"none", cursor:"pointer" }}>
                <span style={{ fontWeight:800, fontSize:17, color:c.text, display:"flex", alignItems:"center", gap:8 }}>🗂 {t.allRecords}</span>
                <span style={{ color:c.goldDeep, fontSize:18 }}>{showAllEntries ? "▲" : "▼"}</span>
              </button>
              <div style={{ padding:"0 20px 16px" }}>
                {entries.length === 0 && <div style={{ textAlign:"center", color:c.sub, padding:"24px 0", fontSize:13, fontStyle:"italic" }}>{t.noEntries}</div>}
                {visibleEntries.map((e, i) => (
                  <div key={e.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom: i < visibleEntries.length-1 ? `1px solid ${c.line}` : "none" }}>
                    <div style={{ width:44, height:44, borderRadius:16, background: e.type==="topup" ? "#dcfce7" : (dark ? "#3a2e1a" : "#F8F1E7"), display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                      {e.type==="topup" ? "＋" : "🧾"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:c.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {e.type==="topup" ? `${t.topUpLabel}: ${e.myCurr} ${fmt(e.addMy)}` : e.note}
                      </div>
                      <div style={{ fontSize:11, color:c.sub, marginTop:2 }}>
                        {fmtDate(e.ts)}{e.type==="expense" && <span> • ≈ {e.myCurr} {fmt(e.my)}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontWeight:800, fontSize:14, color: e.type==="topup" ? c.green : c.danger }}>
                        {e.type==="topup" ? "+" : "-"}{fmt(e.type==="topup" ? e.addForeign : e.foreign)}
                      </div>
                      <div style={{ fontSize:10, fontWeight:700, color:c.sub, textTransform:"uppercase" }}>{e.foreignCurr}</div>
                    </div>
                    <button onClick={() => handleDeleteEntry(e.id)} style={{ background:"none", border:"none", cursor:"pointer", color:c.sub, fontSize:14, padding:4, flexShrink:0 }}>✕</button>
                  </div>
                ))}
                {entries.length > 5 && (
                  <button onClick={() => setShowAllEntries(s => !s)} style={{ width:"100%", marginTop:10, padding:"10px", background: dark ? "#3a2e1a" : "#F7F1E8", border:`1px solid ${c.line}`, borderRadius:12, color:c.goldDeep, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    {showAllEntries ? t.collapse : `${t.showAll} (${entries.length})`}
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ background:c.card, borderRadius:28, border:`1px solid ${dark ? c.line : "#EFE7DB"}`, overflow:"hidden", boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,0.04)" }}>
            <button onClick={() => setShowSetup(s => !s)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px", background:"none", border:"none", cursor:"pointer" }}>
              <span style={{ fontWeight:800, fontSize:17, color:c.text, display:"flex", alignItems:"center", gap:8 }}>👜 {t.setupTitle}</span>
              <span style={{ color:c.goldDeep, fontSize:18 }}>{showSetup ? "▲" : "▼"}</span>
            </button>
            {showSetup && (
              <div style={{ padding:"0 20px 20px", display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>{t.yourCurrency}</label>
                    <select value={setupMyCurr} onChange={e => setSetupMyCurr(e.target.value)} style={sel}>{CURRENCIES.map(cu => <option key={cu.code} value={cu.code}>{cu.flag} {cu.code}</option>)}</select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>{t.exchangeCurrency}</label>
                    <select value={setupForeignCurr} onChange={e => setSetupForeignCurr(e.target.value)} style={sel}>{CURRENCIES.filter(cu => cu.code !== setupMyCurr).map(cu => <option key={cu.code} value={cu.code}>{cu.flag} {cu.code}</option>)}</select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>{getCurr(setupMyCurr).flag} {t.myrAmt}</label>
                  <input type="number" value={setupMyAmt} onChange={e => setSetupMyAmt(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>{getCurr(setupForeignCurr).flag} {t.foreignAmt}</label>
                  <input type="number" value={setupForeignAmt} onChange={e => setSetupForeignAmt(e.target.value)} style={inp} />
                </div>
                {setupMyAmt && setupForeignAmt && parseFloat(setupForeignAmt) > 0 && (
                  <div style={{ fontSize:12, color:c.goldDeep, fontWeight:600 }}>{t.rate}: 1 {setupForeignCurr} = {setupMyCurr} {fmt(parseFloat(setupMyAmt)/parseFloat(setupForeignAmt),4)}</div>
                )}
                <button onClick={handleSetupWallet} style={{ width:"100%", padding:"14px", borderRadius:18, border:"none", background:`linear-gradient(135deg, ${C.gold1}, ${C.gold2}, ${C.goldDeep})`, color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 14px rgba(200,150,62,0.35)", letterSpacing:0.3 }}>
                  {t.createWallet}
                </button>
              </div>
            )}
          </div>

          {!wallet && <div style={{ textAlign:"center", color:c.sub, fontSize:13 }}>{t.noWallet}</div>}

          <button onClick={() => signOut(auth)} style={{ width:"100%", padding:"12px", background:"none", border:`1px solid ${c.line}`, borderRadius:14, color:c.sub, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            {t.logout}
          </button>

        </main>
      </div>

      <Modal show={showTopUpModal} onClose={() => setShowTopUpModal(false)} title={t.topUpTitle} c={c}>
        {wallet && <>
          <div style={{ fontSize:12, color:c.sub, marginBottom:16 }}>{lang==="zh" ? "当前汇率" : "Current rate"}: 1 {wallet.foreignCurr} = {wallet.myCurr} {fmt(wallet.rate,4)}</div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", display:"block", marginBottom:6 }}>{getCurr(wallet.myCurr).flag} {wallet.myCurr}</label>
            <input type="number" value={topUpMyAmt} onChange={e => setTopUpMyAmt(e.target.value)} style={inp} />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:c.sub, textTransform:"uppercase", display:"block", marginBottom:6 }}>{getCurr(wallet.foreignCurr).flag} {wallet.foreignCurr}</label>
            <input type="number" value={topUpForeignAmt} onChange={e => setTopUpForeignAmt(e.target.value)} style={inp} />
          </div>
          {topUpPreviewRate() && <div style={{ fontSize:12, color:c.goldDeep, marginBottom:16, fontWeight:600 }}>{t.avgRateLabel}: 1 {wallet.foreignCurr} = {wallet.myCurr} {fmt(topUpPreviewRate(),4)}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button onClick={() => setShowTopUpModal(false)} style={{ padding:"12px", borderRadius:14, border:`1px solid ${c.line}`, background:"none", color:c.sub, fontSize:14, cursor:"pointer", fontWeight:600 }}>{t.cancel}</button>
            <button onClick={handleTopUp} style={{ padding:"12px", borderRadius:14, border:"none", background:`linear-gradient(135deg, ${C.gold1}, ${C.goldDeep})`, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer" }}>{t.confirm}</button>
          </div>
        </>}
      </Modal>
    </div>
  );
}