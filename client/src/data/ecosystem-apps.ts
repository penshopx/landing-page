import {
  Award,
  Building2,
  LayoutDashboard,
  Shield,
  Users2,
} from "lucide-react";

export const ISO_ECOSYSTEM_APPS = [
  {
    name: "ISO Hub",
    healthHeading: "Operating System Untuk Manajemen ISO Anda",
    icon: Award,
    description: "Ruang kerja terpusat untuk dokumentasi, audit, dan peningkatan berkelanjutan sistem manajemen ISO.",
    href: "https://iso-hub.gustafta.my.id",
    cta: "Buka ISO Hub",
  },
  {
    name: "SMAP–PANCEK",
    healthHeading: "Sistem Manajemen Anti Penyuapan dengan AI",
    icon: Shield,
    description: "Aplikasi khusus antipenyuapan dan pemeriksaan kelayakan untuk mendukung penerapan SMAP yang lebih terstruktur.",
    href: "https://smap-pancek.gustafta.my.id",
    cta: "Buka SMAP–PANCEK",
  },
] as const;

export const PROJECT_ECOSYSTEM_APPS = [
  {
    stage: "01 · RENCANAKAN",
    name: "Rancang–Bangun",
    healthHeading: "Bangun Proyek Impian Anda Lebih Cepat, Lebih Aman, Lebih Terpercaya",
    icon: Building2,
    description: "Perencanaan dan persiapan proyek dari konsep awal hingga pekerjaan siap dilaksanakan.",
    href: "https://rancang-bangun.gustafta.my.id",
  },
  {
    stage: "02 · KENDALIKAN",
    name: "Sistem Informasi Proyek",
    healthHeading: "Proyek Terlihat Jelas. Keputusan Tetap Terkendali.",
    icon: LayoutDashboard,
    description: "Kendalikan data, progres, biaya, dan mutu selama proyek berjalan dalam satu sistem.",
    href: "https://sistem-proyek.gustafta.my.id",
  },
  {
    stage: "03 · HUBUNGKAN",
    name: "TukangConnect",
    healthHeading: "Hubungkan Owner & Boher dengan Tukang, Mandor & Tenaga Ahli Konstruksi",
    icon: Users2,
    description: "Temukan dan hubungkan kebutuhan proyek dengan jaringan tenaga konstruksi.",
    href: "https://tukang-connect.gustafta.my.id",
  },
] as const;