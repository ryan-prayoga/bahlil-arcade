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
  "Keracunan itu plus-minus biasa — tinggal dimitigasi dan disiasati.",
  "Kata Pak Menteri, nggak viral nggak top. Nih, kamu udah top.",
  "37 ribu korban, anggaran tetap terserap 93 persen. Mantap.",
  "Baru 56 persen dapur lulus higiene, sisanya lulus pasrah.",
  "Rp1 miliar sebulan per dapur, sendok plastiknya masih dihitung.",
  "70 persen buat bahan baku, 30 persen buat doa biar nggak basi.",
  "Gizinya gratis, ongkos cuci lambung tanggung sendiri.",
  "Doktor kelar 1 tahun 8 bulan, sertifikat dapur entah tahun berapa.",
  "Ngurus migas sama partai aja repot, apalagi ngecek nasimu.",
  "Anggaran Rp335 triliun, yang nyampe piring tinggal micin.",
  "Antre LPG belum kelar, sekarang gantian antre ke UGD.",
  "Target 60 juta penerima, bonus 37 ribu pasien.",
  "Menu ganti tiap minggu, yang konsisten cuma sakit perutnya.",
  "Yang penting serapan anggaran — serapan gizi nanti dulu.",
  "Jawa Tengah juara korban, pialanya sekotak nasi basi.",
  "Dari jualan kue sampai atur negara, ujian mutunya tetap nggak lulus.",
];

export function randomQuote(rng: () => number = Math.random): string {
  return QUOTES[Math.floor(rng() * QUOTES.length)];
}
