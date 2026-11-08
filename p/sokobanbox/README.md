# SOKOBAN // PUSH — HTML biasa

Game ini menggunakan HTML, CSS, dan JavaScript biasa. Tidak perlu memasang aplikasi atau menjalankan proses build.

## Cara membuka

1. Ekstrak ZIP ke satu folder.
2. Buka `index.html` dengan browser modern.
3. Progres dan pengaturan tersimpan di browser yang sama.

Untuk mengubah game, buka folder `js/` dan `css/` di editor HTML Anda. Jangan memindahkan file-file tersebut dari susunan foldernya.

## Menambahkan level

Buka `js/levels.js`, lalu tambahkan data level ke bagian `levels` pada world yang diinginkan:

```js
{ name: "Nama Level", par: 6, map: [
  "#######",
  "#     #",
  "#  $  #",
  "#  .  #",
  "#  @  #",
  "#######"
] }
```

Simbol peta: `#` dinding, spasi lantai, `.` tujuan, `$` kotak, `*` kotak di tujuan, `@` pemain, `+` pemain di tujuan. Jumlah kotak dan tujuan harus sama. `par` adalah patokan jumlah langkah untuk mendapatkan bintang.

## Menaruh iklan setelah level selesai

1. Di akun AdSense, buat unit iklan display dan salin ID penerbit serta ID unit iklan.
2. Buka `js/ads.js`.
3. Isi `client` dengan ID penerbit `ca-pub-...` dan `slot` dengan ID unit iklan:

```js
var ADS_CONFIG = {
  client: "ca-pub-ID_PENERBIT_ANDA",
  slot: "ID_UNIT_IKLAN_ANDA"
};
```

Script AdSense dipanggil otomatis hanya setelah layar `CLEAR` dibuka. Biarkan kedua nilai kosong untuk menyembunyikan iklan. Iklan tidak dapat diuji atau ditayangkan tanpa ID AdSense yang valid; ikuti kebijakan Google dan jangan klik iklan sendiri.

## Kontrol

- Panah atau `WASD`: bergerak
- `U`: undo
- `R`: reset level
- `H`: hint bertingkat
- Pada ponsel, gunakan tombol arah di layar

Game mencakup 18 level, tiga tema (CRT/PAPER/MONO), progres lokal, statistik, achievement, suara opsional, getar, undo, reset, hint, dan slot iklan opsional.