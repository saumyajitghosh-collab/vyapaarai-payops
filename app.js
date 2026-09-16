/* ============ CONFIG: edit these before deploying ============ */
const CONFIG = {
  BRAND: "VyapaarAI PayOps",
  MERCHANT: "Shree Balaji Distributors",
  MERCHANT_VPA: "shreebalaji@demo",
  // Formspree (https://formspree.io) endpoint e.g. "https://formspree.io/f/abcdwxyz". Leave "" to fall back to email.
  FORM_ENDPOINT: "",
  // Used if FORM_ENDPOINT is empty: opens the visitor's email app with the details filled in.
  CONTACT_EMAIL: "",
  // Illustrative fee rates (fraction). Not real provider pricing.
  FEES: { "PhonePe":0, "Google Pay":0, "Paytm":0, "BHIM":0, "Razorpay":0.02, "Card POS":0.018, "NEFT":0 },
  // Confirmed NPCI MDR framework, effective 15 October 2026: 0.4% on P2M UPI above ₹2,000, capped at ₹300 for ₹75,000+. P2P and sub-₹2,000 payments stay free.
  MDR_SCENARIO: { rate:0.004, above:2000, cap:300 },
  // Smart Terms: early-payment offers sized against the merchant's cost of funds.
  SMART_TERMS: { financeRate:0.18, buyerShare:0.5, maxDiscountPct:0.02, payopsFee:95 },
  // Money Finder: illustrative supplier-scheme position for the demo (₹).
  SCHEME: { qualified:83450, received:51200 },
  // Where customers pay. The QR codes below are generated for exactly these UPI intent links.
  PAY: {
    UPI_ID: "9836296103@upi",
    PAYEE_NAME: "VyapaarAI PayOps",
    // Your WhatsApp number for payment confirmations, e.g. "919836296104". Shown in the payment dialog.
    WHATSAPP: "",
    PLANS: {
      reconcile:   { label:"Reconcile", amount:999, note:"PayOps Reconcile 1mo",
                     desc:"One bank account, up to 3 payment apps, automatic matching to bills, daily WhatsApp summary.",
                     qr:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWgAAAFoAQAAAABSnlx4AAAC00lEQVR4nO2bwW7kMAxDySL//8vcAyXZcylQTDqVNp6iRZC+A6ERZFqyKfzg8/UT+NCH/nP6AugnERBFARQoAKBfJNFI91T6AuDQAiJExxiOuiiCKqKP7qn0BTjWiLSOCGd+w9kdRB/dU+lrPWYSO7cpASDEDyl5Br3Fm6Kc3hV7xZ9PKHkGfQERXShy2dUbleCLaKR7Kg1l+uqbn0T76J5KX1jhZFVwrNVSXEQj3VNpWxGviQ54em4HOaJPh72P7qk0JEiCttIhSZBLjV7e9tE9lb6A2uGE836xJIyvgb+u5Dm0ACjqNCHZocgWRQDJ+Ap66Z5LexsPSkLsNbOmxw5IH1Lyv9NwiBGBjkKeNVxVvv2uj+6pNAUiO1RpSnIbL1aVAY4/uYlWxDaiSodYkI2huBx4K91j6Qy3CEaKq0x3fs56eQt9IfY5DjPDG3KtkdUv/GUlz6CxLImXxGxe1UNue856eRctgf4Vw4FXF0Uxa3AN76V7LM0McHZLwoLXYy6YzXTPpNewEtXyToMouKLzI0oeQFN7Im8unNhasTz+5F6akEhPhrmOSMSwmFnR2+keR9c8jeX/lg1k7i1z39lH92Da+xwf9IlVUyRArs6Kd0O9dI+kI79VVUR1+iTHa1rjnj66p9KQqgFY8+GY9+TzIvvonkp7Pw9tpkRpWqKZohxlnv7g+/SVJjBmOszjJ26lROMkv5A+uqfS7o5UBxY5IobqVfVSTj15n2a6Pm2zBv/Dqe6mbFB9dE+l83yVMslrpqZ6l+DJ7/dpan+MyQNyC1Qnf3j6VffQ2/0GpBUR3KXKt1V0GumeSu/3G157V/GoHGceP3gHvd9vANJ++4xVtq7cQTn9qvtpN61UN3ZqzYwy01X3SLou7cQdB0p57sTnIprqnkfnGavt9PFqm7gn685hM90D6QtlUKqLkoc1GXdMhFNP7qI3//3HSg596Pvpf3bc1C+Ae/mqAAAAAElFTkSuQmCC" },
      reconcollect: { label:"Reconcile + Collect", amount:2499, note:"PayOps Recon+Collect 1mo",
                     desc:"Everything in Reconcile, plus reminders in Kannada/Hindi/Tamil/English, settlement and fee tracking, and Ask PayOps on WhatsApp.",
                     qr:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWgAAAFoAQAAAABSnlx4AAAC00lEQVR4nO1bwW7dMAwjh/z/L3MHkXK2w4YC7ip3bl/R1OGBUAWakmwKH/j68RHwRV/0l6MfgPUkUATqRwDAWtJCzOF9KvoBUMEFVU8QBdazoF7nJN6noh8AYMc8UYZACaAorTdzeH8LdPZOloKQBEV+AZNvi37WowhrtRJi4R3tSbxPRT/AymuIEAEKJd2gt059PpP/Aw0l2PrDd6BzeJ+Kfl7ZDUW6uVbeAR/E+1Q0hZhtW8BISL17ybom8T4VbT8oiiJFWL1T6NS/g7h+cBtacLjLc0slKg4zRULWlFG8j0Q/QOr4pSZVYKL8Sup53np+D9q5XDod6baGC6DXdfV7AxoqrVB+e0Favltlx68f3IB2fbm2RoBRFdBtK1pZBvE+Gh37IYByOpOV9FVu2iwO430qunKYIonS7ip6aPudJJ/G+0B0CbU/lduCH4XIe17O4X0qmsKqaKzWywyihw+V5XN4n4r2flkh945JD9cs51TGPIN4n4pu+1d/WExcT7aU+O3Vkx1oZkgpucok2aJOyOX9ze8NaAuI0rLKJNP9lDhzA+fwPhWdvdLe22U8O8KA24cA7365BV2FDd0o9Ky4XHjb8dKUWbyPRUusdlV5FHnC00Me2qNM430s2spNZDjcDpDVEo/iDON9INrGO52q1+7I9uAePdx4b0Ink11SuosixrD06bZhvE9EszuxNeNJZFeu2yne+c5GdA5oCqpTbLUKd8CVU23TeJ+HftBp3TmeZngmxgC8Pof3qWh0qwTpzSqfX2C4/dgdaK6opi2Y45pW9pSen83k/0C/7je4nqxpWslKDian0J/D+1T0635Dzg+qeynsvvj1g5vQv99vyFlBekrch++vH9yO7uskfWdnlfd3Pr8fnaPHRB2D4LsMuvX8PnQPzIglJjmxqVx7uPfTNqAftEFJFvflnRoWV/1z+1V70NTfMf+GyUVf9H70TyfDvWfQJTflAAAAAElFTkSuQmCC" }
    }
  },
  TICK_MS: 1500
};
/* ============================================================== */

document.getElementById("brandName").textContent = CONFIG.BRAND;
document.getElementById("merchantName").textContent = CONFIG.MERCHANT;

// theme
(function(){
  const btn=document.getElementById("themeBtn");
  btn.addEventListener("click",()=>{
    const cur=document.documentElement.getAttribute("data-theme");
    const sysDark=matchMedia("(prefers-color-scheme: dark)").matches;
    const next = cur ? (cur==="dark"?"light":"dark") : (sysDark?"light":"dark");
    document.documentElement.setAttribute("data-theme",next);
    try{localStorage.setItem("payops-theme",next)}catch(e){}
  });
  try{const t=localStorage.getItem("payops-theme"); if(t) document.documentElement.setAttribute("data-theme",t)}catch(e){}
})();

const signals = { tabs:new Set(), actions:0, asks:0, tierClicks:[] };

// ---------- helpers ----------
let seed = 20260916;
function rand(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }
const pick = a => a[Math.floor(rand()*a.length)];
const inr = n => "₹" + Math.round(n).toLocaleString("en-IN");
const esc = s => String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = id => document.getElementById(id);

// ---------- synthetic world ----------
const customers = [
  ["Rajesh Kirana Stores","rajeshkirana@ybl","kn"],["Sri Lakshmi Traders","srilakshmi.traders@okaxis","kn"],
  ["Gupta General Store","guptags@paytm","hi"],["Fresh Mart Indiranagar","freshmart.blr@okicici","en"],
  ["Annapoorna Provisions","annapoorna@ibl","kn"],["Sharma Super Bazaar","sharmabazaar@ybl","hi"],
  ["Nandini Mini Mart","nandinimart@okhdfcbank","kn"],["Royal Stores","royalstores@paytm","en"],
  ["Venkateshwara Agencies","venkyagencies@okaxis","kn"],["Agarwal Traders","agarwaltraders@ibl","hi"],
  ["Daily Needs Whitefield","dailyneeds.wf@ybl","en"],["Mahalakshmi Stores","mahalakshmi.st@okicici","kn"],
  ["Kaveri Provision Centre","kaveriprov@ybl","kn"],["Singh Brothers","singhbros@okaxis","hi"]
].map(([name,vpa,lang],i)=>({id:i,name,vpa,lang}));
const custByVpa = Object.fromEntries(customers.map(c=>[c.vpa,c]));

let invSeq = 4401;
const invoices = [];
function newInvoice(c, dueOffset){
  const amt = Math.round((1800 + rand()*42000)/10)*10;
  const inv = {id:"INV-"+(invSeq++), cust:c.id, amount:amt, balance:amt, due:dueOffset, reminded:false};
  invoices.push(inv); return inv;
}
customers.forEach(c=>{ const n=2+Math.floor(rand()*3); for(let k=0;k<n;k++) newInvoice(c, Math.round(-70 + rand()*84)); });

const channels = ["PhonePe","Google Pay","PhonePe","Paytm","Google Pay","BHIM","Razorpay","Card POS","NEFT"];
const isGateway = ch => ch==="Razorpay" || ch==="Card POS";

const S = {
  minutes: 9*60, txns: [], exceptions: [], settlements: [], retries: [], refundQueue: [],
  received:0, matchedCount:0, totalCount:0, bank:412000, speed:1, paused:false, mdr:false, writeoff:0,
  advances:0, unallocated:0, refundsPaid:0, earlySurplus:0, schemeClaimed:false
};

function openInvoices(custId){ return invoices.filter(i=>i.balance>0 && (custId===undefined || i.cust===custId)).sort((a,b)=>a.due-b.due); }

// ---------- generator ----------
function generate(){
  const open = openInvoices();
  if(open.length < 12){ const c=pick(customers); newInvoice(c, Math.round(-5+rand()*20)); }
  const inv = pick(openInvoices());
  const c = customers[inv.cust];
  const r = rand();
  let t = { time:S.minutes, channel:pick(channels), vpa:c.vpa, amount:inv.balance, remark:"", failed:false };
  if(r<0.50){ if(rand()<0.3) t.remark = inv.id; }
  else if(r<0.62){ t.amount = Math.max(500, Math.round(inv.balance*(0.3+rand()*0.4)/10)*10); }
  else if(r<0.70){ t.amount = inv.balance - (1+Math.floor(rand()*9)); }
  else if(r<0.77){
    const last = [...S.txns].reverse().find(x=>x.status==="MATCHED" && !x.failed);
    if(last){ t.vpa=last.vpa; t.amount=last.amount; t.channel=last.channel; }
  }
  else if(r<0.85){ t.vpa = "98"+Math.floor(10000000+rand()*89999999)+"@"+pick(["ybl","paytm","okaxis"]); }
  else if(r<0.93){ t.vpa = "98"+Math.floor(10000000+rand()*89999999)+"@ybl"; t.remark = "payment for "+inv.id; }
  else { t.failed = true; t.channel = pick(["PhonePe","Google Pay","Paytm"]); }
  return t;
}

// ---------- matching engine (deterministic, rule is recorded) ----------
// All money enters through one door: fees charged, gateway settlements delayed and netted,
// direct channels credited to bank. No exception path may touch S.bank directly.
function receiveFunds(t){
  const fee = feeFor(t.channel, t.amount); t.fee = fee;
  if(isGateway(t.channel)){ S.settlements.push({txn:t, net:t.amount-fee, due:S.minutes + (90 + Math.floor(rand()*180)), done:false}); }
  else { S.bank += t.amount - fee; }
}
function applyPayment(t, inv, amount){
  inv.balance = Math.max(0, inv.balance - amount);
  receiveFunds(t);
}
function feeFor(ch, amt){
  let f = amt*(CONFIG.FEES[ch]||0);
  if(S.mdr && !isGateway(ch) && ch!=="NEFT" && amt>CONFIG.MDR_SCENARIO.above) f += Math.min(amt*CONFIG.MDR_SCENARIO.rate, CONFIG.MDR_SCENARIO.cap);
  return f;
}
function addException(t, type, detail, actions){
  const e = {id:"E"+(S.exceptions.length+1), txn:t, type, detail, actions, open:true, at:S.minutes};
  S.exceptions.push(e); return e;
}

function match(t){
  S.totalCount++;
  if(t.failed){
    t.status="FAILED"; t.rule="Payment declined by payer's bank";
    const c=custByVpa[t.vpa];
    addException(t,"Failed payment", `${c?c.name:t.vpa} tried to pay ${inr(t.amount)} and it didn't go through.`, [{label:"Send retry link", do:"retry"},{label:"Ignore", do:"dismiss"}]);
    return;
  }
  S.received += t.amount;

  const dup = S.txns.slice(-10).find(x=>x!==t && !x.failed && x.vpa===t.vpa && x.amount===t.amount && (t.time-x.time)<=45 && (x.status==="MATCHED"||x.status==="PARTIAL"));
  if(dup){
    t.status="DUPLICATE"; t.rule=`Same payer and amount ${t.time-dup.time} min after an earlier payment`;
    receiveFunds(t);
    addException(t,"Possible duplicate", `${custName(t)} paid ${inr(t.amount)} twice within ${t.time-dup.time} minutes.`, [{label:"Mark for refund", do:"refund"},{label:"Keep as advance", do:"dismiss"}]);
    return;
  }

  const ref = (t.remark.match(/INV-\d+/)||[])[0];
  if(ref){
    const inv = invoices.find(i=>i.id===ref && i.balance>0);
    if(inv){
      const partial = t.amount < inv.balance;
      applyPayment(t, inv, t.amount);
      t.status = partial?"PARTIAL":"MATCHED"; t.inv=inv.id; t.rule="Bill number found in UPI remark";
      S.matchedCount++; return;
    }
  }

  const c = custByVpa[t.vpa];
  if(!c){
    const cands = openInvoices().filter(i=>i.balance===t.amount);
    t.status="UNIDENTIFIED"; t.rule="Payer UPI ID not linked to any customer";
    receiveFunds(t);
    const acts = cands.slice(0,2).map(i=>({label:`Assign to ${customers[i.cust].name} (${i.id})`, do:"assign", inv:i.id}));
    acts.push({label:"Park as unallocated", do:"dismiss"});
    addException(t,"Unknown payer", `${inr(t.amount)} from ${t.vpa}. ${cands.length?cands.length+" open bill"+(cands.length>1?"s":"")+" match this amount exactly.":"No open bill matches this amount."}`, acts);
    return;
  }

  const mine = openInvoices(c.id);
  const exact = mine.filter(i=>i.balance===t.amount);
  if(exact.length){
    applyPayment(t, exact[0], t.amount);
    t.status="MATCHED"; t.inv=exact[0].id;
    t.rule = exact.length>1 ? "Payer UPI ID + exact amount (oldest of "+exact.length+" equal bills)" : "Payer UPI ID + exact amount";
    S.matchedCount++; return;
  }
  const near = mine.find(i=>i.balance-t.amount>0 && i.balance-t.amount<=10);
  if(near){
    t.status="SHORT"; t.rule=`Short by ₹${near.balance-t.amount} against ${near.id}`; t.inv=near.id;
    receiveFunds(t);
    addException(t,"Short payment", `${c.name} paid ${inr(t.amount)} against ${near.id} for ${inr(near.balance)}.`, [{label:`Approve and write off ₹${near.balance-t.amount}`, do:"writeoff", inv:near.id},{label:"Keep bill open", do:"dismiss"}]);
    return;
  }
  const oldest = mine[0];
  if(oldest && t.amount < oldest.balance){
    applyPayment(t, oldest, t.amount);
    t.status="PARTIAL"; t.inv=oldest.id; t.rule="Part-payment applied to oldest bill";
    S.matchedCount++; return;
  }
  t.status="UNIDENTIFIED"; t.rule="Known customer, no bill fits this amount";
  receiveFunds(t);
  addException(t,"No matching bill", `${c.name} paid ${inr(t.amount)} but has no open bill it fits.`, [{label:"Record as advance", do:"dismiss"}]);
}
const custName = t => (custByVpa[t.vpa]||{name:t.vpa}).name;

function resolve(eid, actIdx){
  const e = S.exceptions.find(x=>x.id===eid); if(!e||!e.open) return;
  const a = e.actions[actIdx]; const t=e.txn;
  signals.actions++;
  if(a.do==="assign"){ const inv=invoices.find(i=>i.id===a.inv); if(inv&&inv.balance>=t.amount){ inv.balance-=t.amount; t.inv=inv.id; t.status="MATCHED"; t.rule="Assigned by you"; S.matchedCount++; } }
  if(a.do==="writeoff"){ const inv=invoices.find(i=>i.id===a.inv); if(inv){ S.writeoff += inv.balance-t.amount; inv.balance=0; t.status="MATCHED"; t.rule="Approved with write-off"; S.matchedCount++; } }
  if(a.do==="refund"){ t.status="REFUND"; t.rule="Marked for refund"; S.refundQueue.push({amount:t.amount, due:S.minutes + 20 + Math.floor(rand()*40)}); }
  if(a.do==="dismiss"){
    if(e.type==="Possible duplicate" || e.type==="No matching bill") S.advances += t.amount;
    if(e.type==="Unknown payer") S.unallocated += t.amount;
  }
  if(a.do==="retry"){ t.rule="Retry link sent"; if(rand()<0.7) S.retries.push({at:S.minutes+20+Math.floor(rand()*40), vpa:t.vpa, amount:t.amount, channel:t.channel)}); }
  e.open=false; e.outcome=a.label;
  render();
}
