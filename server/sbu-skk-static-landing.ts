import type { Express } from "express";
import { SBU_SKK_EBOOK } from "../shared/sbu-skk-ebook";
import { PAYMENT_BASE_URL } from "./lib/scalev";

export const SBU_SKK_STATIC_LANDING_PATH = "/lp/sbu-skk-level-1";

const checkoutUrl =
  `${PAYMENT_BASE_URL}/c/checkout?variant_ids=${SBU_SKK_EBOOK.scalev.variantId}&qty=1`;

function renderLandingPage(): string {
  const title = `${SBU_SKK_EBOOK.title} — Level 1`;
  const contentName = `${SBU_SKK_EBOOK.title} Level 1`;
  const checkoutJson = JSON.stringify(checkoutUrl);
  const contentJson = JSON.stringify(contentName);

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title} | Gustafta</title>
<meta name="description" content="Panduan SBU-SKK, toolkit praktis, dan satu diagnosis kesiapan SBU atau SKK. Paket Level 1 Rp149.000.">
<meta name="theme-color" content="#071426">
<link rel="canonical" href="https://gustafta.my.id${SBU_SKK_STATIC_LANDING_PATH}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="E-book ${SBU_SKK_EBOOK.pages} halaman, toolkit ${SBU_SKK_EBOOK.toolkitPages} halaman, dan satu diagnosis SBU atau SKK.">
<meta property="og:url" content="https://gustafta.my.id${SBU_SKK_STATIC_LANDING_PATH}">
<meta property="og:image" content="https://gustafta.my.id/og-gustafta-platform.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#071426;color:#f8fbff;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased}.wrap{width:min(1080px,calc(100% - 32px));margin:auto}.top{padding:18px 0;border-bottom:1px solid #1c3552}.brand{display:flex;align-items:center;gap:10px;font-weight:900;letter-spacing:.08em}.mark{display:grid;place-items:center;width:34px;height:34px;border:2px solid #23c8ee;border-radius:10px;color:#23c8ee;font-size:19px}.safe{margin-left:auto;color:#a8bdd1;font-size:12px}.top .wrap{display:flex;align-items:center}.hero{padding:58px 0 40px;background:radial-gradient(circle at 80% 0,#113e55 0,transparent 42%)}.hero-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:54px;align-items:center}.eyebrow{margin:0 0 16px;color:#55d9f7;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}h1{margin:0;max-width:760px;font-size:clamp(42px,7vw,76px);line-height:.96;letter-spacing:-.055em}.gold{color:#ffc247}.lead{max-width:680px;margin:24px 0 0;color:#c7d7e7;font-size:18px;line-height:1.65}.chips{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}.chip{padding:8px 11px;border:1px solid #31506d;border-radius:999px;color:#d9e8f4;font-size:13px}.cta{display:inline-flex;align-items:center;justify-content:center;min-height:54px;padding:14px 22px;border-radius:12px;background:#ffc247;color:#071426;font-weight:900;text-decoration:none;box-shadow:0 10px 30px #0005}.cta:hover{background:#ffd06d}.micro{margin:12px 0 0;color:#8fa9bf;font-size:12px}.book{position:relative;max-width:320px;margin:auto;padding:34px 26px;border:1px solid #2b6681;border-left:13px solid #18b9dc;border-radius:8px 18px 18px 8px;background:linear-gradient(145deg,#0e3347,#081b30);box-shadow:18px 22px 50px #0008;transform:rotate(2deg)}.book small{color:#59dcf9;font-weight:800;letter-spacing:.14em}.book h2{margin:30px 0 14px;font-size:36px;line-height:1}.book p{color:#c7d7e7;line-height:1.5}.book .seal{display:inline-block;margin-top:28px;padding:8px 10px;border:1px solid #ffc247;border-radius:99px;color:#ffc247;font-size:12px;font-weight:800}.proof{padding:20px 0;background:#0b2037;border-block:1px solid #1c3552}.proof-row{display:flex;justify-content:center;gap:28px;flex-wrap:wrap;color:#c7d7e7;font-size:13px}.proof b{color:#fff}.section{padding:64px 0}.section.light{background:#f4f8fb;color:#10243a}.section h2{margin:0;font-size:clamp(30px,5vw,46px);letter-spacing:-.035em}.sub{max-width:650px;color:#5b7085;line-height:1.7}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}.card{padding:24px;border:1px solid #dbe5ec;border-radius:16px;background:#fff;box-shadow:0 8px 24px #2341}.num{color:#078dab;font-size:12px;font-weight:900;letter-spacing:.1em}.card h3{margin:12px 0 8px}.card p{margin:0;color:#5b7085;line-height:1.6}.choice{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px}.choice article{padding:24px;border:1px solid #284763;border-radius:16px;background:#0b2037}.choice h3{color:#58def9}.choice p{color:#b9ccdd;line-height:1.6}.price{padding:62px 0;text-align:center;background:#09283a}.pricebox{width:min(680px,100%);margin:auto;padding:30px;border:1px solid #2e6680;border-radius:20px;background:#071a2d}.amount{margin:8px 0 20px;color:#ffc247;font-size:46px;font-weight:900}.list{display:grid;gap:10px;margin:0 auto 26px;padding:0;max-width:470px;text-align:left;list-style:none}.list li:before{content:"✓";margin-right:10px;color:#58def9;font-weight:900}.faq{max-width:760px}.faq details{padding:17px 0;border-bottom:1px solid #dbe5ec}.faq summary{cursor:pointer;font-weight:800}.faq p{color:#5b7085;line-height:1.6}.sticky{display:none}.footer{padding:25px 0;color:#8099af;text-align:center;font-size:12px}@media(max-width:760px){.safe{display:none}.hero{padding:42px 0 32px}.hero-grid{grid-template-columns:1fr;gap:38px}h1{font-size:48px}.lead{font-size:16px}.book{max-width:270px}.cards,.choice{grid-template-columns:1fr}.section{padding:48px 0}.price{padding:48px 0 90px}.sticky{position:fixed;z-index:10;display:block;left:0;right:0;bottom:0;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:#071426ee;border-top:1px solid #284763}.sticky .cta{width:100%;min-height:48px}.footer{padding-bottom:90px}}
</style>
</head>
<body>
<header class="top"><div class="wrap"><div class="brand"><span class="mark">G</span>GUSTAFTA</div><div class="safe">Pembayaran aman via Scalev.id</div></div></header>
<main>
<section class="hero"><div class="wrap hero-grid"><div><p class="eyebrow">Paket Level 1 · SBU / SKK</p><h1>SBU &amp; SKK<br><span class="gold">Tanpa Bingung.</span></h1><p class="lead">Pahami apa yang perlu disiapkan, rapikan dokumen, dan ukur kesiapan Anda sebelum melangkah lebih jauh.</p><div class="chips"><span class="chip">${SBU_SKK_EBOOK.pages} halaman e-book</span><span class="chip">${SBU_SKK_EBOOK.toolkitPages} halaman toolkit</span><span class="chip">Pilih 1 diagnosis</span></div><a class="cta js-checkout" href="${checkoutUrl}">Dapatkan Level 1 — ${SBU_SKK_EBOOK.priceLabel} &nbsp;→</a><p class="micro">Produk digital · Akses dikirim melalui email setelah pembayaran terverifikasi</p></div><aside class="book" aria-label="Sampul digital SBU dan SKK Tanpa Bingung"><small>GUSTAFTA · LEVEL 1</small><h2>SBU &amp; SKK<br>Tanpa Bingung</h2><p>Panduan kerja untuk legalitas dan kompetensi konstruksi.</p><span class="seal">${SBU_SKK_EBOOK.totalPackagePages} HALAMAN PAKET</span></aside></div></section>
<section class="proof"><div class="wrap proof-row"><span><b>Fokus:</b> langkah yang lebih tertib</span><span><b>Praktis:</b> toolkit siap pakai</span><span><b>Personal:</b> diagnosis pilihan Anda</span></div></section>
<section class="section light"><div class="wrap"><p class="eyebrow">Yang Anda dapatkan</p><h2>Bukan sekadar bacaan.</h2><p class="sub">Satu paket untuk memahami peta masalah, menyiapkan pekerjaan, lalu mengukur kesiapan awal sesuai kebutuhan Anda.</p><div class="cards"><article class="card"><span class="num">01 · PAHAM</span><h3>E-book lengkap</h3><p>${SBU_SKK_EBOOK.pages} halaman panduan SBU–SKK dan arah regulasi baru dalam bahasa kerja yang lebih mudah diikuti.</p></article><article class="card"><span class="num">02 · KERJAKAN</span><h3>Lampiran Toolkit</h3><p>${SBU_SKK_EBOOK.toolkitPages} halaman alat bantu praktis untuk menata persyaratan dan dokumen secara lebih terarah.</p></article><article class="card"><span class="num">03 · UKUR</span><h3>Satu diagnosis</h3><p>Pilih Cek Kesiapan SBU untuk badan usaha atau Cek Kesiapan SKK untuk tenaga kerja konstruksi.</p></article></div></div></section>
<section class="section"><div class="wrap"><p class="eyebrow">Hak diagnosis Level 1</p><h2>Pilih SBU <span class="gold">atau</span> SKK.</h2><div class="choice"><article><h3>Cek Kesiapan SBU</h3><p>Untuk badan usaha: menilai kesiapan awal personel, pengalaman, keuangan, dan dokumen.</p></article><article><h3>Cek Kesiapan SKK</h3><p>Untuk tenaga kerja: menilai target jabatan, pengalaman, portofolio, dan kesiapan uji.</p></article></div></div></section>
<section class="price"><div class="wrap"><div class="pricebox"><p class="eyebrow">Sekali bayar · Level 1</p><h2>Satu paket untuk mulai lebih terarah.</h2><div class="amount">${SBU_SKK_EBOOK.priceLabel}</div><ul class="list"><li>E-book ${SBU_SKK_EBOOK.pages} halaman</li><li>Toolkit ${SBU_SKK_EBOOK.toolkitPages} halaman</li><li>Satu pilihan diagnosis SBU atau SKK</li><li>Akses otomatis setelah pembayaran terverifikasi</li></ul><a class="cta js-checkout" href="${checkoutUrl}">Lanjut ke Pembayaran Aman &nbsp;→</a><p class="micro">Pembayaran diproses oleh Scalev · Produk digital tidak dikirim secara fisik</p></div></div></section>
<section class="section light"><div class="wrap faq"><p class="eyebrow">Pertanyaan singkat</p><h2>Sebelum membeli</h2><details><summary>Apakah saya mendapat diagnosis SBU dan SKK sekaligus?</summary><p>Tidak. Paket Level 1 memberi tepat satu pilihan diagnosis: SBU atau SKK. Pilihan ditentukan setelah akses dibuka.</p></details><details><summary>Kapan akses diberikan?</summary><p>Setelah Scalev menyatakan pembayaran berhasil, sistem mengirimkan akses produk digital ke email pembeli.</p></details><details><summary>Apakah hasil diagnosis merupakan keputusan resmi?</summary><p>Tidak. Diagnosis adalah penilaian kesiapan awal. Keputusan resmi tetap berada pada LPJK, LSBU, LSP, dan otoritas terkait.</p></details></div></section>
</main>
<div class="sticky"><a class="cta js-checkout" href="${checkoutUrl}">Beli Level 1 — ${SBU_SKK_EBOOK.priceLabel}</a></div>
<footer class="footer"><div class="wrap">© Gustafta · AI Specialist Platform · gustafta.my.id</div></footer>
<script>
(function(){
  var checkout=${checkoutJson},content=${contentJson},value=${SBU_SKK_EBOOK.amount};
  function cookie(n){var m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):""}
  var q=new URLSearchParams(location.search),click=q.get("fbclid");
  if(click&&!cookie("_fbc"))document.cookie="_fbc="+encodeURIComponent("fb.1."+Date.now()+"."+click)+"; max-age=7776000; path=/; SameSite=Lax";
  function id(){return crypto.randomUUID?crypto.randomUUID():"evt_"+Date.now()+"_"+Math.random().toString(36).slice(2)}
  function relay(name,eventId){try{fetch("/api/track/meta-event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventName:name,eventId:eventId,value:value,currency:"IDR",contentName:content,contentCategory:"Ebook SBU-SKK",fbp:cookie("_fbp"),fbc:cookie("_fbc"),eventSourceUrl:location.href}),keepalive:true,credentials:"omit"})}catch(e){}}
  function pixel(name,eventId){if(typeof fbq==="function")fbq("track",name,{content_name:content,content_category:"Ebook SBU-SKK",value:value,currency:"IDR"},{eventID:eventId})}
  var viewId=id();relay("ViewContent",viewId);
  fetch("/api/config/meta-pixel",{credentials:"omit"}).then(function(r){return r.json()}).then(function(j){var p=String(j.pixelId||"").replace(/\\D/g,"");if(!p)return;(function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.push=n;n.loaded=true;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init",p);fbq("track","PageView");pixel("ViewContent",viewId)}).catch(function(){});
  document.querySelectorAll(".js-checkout").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var eventId=id();pixel("InitiateCheckout",eventId);relay("InitiateCheckout",eventId);var u=new URL(checkout),fbp=cookie("_fbp"),fbc=cookie("_fbc");if(fbp)u.searchParams.set("fbp",fbp);if(fbc)u.searchParams.set("fbc",fbc);u.searchParams.set("esu",location.href);setTimeout(function(){location.href=u.toString()},90)})});
})();
</script>
</body>
</html>`;
}

export function registerSbuSkkStaticLanding(app: Express): void {
  app.get([SBU_SKK_STATIC_LANDING_PATH, "/sbu-skk-level-1"], (_req, res) => {
    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "X-Robots-Tag": "index, follow",
      "X-Content-Type-Options": "nosniff",
    });
    res.status(200).send(renderLandingPage());
  });
}