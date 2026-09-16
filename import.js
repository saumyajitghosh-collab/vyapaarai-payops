// ============================================================
// Real-data import: bank statement + bills → reconciliation.
// Runs 100% in the browser. Nothing is uploaded anywhere.
// ============================================================
(function(){
const IMP = { bank:null, inv:null, mapB:null, mapI:null, results:null };

// ---------- CSV / table parsing ----------
function parseCSV(text){
  const rows=[]; let cur=[""], r=0, inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){ if(c==='"'){ if(text[i+1]==='"'){cur[r]+='"';i++;} else inQ=false; } else cur[r]+=c; }
    else if(c==='"'){ inQ=true; }
    else if(c===","){ cur.push(""); r++; }
    else if(c==="\n"){ rows.push(cur); cur=[""]; r=0; }
    else if(c!=="\r"){ cur[r]+=c; }
  }
  if(cur.length>1 || cur[0]!=="") rows.push(cur);
  const clean=rows.map(row=>row.map(c=>String(c==null?"":c).trim())).filter(row=>row.some(c=>c!==""));
  if(clean.length<2) return [];
  const hi=findHeader(clean);
  const head=clean[hi].map((h,k)=>String(h||("column "+(k+1))));
  const out=[];
  for(let i=hi+1;i<clean.length;i++){
    const o={};
    clean[i].forEach((c,k)=>o[head[k]]=""+c);
    o.__row=i+1;
    out.push(o);
  }
  return out;
}
function findHeader(rows){
  const KW=/date|narration|description|particulars|remark|detail|deposit|credit|withdrawal|debit|amount|balance|ref|utr|chq|cheque|customer|invoice|party|due/i;
  for(let i=0;i<Math.min(rows.length,15);i++){
    if(rows[i].filter(c=>KW.test(c)).length>=2) return i;
  }
  return 0;
}
function loadXLSX(){
  if(window.XLSX) return Promise.resolve();
  return new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    s.onload=res; s.onerror=rej; document.head.appendChild(s);
  });
}
function readFile(file){
  const name=file.name||"";
  if(/\.(xlsx|xls)$/i.test(name)){
    return loadXLSX().then(()=>new Promise((res,rej)=>{
      const fr=new FileReader();
      fr.onload=()=>{ try{
        const wb=XLSX.read(fr.result,{type:"array"});
        const ws=wb.Sheets[wb.SheetNames[0]];
        res(XLSX.utils.sheet_to_json(ws,{header:1,raw:false}).map(r=>(r||[]).map(c=>String(c==null?"":c))));
      }catch(e){rej(e);} };
      fr.onerror=rej; fr.readAsArrayBuffer(file);
    }));
  }
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsText(file);
  });
}

// ---------- helpers ----------
const $id = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString("en-IN");
function parseAmount(v){
  const n=parseFloat(String(v==null?"":v).replace(/[₹,\s]/g,""));
  return isNaN(n)?0:n;
}
function normStr(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]/g,""); }
function firstToken(c){
  const w=String(c||"").toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>=4);
  return w[0]||"";
}
function dparse(s){
  s=String(s||"").trim();
  let m=s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if(m){ let y=+m[3]; if(y<100) y+=2000; return new Date(y, +m[2]-1, +m[1]).getTime(); }
  m=s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if(m) return new Date(+m[1], +m[2]-1, +m[3]).getTime();
  const t=Date.parse(s);
  return isNaN(t)?null:t;
}

// ---------- field detection ----------
const BANK_FIELDS=[
  {key:"date",   label:"Date",                      re:/^(txn\s*)?date$|value\s*date|date/i, req:true},
  {key:"narration", label:"Narration / description", re:/narration|description|particulars|remark|detail/i, req:true},
  {key:"credit", label:"Credit / deposit (₹)",      re:/deposit|credit|cr\s*amt|amount\s*cred/i, req:true},
  {key:"debit",  label:"Debit / withdrawal (₹)",    re:/withdrawal|debit|dr\s*amt/i, req:false},
  {key:"ref",    label:"Reference / UTR / cheque",  re:/ref|utr|chq|cheque/i, req:false},
];
const INV_FIELDS=[
  {key:"customer", label:"Customer / party",  re:/customer|party|buyer|ledger|client|name/i, req:true},
  {key:"no",       label:"Invoice number",    re:/invoice|bill\s*no|inv\s*no|voucher|doc.*no|number/i, req:true},
  {key:"amount",   label:"Amount (₹)",        re:/amount|total|value|grand/i, req:true},
  {key:"date",     label:"Bill date",          re:/bill\s*date|^date$|invoice\s*date|doc\s*date/i, req:false},
  {key:"due",      label:"Due date",           re:/due/i, req:false},
];
function detect(headers, fields){
  const map={}, used=new Set();
  fields.forEach(f=>{
    let best=-1;
    headers.forEach((h,i)=>{
      if(used.has(i)) return;
      if(best<0 && f.re.test(String(h).trim())){ best=i; }
    });
    if(best>=0){ map[f.key]=headers[best]; used.add(best); }
  });
  // fallbacks: credit column can be a plain "amount" column
  if(!map.credit){
    const k=headers.findIndex(h=>/amount/i.test(h) && !Array.from(used.values()).includes(h));
    if(k>=0){ map.credit=headers[k]; used.add(k); }
  }
  return map;
}

// ---------- reconciliation engine (deterministic rules, recorded) ----------
function runImport(bankRows, invRows, mapB, mapI){
  const invs=invRows.map((r,i)=>({
    idx:i, no:String(r[mapI.no]||"").trim(), customer:String(r[mapI.customer]||"").trim(),
    amount:parseAmount(r[mapI.amount]), date:String(r[mapI.date]||""), due:String(r[mapI.due]||""),
    balance:parseAmount(r[mapI.amount])
  })).filter(v=>v.amount>0 && v.no!=="");
  const credits=[];
  bankRows.forEach(r=>{
    const amt=parseAmount(r[mapB.credit]);
    if(amt>0) credits.push({date:String(r[mapB.date]||""), narration:String(r[mapB.narration]||""), ref:String(r[mapB.ref]||""), amount:amt, ts:dparse(r[mapB.date]), row:r.__row||""});
  });
  const res={matched:[], probable:[], exceptions:[], unpaid:[], overdue:[], credits, invs, stats:{}};
  const seen=[];
  credits.forEach(t=>{
    const nn=normStr(t.narration+" "+t.ref);
    const dup=seen.find(s=>s.nn===nn && s.amount===t.amount && ((t.ts&&s.ts)? Math.abs(t.ts-s.ts)<=3*864e5 : true));
    if(dup){
      res.exceptions.push({type:"Possible duplicate", amount:t.amount,
        detail:esc(t.narration)+" — same payer and amount as row "+dup.row+".", row:t.row});
      return;
    }
    seen.push({nn, amount:t.amount, ts:t.ts, row:t.row});
    let inv=null, rule="";
    const byNo=invs.filter(i=>i.balance>0 && normStr(i.no)!=="" && nn.includes(normStr(i.no)));
    if(byNo.length){ inv=byNo[0]; rule="Invoice number found in narration"; }
    if(!inv){
      const cands=invs.filter(i=>i.balance>0 && firstToken(i.customer) && nn.includes(firstToken(i.customer)));
      const exact=cands.filter(i=>i.balance===t.amount);
      if(exact.length===1){ inv=exact[0]; rule="Customer name + exact amount"; }
      else if(exact.length>1){ inv=exact[0]; rule="Customer + exact amount (oldest of "+exact.length+")"; }
      else{
        const near=cands.filter(i=>i.balance-t.amount>0 && i.balance-t.amount<=10);
        if(near.length){ inv=near[0]; rule="Short payment"; }
        else{
          const part=cands.filter(i=>i.balance-t.amount>10);
          if(part.length){ inv=part[0]; rule="Customer + part payment (oldest bill)"; }
        }
        if(!inv){
          const anyExact=invs.filter(i=>i.balance===t.amount);
          if(anyExact.length){
            res.probable.push({amount:t.amount, inv:anyExact[0].no,
              detail:esc(t.narration)+" — matches "+esc(anyExact[0].no)+" ("+esc(anyExact[0].customer)+") exactly, but the customer name isn't in the narration. Confirm before applying.", row:t.row});
            return;
          }
          res.exceptions.push({type:"Unmatched credit", amount:t.amount,
            detail:fmt(t.amount)+" from \u201C"+esc(t.narration)+"\u201D — no customer name, invoice number or matching amount.", row:t.row});
          return;
        }
      }
    }
    if(rule==="Short payment"){
      const deficit=inv.balance-t.amount;
      res.exceptions.push({type:"Short payment", amount:deficit,
        detail:esc(inv.customer)+" paid "+fmt(t.amount)+" against "+esc(inv.no)+" of "+fmt(inv.balance)+" — short by "+fmt(deficit)+".", row:t.row});
      inv.balance=0; t.status="short";
    } else if(t.amount>inv.balance){
      res.exceptions.push({type:"Over-payment", amount:t.amount-inv.balance,
        detail:esc(inv.customer)+" paid "+fmt(t.amount)+" against "+esc(inv.no)+" of "+fmt(inv.balance)+" — "+fmt(t.amount-inv.balance)+" extra.", row:t.row});
      inv.balance=0; t.status="over";
    } else {
      inv.balance=Math.max(0, inv.balance-t.amount);
      t.status=inv.balance===0?"matched":"part";
      if(inv.balance>0) rule+=" — part payment applied";
    }
    t.inv=inv.no; t.rule=rule;
    res.matched.push({txn:t, inv, rule});
  });
  const asOf=credits.reduce((m,c)=>Math.max(m,c.ts||0),0) || Date.now();
  res.unpaid=invs.filter(i=>i.balance>0.5);
  res.unpaid.forEach(i=>{ const d=dparse(i.due); if(d!=null && d<asOf) res.overdue.push(i); });
  res.stats={
    credits:credits.length, bills:invs.length,
    matched:res.matched.filter(m=>m.inv.balance===0).length,
    part:res.matched.filter(m=>m.inv.balance>0).length,
    probable:res.probable.length, exceptions:res.exceptions.length, unpaid:res.unpaid.length
  };
  res.attention={
    overdue:res.overdue.reduce((a,i)=>a+i.balance,0),
    unmatched:res.exceptions.filter(e=>e.type==="Unmatched credit").reduce((a,e)=>a+e.amount,0),
    short:res.exceptions.filter(e=>e.type==="Short payment").reduce((a,e)=>a+e.amount,0),
    duplicate:res.exceptions.filter(e=>e.type==="Possible duplicate").reduce((a,e)=>a+e.amount,0),
  };
  return res;
}

// ---------- sample data ----------
const SAMPLE_INV=`Customer,Invoice No,Amount,Bill Date,Due Date
Rajesh Kirana Stores,INV1001,24800,05/08/2026,04/09/2026
Sri Lakshmi Traders,INV1002,36400,09/08/2026,08/09/2026
Gupta General Store,INV1003,15250,12/08/2026,11/09/2026
Fresh Mart Indiranagar,INV1004,48300,15/08/2026,14/09/2026
Annapoorna Provisions,INV1005,9750,18/08/2026,17/09/2026
Sharma Super Bazaar,INV1006,61200,20/08/2026,19/09/2026
Nandini Mini Mart,INV1007,12400,22/08/2026,21/09/2026
Royal Stores,INV1008,27350,25/08/2026,24/09/2026
Venkateshwara Agencies,INV1009,31800,27/08/2026,05/09/2026
Agarwal Traders,INV1010,5400,28/08/2026,06/09/2026
Mahalakshmi Stores,INV1011,18950,29/08/2026,09/09/2026
Kaveri Provision Centre,INV1012,22600,30/08/2026,08/09/2026
Singh Brothers,INV1013,41000,01/09/2026,10/09/2026
Daily Needs Whitefield,INV1014,8900,02/09/2026,12/09/2026
Rajesh Kirana Stores,INV1015,21300,03/09/2026,03/10/2026
Fresh Mart Indiranagar,INV1016,30500,05/09/2026,05/10/2026`;
const SAMPLE_BANK=`Date,Narration,Ref No/Cheque No,Withdrawal ,Deposit ,Balance
01/09/2026,UPI/RAJESH KIRANA/OKAXIS/INV1001,,,24800.00,412000
01/09/2026,NEFT-SRILAKSHMI TRADERS-REF123,NEFT123,,36400.00,448400
02/09/2026,UPI/GUPTA GENERAL STORE/PAYTM,,,15250.00,463650
02/09/2026,UPI/FRESHMART BLR/OKICICI,,,48300.00,511950
03/09/2026,SALARY STAFF SEPTEMBER,,86000.00,,425950
03/09/2026,UPI/ANNAPOORNA PROVISIONS/OKHDFC,,,5000.00,430950
04/09/2026,UPI/SHARMA SUPER BAZAAR/YBL,,,61200.00,492150
04/09/2026,UPI/SHARMA SUPER BAZAAR/YBL,,,61200.00,553350
05/09/2026,UPI/NANDINI MINI MART/OKAXIS,,,12396.00,565746
05/09/2026,RENT OFFICE GODOWN,CHQ2201,42000.00,,523746
06/09/2026,UPI/9876543210@YBL/CHE,,,15000.00,538746
07/09/2026,UPI/ROYAL STORES/PAYTM,,,27350.00,566096
07/09/2026,UPI/AGARWAL TRADRS/YBL,,,5400.00,571496
08/09/2026,IMPS-RAJESH KIRANA-INV1015,,,21300.00,592796
09/09/2026,IMPS-M/S K P CENTRE-778899,,,22600.00,615396`;

// ---------- UI ----------
function renderMap(kind){
  const isBank=kind==="bank";
  const d=IMP[isBank?"bank":"inv"], fields=isBank?BANK_FIELDS:INV_FIELDS, map=IMP[isBank?"mapB":"mapI"];
  const box=$id(isBank?"bankMap":"invMap");
  if(!d){ box.innerHTML=""; return; }
  box.innerHTML="<b style='font-size:.85rem'>Check the column mapping</b>"+fields.map(f=>{
    const opts=["<option value=''>— not present —</option>"].concat(
      d.headers.map(h=>`<option value="${esc(h)}"${map[f.key]===h?" selected":""}>${esc(h)}</option>`));
    return `<label>${esc(f.label)}${f.req?" *":""}<select data-kind="${kind}" data-field="${f.key}">${opts.join("")}</select></label>`;
  }).join("");
  const missing=fields.filter(f=>f.req && !map[f.key]);
  $id(isBank?"bankInfo":"invInfo").innerHTML = missing.length
    ? "Loaded "+d.rows.length+" rows — map the required columns marked *."
    : "Loaded "+d.rows.length+" rows. Detected: "+fields.map(f=>f.key+"→"+(map[f.key]||"—")).join(", ")+".";
}
function setData(kind, name, rows){
  const headers=rows.length?Object.keys(rows[0]).filter(h=>h!=="__row"):[];
  if(kind==="bank"){ IMP.bank={name,rows,headers}; IMP.mapB=detect(headers,BANK_FIELDS); }
  else{ IMP.inv={name,rows,headers}; IMP.mapI=detect(headers,INV_FIELDS); }
  renderMap(kind);
  refreshRun();
}
function refreshRun(){
  const ok=IMP.bank && IMP.inv;
  $id("impRunWrap").hidden=!ok;
  if(ok) $id("impRunNote").textContent="Ready: "+IMP.bank.rows.length+" statement rows + "+IMP.inv.rows.length+" bills.";
}
function renderResults(res){
  const a=res.attention, tot=a.overdue+a.unmatched+a.short+a.duplicate;
  const st=res.stats;
  $id("impResults").innerHTML=`
  <div class="imp-hero">
    <h3>₹${fmt(tot)} found needing attention</h3>
    <p class="sub">Overdue bills <b class="num">₹${fmt(a.overdue)}</b> · Unmatched credits <b class="num">₹${fmt(a.unmatched)}</b> · Short-paid <b class="num">₹${fmt(a.short)}</b> · Possible duplicates <b class="num">₹${fmt(a.duplicate)}</b></p>
    <p class="sub">From ${st.credits} credits and ${st.bills} bills — matched by rules you can audit on every row, computed in your browser. Nothing was uploaded.</p>
  </div>
  <div class="imp-quality">
    <div><small>Credits read</small><span class="num">${st.credits}</span></div>
    <div><small>Bills read</small><span class="num">${st.bills}</span></div>
    <div><small>Fully matched</small><span class="num">${st.matched}</span></div>
    <div><small>Part-paid</small><span class="num">${st.part}</span></div>
    <div><small>Probable (confirm)</small><span class="num">${st.probable}</span></div>
    <div><small>Exceptions</small><span class="num">${st.exceptions}</span></div>
    <div><small>Unpaid bills</small><span class="num">${st.unpaid}</span></div>
  </div>
  ${res.exceptions.length?`<h4 class="imp-h4">Exceptions</h4><div class="scroll"><table>
    <thead><tr><th>What</th><th>Amount</th><th>Detail</th><th>Row</th></tr></thead><tbody>
    ${res.exceptions.map(e=>`<tr><td><b>${e.type}</b></td><td class="r num">₹${fmt(e.amount)}</td><td>${e.detail}</td><td class="sub">${e.row||""}</td></tr>`).join("")}
    </tbody></table></div>`:""}
  ${res.probable.length?`<h4 class="imp-h4">Probable matches — confirm before applying</h4><div class="scroll"><table>
    <thead><tr><th>Amount</th><th>Detail</th><th>Row</th></tr></thead><tbody>
    ${res.probable.map(e=>`<tr><td class="r num">₹${fmt(e.amount)}</td><td>${e.detail}</td><td class="sub">${e.row||""}</td></tr>`).join("")}
    </tbody></table></div>`:""}
  ${res.overdue.length?`<h4 class="imp-h4">Overdue and unpaid (${res.overdue.length})</h4><div class="scroll"><table>
    <thead><tr><th>Bill</th><th>Customer</th><th class="r">Balance</th><th>Due</th></tr></thead><tbody>
    ${res.overdue.slice(0,15).map(i=>`<tr><td>${esc(i.no)}</td><td>${esc(i.customer)}</td><td class="r num">₹${fmt(i.balance)}</td><td>${esc(i.due||"—")}</td></tr>`).join("")}
    </tbody></table></div>`:""}
  <p style="margin-top:18px"><button class="btn small ghost" id="impDl" type="button">Download exceptions (CSV)</button>
  <span class="sub" style="margin-left:10px">In the product this feeds the same collections, Smart Terms and Profit Ledger you saw in the live demo — on your real data.</span></p>`;
  $id("impDl").addEventListener("click",()=>{
    const lines=["Type,Amount,Detail,Statement row"];
    res.exceptions.forEach(e=>lines.push(`"${e.type}",${Math.round(e.amount)},"${e.detail.replace(/"/g,'""')}",${e.row||""}`));
    res.probable.forEach(e=>lines.push(`"Probable match",${Math.round(e.amount)},"${e.detail.replace(/"/g,'""')}",${e.row||""}`));
    const blob=new Blob([lines.join("\n")],{type:"text/csv"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download="payops-exceptions.csv"; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  });
}
function runNow(){
  IMP.results=runImport(IMP.bank.rows, IMP.inv.rows, IMP.mapB, IMP.mapI);
  renderResults(IMP.results);
}
function handleFile(file, kind){
  if(!file) return;
  readFile(file).then(txt=>{
    const rows=typeof txt==="string"?parseCSV(txt):txt;
    if(!rows.length){ $id(kind==="bank"?"bankInfo":"invInfo").textContent="Couldn't read any rows from this file."; return; }
    setData(kind, file.name, rows);
  }).catch(err=>{
    const el=$id(kind==="bank"?"bankInfo":"invInfo");
    el.textContent=/\.(xlsx|xls)$/i.test(file.name||"")
      ? "XLSX needs the SheetJS library from the CDN — check your connection, or export the sheet as CSV and try again."
      : "Couldn't read this file: "+(err&&err.message?err.message:"");
  });
}
$id("bankFile").addEventListener("change",e=>{ handleFile(e.target.files[0],"bank"); e.target.value=""; });
$id("invFile").addEventListener("change",e=>{ handleFile(e.target.files[0],"inv"); e.target.value=""; });
$id("bankSample").addEventListener("click",()=>setData("bank","sample-statement.csv",parseCSV(SAMPLE_BANK)));
$id("invSample").addEventListener("click",()=>setData("inv","sample-bills.csv",parseCSV(SAMPLE_INV)));
$id("impRun").addEventListener("click",runNow);
document.addEventListener("change",e=>{
  const sel=e.target.closest && e.target.closest("select[data-kind]");
  if(!sel) return;
  const map=sel.dataset.kind==="bank"?IMP.mapB:IMP.mapI;
  map[sel.dataset.field]=sel.value||null;
  const fields=sel.dataset.kind==="bank"?BANK_FIELDS:INV_FIELDS;
  const missing=fields.filter(f=>f.req && !map[f.key]);
  const info=$id(sel.dataset.kind==="bank"?"bankInfo":"invInfo");
  info.textContent=missing.length?("Map the required columns marked *."):(IMP[sel.dataset.kind].rows.length+" rows mapped.");
  if(IMP.bank && IMP.inv && !missing.length) runNow();
});
// expose for automated tests only
window.__payopsImport={parseCSV, runImport, detect, dparse, parseAmount, SAMPLE_BANK, SAMPLE_INV, BANK_FIELDS, INV_FIELDS, IMP};
})();
