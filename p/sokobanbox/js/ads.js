// =============================================================
//  IKLAN — hanya tampil di layar CLEAR (setelah level selesai).
//  TEMPAT MENGISI IKLAN: ganti client dan slot di ADS_CONFIG di bawah.
//  client = ID penerbit (ca-pub-...), slot = ID unit iklan dari AdSense.
//  Iklan baru dimuat setelah level CLEAR; jangan tempel kode script AdSense lain di index.html.
//  Biarkan kosong ("") jika tidak ingin memakai iklan.
// =============================================================
var ADS_CONFIG = {
  client: "", // contoh: "ca-pub-1234567890123456"
  slot: "" // contoh: "1234567890"
};

var _adsScriptLoaded = false;

function ensureAdsScript(client) {
  if (_adsScriptLoaded) return;
  _adsScriptLoaded = true;
  var s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(client);
  document.head.appendChild(s);
}

/** Render iklan ke dalam elemen container. Aman jika offline / diblokir. */
function showAd(container) {
  container.innerHTML = "";
  if (!ADS_CONFIG.client || !ADS_CONFIG.slot) return;
  try {
    ensureAdsScript(ADS_CONFIG.client);
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.style.minHeight = "100px";
    ins.setAttribute("data-ad-client", ADS_CONFIG.client);
    ins.setAttribute("data-ad-slot", ADS_CONFIG.slot);
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    container.appendChild(ins);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    container.innerHTML = "";
  }
}

/** Bersihkan slot iklan saat overlay ditutup. */
function clearAd(container) {
  container.innerHTML = "";
}
