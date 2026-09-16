/* ============ CONFIG: edit these before deploying ============ */
const CONFIG = {
  BRAND: "VyapaarAI PayOps",
  MERCHANT: "Shree Balaji Distributors",
  MERCHANT_VPA: "shreebalaji@demo",
  // Formspree (https://formspree.io) endpoint e.g. "https://formspree.io/f/abcdwxyz". Leave "" to fall back to email.
  FORM_ENDPOINT: "",
  // Used if FORM_ENDPOINT is empty: opens the visitor's email app with the details filled in.
  CONTACT_EMAIL: "saumyajit.ghosh@gmail.com",
  // Illustrative fee rates (fraction). Not real provider pricing.
  FEES: { "PhonePe":0, "Google Pay":0, "Paytm":0, "BHIM":0, "Razorpay":0.02, "Card POS":0.018, "NEFT":0 },
  // Confirmed NPCI MDR framework, effective 15 October 2026: 0.4% on P2M UPI above â‚¹2,000, capped at â‚¹300 for â‚¹75,000+. P2P and sub-â‚¹2,000 payments stay free.
  MDR_SCENARIO: { rate:0.004, above:2000, cap:300 },
  // Smart Terms: early-payment offfers sized against the merchant's cost of funds.
  SMART_TERMS: { financeRate:0.18, buyerShare:0.5, maxDiscountPct:0.02, payopsFee:95 },
  // Money Finder: illustrative supplier-scheme position for the demo (â‚¹).
  SCHEME: { qualified:83450, received:51200 },
  // Where customers pay. The QR codes below are generated for exactly these UPI intent links.
  PAY: {
    UPI_ID: "9836296103@upi",
    PAYEE_NAME: "VyapaarAI PayOps",
    // Your WhatApp number for payment confirmations, e.g. "919836296104". Shown in the payment dialog.
    WHATSAPP: "919836296103",
    PLANS: {
      reconcile:   { label:"Reconcille", amount:999, note:"PayOps Reconcile 1mo",
                     desc:"One bank account, up to 3 payment apps, automatic matching to bills, daily WhatsApp summary.",
                     qr:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWgAAAFoAQAAABCnlx4AAAC00lEQVR4nO2bwW7kMAxDySL//8vcAyXZcylQTDqVNp6iRZC+A6ERZFqyKfzg8/UT+NCH/nP6AugnERBFARQoAKBfJNFI91T6AuDQAiJExxiOuiiCKqKP7qn0BTjWiLSOCGd+w9kdRB/dU+lrPWYSO7cpASDEDyl5Br3Fm6Kc3hV7xZ9PKHkGfQERXShy2dUbleCLaKR7Kg1l+uqbn0T76J5KX1jhZFVwrNVSXEQj3VNpWxGviQ54em4HOaJPh72P7qk0JEiCttIhSZBLjV7e9tE9lb6A2uGE836xJIyvgb+u5Dm0ACjqNCHZocgWRQDJ+Ap66Z5LexsPSkLsNbOmxw5IH1Lyv9NwiBGBjkKeNVxVvv2uj+6pNAUiO1RpSnIbL1aVAY4/uYlWxDaiSodYkI2huBx4K91j6Qy3CEaKq0x3fs56eQt9IfY5DjPDG3KtkdUv/GUlz6CxLImXxGxe1UNue856eRctgf4Vw4FXF0Uxa3AN76V7LM0McHZLwoLXYy6YzXTPpNewEtXyToMouKLzI0oeQFN7Im8unNhasTz+5F6akEhPhrmOSMSwmFnR2+keR9c8jeX/lg1k7i1z39lH92Da+xwf9IlVUyRArs6Kd0O9dI+kI79VVUR1+iTHa1rjnj66p9KQqgFY8+GY9+TzIvvonkp7Pw9tpkRpWqKZohxlnv7g+/SVJjBmOszjJ26lROMkv5A+uqfS7o5UBxY5IobqVfVSTj15n2a6Pm2zBv/Dqe6mbFB9dE+l83yVMslrpqZ6l+DJ7/dpan+MyQNyC1Qnf3j6VffQ2/0GpBUR3KXKt1V0GumeSu/3G157V/GoHGceP3gHvd9vANJ++4xVtq7cQTn9qvtpN61UN3ZqzYwy01X3SLou7cQdB0p57sTnIprqnkfnGavt9PFqm7gn685hM90D6QtlUKqLkoc1GXdMhFNP7qI3//3HSg596Pvpf3bc1C+Ae/mqAAAAAElFTkSuQmCC" },
      reconcollect: { label:"Reconcille + Collect", amount:2499, note:"PayOps Recon+Collect 1mo",
                     desc:"Everything in Reconcile, plus reminders in Kannada/Hindi/Tamil/English, settlement and fee tracking, and Ask PayOps on WhatApp.",
                     qr:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWgAAAFoAQAAAABSnlx4AAAC00lEQVR4nO1bwW7dMAwjh/z/L3MHkXK2w4YC7ip3bl/R1OGBUAWakmwKH/j68RHwRV/0l6MfgPUkUATqrwDAWtJCzOF9KvoBUMEFVU8QBdazoF7nJN6noh8AYMc8UYZACaAorddzeH8LdPZOloKQBEV+AZNvi37WowhrtRJi4R3tSbxPRT/AymuIEAEKJd2gt059PpP/Aw0l2PrDd6BzeJ+Kfl7ZDUW6uVbeAR/E+1Q0hZhtW8BISL17ybom8T4VbT8oiiJFWL1T6NS/g7h+cBtacLjLc0slKg4zRULWlFG8j0Q/QOr4pSZVYKL8Sup53np+D9q5XDod6baGC6DXdfV7AxoqrVB+e0Favltlx68f3IB2fbm2RoBRFdBtK1pZBvE+Gh37IYByOpOV9FVu2iwO430qunKYIonS7ip6aPudJJ/G+0B0CbU/lduCH4XIe17O4X0qmsKqaKzWywyihw+V5XN4n4r2flkh945JD9cs51TGPIN4n4pu+1d/WExcT7aU+O3Vkx1oZkgpucok2aJOyOX9ze8NaAuI0rLKJNP9lDhzA+fwPhWdvdLe22U8O8KA24cA7365BV2FDd0o9Ky4XHjb8dKUWbyPRUusdlV5FHnC00Me2qNM430s2spNZDjcDpDVEo/iDON9INrGO52q1+7I9uAePdx4b0Ink11SuosixrD06bZhvE9EszuxNeNJZFeu2yne+c5GdA5oCqpTbLUKd8CVU23TeJ+HftBp3TmeZngmxgC8Pof3qWh0qwTpzSqfX2C4/dgdaK6opi2Y45pW9pSen83k/0C/7je4nqxpWslKDian0J/D+1T0635Dzg+qeynsvvj1g5vQv99vyFlBekrch++vH9yO7uskfWdnlfd3Pr8fnaPHRB2D4LsMuvX8PnQPzIglJjmxqVx7uPfTNqAftEFJFvflnRoWV/1z+1V70NTfMf+GyUVf9H70TyfDvWfQJTflAAAAAElFTkSuQmCC" }ˆBˆKˆPÒ×ÓTÎˆMLŸNÂ‹ÊˆOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOH
‹Â‚™ØÝ[Y[™Ù][[Y[žRY
˜œ˜[™˜[YHŠK^ÛÛ[HÓÓ‘’QË”S‘Â™ØÝ[Y[™Ù][[Y[žRY
›Y\˜Ú[˜[YHŠK^ÛÛ[HÓÓ‘’QË“QTÒS•Â‚‹ËÈ[YBŠ[˜Ý[ÛŠ
^ÂˆÛÛœÝYØÝ[Y[™Ù][[Y[žRY
[YPˆŠNÂˆ‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

OOžÂˆÛÛœÝÝ\YØÝ[Y[™ØÝ[Y[[[Y[™Ù]]šX]J™]K][YHŠNÂˆÛÛœÝÞ\Ñ\šÏ[X]ÚYYXJŠ™Y™\œËXÛÛÜ‹\ØÚ[YNˆ\šÊHŠK›X]Ú\ÎÂˆÛÛœÝ™^HÝ\ˆÈ
Ý\OOH™\šÈÈ›YÚŽˆ™\šÈŠHˆ
Þ\Ñ\šÏÈ›YÚŽˆ™\šÈŠNÂˆØÝ[Y[™ØÝ[Y[[[Y[œÙ]]šX]J™]K][YH‹™^
NÂˆž^ÛØØ[ÝÜ˜YÙKœÙ]][Jœ^[ÜË][YH‹™^
_XØ]Ú
J^ßBˆJNÂˆž^ØÛÛœÝ[ØØ[ÝÜ˜YÙK™Ù]][Jœ^[ÜË][YHŠNÈYŠ
HØÝ[Y[™ØÝ[Y[[[Y[œÙ]]šX]J™]K][YH‹
_XØ]Ú
J^ßBŸJJ
NÂ‚˜ÛÛœÝÚYÛ˜[ÈHÈXœÎ›™]ÈÙ]

KXÝ[ÛœÎŒ\ÚÜÎŒY\ÛXÚÜÎ–×HNÂ‚‹ËÈKKKKKKKKKH[\œÈKKKKKKKKKB›]ÙYYHŒŒLMŽÂ™[˜Ý[Ûˆ˜[™

^ÈÙYYLÈÙYY\ÙYY
Ì‘ÎQ_È]SX]š[][
ÙYYœÙYYŒMK_ÙYY
NÈ]
ÓX]š[][
ËŒ_
WÈ™]\›ˆ

ŒM
OŒ
KÍŽMMÌŽMŽÈB˜ÛÛœÝXÚÈHHOˆVÓX]™›ÛÜŠ˜[™

J˜K›[™Ý
WNÂ˜ÛÛœÝ[œˆHˆOˆ¸ ®Hˆ
ÈX]œ›Ý[™
ŠKÓØØ[TÝš[™Ê™[‹RSˆŠNÂ˜ÛÛœÝ\ØÈHÈOˆÝš[™ÊÊKœ™\XÙJÖÉˆ‰×KÙËÏOŠÈ‰ˆŽˆ‰˜[\È‹Žˆ‰›È‹ˆŽˆ‰™ÝÈ‹	È‰Îˆ‰œ][ÝÈ‹‰ÈŽˆ‰ˆÌÎNÈŸVØ×JJNÂ˜ÛÛœÝ	HYOˆØÝ[Y[™Ù][[Y[žRY
Y
NÂ‚‹ËÈKKKKKKKKKHÞ[]XÈÛÜ›KKKKKKKKKB˜ÛÛœÝÝ\ÝÛY\œÈHÂˆÈ”˜Z™\ÚÚ\˜[˜HÝÜ™\È‹œ˜Z™\ÚÚ\˜[˜PX›‹šÛˆ—KÈ”ÜšHZÜÚZH˜Y\œÈ‹œÜš[ZÜÚZK˜Y\œÐÚØ^\È‹šÛˆ—KˆÈ‘Ý\HÙ[™\˜[ÝÜ™H‹™Ý\YÜÐ^]H‹šH—KÈ‘œ™\ÚX\[™\˜[˜YØ\ˆ‹™œ™\ÚX\˜›ÚÚXÚXÚH‹™[ˆ—KˆÈ[›˜\ÛÜ›˜H›Ýš\Ú[ÛœÈ‹˜[›˜\ÛÜ›˜PX›‹šÛˆ—KÈ”Ú\›XHÝ\\ˆ˜^˜X\ˆ‹œÚ\›XX˜^˜X\X›‹šH—KˆÈ“˜[™[šHZ[šHX\‹›˜[™[š[X\ÚÚ˜Ø˜[šÈ‹šÛˆ—KÈ”›ÞX[ÝÜ™\È‹œ›ÞX[ÝÜ™\Ð^]H‹™[ˆ—KˆÈ•™[šØ]\ÚØ\˜HYÙ[˜ÚY\È‹™[šÞXYÙ[˜ÚY\ÐÚØ^\È‹šÛˆ—KÈYØ\Ø[˜Y\œÈ‹˜YØ\Ø[˜Y\œÐX›‹šH—KˆÈ‘Z[H™YYÈÚ]YšY[‹™Z[[™YYËÙX›‹™[ˆ—KÈ“XZ[ZÜÚZHÝÜ™\È‹›XZ[ZÜÚZKœÝÚÚXÚXÚH‹šÛˆ—KˆÈ’Ø]™\šH›Ýš\Ú[ÛˆÙ[™H‹šØ]™\š\›ÝX›‹šÛˆ—KÈ”Ú[™Úœ›Ý\œÈ‹œÚ[™Úœ›ÜÐÚØ^\È‹šH—B—K›X\

Û˜[YKœK[™×KJOOŠÚYšK˜[YKœK[™ßJJNÂ˜ÛÛœÝÝ\ÝžUœHHØš™XÝ™œ›ÛQ[šY\ÊÝ\ÝÛY\œË›X\
ÏO–ØËœK×JJNÂ‚›][”Ù\HHNÂ˜ÛÛœÝ[›ÚXÙ\ÈH×NÂ™[˜Ý[Ûˆ™]Ò[›ÚXÙJËYSÙ™œÙ]
^ÂˆÛÛœÝ[]HX]œ›Ý[™

N
È˜[™

JŒ
KÌL
JŒLÂˆÛÛœÝ[ˆHÚYˆ’S•‹HŠÊ[”Ù\JÊÊKÝ\Ý˜ËšY[[Ý[˜[]˜[[˜ÙN˜[]YN™YSÙ™œÙ]™[Z[™Y™˜[Ù_NÂˆ[›ÚXÙ\Ëœ\Ú
[ŠNÈ™]\›ˆ[ŽÂŸB˜Ý\ÝÛY\œË™›Ü‘XXÚ
ÏOžÈÛÛœÝLŠÓX]™›ÛÜŠ˜[™

JŒÊNÈ›ÜŠ]ÏLÚÏŽÚÊÊÊH™]Ò[›ÚXÙJËX]œ›Ý[™
MÌ
È˜[™

JŽ
JNÈJNÂ‚˜ÛÛœÝÚ[›™[ÈHÈ”Û™TH‹‘ÛÛÙÛH^H‹”Û™TH‹”^]H‹‘ÛÛÙÛH^H‹’SH‹”˜^›Üœ^H‹Ø\™ÔÈ‹“‘Q•—NÂ˜ÛÛœÝ\ÑØ]]Ø^HHÚOˆÚOOH”˜^›Üœ^HˆÚOOHØ\™ÔÈŽÂ‚˜ÛÛœÝÈHÂˆZ[]\ÎˆJŒœÎˆ×K^Ù\[ÛœÎˆ×KÙ][Y[Îˆ×K™]šY\Îˆ×K™Y[™]Y]YNˆ×Kˆ™XÙZ]™YŒX]ÚYÛÝ[ŒÝ[ÛÝ[Œ˜[šÎLŒÜYYŒK]\ÙY™˜[ÙKYŽ™˜[ÙKÜš][Ù™ŽŒˆY˜[˜Ù\ÎŒ[˜[ØØ]YŒ™Y[™ÔZYŒX\›TÝ\œ\ÎŒØÚ[YPÛZ[YY™˜[ÙBŸNÂ‚™[˜Ý[ÛˆÜ[’[›ÚXÙ\ÊÝ\ÝY
^È™]\›ˆ[›ÚXÙ\Ë™š[\ŠOOšK˜˜[[˜ÙOŒ	‰ˆ
Ý\ÝYOO][™Yš[™YK˜Ý\ÝOOXÝ\ÝY
JKœÛÜ

KŠOO˜K™YKX‹™YJNÈB‚‹ËÈKKKKKKKKKHÙ[™\˜]ÜˆKKKKKKKKKB™[˜Ý[ÛˆÙ[™\˜]J
^ÂˆÛÛœÝÜ[ˆHÜ[’[›ÚXÙ\Ê
NÂˆYŠÜ[‹›[™ÝLŠ^ÈÛÛœÝÏ\XÚÊÝ\ÝÛY\œÊNÈ™]Ò[›ÚXÙJËX]œ›Ý[™
MJÜ˜[™

JŒŒ
JNÈBˆÛÛœÝ[ˆHXÚÊÜ[’[›ÚXÙ\Ê
JNÂˆÛÛœÝÈHÝ\ÝÛY\œÖÚ[‹˜Ý\ÝNÂˆÛÛœÝˆH˜[™

NÂˆ]HÈ[YN”Ë›Z[]\ËÚ[›™[œXÚÊÚ[›™[ÊKœN˜ËœK[[Ý[š[‹˜˜[[˜ÙK™[X\šÎˆˆ‹˜Z[Y™˜[ÙHNÂˆYŠL
^ÈYŠ˜[™

OŒÊHœ™[X\šÈH[‹šYÈBˆ[ÙHYŠŒŠ^È˜[[Ý[HX]›X^
LX]œ›Ý[™
[‹˜˜[[˜ÙJŠŒÊÜ˜[™

JŒ
KÌL
JŒL
NÈBˆ[ÙHYŠÌ
^È˜[[Ý[H[‹˜˜[[˜ÙHH
JÓX]™›ÛÜŠ˜[™

JŽJJNÈBˆ[ÙHYŠÍÊ^ÂˆÛÛœÝ\ÝHË‹‹”Ëœ×Kœ™]™\œÙJ
K™š[™
OžœÝ]\ÏOOH“PUÒQˆ	‰ˆ^™˜Z[Y
NÂˆYŠ\Ý
^ÈœO[\ÝœNÈ˜[[Ý[[\Ý˜[[Ý[È˜Ú[›™[[\Ý˜Ú[›™[ÈBˆBˆ[ÙHYŠŽJ^ÈœHHŽNŠÓX]™›ÛÜŠL
Ü˜[™

JŽNNNNNNJJÈŠÜXÚÊÈžX›‹œ^]H‹›ÚØ^\È—JNÈBˆ[ÙHYŠŽLÊ^ÈœHHŽNŠÓX]™›ÛÜŠL
Ü˜[™

JŽNNNNNNJJÈX›ŽÈœ™[X\šÈHœ^[Y[›ÜˆŠÚ[‹šYÈBˆ[ÙHÈ™˜Z[YHYNÈ˜Ú[›™[HXÚÊÈ”Û™TH‹‘ÛÛÙÛH^H‹”^]H—JNÈBˆ™]\›ˆÂŸB‚‹ËÈKKKKKKKKKKKHX]Ú[™È[™Ú[™H
]\›Z[š\ÝXË[H\È™XÛÜ™Y
HKKKKKKKKKKB‹ËÈ[[Û™^H[\œÈ›ÝYÚÛ™HÛÜŽˆ™Y\ÈÚ\™ÙYØ]]Ø^HÙ][Y[È[^YY[™™]Y‹ËÈ\™XÝÚ[›™[ÈÜ™Y]YÈ˜[šËˆ›È^Ù\[Ûˆ]X^HÝXÚË˜˜[šÈ\™XÝK‚™[˜Ý[Ûˆ™XÙZ]™Q[™Ê
^ÂˆÛÛœÝ™YHH™YQ›ÜŠ˜Ú[›™[˜[[Ý[
NÈ™™YHH™YNÂˆYŠ\ÑØ]]Ø^J˜Ú[›™[
J^ÈËœÙ][Y[Ëœ\Ú
ÝŽ™]˜[[Ý[Y™YKYN”Ë›Z[]\È
È
L
ÈX]™›ÛÜŠ˜[™

JŒN
JKÛ™N™˜[Ù_JNÈBˆ[ÙHÈË˜˜[šÈ
ÏH˜[[Ý[H™YNÈBŸB™[˜Ý[Ûˆ\T^[Y[
[‹[[Ý[
^Âˆ[‹˜˜[[˜ÙHHX]›X^
[‹˜˜[[˜ÙHH[[Ý[
NÂˆ™XÙZ]™Q[™Ê
NÂŸB™[˜Ý[Ûˆ™YQ›ÜŠÚ[]
^Âˆ]ˆH[]
ŠÓÓ‘’QË‘‘QTÖØÚ_
NÂˆYŠË›Yˆ	‰ˆZ\ÑØ]]Ø^JÚ
H	‰ˆÚOOH“‘Q•ˆ	‰ˆ[]ÓÓ‘’QË“Q—ÔÐÑST’SË˜X›Ý™JHˆ
ÏHX]›Z[Š[]
ÓÓ‘’QË“Q—ÔÐÑST’SËœ˜]KÓÓ‘’QË“Q—ÔÐÑST’SË˜Ø\
NÂˆ™]\›ˆŽÂŸB™[˜Ý[ÛˆY^Ù\[ÛŠ\K]Z[XÝ[ÛœÊ^ÂˆÛÛœÝHHÚYˆ‘HŠÊË™^Ù\[ÛœË›[™Ý
ÌJKŽ\K]Z[XÝ[ÛœËÜ[ŽYK]”Ë›Z[]\ßNÂˆË™^Ù\[ÛœËœ\Ú
JNÈ™]\›ˆNÂŸB‚™[˜Ý[ÛˆX]Ú

^ÂˆËÝ[ÛÝ[
ÊÎÂˆYŠ™˜Z[Y
^ÂˆœÝ]\ÏH‘RSQŽÈœ[OH”^[Y[XÛ[™YžH^Y\‰ÜÈ˜[šÈŽÂˆÛÛœÝÏXÝ\ÝžUœVÝœWNÂˆY^Ù\[ÛŠ‘˜Z[Y^[Y[‹	ØÏØË›˜[YNœ_HšYYÈ^H	Ú[œŠ˜[[Ý[
_H[™]Y‰ÝÛÈ›ÝYÚ˜ÞÛX™[ˆ”Ù[™™]žH[šÈ‹Îˆœ™]žHŸKÛX™[ˆ’YÛ›Ü™H‹Îˆ™\ÛZ\ÜÈŸWJNÂˆ™]\›ŽÂˆBˆËœ™XÙZ]™Y
ÏH˜[[Ý[Â‚ˆÛÛœÝ\HËœËœÛXÙJLL
K™š[™
OžO]	‰ˆ^™˜Z[Y	‰ˆœOOO]œH	‰ˆ˜[[Ý[OO]˜[[Ý[	‰ˆ
[YK^[YJOH	‰ˆ
œÝ]\ÏOOH“PUÒQŸœÝ]\ÏOOH”T•PSŠJNÂˆYŠ\
^ÂˆœÝ]\ÏH‘TPÐUHŽÈœ[OXØ[YH^Y\ˆ[™[[Ý[	Ý[YKY\[Y_HZ[ˆY\ˆ[ˆX\›Y\ˆ^[Y[Âˆ™XÙZ]™Q[™Ê
NÂˆY^Ù\[ÛŠ”ÜÜÚX›H\XØ]H‹	ØÝ\Ý˜[YJ
_HZY	Ú[œŠ˜[[Ý[
_HÚXÙHÚ][ˆ	Ý[YKY\[Y_HZ[]\Ë˜ÞÛX™[ˆ“X\šÈ›Üˆ™Y[™‹Îˆœ™Y[™ŸKÛX™[ˆ’ÙY\\ÈY˜[˜ÙH‹Îˆ™\ÛZ\ÜÈŸWJNÂˆ™]\›ŽÂˆB‚ˆÛÛœÝ™YˆH
œ™[X\šË›X]Ú
ÒS•‹W
ËÊ_×JVÌNÂˆYŠ™YŠ^ÂˆÛÛœÝ[ˆH[›ÚXÙ\Ë™š[™
OOšKšYOO\™Yˆ	‰ˆK˜˜[[˜ÙOŒ
NÂˆYŠ[Š^ÂˆÛÛœÝ\X[H˜[[Ý[[‹˜˜[[˜ÙNÂˆ\T^[Y[
[‹˜[[Ý[
NÂˆœÝ]\ÈH\X[È”T•PSŽˆ“PUÒQŽÈš[Z[‹šYÈœ[OHš[[X™\ˆ›Ý[™[ˆTH™[X\šÈŽÂˆË›X]ÚYÛÝ[
ÊÎÈ™]\›ŽÂˆBˆB‚ˆÛÛœÝÈHÝ\ÝžUœVÝœWNÂˆYŠXÊ^ÂˆÛÛœÝØ[™ÈHÜ[’[›ÚXÙ\Ê
K™š[\ŠOOšK˜˜[[˜ÙOOO]˜[[Ý[
NÂˆœÝ]\ÏH•S’QS•Q’QQŽÈœ[OH”^Y\ˆTHQ›Ý[šÙYÈ[žHÝ\ÝÛY\ˆŽÂˆ™XÙZ]™Q[™Ê
NÂˆÛÛœÝXÝÈHØ[™ËœÛXÙJŠK›X\
OOŠÛX™[˜\ÜÚYÛˆÈ	ØÝ\ÝÛY\œÖÚK˜Ý\ÝK›˜[Y_H
	ÚKšYJXÎˆ˜\ÜÚYÛˆ‹[ŽšKšYJJNÂˆXÝËœ\Ú
ÛX™[ˆ”\šÈ\È[˜[ØØ]Y‹Îˆ™\ÛZ\ÜÈŸJNÂˆY^Ù\[ÛŠ•[šÛ›ÝÛˆ^Y\ˆ‹	Ú[œŠ˜[[Ý[
_Hœ›ÛH	Ýœ_Kˆ	ØØ[™Ë›[™ÝØØ[™Ë›[™Ý
ÈˆÜ[ˆš[ŠÊØ[™Ë›[™ÝŒOÈœÈŽˆˆŠJÈˆX]Ú\È[[Ý[^XÝKˆŽˆ“›ÈÜ[ˆš[X]Ú\È\È[[Ý[ˆŸXXÝÊNÂˆ™]\›ŽÂˆB‚ˆÛÛœÝZ[™HHÜ[’[›ÚXÙ\ÊËšY
NÂˆÛÛœÝ^XÝHZ[™K™š[\ŠOOšK˜˜[[˜ÙOOO]˜[[Ý[
NÂˆYŠ^XÝ›[™Ý
^Âˆ\T^[Y[
^XÝÌK˜[[Ý[
NÂˆœÝ]\ÏH“PUÒQŽÈš[Y^XÝÌKšYÂˆœ[HH^XÝ›[™ÝŒHÈ”^Y\ˆTHQ
È^XÝ[[Ý[
Û\ÝÙˆŠÙ^XÝ›[™Ý
Èˆ\]X[š[ÊHˆˆ”^Y\ˆTHQ
È^XÝ[[Ý[ŽÂˆË›X]ÚYÛÝ[
ÊÎÈ™]\›ŽÂˆBˆÛÛœÝ™X\ˆHZ[™K™š[™
OOšK˜˜[[˜ÙK]˜[[Ý[Œ	‰ˆK˜˜[[˜ÙK]˜[[Ý[LL
NÂˆYŠ™X\Š^ÂˆœÝ]\ÏH”ÒÔ•ŽÈœ[OXÚÜžH8 ®IÛ™X\‹˜˜[[˜ÙK]˜[[Ý[HYØZ[œÝ	Û™X\‹šYXÈš[[™X\‹šYÂˆ™XÙZ]™Q[™Ê
NÂˆY^Ù\[ÛŠ”ÚÜ^[Y[‹	ØË›˜[Y_HZY	Ú[œŠ˜[[Ý[
_HYØZ[œÝ	Û™X\‹šYH›Üˆ	Ú[œŠ™X\‹˜˜[[˜ÙJ_K˜ÞÛX™[˜\›Ý™H[™Üš]HÙ™ˆ8 ®IÛ™X\‹˜˜[[˜ÙK]˜[[Ý[XÎˆÜš][Ù™ˆ‹[Ž›™X\‹šYKÛX™[ˆ’ÙY\š[Ü[ˆ‹Îˆ™\ÛZ\ÜÈŸWJNÂˆ™]\›ŽÂˆBˆÛÛœÝÛ\ÝHZ[™VÌNÂˆYŠÛ\Ý	‰ˆ˜[[Ý[Û\Ý˜˜[[˜ÙJ^À¢Ç•–ÖVçB‡BÂöÆFW7BÂBæÖ÷VçB“°¢Bç7FGW3Ò%%D”Â#²Bæ–çcÖöÆFW7Bæ–C²Bç'VÆSÒ%'B×–ÖVçBÆ–VBFòöÆFW7B&–ÆÂ#°¢2æÖF6†VD6÷VçB²³²&WGW&ã°¢Ð¢Bç7FGW3Ò%Tä”DTåD”d”TB#²Bç'VÆSÒ$¶æ÷vâ7W7FöÖW"Âæò&–ÆÂf—G2F†—2Ö÷VçB#°¢&V6V—fTgVæG2‡B“°¢FDW†6WF–öâ‡BÂ$æòÖF6†–ær&–ÆÂ"ÂG¶2ææÖWÒ–BG¶–ç"‡BæÖ÷VçB—Ò'WB†2æò÷Vâ&–ÆÂ—Bf—G2æÂ·¶Æ&VÃ¢%&V6÷&B2Gfæ6R"ÂFó¢&F—6Ö—72'ÕÒ“°§Ð¦6öç7B7W7DæÖRÒBÓâ†7W7D'•g·Bçg×ÇÇ¶æÖS§BçgÒ’ææÖS° ¦gVæ7F–öâ&W6öÇfR†V–BÂ7D–G‚—°¢6öç7BRÒ2æW†6WF–öç2æf–æB‡ƒÓç‚æ–CÓÓÖV–B“²–b‚WÇÂRæ÷Vâ’&WGW&ã°¢6öç7BÒRæ7F–öç5¶7D–G…Ó²6öç7BCÖRçG†ã°¢6–væÇ2æ7F–öç2²³°¢–b†æFóÓÓÒ&76–vâ"—²6öç7B–çcÖ–çfö–6W2æf–æB†“Óæ’æ–CÓÓÖæ–çb“²–b†–çbbf–çbæ&Ææ6Sã×BæÖ÷VçB—²–çbæ&Ææ6RÓ×BæÖ÷VçC²Bæ–çcÖ–çbæ–C²Bç7FGW3Ò$ÔD4„TB#²Bç'VÆSÒ$76–væVB'’–÷R#²2æÖF6†VD6÷VçB²³²ÒÐ¢–b†æFóÓÓÒ'w&—FVöfb"—²6öç7B–çcÖ–çfö–6W2æf–æB†“Óæ’æ–CÓÓÖæ–çb“²–b†–çb—²2çw&—FVöfb³Ò–çbæ&Ææ6R×BæÖ÷VçC²–çbæ&Ææ6SÓ²Bç7FGW3Ò$ÔD4„TB#²Bç'VÆSÒ$&÷fVBv—F‚w&—FRÖöfb#²2æÖF6†VD6÷VçB²³²ÒÐ¢–b†æFóÓÓÒ'&VgVæB"—²Bç7FGW3Ò%$TeTäB#²Bç'VÆSÒ$Ö&¶VBf÷"&VgVæB#²2ç&VgVæEVWVRçW6‚‡¶Ö÷VçC§BæÖ÷VçBÂGVS¥2æÖ–çWFW2²#²ÖF‚æfÆö÷"‡&æB‚’£C—Ò“²Ð¢–b†æFóÓÓÒ&F—6Ö—72"—°¢–b†RçG—SÓÓÒ%÷76–&ÆRGWÆ–6FR"ÇÂRçG—SÓÓÒ$æòÖF6†–ær&–ÆÂ"’2æGfæ6W2³ÒBæÖ÷VçC°¢–b†RçG—SÓÓÒ%Væ¶æ÷vâ–W""’2çVæÆÆö6FVB³ÒBæÖ÷VçC°¢Ð¢–b†æFóÓÓÒ'&WG'’"—²Bç'VÆSÒ%&WG'’Æ–æ²6VçB#²–b‡&æB‚“Ããr’2ç&WG&–W2çW6‚‡¶C¥2æÖ–çWFW2³#´ÖF‚æfÆö÷"‡&æB‚’£C’Âg§BçgÂÖ÷VçC§BæÖ÷VçBÂ6†ææVÃ§Bæ6†ææVÇÒ“²Ð¢Ræ÷VãÖfÇ6S²Ræ÷WF6öÖSÖæÆ&VÃ°¢&VæFW"‚“°§Ð 