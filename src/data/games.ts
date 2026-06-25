// Registry kartu game di hub. Nambah game baru = tambah 1 entry + 1 scene.
// status "active" -> bisa dimainin (sceneKey wajib). "soon" -> kartu Coming Soon.
// iconKey = key tekstur (digambar di BootScene) buat ikon kartu.

export interface GameEntry {
  id: string;
  title: string;
  tagline: string;
  iconKey: string;
  status: "active" | "soon";
  sceneKey?: string;
}

export const GAMES: GameEntry[] = [
  {
    id: "tangkap-mbg",
    title: "Tangkap MBG",
    tagline: "Sambut yang bergizi, tampik yang basi.",
    iconKey: "mbg",
    status: "active",
    sceneKey: "TangkapMBG",
  },
  {
    id: "bahlil-lari",
    title: "Bahlil Lari",
    tagline: "Lompati hambatan, kejar investasi.",
    iconKey: "player",
    status: "active",
    sceneKey: "BahlilLari",
  },
  {
    id: "bagi-bagi-mbg",
    title: "Bagi-bagi",
    tagline: "Satu ketuk, anggaran melonjak.",
    iconKey: "koin",
    status: "active",
    sceneKey: "BagiBagi",
  },
  {
    id: "gepuk-bahlil",
    title: "Gepuk Bahlil",
    tagline: "Gercep sebelum dia kabur.",
    iconKey: "player_panik",
    status: "active",
    sceneKey: "Gepuk",
  },
];
