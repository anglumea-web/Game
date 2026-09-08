// =============================================================
//  AD SLOT — iklan opsional yang tampil SETELAH level selesai.
//  Tidak pernah muncul saat bermain, sesuai prinsip "no noise".
//
//  Cara pakai:
//  1. Buat file .env di root project, isi:
//       VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
//       VITE_ADSENSE_SLOT=1234567890
//  2. Restart dev server. Tanpa dua nilai itu, slot iklan
//     otomatis disembunyikan (mode gratis / offline tetap bersih).
// =============================================================
import { useEffect, useRef } from "react";

const CLIENT = import.meta.env["VITE_ADSENSE_CLIENT"] as string | undefined;
const SLOT = import.meta.env["VITE_ADSENSE_SLOT"] as string | undefined;

const SCRIPT_ID = "adsbygoogle-js";

function ensureScript(client: string) {
  if (typeof document === "undefined" || document.getElementById(SCRIPT_ID)) return;
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  document.head.appendChild(s);
}

/** Banner iklan pada layar CLEAR. Render null kalau belum dikonfigurasi. */
export function AdSlot() {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !SLOT || pushed.current) return;
    ensureScript(CLIENT);
    pushed.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle ?? [];
      w.adsbygoogle.push({});
    } catch {
      /* pemblokir iklan / offline — abaikan */
    }
  }, []);

  if (!CLIENT || !SLOT) return null;

  return (
    <div className="mt-6 border-t border-border pt-3">
      <p className="mb-2 text-[9px] tracking-[0.3em] text-muted-foreground">ADVERTISEMENT</p>
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: "block", minHeight: 100 }}
        data-ad-client={CLIENT}
        data-ad-slot={SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
