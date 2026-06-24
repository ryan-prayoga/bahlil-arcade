// Quote satir tone "medium" — sindir program/kebijakan (MBG, investasi, proyek),
// bukan serang pribadi. Dipilih acak di layar Game Over. Konten parodi.

export const QUOTES: string[] = [
  "Kotaknya gratis, gizinya kadang offline.",
  "Investasi masuk, gizi keluar — neraca tetap defisit.",
  "Anggaran triliunan, sendoknya tetap dicari.",
  "Yang penting serapan, soal rasa urusan nanti.",
  "Bukan basi, cuma 'belum optimal'.",
  "Target tercapai di atas kertas, mual di lapangan.",
  "Makan bergizi, asal jangan baca komposisinya.",
  "Proyek strategis nasional: tangkap dulu, audit belakangan.",
  "Skor kamu naik, mutu menunya yang turun.",
  "Reshuffle menu lebih sering daripada reshuffle kabinet.",
  "Katanya untuk rakyat, antrenya buat konten.",
  "Gizi seimbang: setengah nasi, setengah pencitraan.",
];

export function randomQuote(rng: () => number = Math.random): string {
  return QUOTES[Math.floor(rng() * QUOTES.length)];
}
