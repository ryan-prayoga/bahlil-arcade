// Registry kartu game di hub. Nambah game baru = tambah 1 entry + 1 scene.
// status "active" -> bisa dimainin (sceneKey wajib). "soon" -> kartu Coming Soon.
// iconKey = key tekstur (digambar di BootScene) buat ikon kartu.
// highKey = key localStorage rekor (buat ditampilin per kartu).

import { STORAGE_KEYS } from "../config";

export interface GameEntry {
  id: string;
  title: string;
  tagline: string;
  iconKey: string;
  status: "active" | "soon";
  sceneKey?: string;
  highKey?: string;
}

export const GAMES: GameEntry[] = [
  {
    id: "tangkap-mbg",
    title: "Tangkap MBG",
    tagline: "Sambut yang bergizi, tampik yang basi.",
    iconKey: "mbg",
    status: "active",
    sceneKey: "TangkapMBG",
    highKey: STORAGE_KEYS.highScore,
  },
  {
    id: "bahlil-lari",
    title: "Bahlil Lari",
    tagline: "Lompati hambatan, kejar investasi.",
    iconKey: "player",
    status: "active",
    sceneKey: "BahlilLari",
    highKey: STORAGE_KEYS.highScoreLari,
  },
  {
    id: "antar-mbg",
    title: "Antar MBG",
    tagline: "Salip halangan, antar gizi.",
    iconKey: "truk",
    status: "active",
    sceneKey: "AntarMBG",
    highKey: STORAGE_KEYS.highScoreAntar,
  },
  {
    id: "gepuk-bahlil",
    title: "Gepuk Bahlil",
    tagline: "Gercep sebelum dia kabur.",
    iconKey: "player_panik",
    status: "active",
    sceneKey: "Gepuk",
    highKey: STORAGE_KEYS.highScoreGepuk,
  },
];
