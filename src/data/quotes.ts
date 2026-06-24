// Quote satir tone "medium-tajam" buat layar Game Over. Disindir: program MBG,
// Badan Gizi Nasional (BGN), dan pernyataan publik Bahlil. Konten parodi.
//
// Acuan fakta (riset Jun 2026, biar nyentuh bukan generik):
// - ~37 ribu korban keracunan MBG (Jan 2025–Mei 2026); Jateng tertinggi.
// - Baru ~56,72% dapur (SPPG) kantongi Sertifikat Laik Higiene Sanitasi (SLHS).
// - Anggaran MBG 2026 ~Rp268T (BGN) / Rp335T (Dadan Hindayana); tiap SPPG ~Rp1M/bln;
//   split 70% bahan / 20% operasional / 10% mitra; klaim 93% terserap; target ~60jt.
// - Bahlil: Menteri ESDM + Ketum Golkar, "doktor kilat" 1th8bln, "Raja Jawa",
//   LPG 3kg bikin antre. Quote viral: "nggak viral nggak top... plus-minus biasa,
//   tinggal dimitigasi dan disiasati."

export const QUOTES: string[] = [
  "Selamat! Menu gratis, tiket UGD bonus.",
  "Gizi seimbang: setengah nasi, setengah bakteri.",
  "Nasinya gratis, rawat inapnya yang mahal.",
  "Mama: jangan jajan sembarangan. Negara: nih, gratis.",
  "Bukan basi, ayamnya lagi healing.",
  "Telur satu dibagi sekelas — adil, kan?",
  "Kata Mas Bahlil: nggak viral nggak top. Selamat, kamu trending.",
  "Keracunan itu plus-minus biasa, katanya. Mitigasi sendiri ya.",
  "Beliau doktor 1,5 tahun, dapurnya masih 'sertifikat menyusul'.",
  "Sibuk ngurus bensin sama partai, nasimu antre belakangan.",
  "Mas Bahlil ganteng, sayang ayamnya nggak se-fresh senyumnya.",
  "Anggaran triliunan, micin tetap pemain inti.",
  "Grup WA wali murid udah ramai, rapatnya masih 'evaluasi'.",
  "Katanya buat masa depan bangsa — masa depanmu di kasur tiga hari.",
  "Programnya lancar jaya, kamu yang nggak bisa jalan.",
  "Yang penting fotonya senyum, isinya urusan nanti.",
];

export function randomQuote(rng: () => number = Math.random): string {
  return QUOTES[Math.floor(rng() * QUOTES.length)];
}
