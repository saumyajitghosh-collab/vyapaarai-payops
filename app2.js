// ---------- tick ----------
function tick(){
  if(S.paused) return;
  S.minutes += 3; // absolute clock; formatted modulo 24h, never resets, so settlements always come due
  // settlements land
  S.settlements.forEach(s=>{ if(!s.done && S.minutes>=s.due){ s.done=true; S.bank+=s.net; } });
  // refunds leave
  const rdy = S.refundQueue.filter(r=>S.minutes>=r.due);
  S.refundQueue = S.refundQueue.filter(r=>S.minutes<r.due);
  rdy.forEach(r=>{ S.bank -= r.amount; S.refundsPaid += r.amount; });
  // retries succeed
  const ready = S.retries.filter(r=>S.minutes>=r.at); S.retries = S.retries.filter(r=>S.minutes<r.at);
  ready.forEach(r=>{ const t={time:S.minutes,channel:r.channel,vpa:r.vpa,amount:r.amount,remark:r.remark||"",failed:false,retried:!r.early,early:!!r.early}; S.txns.push(t); match(t); t.isNew=true; });
  // new payment(s)
  const n = rand()<0.25?2:1;
  for(let k=0;k<n;k++){ const t=generate(); S.txns.push(t); match(t); t.isNew=true; }
  render();
}

// ---------- render ----------
const stampFor = s => ({MATCHED:["ok","Matched"],PARTIAL:["info","Part-paid"],DUPLICATE:["bad","Duplicate"],UNIDENTIFIED:["bad","Unknown"],SHORT:["warn","Short"],FAILED:["bad","Failed"],REFUND:["warn","Refund"]}[s]||["info",s]);
const hhmm = m => String(Math.floor(m/60)%24).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
let activeTab="feed";

function render(){
  $("clock").textContent = hhmm(S.minutes);
  $("kReceived").textContent = inr(S.received);
  const valid = S.txns.filter(t=>!t.failed).length;
  $("kMatched").textContent = valid ? Math.round(100*S.matchedCount/valid)+"%" : "0%";
  const openExc = S.exceptions.filter(e=>e.open);
  $("kExc").textContent = openExc.length; $("excCount").textContent = openExc.length;
  $("kOverdue").textContent = inr(invoices.filter(i=>i.due<0).reduce((s,i)=>s+i.balance,0));
  $("kPending").textContent = inr(S.settlements.filter(s=>!s.done).reduce((a,s)=>a+s.net,0));

  if(activeTab==="feed"){
    $("feedBody").innerHTML = S.txns.slice(-40).reverse().map(t=>{
      const [cls,label]=stampFor(t.status); const nw=t.isNew; t.isNew=false;
      return `<tr class="${nw?"new":""}"><td class="num">${hhmm(t.time)}</td>
        <td>${esc(custName(t))}<div class="sub">${esc(t.vpa)}${t.remark?", remark “"+esc(t.remark)+"”":""}</div></td>
        <td>${esc(t.channel)}${t.early?'<div class="sub">early-pay offer accepted</div>':t.retried?'<div class="sub">after retry link</div>':""}</td>
        <td class="r num">${inr(t.amount)}</td>
        <td>${t.inv?esc(t.inv):"—"}<div class="sub">${esc(t.rule||"")}</div></td>
        <td><span class="stamp ${cls}">${label}</span></td></tr>`;
    }).join("") || `<tr><td colspan="6" class="empty">Waiting for the first payment of the day.</td></tr>`;
  }
  if(activeTab==="exc"){
    const list = [...openExc].reverse();
    const done = S.exceptions.filter(e=>!e.open).length;
    $("excList").innerHTML = (list.length ? list.map(e=>{
      const [cls]=stampFor(e.txn.status);
      return `<div class="exc"><span class="stamp ${cls}">${esc(e.type)}</span>
        <div>${esc(e.detail)}<div class="sub">${hhmm(e.at)} via ${esc(e.txn.channel)}. Rule: ${esc(e.txn.rule)}</div></div>
        <div class="acts">${e.actions.map((a,i)=>`<button class="btn small ${i?"ghost":""}" data-exc="${e.id}" data-act="${i}" type="button">${esc(a.label)}</button>`).join("")}</div></div>`;
    }).join("") : `<p class="empty">No open exceptions. Everything that came in is matched or handled.</p>`)
    + (done?`<p class="sub" style="margin-top:12px">${done} handled so far today.</p>`:"");
  }
  if(activeTab==="coll") renderCollections();
  if(activeTab==="opps") renderOpps();
  if(activeTab==="fees") renderFees();
  // profit ledger strip
  const recov = S.txns.filter(t=>!t.failed && (t.early || t.retried)).reduce((a,t)=>a+t.amount,0);
  const prot = S.txns.filter(t=>t.status==="DUPLICATE").reduce((a,t)=>a+t.amount,0);
  const scheme = S.schemeClaimed ? 0 : (CONFIG.SCHEME.qualified - CONFIG.SCHEME.received);
  $("profitStrip").innerHTML = `<b>PayOps effect today:</b> <span class="num">${inr(recov)}</span> recovered (retry links + early-pay offers) · <span class="num">${inr(prot)}</span> duplicate value protected · <span class="num">${inr(scheme)}</span> supplier scheme unclaimed`;
  $("oppCount").textContent = oppRows().length;
}

function overdueByCustomer(){
  const map = {};
  invoices.filter(i=>i.due<0 && i.balance>0).forEach(i=>{
    (map[i.cust] ||= {c:customers[i.cust], invs:[], total:0, oldest:0});
    const m=map[i.cust]; m.invs.push(i); m.total+=i.balance; m.oldest=Math.max(m.oldest,-i.due);
  });
  return Object.values(map).sort((a,b)=>b.total-a.total);
}
const langName = {kn:"Kannada",hi:"Hindi",en:"English"};
function renderCollections(){
  const od = invoices.filter(i=>i.due<0 && i.balance>0);
  const b = [[1,15],[16,30],[31,60],[61,999]].map(([lo,hi])=>od.filter(i=>-i.due>=lo && -i.due<=hi).reduce((s,i)=>s+i.balance,0));
  $("aging").innerHTML = ["1–15 days","16–30 days","31–60 days","60+ days"].map((l,k)=>`<div><small class="sub">${l}</small><div class="num">${inr(b[k])}</div></div>`).join("");
  $("collBody").innerHTML = overdueByCustomer().map(m=>`<tr><td>${esc(m.c.name)}</td><td class="r num">${m.invs.length}</td><td class="r num">${inr(m.total)}</td><td class="r num">${m.oldest}d</td><td>${langName[m.c.lang]}</td>
    <td class="r" style="white-space:nowrap"><button class="btn small ghost" data-early="${m.c.id}" type="button" title="Offer a small discount for payment today">Early pay</button> <button class="btn small ghost" data-draft="${m.c.id}" type="button">${m.invs.every(i=>i.reminded)?"Reminded":"Remind"}</button></td></tr>`).join("")
    || `<tr><td colspan="6" class="empty">No overdue bills.</td></tr>`;
  smartInvoice();
}
function reminderText(m){
  const inv = m.invs.sort((a,b)=>a.due-b.due)[0];
  const link = `upi://pay?pa=${CONFIG.MERCHANT_VPA}&pn=${encodeURIComponent(CONFIG.MERCHANT)}&am=${m.total}&cu=INR&tn=${inv.id}`;
  const amt = inr(m.total), days = -inv.due, n=m.invs.length;
  const t = {
    en:`Hi ${m.c.name}, this is ${CONFIG.MERCHANT}. ${n} bill${n>1?"s":""} totalling ${amt} ${n>1?"are":"is"} pending, the oldest (${inv.id}) by ${days} days. Pay by UPI here:`,
    hi:`नमस्ते ${m.c.name} जी, ${CONFIG.MERCHANT} की ओर से। आपके ${n} बिल, कुल ${amt}, बकाया हैं। सबसे पुराना बिल (${inv.id}) ${days} दिन से बाकी है। UPI से भुगतान करें:`,
    kn:`ನಮಸ್ಕಾರ ${m.c.name}, ${CONFIG.MERCHANT} ಇಂದ. ನಿಮ್ಮ ${n} ಬಿಲ್‌ಗಳ ಒಟ್ಟು ${amt} ಬಾಕಿ ಇದೆ. ಹಳೆಯ ಬಿಲ್ (${inv.id}) ${days} ದಿನಗಳಿಂದ ಬಾಕಿ. UPI ಮೂಲಕ ಪಾವತಿಸಿ:`
  }[m.c.lang];
  return {t, link};
}
function draftFor(ids){
  const all = overdueByCustomer().filter(m=>ids.includes(m.c.id));
  signals.actions++;
  $("drafts").innerHTML = all.map(m=>{ const {t,link}=reminderText(m); m.invs.forEach(i=>i.reminded=true);
    return `<div class="draft"><div class="to">To ${esc(m.c.name)} (${langName[m.c.lang]})</div>${esc(t)}<br><code>${esc(link)}</code></div>`; }).join("")
    + (all.length?`<p class="sub" style="grid-column:1/-1">In the product these go out from your WhatsApp Business number after you approve. Nothing is sent from this demo.</p>`:"");
  renderCollections();
}
// ---------- Smart Terms (early-payment offers sized against cost of funds) ----------
function earlySurplus(inv){ return inv.balance * (CONFIG.SMART_TERMS.financeRate/365) * Math.max(1, -inv.due); }
function offerDiscount(inv){ return Math.max(1, Math.round(Math.min(earlySurplus(inv)*CONFIG.SMART_TERMS.buyerShare, inv.balance*CONFIG.SMART_TERMS.maxDiscountPct))); }
function sendEarlyOffer(custId){
  const m = overdueByCustomer().find(x=>x.c.id===custId); if(!m) return;
  const inv = m.invs.find(i=>!i.earlyOffered); if(!inv) return;
  inv.earlyOffered = true; inv._discount = offerDiscount(inv);
  S.earlySurplus += earlySurplus(inv);
  signals.actions++;
  // In the product the customer gets this on WhatsApp; here the acceptance is simulated: the discounted payment arrives shortly, matched to this invoice by its remark.
  S.retries.push({at:S.minutes + 8 + Math.floor(rand()*15), vpa:m.c.vpa, amount:inv.balance-inv._discount, channel:pick(["PhonePe","Google Pay","Paytm"]), remark:inv.id, early:true});
  render();
}
function smartInvoice(){
  const od = overdueByCustomer();
  const m = od.find(x=>x.invs.some(i=>i.earlyOffered)) || od[0];
  if(!m){ $("smartInvoice").innerHTML=""; return; }
  const inv = m.invs.find(i=>i.earlyOffered) || m.invs[0];
  const days = -inv.due;
  if(!inv.earlyOffered){
    const d = offerDiscount(inv);
    const link = `upi://pay?pa=${CONFIG.MERCHANT_VPA}&pn=${encodeURIComponent(CONFIG.MERCHANT)}&am=${inv.balance-d}&cu=INR&tn=${inv.id} early`;
    $("smartInvoice").innerHTML = `<div class="smart">
      <div class="s-head"><b>SMART INVOICE</b><span class="sub">${esc(inv.id)} · ${esc(m.c.name)} · due ${days} day${days===1?"":"s"} ago</span></div>
      <div class="s-amt">${inr(inv.balance)}</div>
      <p class="sub">Getting this paid today instead of leaving it outstanding is worth about <b>${inr(earlySurplus(inv))}</b> to you in avoided financing cost at ${CONFIG.SMART_TERMS.financeRate*100}% p.a. PayOps splits that surplus: the customer saves, you still gain, PayOps charges ${inr(CONFIG.SMART_TERMS.payopsFee)} only if the offer is accepted.</p>
      <div class="s-btns">
        <button class="btn small" data-early="${m.c.id}" type="button">Send offer — pay ${inr(inv.balance-d)} today, save ${inr(d)}</button>
        <a class="btn small ghost" href="${link}">UPI link</a>
        <button class="btn small ghost" data-time="${m.c.id}" type="button" title="In the product this routes to partner banks/NBFCs — never PayOps money">Need more time?</button>
      </div></div>`;
  } else {
    $("smartInvoice").innerHTML = `<div class="smart">
      <div class="s-head"><b>SMART INVOICE</b><span class="sub">${esc(inv.id)} · ${esc(m.c.name)}</span></div>
      <p class="sub" style="margin-top:6px">Offer sent: pay <b>${inr(inv.balance-inv._discount)}</b> today and save <b>${inr(inv._discount)}</b> (surplus to you ≈ ${inr(earlySurplus(inv))}, PayOps fee ${inr(CONFIG.SMART_TERMS.payopsFee)} only if accepted). "Need more time?" routes to partner financing — regulated lenders only, never PayOps's balance sheet.</p></div>`;
  }
}

// ---------- Opportunities ----------
function oppRows(){
  const rows = [];
  overdueByCustomer().filter(m=>m.invs.some(i=>!i.earlyOffered)).slice(0,4).forEach(m=>{
    const inv = m.invs.find(i=>!i.earlyOffered);
    rows.push({type:"Early payment", who:`${esc(m.c.name)} · ${inv.id}`, detail:`Offer a small discount to collect ${inr(inv.balance)} today — worth about ${inr(earlySurplus(inv))} in avoided financing cost.`, value:earlySurplus(inv), label:"Offer early pay", action:"offer:"+m.c.id});
  });
  const failed = S.exceptions.filter(e=>e.open&&e.txn.failed);
  if(failed.length) rows.push({type:"Failed payments", who:`${failed.length} customer${failed.length>1?"s":""} tried to pay`, detail:"Retry links recover most failed payments within the hour.", value:failed.reduce((a,e)=>a+e.txn.amount,0), label:"Send retry links", action:"retryAll"});
  const dups = S.exceptions.filter(e=>e.open&&e.txn.status==="DUPLICATE");
  if(dups.length) rows.push({type:"Possible duplicates", who:`${dups.length} double payment${dups.length>1?"s":""}`, detail:"Same payer, same amount, minutes apart. Refunding keeps customers trusting the machine.", value:dups.reduce((a,e)=>a+e.txn.amount,0), label:"Mark for refund", action:"refundAll"});
  if(!S.schemeClaimed) rows.push({type:"Supplier scheme", who:"Q3 volume + fast-pay schemes", detail:`Qualified ${inr(CONFIG.SCHEME.qualified)} against credit notes received ${inr(CONFIG.SCHEME.received)}. PayOps assembles the claim package from your invoices and circulars.`, value:CONFIG.SCHEME.qualified-CONFIG.SCHEME.received, label:"Generate claim", action:"claim"});
  const fees = feeRows(); const totFee = Object.values(fees).reduce((a,r)=>a+r.f,0);
  if(totFee>0) rows.push({type:"Payment cost", who:"Today's acceptance cost", detail:`${inr(totFee)} so far${S.mdr?" (includes the confirmed UPI MDR).":" — turn on the UPI MDR toggle to see the 15-Oct impact."} Standard vs accelerated settlement should follow your cash position.`, value:totFee, label:"Open Fees", action:"feesTab"});
  return rows;
}
function renderOpps(){
  const rows = oppRows();
  $("oppList").innerHTML = rows.length ? rows.map(o=>`<div class="opp"><div class="o-type">${o.type}<small>${o.who}</small></div><div>${o.detail}</div><div class="r"><div class="num">${inr(o.value)}</div><button class="btn small" data-opp="${o.action}" type="button">${o.label}</button></div></div>`).join("") : `<p class="empty">Nothing actionable right now — everything is matched, collected or handled.</p>`;
}

function feeRows(){
  const rows = {};
  S.txns.filter(t=>!t.failed).forEach(t=>{ const r=(rows[t.channel] ||= {n:0,v:0,f:0}); r.n++; r.v+=t.amount; r.f+=feeFor(t.channel,t.amount); });
  return rows;
}
function renderFees(){
  const rows = feeRows(); let N=0,V=0,F=0;
  $("feesBody").innerHTML = Object.entries(rows).sort((a,b)=>b[1].v-a[1].v).map(([ch,r])=>{ N+=r.n;V+=r.v;F+=r.f;
    return `<tr><td>${esc(ch)}</td><td class="r num">${r.n}</td><td class="r num">${inr(r.v)}</td><td class="r num">${inr(r.f)}</td><td class="r num">${r.v?(100*r.f/r.v).toFixed(2):"0.00"}%</td></tr>`; }).join("")
    + `<tr><td><b>Total</b></td><td class="r num"><b>${N}</b></td><td class="r num"><b>${inr(V)}</b></td><td class="r num"><b>${inr(F)}</b></td><td class="r num"><b>${V?(100*F/V).toFixed(2):"0.00"}%</b></td></tr>`;
}

// ---------- Ask PayOps (deterministic answers computed from the ledger) ----------
const chipsQ = ["Aaj kitna business hua?","Who hasn't paid me?","What isn't matched yet?","How much did payment fees cost?","Can I pay salaries of ₹3.5 lakh on Friday?"];
function answer(q){
  const s = q.toLowerCase();
  const valid=S.txns.filter(t=>!t.failed);
  if(/kitna|business|today|aaj|kal|received|collection/.test(s)){
    const um = S.exceptions.filter(e=>e.open && !e.txn.failed).reduce((a,e)=>a+e.txn.amount,0);
    const pend = S.settlements.filter(x=>!x.done);
    return `So far today (${hhmm(S.minutes)}): ${inr(S.received)} across ${valid.length} payments.<ul><li>${inr(um)} is not matched to a bill yet</li><li>${pend.length} gateway settlement${pend.length===1?"":"s"} worth ${inr(pend.reduce((a,x)=>a+x.net,0))} still to reach the bank</li><li>${S.exceptions.filter(e=>e.open&&e.txn.failed).length} failed payment${S.exceptions.filter(e=>e.open&&e.txn.failed).length===1?"":"s"} waiting for a retry link</li></ul>`;
  }
  if(/paid|owe|due|baaki|pending|overdue|unpaid|collect/.test(s)){
    const od=overdueByCustomer(); const tot=od.reduce((a,m)=>a+m.total,0);
    const over30 = invoices.filter(i=>i.due<-30&&i.balance>0).length;
    return `${od.length} customers owe you ${inr(tot)} on overdue bills, ${over30} of them past 30 days. Largest:<ul>${od.slice(0,3).map(m=>`<li>${esc(m.c.name)}: ${inr(m.total)}, oldest ${m.oldest} days</li>`).join("")}</ul>Open Collections to draft reminders.`;
  }
  if(/match|reconcil|exception|mismatch|unknown|duplicate/.test(s)){
    const o=S.exceptions.filter(e=>e.open); const by={}; o.forEach(e=>by[e.type]=(by[e.type]||0)+1);
    return o.length ? `${o.length} open exception${o.length>1?"s":""}:<ul>${Object.entries(by).map(([k,v])=>`<li>${v} × ${esc(k)}</li>`).join("")}</ul>Every other payment was matched by a rule shown on its row.${S.advances||S.unallocated?` Held outside bills: ${inr(S.advances)} as customer advances, ${inr(S.unallocated)} unallocated.`:""}` : "Everything is matched right now.";
  }
  if(/opportunit|money|surplus|recover|save/.test(s)){
    const rows=oppRows(); const tot=rows.reduce((a,r)=>a+r.value,0);
    return rows.length?`₹${Math.round(tot).toLocaleString("en-IN")} of actionable value right now:<ul>${rows.slice(0,3).map(r=>`<li>${r.type} (${esc(r.who)}): ${inr(r.value)}</li>`).join("")}</ul>Open the Opportunities tab to act on them.`:"Nothing actionable right now — everything is matched, collected or handled.";
  }
  if(/fee|charge|mdr|cost/.test(s)){
    const rows=feeRows(); let V=0,F=0; Object.values(rows).forEach(r=>{V+=r.v;F+=r.f});
    const top=Object.entries(rows).sort((a,b)=>b[1].f-a[1].f)[0];
    return `Payment acceptance cost today is ${inr(F)}, or ${V?(100*F/V).toFixed(2):"0.00"}% of what came in.${top&&top[1].f>0?` ${esc(top[0])} is the largest share at ${inr(top[1].f)}.`:""}${S.mdr?" This includes the confirmed UPI MDR effective 15 Oct 2026: 0.4% above ₹2,000, capped at ₹300.":" Turn on the UPI MDR toggle at the top of the console to see what the confirmed 0.4% charge above ₹2,000 will cost you from 15 October."} Card and gateway rates here are illustrative.`;
  }
  if(/salar|cash|afford|pay .*friday|lakh/.test(s)){
    const need = (s.match(/([\d.]+)\s*lakh/)||[])[1] ? parseFloat(s.match(/([\d.]+)\s*lakh/)[1])*100000 : 350000;
    const pend = S.settlements.filter(x=>!x.done).reduce((a,x)=>a+x.net,0);
    const dueSoon = invoices.filter(i=>i.balance>0 && i.due>=-7 && i.due<=3).reduce((a,i)=>a+i.balance,0);
    const expected = S.bank + pend + dueSoon*0.6 - S.refundQueue.reduce((a,r)=>a+r.amount,0);
    return `Bank balance ${inr(S.bank)}, settlements on the way ${inr(pend)}, refunds pending ${inr(S.refundQueue.reduce((a,r)=>a+r.amount,0))}, and bills due around now of ${inr(dueSoon)} (counting 60% as likely to arrive). That's about ${inr(expected)} against ${inr(need)} needed, so ${expected>=need*1.15?"you're covered with room to spare.":expected>=need?"you're covered, but only just. Chase the largest overdue customers first.":"you'll be short by roughly "+inr(need-expected)+". Chasing the top 3 overdue customers would close most of that."}`;
  }
  return "In this demo I can answer questions about today's collections, who owes you, unmatched payments, fees, and whether cash covers a payment. Try one of the suggestions below.";
}
function say(who, html){ const d=document.createElement("div"); d.className="bubble "+who; d.innerHTML=html; $("chatLog").appendChild(d); $("chatLog").scrollTop=1e9; }
$("chips").innerHTML = chipsQ.map(q=>`<button type="button">${esc(q)}</button>`).join("");
$("chips").addEventListener("click",e=>{ if(e.target.tagName==="BUTTON"){ ask(e.target.textContent); }});
$("askForm").addEventListener("submit",e=>{ e.preventDefault(); const v=$("askInput").value.trim(); if(v){ ask(v); $("askInput").value=""; }});
function ask(q){ signals.asks++; say("me", esc(q)); setTimeout(()=>say("bot", answer(q)), 350); }
say("bot","Ask me about today's payments. Answers are calculated from the demo ledger, not made up.");

// ---------- events ----------
document.querySelector(".tabs").addEventListener("click",e=>{
  const b=e.target.closest("button[data-tab]"); if(!b) return;
  document.querySelectorAll(".tabs button").forEach(x=>x.setAttribute("aria-selected", x===b?"true":"false"));
  document.querySelectorAll(".pane").forEach(p=>p.hidden = p.id!=="pane-"+b.dataset.tab);
  activeTab=b.dataset.tab; signals.tabs.add(activeTab); render();
});
$("excList").addEventListener("click",e=>{ const b=e.target.closest("button[data-exc]"); if(b) resolve(b.dataset.exc, +b.dataset.act); });
$("collBody").addEventListener("click",e=>{ const b=e.target.closest("button[data-draft]"); if(b) draftFor([+b.dataset.draft]); const eb=e.target.closest("button[data-early]"); if(eb) sendEarlyOffer(+eb.dataset.early); });
$("smartInvoice").addEventListener("click",e=>{
  const eb=e.target.closest("button[data-early]"); if(eb) sendEarlyOffer(+eb.dataset.early);
  const tb=e.target.closest("button[data-time]");
  if(tb) $("smartInvoice").innerHTML = `<div class="smart"><p class="sub" style="margin:6px 0">In the product, “need more time?” opens partner financing: regulated banks/NBFCs under RBI digital-lending rules (the lender pays PayOps a fee; funds never touch PayOps), or the customer simply pays via their own RuPay credit card linked to UPI and uses the card's 30–45 day float. PayOps never lends its own money.</p></div>`;
});
$("oppList").addEventListener("click",e=>{
  const b=e.target.closest("button[data-opp]"); if(!b) return;
  const a=b.dataset.opp;
  if(a.startsWith("offer:")) sendEarlyOffer(+a.split(":")[1]);
  if(a==="retryAll") S.exceptions.filter(x=>x.open&&x.txn.failed).forEach(x=>resolve(x.id,0));
  if(a==="refundAll") S.exceptions.filter(x=>x.open&&x.txn.status==="DUPLICATE").forEach(x=>resolve(x.id,0));
  if(a==="feesTab") document.querySelector('[data-tab="fees"]').click();
  if(a==="claim"){ S.schemeClaimed=true; signals.actions++; render(); }
});
$("draftAllBtn").addEventListener("click",()=>draftFor(overdueByCustomer().map(m=>m.c.id)));
$("pauseBtn").addEventListener("click",()=>{ S.paused=!S.paused; $("pauseBtn").textContent=S.paused?"Resume":"Pause"; $("liveDot").classList.toggle("paused",S.paused); $("liveDot").textContent=S.paused?"Paused":"Live"; });
$("speedBtn").addEventListener("click",()=>{ S.speed = S.speed===1?3:S.speed===3?6:1; $("speedBtn").textContent="Speed "+S.speed+"×"; restartTimer(); });
$("mdrToggle").addEventListener("change",e=>{ S.mdr=e.target.checked; signals.actions++; render(); });

let timer; function restartTimer(){ clearInterval(timer); timer=setInterval(tick, CONFIG.TICK_MS/S.speed); }
for(let k=0;k<6;k++){ S.minutes+=3; const t=generate(); S.txns.push(t); match(t); }
render(); restartTimer();

// pricing intent
document.querySelectorAll("[data-tier]").forEach(b=>b.addEventListener("click",()=>{
  signals.tierClicks.push(b.dataset.tier); $("tierSelect").value=b.dataset.tier;
  document.getElementById("access").scrollIntoView({behavior:"smooth"}); setTimeout(()=>document.querySelector("#wlForm input[name=name]").focus({preventScroll:true}),500);
}));

// UPI checkout
function openPay(key){
  const p = CONFIG.PAY.PLANS[key]; if(!p) return;
  signals.tierClicks.push("PAY-CLICK "+p.label);
  $("pmTitle").textContent = p.label + " — first month";
  $("pmPlan").textContent = p.desc;
  $("pmAmount").textContent = inr(p.amount);
  $("pmUpiId").textContent = CONFIG.PAY.UPI_ID;
  $("pmQR").src = p.qr;
  $("pmLink").href = `upi://pay?pa=${encodeURIComponent(CONFIG.PAY.UPI_ID)}&pn=${encodeURIComponent(CONFIG.PAY.PAYEE_NAME)}&am=${p.amount}&cu=INR&tn=${encodeURIComponent(p.note)}`;
  if(CONFIG.PAY.WHATSAPP) $("pmContact").textContent = "+" + CONFIG.PAY.WHATSAPP.replace(/^\+/,"");
  $("payModal").hidden = false; $("pmClose").focus();
}
document.querySelectorAll("[data-pay]").forEach(b=>b.addEventListener("click",()=>openPay(b.dataset.pay)));
$("pmClose").addEventListener("click",()=>{ $("payModal").hidden = true; });
$("payModal").addEventListener("click",e=>{ if(e.target.id==="payModal") $("payModal").hidden = true; });
document.addEventListener("keydown",e=>{ if(e.key==="Escape") $("payModal").hidden = true; });

// ---------- waitlist ----------
$("wlForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const f=e.target, msg=$("formMsg"), data=Object.fromEntries(new FormData(f).entries());
  if(data.company_url) return; // bot trap
  if(!data.name.trim() || !/^[+\d\s-]{10,15}$/.test(data.whatsapp.trim())){ msg.className="formmsg bad"; msg.textContent="Add your name and a 10-digit WhatsApp number so we can reach you."; return; }
  delete data.company_url;
  data.demo_tabs=[...signals.tabs].join(","); data.demo_actions=signals.actions; data.demo_questions=signals.asks; data.tier_clicks=signals.tierClicks.join(","); data.page=location.href; data.submitted_at=new Date().toISOString();
  $("wlSubmit").disabled=true;
  if(CONFIG.FORM_ENDPOINT){
    try{
      const r = await fetch(CONFIG.FORM_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(data)});
      if(!r.ok) throw new Error(r.status);
      msg.className="formmsg ok"; msg.textContent="Request received. We'll message you on WhatsApp within two working days."; f.reset();
    }catch(err){ msg.className="formmsg bad"; msg.textContent="Your request didn't go through. Check your connection and select Request early access again."; }
    $("wlSubmit").disabled=false; return;
  }
  if(CONFIG.CONTACT_EMAIL){
    const body = Object.entries(data).map(([k,v])=>`${k}: ${v}`).join("\n");
    location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent("PayOps early access: "+data.business)}&body=${encodeURIComponent(body)}`;
    msg.className="formmsg ok"; msg.textContent="Your email app has opened with your details. Send it to finish your request.";
  } else {
    msg.className="formmsg bad"; msg.textContent="Sign-ups aren't connected yet. Site owner: set FORM_ENDPOINT or CONTACT_EMAIL in the CONFIG block.";
  }
  $("wlSubmit").disabled=false;
});
