import {
  Wrench,
  KeyRound,
  Layers,
  Laptop,
  AlertOctagon,
  Users,
  Wifi,
  ShieldCheck,
  Building,
  Sparkles,
  LucideIcon,
  HelpCircle,
} from "lucide-react";

export function getGroupIcon(groupName: string): LucideIcon {
  const name = groupName.toLowerCase();
  if (name.includes("hardware") || name.includes("laptop") || name.includes("equipment")) return Laptop;
  if (name.includes("access") || name.includes("password") || name.includes("permission") || name.includes("security")) return KeyRound;
  if (name.includes("software") || name.includes("license") || name.includes("application")) return Layers;
  if (name.includes("network") || name.includes("wifi") || name.includes("vpn")) return Wifi;
  if (name.includes("repair") || name.includes("broken") || name.includes("maintenance")) return Wrench;
  if (name.includes("incident") || name.includes("outage") || name.includes("urgent")) return AlertOctagon;
  if (name.includes("onboard") || name.includes("hire") || name.includes("people") || name.includes("hr")) return Users;
  if (name.includes("building") || name.includes("badge") || name.includes("office") || name.includes("facility")) return Building;
  if (name.includes("cloud") || name.includes("aws") || name.includes("gcp")) return Sparkles;
  if (name.includes("security") || name.includes("audit")) return ShieldCheck;
  return HelpCircle;
}

export function getGroupColor(groupName: string) {
  const name = groupName.toLowerCase();
  if (name.includes("hardware") || name.includes("laptop")) return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", hoverBg: "hover:bg-purple-50/80 hover:border-purple-300", ring: "focus:ring-purple-500/20" };
  if (name.includes("access") || name.includes("password")) return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", hoverBg: "hover:bg-blue-50/80 hover:border-blue-300", ring: "focus:ring-blue-500/20" };
  if (name.includes("software") || name.includes("license")) return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", hoverBg: "hover:bg-indigo-50/80 hover:border-indigo-300", ring: "focus:ring-indigo-500/20" };
  if (name.includes("network") || name.includes("wifi")) return { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", hoverBg: "hover:bg-cyan-50/80 hover:border-cyan-300", ring: "focus:ring-cyan-500/20" };
  if (name.includes("repair") || name.includes("broken")) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", hoverBg: "hover:bg-amber-50/80 hover:border-amber-300", ring: "focus:ring-amber-500/20" };
  if (name.includes("incident") || name.includes("outage")) return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", hoverBg: "hover:bg-rose-50/80 hover:border-rose-300", ring: "focus:ring-rose-500/20" };
  if (name.includes("onboard") || name.includes("people")) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", hoverBg: "hover:bg-emerald-50/80 hover:border-emerald-300", ring: "focus:ring-emerald-500/20" };
  
  // Default color
  return {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    hoverBg: "hover:bg-slate-50/80 hover:border-slate-300",
    ring: "focus:ring-slate-500/20",
  };
}
