# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Menambah level

Semua level ada di `src/game/levels.ts`. Tambahkan objek baru ke `WORLDS`:

```ts
{ name: "Nama Level", par: 20, map: [
  "#######",
  "#  $  #",
  "#  .  #",
  "#  @  #",
  "#######",
] }
```

Simbol: `#` dinding, spasi lantai, `.` goal, `$` kotak, `*` kotak di goal,
`@` pemain, `+` pemain di goal. `par` = jumlah langkah optimal (dasar rating bintang).

## Iklan setelah level selesai

Komponen `src/components/game/AdSlot.tsx` menampilkan banner AdSense pada layar CLEAR
(tidak pernah saat bermain). Aktifkan dengan membuat file `.env`:

```
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_SLOT=1234567890
```

Tanpa kedua nilai itu, slot iklan otomatis disembunyikan.
