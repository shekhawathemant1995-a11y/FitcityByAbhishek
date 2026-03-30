import { useState, useEffect } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_IN_MONTH = (y, m) => new Date(y, m + 1, 0).getDate();
const WORKING_DAYS = (y, m) => {
  let count = 0;
  for (let d = 1; d <= DAYS_IN_MONTH(y, m); d++) {
    if (new Date(y, m, d).getDay() !== 0) count++;
  }
  return count;
};

function genAttendance(joinedDate, fee) {
  const records = {};
  const now = new Date();
  const join = new Date(joinedDate);
  const rate = fee >= 2500 ? 0.82 : fee >= 1800 ? 0.68 : 0.55;
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    if (d < join) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
    const days = DAYS_IN_MONTH(d.getFullYear(), d.getMonth());
    const attended = [];
    for (let day = 1; day <= days; day++) {
      const dow = new Date(d.getFullYear(), d.getMonth(), day).getDay();
      if (dow === 0) continue;
      if (offset === 0 && day > now.getDate()) break;
      if (Math.random() < rate) attended.push(day);
    }
    records[key] = attended;
  }
  return records;
}

const SEED_MEMBERS = [
  { id:1, name:"Arjun Mehta",  plan:"Elite", status:"Active",  joined:"2025-01-06", fee:2500, initials:"AM" },
  { id:2, name:"Priya Sharma", plan:"Basic", status:"Active",  joined:"2025-02-10", fee:1200, initials:"PS" },
  { id:3, name:"Rohan Das",    plan:"Elite", status:"Expired", joined:"2024-10-03", fee:2500, initials:"RD" },
  { id:4, name:"Sneha Patel",  plan:"Pro",   status:"Active",  joined:"2025-03-15", fee:1800, initials:"SP" },
  { id:5, name:"Vikram Rao",   plan:"Basic", status:"Pending", joined:"2025-03-20", fee:1200, initials:"VR" },
].map(m => ({ ...m, attendance: genAttendance(m.joined, m.fee) }));

const PLANS = [
  { name:"Basic", price:1200, features:["Gym Access","Locker Room"] },
  { name:"Pro",   price:1800, features:["Gym Access","Locker Room","Group Classes"] },
  { name:"Elite", price:2500, features:["Gym Access","Locker Room","Group Classes","Personal Trainer","Nutrition Plan"] },
];

const STATUS_META = {
  Active:  { color:"#30d158", bg:"rgba(48,209,88,0.14)",  border:"rgba(48,209,88,0.28)"  },
  Expired: { color:"#ff453a", bg:"rgba(255,69,58,0.14)",  border:"rgba(255,69,58,0.28)"  },
  Pending: { color:"#ffd60a", bg:"rgba(255,214,10,0.14)", border:"rgba(255,214,10,0.28)" },
};
const AVATAR_COLORS = [
  ["#c1272d","#7b0d12"],["#c1272d","#ff6b6b"],
  ["#8b0000","#c1272d"],["#ff3b30","#c1272d"],["#922b21","#c1272d"],
];

const glass = (tint="rgba(255,255,255,0.06)", ex={}) => ({
  background: tint,
  backdropFilter:"blur(40px) saturate(180%) brightness(1.08)",
  WebkitBackdropFilter:"blur(40px) saturate(180%) brightness(1.08)",
  border:"1px solid rgba(255,255,255,0.11)",
  borderTop:"1px solid rgba(255,255,255,0.2)",
  boxShadow:"0 2px 0 rgba(255,255,255,0.07) inset,0 16px 40px rgba(0,0,0,0.35)",
  ...ex,
});
const redGlass = (ex={}) => glass("rgba(193,39,45,0.18)",{
  border:"1px solid rgba(193,39,45,0.32)",
  borderTop:"1px solid rgba(255,100,100,0.28)",
  boxShadow:"0 2px 0 rgba(255,80,80,0.12) inset,0 16px 40px rgba(193,39,45,0.22)",
  ...ex,
});

function FitCityLogo({ size=36 }) {
  return (
    <div style={{ width:size,height:size,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#e03030,#8b0000)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 14px rgba(193,39,45,0.55),inset 0 1px 0 rgba(255,255,255,0.22)",border:"2px solid rgba(255,255,255,0.22)" }}>
      <span style={{ color:"#fff",fontWeight:900,fontSize:size*0.44,fontFamily:"Georgia,serif",letterSpacing:-1 }}>F</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status];
  return <span style={{ padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:0.3,background:m.bg,color:m.color,border:`1px solid ${m.border}`,backdropFilter:"blur(10px)" }}>{status}</span>;
}

function Avatar({ member, size=48, index=0 }) {
  const [c1,c2] = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div style={{ width:size,height:size,borderRadius:size*0.32,background:`linear-gradient(145deg,${c1},${c2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:800,color:"#fff",flexShrink:0,letterSpacing:-0.5,boxShadow:"0 4px 12px rgba(193,39,45,0.35),inset 0 1px 0 rgba(255,255,255,0.18)" }}>
      {member.initials}
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const pad = n => String(n).padStart(2,"0");
  const ampm = h >= 12 ? "PM" : "AM";
  return (
    <div style={{ display:"flex",alignItems:"baseline",gap:4 }}>
      <span style={{ color:"#fff",fontSize:20,fontWeight:800,letterSpacing:-0.5,fontVariantNumeric:"tabular-nums" }}>{pad(h%12||12)}:{pad(m)}:{pad(s)}</span>
      <span style={{ color:"rgba(255,255,255,0.4)",fontSize:11,fontWeight:600 }}>{ampm}</span>
    </div>
  );
}

function LiveDot() {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setInterval(() => setOn(p => !p), 900); return () => clearInterval(t); }, []);
  return <div style={{ width:7,height:7,borderRadius:"50%",background:"#30d158",boxShadow:on?"0 0 9px #30d158":"none",transition:"box-shadow 0.5s ease",flexShrink:0 }} />;
}

function MonthCalendar({ year, month, attendedDays, onToggle, isCurrentMonth }) {
  const today = new Date();
  const totalDays = DAYS_IN_MONTH(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const attended = new Set(attendedDays || []);
  const dayLabels = ["M","T","W","T","F","S","S"];

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:5 }}>
        {dayLabels.map((l,i) => (
          <div key={i} style={{ textAlign:"center",fontSize:10,fontWeight:700,padding:"3px 0",color:i===6?"rgba(255,69,58,0.45)":"rgba(255,255,255,0.25)" }}>{l}</div>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3 }}>
        {Array.from({length:startOffset}).map((_,i) => <div key={`e${i}`} />)}
        {Array.from({length:totalDays}).map((_,i) => {
          const day = i + 1;
          const dow = new Date(year, month, day).getDay();
          const isSun = dow === 0;
          const isToday = isCurrentMonth && day === today.getDate();
          const isFuture = isCurrentMonth && day > today.getDate();
          const present = attended.has(day);
          return (
            <div key={day} onClick={() => !isFuture && !isSun && onToggle && onToggle(day)} style={{
              aspectRatio:"1",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:isToday?800:500,
              cursor:isFuture||isSun?"default":"pointer",
              background:present?"linear-gradient(135deg,#c1272d,#ff4040)":isToday?"rgba(255,255,255,0.12)":isFuture?"transparent":isSun?"transparent":"rgba(255,255,255,0.04)",
              color:present?"#fff":isToday?"#fff":isFuture?"rgba(255,255,255,0.13)":isSun?"rgba(255,69,58,0.3)":"rgba(255,255,255,0.48)",
              boxShadow:present?"0 2px 8px rgba(193,39,45,0.4)":isToday?"inset 0 0 0 1px rgba(255,255,255,0.22)":"none",
              transition:"background 0.16s,box-shadow 0.16s",fontVariantNumeric:"tabular-nums",
            }}>{day}</div>
          );
        })}
      </div>
    </div>
  );
}

function AttendanceDetailSheet({ member, memberIndex, onClose, onUpdateAttendance }) {
  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());

  const monthKey = `${selYear}-${String(selMonth).padStart(2,"0")}`;
  const attendedDays = member.attendance[monthKey] || [];
  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();

  const workedSoFar = (() => {
    let c = 0;
    const limit = isCurrentMonth ? now.getDate() : DAYS_IN_MONTH(selYear, selMonth);
    for (let d = 1; d <= limit; d++) {
      if (new Date(selYear, selMonth, d).getDay() !== 0) c++;
    }
    return c;
  })();

  const rate = workedSoFar > 0 ? Math.round((attendedDays.length / workedSoFar) * 100) : 0;
  const rateColor = rate >= 75 ? "#30d158" : rate >= 45 ? "#ffd60a" : "#ff453a";

  const joinDate = new Date(member.joined);
  const availMonths = [];
  let cur = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
  while (cur <= now) {
    availMonths.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  availMonths.reverse();

  const toggleDay = (day) => {
    const s = new Set(attendedDays);
    if (s.has(day)) s.delete(day); else s.add(day);
    onUpdateAttendance(member.id, monthKey, Array.from(s).sort((a,b) => a-b));
  };

  const canPrev = availMonths.some(a => a.year < selYear || (a.year===selYear && a.month < selMonth));
  const canNext = selYear < now.getFullYear() || (selYear===now.getFullYear() && selMonth < now.getMonth());
  const goMonth = (delta) => {
    let m = selMonth + delta, y = selYear;
    if (m < 0) { m=11; y--; } if (m > 11) { m=0; y++; }
    setSelMonth(m); setSelYear(y);
  };

  const totalAttended = Object.values(member.attendance).reduce((s,a) => s+a.length, 0);
  const totalWorking = Object.keys(member.attendance).reduce((s,key) => {
    const [y,mo] = key.split("-").map(Number);
    return s + WORKING_DAYS(y, mo);
  }, 0);
  const overallRate = totalWorking > 0 ? Math.round((totalAttended/totalWorking)*100) : 0;
  const overallColor = overallRate>=75?"#30d158":overallRate>=45?"#ffd60a":"#ff453a";

  return (
    <div className="fade-in" style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={onClose}>
      <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)" }} />
      <div className="sheet-up" style={{ width:"100%",maxWidth:430,background:"rgba(9,9,9,0.92)",backdropFilter:"blur(60px) saturate(220%)",WebkitBackdropFilter:"blur(60px) saturate(220%)",borderRadius:"32px 32px 0 0",border:"1px solid rgba(255,255,255,0.09)",borderTop:"1px solid rgba(255,255,255,0.2)",boxShadow:"0 -24px 80px rgba(193,39,45,0.1),inset 0 1px 0 rgba(255,255,255,0.1)",padding:"18px 20px 52px",position:"relative",zIndex:1,maxHeight:"94vh",overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.16)",margin:"0 auto 20px" }} />

        {/* Member header */}
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:18 }}>
          <Avatar member={member} size={54} index={memberIndex} />
          <div style={{ flex:1 }}>
            <h2 style={{ color:"#fff",fontSize:20,fontWeight:800,margin:0,letterSpacing:-0.5 }}>{member.name}</h2>
            <div style={{ display:"flex",alignItems:"center",gap:7,marginTop:4 }}>
              <StatusBadge status={member.status} />
              <span style={{ color:"rgba(255,255,255,0.28)",fontSize:12 }}>{member.plan}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width:30,height:30,borderRadius:15,border:"none",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.55)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>

        {/* Overall stats */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:18 }}>
          {[
            {label:"Overall",value:`${overallRate}%`,color:overallColor},
            {label:"Total Days",value:totalAttended,color:"#fff"},
            {label:"Months Active",value:Object.keys(member.attendance).length,color:"#c1272d"},
          ].map(s => (
            <div key={s.label} style={{ ...glass("rgba(255,255,255,0.045)",{borderRadius:18}),padding:"12px 8px",textAlign:"center",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,left:"10%",right:"10%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }} />
              <div style={{ color:s.color,fontSize:20,fontWeight:800,letterSpacing:-0.5 }}>{s.value}</div>
              <div style={{ color:"rgba(255,255,255,0.28)",fontSize:10,fontWeight:600,marginTop:3,letterSpacing:0.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Month navigator + calendar */}
        <div style={{ ...glass("rgba(255,255,255,0.04)",{borderRadius:22}),padding:"16px 16px 18px",marginBottom:16,position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",top:0,left:"6%",right:"6%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.11),transparent)" }} />

          {/* Month nav */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <button onClick={() => canPrev && goMonth(-1)} style={{ width:32,height:32,borderRadius:10,border:"none",background:canPrev?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",color:canPrev?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.13)",fontSize:18,cursor:canPrev?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:"#fff",fontSize:16,fontWeight:800,letterSpacing:-0.3 }}>{MONTHS[selMonth]} {selYear}</div>
              <div style={{ color:"rgba(255,255,255,0.3)",fontSize:11,marginTop:2 }}>{attendedDays.length} / {workedSoFar} working days</div>
            </div>
            <button onClick={() => canNext && goMonth(1)} style={{ width:32,height:32,borderRadius:10,border:"none",background:canNext?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",color:canNext?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.13)",fontSize:18,cursor:canNext?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>
          </div>

          {/* Rate bar */}
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
            <div style={{ flex:1,height:4,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${rate}%`,background:rateColor,borderRadius:4,transition:"width 0.5s ease" }} />
            </div>
            <span style={{ color:rateColor,fontSize:13,fontWeight:800,minWidth:36,textAlign:"right" }}>{rate}%</span>
          </div>

          <MonthCalendar year={selYear} month={selMonth} attendedDays={attendedDays} onToggle={toggleDay} isCurrentMonth={isCurrentMonth} />

          <div style={{ display:"flex",gap:14,marginTop:12,justifyContent:"center" }}>
            {[
              {color:"#c1272d",label:"Present"},
              {color:"rgba(255,255,255,0.07)",label:"Absent"},
              {color:"rgba(255,255,255,0.12)",label:"Today",border:"rgba(255,255,255,0.22)"},
            ].map(l => (
              <div key={l.label} style={{ display:"flex",alignItems:"center",gap:5 }}>
                <div style={{ width:10,height:10,borderRadius:3,background:l.color,border:l.border?`1px solid ${l.border}`:"none" }} />
                <span style={{ color:"rgba(255,255,255,0.28)",fontSize:10 }}>{l.label}</span>
              </div>
            ))}
          </div>

          {isCurrentMonth && <p style={{ color:"rgba(255,255,255,0.22)",fontSize:10,textAlign:"center",margin:"10px 0 0",letterSpacing:0.2 }}>Tap date to mark / unmark attendance</p>}
        </div>

        {/* Month history */}
        <p style={{ color:"rgba(255,255,255,0.28)",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",margin:"0 0 10px" }}>All Months</p>
        <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
          {availMonths.map(({year,month}) => {
            const key = `${year}-${String(month).padStart(2,"0")}`;
            const days = (member.attendance[key]||[]).length;
            const isCurrent = year===now.getFullYear()&&month===now.getMonth();
            const wd = isCurrent ? (() => { let c=0; for(let d=1;d<=now.getDate();d++){if(new Date(year,month,d).getDay()!==0)c++;} return c; })() : WORKING_DAYS(year,month);
            const pct = wd > 0 ? Math.round((days/wd)*100) : 0;
            const sel = year===selYear&&month===selMonth;
            const col = pct>=75?"#30d158":pct>=45?"#ffd60a":"#ff453a";
            return (
              <button key={key} onClick={() => { setSelYear(year); setSelMonth(month); }} style={{ padding:"7px 13px",borderRadius:20,border:sel?"1px solid rgba(193,39,45,0.5)":"1px solid rgba(255,255,255,0.07)",background:sel?"rgba(193,39,45,0.28)":"rgba(255,255,255,0.05)",fontFamily:"-apple-system,sans-serif",cursor:"pointer",transition:"all 0.18s" }}>
                <span style={{ color:sel?"#ff8080":"rgba(255,255,255,0.55)",fontSize:12,fontWeight:600 }}>{MONTHS[month]} {year!==now.getFullYear()?year:""}</span>
                <span style={{ color:col,fontSize:11,fontWeight:700,marginLeft:5 }}>{pct}%</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FitCityApp() {
  const [tab, setTab] = useState("home");
  const [members, setMembers] = useState(SEED_MEMBERS);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [attDetail, setAttDetail] = useState(null);
  const [form, setForm] = useState({ name:"", plan:"Basic" });
  const [mounted, setMounted] = useState(false);
  const [liveDate, setLiveDate] = useState(new Date());

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);
  useEffect(() => { const t = setInterval(() => setLiveDate(new Date()), 30000); return () => clearInterval(t); }, []);

  const now = new Date();
  const todayMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2,"0")}`;

  const active  = members.filter(m => m.status === "Active").length;
  const expired = members.filter(m => m.status === "Expired").length;
  const revenue = members.filter(m => m.status === "Active").reduce((s,m) => s+m.fee, 0);
  const todayPresent = members.filter(m => (m.attendance[todayMonthKey]||[]).includes(now.getDate())).length;

  const addMember = () => {
    if (!form.name.trim()) return;
    const p = PLANS.find(p => p.name === form.plan);
    const initials = form.name.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    setMembers([...members, {
      id:Date.now(), name:form.name, plan:form.plan, status:"Active",
      joined:`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`,
      fee:p.price, initials, attendance:{ [todayMonthKey]:[] },
    }]);
    setShowAdd(false); setForm({name:"",plan:"Basic"});
  };

  const toggleStatus = id =>
    setMembers(members.map(m => m.id===id ? {...m,status:m.status==="Active"?"Expired":"Active"} : m));

  const updateAttendance = (memberId, monthKey, days) => {
    setMembers(prev => prev.map(m => m.id!==memberId ? m : {...m,attendance:{...m.attendance,[monthKey]:days}}));
    setAttDetail(prev => prev && prev.id===memberId ? {...prev,attendance:{...prev.attendance,[monthKey]:days}} : prev);
  };

  const sheetStyle = {
    width:"100%",maxWidth:430,background:"rgba(9,9,9,0.92)",
    backdropFilter:"blur(60px) saturate(200%)",WebkitBackdropFilter:"blur(60px) saturate(200%)",
    borderRadius:"32px 32px 0 0",border:"1px solid rgba(255,255,255,0.09)",
    borderTop:"1px solid rgba(255,255,255,0.2)",
    boxShadow:"0 -20px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.09)",
    padding:"20px 22px 50px",position:"relative",zIndex:1,
  };

  return (
    <div style={{ minHeight:"100vh",width:"100%",maxWidth:430,margin:"0 auto",fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif",background:"#000",position:"relative",overflowX:"hidden",paddingBottom:110,opacity:mounted?1:0,transition:"opacity 0.4s ease" }}>

      {/* Ambient glow */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",maxWidth:430,margin:"0 auto" }}>
        <div style={{ position:"absolute",top:-100,left:"50%",transform:"translateX(-50%)",width:500,height:500,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(193,39,45,0.18) 0%,transparent 65%)",filter:"blur(60px)" }} />
        <div style={{ position:"absolute",top:"38%",right:-80,width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,rgba(193,39,45,0.09) 0%,transparent 70%)",filter:"blur(50px)" }} />
        <div style={{ position:"absolute",bottom:130,left:-40,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(120,0,0,0.12) 0%,transparent 70%)",filter:"blur(40px)" }} />
      </div>

      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes sheetUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        .slide-up{animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both}
        .fade-in{animation:fadeIn 0.26s ease both}
        .sheet-up{animation:sheetUp 0.38s cubic-bezier(0.22,1,0.36,1) both}
        .tap{transition:transform 0.12s ease,opacity 0.12s ease;cursor:pointer}
        .tap:active{transform:scale(0.972);opacity:0.82}
        input::placeholder{color:rgba(255,255,255,0.24)}
        input:focus{border-color:rgba(193,39,45,0.5)!important;box-shadow:0 0 0 3px rgba(193,39,45,0.12)!important;outline:none}
        ::-webkit-scrollbar{display:none}
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ position:"relative",zIndex:1 }}>

        {/* ─── HOME ─── */}
        {tab==="home" && (
          <div style={{ padding:"56px 18px 20px" }}>
            <div className="slide-up" style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
              <div>
                <p style={{ color:"rgba(255,255,255,0.36)",fontSize:13,margin:"0 0 1px" }}>Good morning 👋</p>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <h1 style={{ color:"#fff",fontSize:26,fontWeight:800,margin:0,letterSpacing:-0.8 }}>FITCITY</h1>
                  <span style={{ color:"rgba(255,255,255,0.28)",fontSize:12,fontStyle:"italic" }}>by Abhishek</span>
                </div>
              </div>
              <FitCityLogo size={40} />
            </div>

            <div className="slide-up tap" style={{ ...redGlass({borderRadius:26}),padding:"24px 22px",marginBottom:12,animationDelay:"55ms",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,left:"10%",right:"10%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)" }} />
              <p style={{ color:"rgba(255,255,255,0.48)",fontSize:11,fontWeight:700,margin:"0 0 7px",letterSpacing:1.8,textTransform:"uppercase" }}>Monthly Revenue</p>
              <div style={{ color:"#fff",fontSize:42,fontWeight:800,letterSpacing:-2,lineHeight:1 }}>₹{revenue.toLocaleString()}</div>
              <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:9 }}>
                <LiveDot />
                <p style={{ color:"rgba(255,255,255,0.38)",fontSize:12,margin:0 }}>{active} active · live</p>
              </div>
            </div>

            <div className="slide-up" style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:26,animationDelay:"110ms" }}>
              {[{label:"Members",value:members.length,color:"#fff"},{label:"Active",value:active,color:"#30d158"},{label:"Expired",value:expired,color:"#ff453a"}].map(s=>(
                <div key={s.label} style={{ ...glass("rgba(255,255,255,0.05)",{borderRadius:20}),padding:"16px 8px",textAlign:"center",position:"relative",overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:0,left:"15%",right:"15%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)" }} />
                  <div style={{ color:s.color,fontSize:26,fontWeight:800,lineHeight:1,letterSpacing:-0.5 }}>{s.value}</div>
                  <div style={{ color:"rgba(255,255,255,0.32)",fontSize:11,fontWeight:600,marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <p className="slide-up" style={{ color:"rgba(255,255,255,0.38)",fontSize:11,fontWeight:700,margin:"0 0 10px",letterSpacing:1.2,textTransform:"uppercase",animationDelay:"150ms" }}>Recent Members</p>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {members.slice(0,4).map((m,i)=>(
                <div key={m.id} className="tap slide-up" style={{ ...glass("rgba(255,255,255,0.05)",{borderRadius:20}),padding:"13px 15px",display:"flex",alignItems:"center",gap:12,animationDelay:`${190+i*48}ms`,position:"relative",overflow:"hidden" }}
                  onClick={()=>setSelected(m)}>
                  <div style={{ position:"absolute",top:0,left:"8%",right:"8%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.11),transparent)" }} />
                  <Avatar member={m} size={42} index={i} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ color:"#fff",fontSize:14,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{m.name}</div>
                    <div style={{ color:"rgba(255,255,255,0.28)",fontSize:12,marginTop:1 }}>{m.plan}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── MEMBERS ─── */}
        {tab==="members" && (
          <div style={{ padding:"56px 18px 20px" }}>
            <div className="slide-up" style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div>
                <p style={{ color:"rgba(255,255,255,0.28)",fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",margin:"0 0 2px" }}>FITCITY</p>
                <h1 style={{ color:"#fff",fontSize:26,fontWeight:800,margin:0,letterSpacing:-0.6 }}>Members</h1>
              </div>
              <button onClick={()=>setShowAdd(true)} className="tap" style={{ width:36,height:36,borderRadius:11,border:"none",cursor:"pointer",background:"rgba(193,39,45,0.85)",color:"#fff",fontSize:22,fontWeight:300,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 18px rgba(193,39,45,0.45),inset 0 1px 0 rgba(255,255,255,0.2)" }}>+</button>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {members.map((m,i)=>(
                <div key={m.id} className="tap slide-up" style={{ ...glass("rgba(255,255,255,0.05)",{borderRadius:22}),padding:16,animationDelay:`${i*42}ms`,position:"relative",overflow:"hidden" }}
                  onClick={()=>setSelected(m)}>
                  <div style={{ position:"absolute",top:0,left:"6%",right:"6%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.13),transparent)" }} />
                  <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <Avatar member={m} size={48} index={i} />
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ color:"#fff",fontSize:15,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{m.name}</div>
                      <div style={{ color:"rgba(255,255,255,0.3)",fontSize:12,marginTop:2 }}>{m.plan} · ₹{m.fee.toLocaleString()}/mo</div>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
                      <StatusBadge status={m.status} />
                      <span style={{ color:"rgba(255,255,255,0.16)",fontSize:16 }}>›</span>
                    </div>
                  </div>
                  <div style={{ marginTop:12,display:"flex",alignItems:"center",gap:8 }}>
                    <div style={{ flex:1,height:3,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${Math.min(100,((m.attendance[todayMonthKey]||[]).length/26)*100)}%`,background:"linear-gradient(90deg,#c1272d,#ff5050)",borderRadius:3 }} />
                    </div>
                    <span style={{ color:"rgba(255,255,255,0.2)",fontSize:10,whiteSpace:"nowrap" }}>{(m.attendance[todayMonthKey]||[]).length} days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── PLANS ─── */}
        {tab==="plans" && (
          <div style={{ padding:"56px 18px 20px" }}>
            <div className="slide-up" style={{ marginBottom:20 }}>
              <p style={{ color:"rgba(255,255,255,0.28)",fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",margin:"0 0 2px" }}>FITCITY</p>
              <h1 style={{ color:"#fff",fontSize:26,fontWeight:800,margin:"0 0 3px",letterSpacing:-0.6 }}>Plans</h1>
              <p style={{ color:"rgba(255,255,255,0.28)",fontSize:13,margin:0 }}>Choose your commitment</p>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {PLANS.map((p,i)=>{
                const count=members.filter(m=>m.plan===p.name&&m.status==="Active").length;
                const isElite=p.name==="Elite";
                return (
                  <div key={p.name} className="tap slide-up" style={{ ...(isElite?redGlass({borderRadius:26}):glass("rgba(255,255,255,0.05)",{borderRadius:26})),padding:22,animationDelay:`${55+i*65}ms`,position:"relative",overflow:"hidden" }}>
                    <div style={{ position:"absolute",top:0,left:"8%",right:"8%",height:1,background:`linear-gradient(90deg,transparent,${isElite?"rgba(255,150,150,0.22)":"rgba(255,255,255,0.11)"},transparent)` }} />
                    {isElite&&<div style={{ display:"inline-flex",padding:"3px 10px",borderRadius:20,background:"rgba(193,39,45,0.25)",border:"1px solid rgba(193,39,45,0.35)",marginBottom:12 }}><span style={{ fontSize:9,color:"#ff8080",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase" }}>★ Most Popular</span></div>}
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:15 }}>
                      <div>
                        <div style={{ color:"#fff",fontSize:22,fontWeight:800,letterSpacing:-0.4 }}>{p.name}</div>
                        <div style={{ color:"rgba(255,255,255,0.28)",fontSize:12,marginTop:2 }}>{count} active</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ color:"#fff",fontSize:30,fontWeight:800,lineHeight:1,letterSpacing:-1 }}>₹{p.price.toLocaleString()}</div>
                        <div style={{ color:"rgba(255,255,255,0.26)",fontSize:11,marginTop:2,letterSpacing:0.3 }}>/MONTH</div>
                      </div>
                    </div>
                    <div style={{ height:1,background:"rgba(255,255,255,0.05)",marginBottom:13 }} />
                    {p.features.map(f=>(
                      <div key={f} style={{ display:"flex",alignItems:"center",gap:10,padding:"5px 0" }}>
                        <div style={{ width:18,height:18,borderRadius:9,background:"rgba(193,39,45,0.2)",border:"1px solid rgba(193,39,45,0.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                          <span style={{ fontSize:9,color:"#ff8080",fontWeight:800 }}>✓</span>
                        </div>
                        <span style={{ color:"rgba(255,255,255,0.62)",fontSize:13 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ATTENDANCE (REAL-TIME) ─── */}
        {tab==="attendance" && (
          <div style={{ padding:"56px 18px 20px" }}>
            <div className="slide-up" style={{ marginBottom:18 }}>
              <p style={{ color:"rgba(255,255,255,0.28)",fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",margin:"0 0 2px" }}>FITCITY</p>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <h1 style={{ color:"#fff",fontSize:26,fontWeight:800,margin:0,letterSpacing:-0.6 }}>Attendance</h1>
                <LiveClock />
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:4 }}>
                <LiveDot />
                <p style={{ color:"rgba(255,255,255,0.32)",fontSize:12,margin:0 }}>
                  {liveDate.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
                </p>
              </div>
            </div>

            {/* Today snapshot */}
            <div className="slide-up" style={{ ...glass("rgba(255,255,255,0.05)",{borderRadius:22}),padding:"16px 18px",marginBottom:16,animationDelay:"55ms",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,left:"8%",right:"8%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.13),transparent)" }} />
              <p style={{ color:"rgba(255,255,255,0.32)",fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",margin:"0 0 12px" }}>Today's Snapshot</p>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                {[
                  {label:"Present",value:todayPresent,color:"#30d158"},
                  {label:"Absent",value:members.length-todayPresent,color:"#ff453a"},
                  {label:"This Month",value:(members[0]?.attendance[todayMonthKey]||[]).length,color:"#c1272d"},
                ].map(s=>(
                  <div key={s.label} style={{ textAlign:"center" }}>
                    <div style={{ color:s.color,fontSize:22,fontWeight:800,letterSpacing:-0.3 }}>{s.value}</div>
                    <div style={{ color:"rgba(255,255,255,0.26)",fontSize:10,fontWeight:600,marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="slide-up" style={{ color:"rgba(255,255,255,0.28)",fontSize:11,fontWeight:700,letterSpacing:1.1,textTransform:"uppercase",margin:"0 0 10px",animationDelay:"75ms" }}>Tap member for full history</p>

            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {members.map((m,i)=>{
                const monthDays=(m.attendance[todayMonthKey]||[]).length;
                const isPresentToday=(m.attendance[todayMonthKey]||[]).includes(now.getDate());
                const workedSoFar=(() => { let c=0; for(let d=1;d<=now.getDate();d++){if(new Date(now.getFullYear(),now.getMonth(),d).getDay()!==0)c++;} return c; })();
                const rate=workedSoFar>0?Math.round((monthDays/workedSoFar)*100):0;
                const rateColor=rate>=75?"#30d158":rate>=45?"#ffd60a":"#ff453a";

                return (
                  <div key={m.id} className="tap slide-up" style={{ ...glass("rgba(255,255,255,0.05)",{borderRadius:22}),padding:16,animationDelay:`${110+i*50}ms`,position:"relative",overflow:"hidden" }}
                    onClick={()=>setAttDetail({...m})}>
                    <div style={{ position:"absolute",top:0,left:"6%",right:"6%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.11),transparent)" }} />

                    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
                      {/* Avatar with live today dot */}
                      <div style={{ position:"relative",flexShrink:0 }}>
                        <Avatar member={m} size={46} index={i} />
                        <div style={{ position:"absolute",bottom:-2,right:-2,width:13,height:13,borderRadius:7,background:isPresentToday?"#30d158":"#ff453a",border:"2.5px solid #000",boxShadow:isPresentToday?"0 0 7px #30d158":"0 0 7px rgba(255,69,58,0.6)" }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>{m.name}</div>
                        <div style={{ color:"rgba(255,255,255,0.28)",fontSize:11,marginTop:2 }}>
                          <span style={{ color:isPresentToday?"#30d158":"#ff453a" }}>{isPresentToday?"● Present":"● Absent"}</span>
                          <span style={{ color:"rgba(255,255,255,0.2)" }}> · {m.plan}</span>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ color:rateColor,fontSize:22,fontWeight:800,letterSpacing:-0.5 }}>{rate}%</div>
                        <div style={{ color:"rgba(255,255,255,0.22)",fontSize:10,marginTop:1 }}>this month</div>
                      </div>
                    </div>

                    {/* 14-day mini strip */}
                    <div style={{ display:"flex",gap:3,marginBottom:5 }}>
                      {Array.from({length:14}).map((_,offset)=>{
                        const d=new Date(now); d.setDate(d.getDate()-13+offset);
                        if(d.getDay()===0) return <div key={offset} style={{ flex:1,height:12 }} />;
                        const dayNum=d.getDate();
                        const mk=`${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
                        const present=(m.attendance[mk]||[]).includes(dayNum);
                        const isToday=d.toDateString()===now.toDateString();
                        return (
                          <div key={offset} style={{ flex:1,height:12,borderRadius:4,background:present?"linear-gradient(135deg,#c1272d,#ff5050)":isToday?"rgba(255,255,255,0.09)":"rgba(255,255,255,0.04)",boxShadow:present?"0 1px 4px rgba(193,39,45,0.3)":isToday?"inset 0 0 0 1px rgba(255,255,255,0.18)":"none" }} />
                        );
                      })}
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between" }}>
                      <span style={{ color:"rgba(255,255,255,0.18)",fontSize:10 }}>14 days ago</span>
                      <span style={{ color:"rgba(255,255,255,0.35)",fontSize:10,fontWeight:600 }}>View full history ›</span>
                      <span style={{ color:"rgba(255,255,255,0.18)",fontSize:10 }}>Today</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM TAB BAR ─── */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:50,padding:"0 14px 28px",boxSizing:"border-box" }}>
        <div style={{ display:"flex",justifyContent:"space-around",padding:"8px 6px",borderRadius:30,background:"rgba(7,7,7,0.8)",backdropFilter:"blur(50px) saturate(200%) brightness(1.12)",WebkitBackdropFilter:"blur(50px) saturate(200%) brightness(1.12)",border:"1px solid rgba(255,255,255,0.08)",borderTop:"1px solid rgba(255,255,255,0.16)",boxShadow:"0 2px 0 rgba(255,255,255,0.05) inset,0 -4px 40px rgba(0,0,0,0.55)" }}>
          {[
            {id:"home",label:"Home",icon:"⊙"},
            {id:"members",label:"Members",icon:"◎"},
            {id:"plans",label:"Plans",icon:"◈"},
            {id:"attendance",label:"Stats",icon:"▦",live:true},
          ].map(t=>{
            const isActive=tab===t.id;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"transparent",border:"none",cursor:"pointer",padding:"4px",borderRadius:22 }}>
                <div style={{ width:50,height:30,borderRadius:15,background:isActive?"rgba(193,39,45,0.3)":"transparent",border:isActive?"1px solid rgba(193,39,45,0.36)":"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:3,transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:isActive?"0 2px 12px rgba(193,39,45,0.25),inset 0 1px 0 rgba(255,100,100,0.15)":"none" }}>
                  {t.live && <LiveDot />}
                  <span style={{ fontSize:isActive?15:13,color:isActive?"#ff8080":"#fff",filter:isActive?"none":"brightness(0.35)" }}>{t.icon}</span>
                </div>
                <span style={{ fontSize:10,fontWeight:isActive?700:500,color:isActive?"#ff8080":"rgba(255,255,255,0.24)",letterSpacing:0.2,transition:"color 0.2s" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── ADD MEMBER SHEET ─── */}
      {showAdd && (
        <div className="fade-in" style={{ position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={()=>setShowAdd(false)}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.74)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)" }} />
          <div className="sheet-up" style={sheetStyle} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 20px" }} />
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
              <FitCityLogo size={30} />
              <h2 style={{ color:"#fff",fontSize:20,fontWeight:800,margin:0,letterSpacing:-0.5 }}>New Member</h2>
            </div>
            <label style={{ color:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",display:"block",marginBottom:7 }}>Full Name</label>
            <input style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 14px",color:"#fff",fontSize:15,fontFamily:"-apple-system,sans-serif",marginBottom:18,transition:"border-color 0.2s,box-shadow 0.2s" }}
              placeholder="e.g. Rahul Kumar" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <label style={{ color:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",display:"block",marginBottom:7 }}>Plan</label>
            <div style={{ display:"flex",gap:8,marginBottom:24 }}>
              {PLANS.map(p=>{
                const sel=form.plan===p.name;
                return (
                  <button key={p.name} onClick={()=>setForm({...form,plan:p.name})} style={{ flex:1,padding:"12px 6px",borderRadius:15,border:sel?"1.5px solid rgba(193,39,45,0.5)":"1.5px solid rgba(255,255,255,0.07)",background:sel?"rgba(193,39,45,0.18)":"rgba(255,255,255,0.04)",color:sel?"#ff8080":"rgba(255,255,255,0.3)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"-apple-system,sans-serif",transition:"all 0.17s" }}>
                    <div style={{ fontSize:17,marginBottom:3 }}>{p.name==="Basic"?"🥈":p.name==="Pro"?"🥇":"💎"}</div>{p.name}
                  </button>
                );
              })}
            </div>
            <button onClick={addMember} disabled={!form.name.trim()} className="tap" style={{ width:"100%",padding:"15px",borderRadius:18,border:"none",background:form.name.trim()?"linear-gradient(135deg,#c1272d,#8b0000)":"rgba(255,255,255,0.05)",color:form.name.trim()?"#fff":"rgba(255,255,255,0.16)",fontSize:15,fontWeight:700,cursor:form.name.trim()?"pointer":"not-allowed",fontFamily:"-apple-system,sans-serif",boxShadow:form.name.trim()?"0 8px 24px rgba(193,39,45,0.38),inset 0 1px 0 rgba(255,255,255,0.16)":"none",transition:"all 0.18s" }}>
              Add to FitCity
            </button>
          </div>
        </div>
      )}

      {/* ─── MEMBER DETAIL SHEET ─── */}
      {selected && (
        <div className="fade-in" style={{ position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={()=>setSelected(null)}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.74)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)" }} />
          <div className="sheet-up" style={sheetStyle} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 20px" }} />
            <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:20 }}>
              <Avatar member={selected} size={56} index={members.findIndex(m=>m.id===selected.id)} />
              <div>
                <h2 style={{ color:"#fff",fontSize:20,fontWeight:800,margin:0,letterSpacing:-0.5 }}>{selected.name}</h2>
                <p style={{ color:"rgba(255,255,255,0.28)",fontSize:12,margin:"3px 0 0" }}>Since {new Date(selected.joined).toLocaleDateString("en-IN",{month:"short",year:"numeric"})}</p>
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18 }}>
              {[
                {label:"Plan",value:selected.plan},
                {label:"Monthly Fee",value:`₹${selected.fee.toLocaleString()}`},
                {label:"Days This Month",value:`${(selected.attendance[todayMonthKey]||[]).length}`},
                {label:"Status",value:selected.status,color:STATUS_META[selected.status].color},
              ].map(item=>(
                <div key={item.label} style={{ ...glass("rgba(255,255,255,0.045)",{borderRadius:18}),padding:"12px 14px",position:"relative",overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:0,left:"10%",right:"10%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)" }} />
                  <div style={{ color:"rgba(255,255,255,0.26)",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4 }}>{item.label}</div>
                  <div style={{ color:item.color||"#fff",fontSize:16,fontWeight:700 }}>{item.value}</div>
                </div>
              ))}
            </div>
            <button className="tap" onClick={()=>{toggleStatus(selected.id);setSelected(null);}} style={{ width:"100%",padding:"14px",borderRadius:18,cursor:"pointer",fontFamily:"-apple-system,sans-serif",fontSize:15,fontWeight:700,background:selected.status==="Active"?"rgba(255,69,58,0.09)":"rgba(48,209,88,0.09)",color:selected.status==="Active"?"#ff453a":"#30d158",border:`1px solid ${selected.status==="Active"?"rgba(255,69,58,0.2)":"rgba(48,209,88,0.2)"}`,boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)" }}>
              {selected.status==="Active"?"Deactivate Member":"Activate Member"}
            </button>
          </div>
        </div>
      )}

      {/* ─── ATTENDANCE DETAIL SHEET ─── */}
      {attDetail && (
        <AttendanceDetailSheet
          member={members.find(m=>m.id===attDetail.id)||attDetail}
          memberIndex={members.findIndex(m=>m.id===attDetail.id)}
          onClose={()=>setAttDetail(null)}
          onUpdateAttendance={updateAttendance}
        />
      )}
    </div>
  );
}
