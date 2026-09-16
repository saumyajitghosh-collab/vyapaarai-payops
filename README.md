# VyapaarAI PayOps — market-validation prototype

Single-page landing site with a live, in-browser demo of UPI reconciliation and collections for distributors/wholesalers. No backend, no real money, synthetic data only. Purpose: find out whether merchants care before investing in hardware or a real build.

## What's in the demo
- **Payments feed** — synthetic UPI / card / gateway / NEFT payments every few seconds, matched by deterministic, visible rules (payer VPA + exact amount, bill number in remark, FIFO part-payment, near-amount short payment, duplicate window, unknown payer, failed payment).
- **Exceptions** — approve write-offs, assign unknown payers, mark refunds, send retry links.
- **Collections** — aging buckets, reminder drafts in Kannada / Hindi / English with a `upi://pay` intent link.
- **Fees** — per-channel acceptance cost, plus a toggle applying the **confirmed NPCI MDR framework** (announced 15 September 2026): 0.4% on P2M UPI above ₹2,000, capped at ₹300 for ₹75,000+, effective 15 October 2026. P2P and sub-₹2,000 payments stay free. This is now a real, dated pain point to lead with in outreach.
- **Smart Terms (new)** — on the Collections tab, a Smart Invoice card offers overdue customers an early-payment discount sized against an 18% p.a. cost of funds (the surplus is split: buyer saves, merchant still gains; PayOps charges ₹95 only if accepted). Acceptance is simulated: the discounted payment arrives minutes later and matches its invoice by remark — a short-payment exception for the discount, exactly like real life.
- **Opportunities tab (new)** — ranked, money-labelled actions: early-pay candidates, failed-payment recovery, duplicate refunds, supplier-scheme claim (illustrative), fee check. Every action is one click.
- **Profit Ledger (new)** — a strip under the KPIs: "PayOps effect today" — recovered value, protected value, unclaimed scheme — computed live from the ledger.
- **Ask PayOps** — WhatsApp-style Q&A answered from the demo ledger (no LLM, no API key). Now also answers "any money opportunities?".
- **Pricing intent + waitlist** — the form also sends which demo tabs the visitor used, actions taken and plan clicked.

## Bring your own data (the real product starts here)
The **Import your data** section lets a merchant upload a real bank statement and bill list — CSV works directly, XLSX via the SheetJS CDN library. Column mapping is auto-detected (HDFC/SBI/ICICI-style exports work) and correctable in the UI. The same deterministic rules then run on the merchant's own rows: invoice number in narration, customer + exact amount, part payment, short payment (≤₹10), duplicates within 3 days, probable matches (exact amount, no name) and unmatched credits become exceptions — never guesses. Results: a "₹X found needing attention" headline, an import-quality summary, exception/probable/overdue tables and a CSV download. **Everything runs in the browser; no data is uploaded anywhere.** Press "Use sample" on both cards to try it with a realistic 13-credit statement and 16 bills. The engine is verified by a headless test asserting every classification on the sample (9 matched, 1 part, 1 probable, 3 exceptions, ₹1,30,604 attention).

## Taking payments (already wired)
The pricing section now has real **Pay via UPI** buttons. Clicking one opens a dialog with a QR code and deep link that pay straight to the UPI ID in `CONFIG.PAY` (`9836296103@upi`). Amounts are pre-filled (₹999 / ₹2,499) with a plan note, so payments are identifiable in your bank/UPI app passbook.

How confirmation works with no backend: the customer pays, then WhatsApps you the screenshot/UTR; you verify receipt in your UPI app and start their month. **Set `CONFIG.PAY.WHATSAPP`** to your number so the dialog tells them exactly where to send it.

Limits of this setup (be aware):
- A personal UPI ID cannot do automatic recurring billing. Renewals are manual reminders for now — which is also a retention conversation.
- To accept cards/netbanking, or UPI Autopay for subscriptions, you'll need a PSP (Razorpay/Cashfree) with business KYC — a proprietorship works, and GST registration becomes mandatory once turnover crosses the threshold. Track every rupee received; this is business income.

## Accounting model (v2, demo ledger)
Every rupee now enters through a single `receiveFunds()` door: fees computed, gateway settlements delayed and netted, direct channels credited to bank. Exception paths (duplicate, unknown payer, short payment, no matching bill) no longer touch the bank directly. "Mark for refund" creates a refund liability that later debits the bank; "keep as advance" / "record as advance" and "park as unallocated" feed separate advance/unallocated ledgers surfaced in Ask PayOps. The simulation clock is absolute (never resets), so no settlement can become unreachable. A headless harness verified the bank invariant (opening + received − fees − refunds = closing) across 500+ simulated transactions.

## Before you deploy (2 minutes)
Edit the `CONFIG` block near the top of `app.js`:
1. Create a free form at https://formspree.io → copy the endpoint into `FORM_ENDPOINT`. (Or set `CONTACT_EMAIL` for a mailto fallback.)
2. Set `CONFIG.PAY.WHATSAPP` to the number buyers should message with their payment screenshot (e.g. `"919836296104"`).
3. Optional: paste a GoatCounter or Cloudflare Web Analytics snippet where the `<head>` comment in `index.html` says so.

## Push to GitHub
```bash
cd vyapaarai-payops
git init && git add . && git commit -m "PayOps validation prototype v0"
git branch -M main
gh repo create vyapaarai-payops --public --source=. --push
# or without gh:
# git remote add origin https://github.com/saumyajitghosh-collab/vyapaarai-payops.git && git push -u origin main
```

## Host it
- **GitHub Pages (public repo):** Settings → Pages → Deploy from branch → `main` / root.
  URL: `https://saumyajitghosh-collab.github.io/vyapaarai-payops/`
- **Render (keeps repo private):** New → Static Site → connect repo → build command empty, publish directory `.`

## Validation plan (2–3 weeks)
Traffic alone proves nothing. Send the link directly to people who fit the buyer profile.

| Step | Target |
|---|---|
| Direct outreach to distributors/wholesalers (WhatsApp, LinkedIn, CA/accountant referrals, trade associations) | 50–80 people |
| Sign-ups with collections ≥ ₹5 lakh/month | 10+ |
| 20-minute calls booked | 5+ |
| Merchant shares a real bank statement / gateway report for a manual reconciliation trial | 2–3 |
| Someone agrees to pay for a pilot month | 1 |

**Go signal:** a merchant hands over real statements or pays. **Kill/pivot signal:** lots of "nice demo" and no statements after 5+ calls — try a different vertical (clinics, coaching centres) with the same page.

The fastest real test after sign-ups: do reconciliation manually (Python + spreadsheet) for 2–3 merchants for a month. If they won't give you data for a free manual service, software won't change that.

## Disclaimer
Prototype. Demo data is synthetic. Fee rates are illustrative. Not affiliated with NPCI or any bank, payment app or gateway named.
