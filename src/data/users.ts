import type { User } from "@/types";

export const users: User[] = [
  {
    id: "user-001",
    name: "Sarah Mitchell",
    nameFa: "حامد فرازی",
    email: "sarah.mitchell@freshflow.co.uk",
    role: "manager",
    roleFa: "مدیر ارشد",
    storeId: "store-001",
  },
  {
    id: "user-002",
    name: "Tom Reeves",
    nameFa: "علی محمدی",
    email: "tom.reeves@freshflow.co.uk",
    role: "staff",
    roleFa: "مسئول انبار",
    storeId: "store-001",
  },
  {
    id: "user-003",
    name: "Amara Diallo",
    nameFa: "مریم امیری",
    email: "amara.diallo@freshflow.co.uk",
    role: "staff",
    roleFa: "مسئول چیدمان",
    storeId: "store-001",
  },
  {
    id: "user-004",
    name: "Jake Brennan",
    nameFa: "امیر حسینی",
    email: "jake.brennan@freshflow.co.uk",
    role: "staff",
    roleFa: "بازرس کیفیت",
    storeId: "store-001",
  },
];
