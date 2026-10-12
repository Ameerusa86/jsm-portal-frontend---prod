"use client";

import React from "react";
import { RequestType } from "@/types/jsm";
import {
  Laptop,
  Wifi,
  KeyRound,
  Users,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ServiceCardProps {
  requestType: RequestType & { group?: string };
  boardName?: string;
  onClick: () => void;
  variant?: "grid" | "list";
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  requestType,
  boardName,
  onClick,
  variant = "grid",
}) => {
  const getMetadata = () => {
    const text = `${requestType.name} ${requestType.description || ""} ${requestType.group || ""}`.toLowerCase();

    // Dynamically assign icons and colors based on keywords
    let icon = FileText;
    let bg = "bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-slate-800 group-hover:text-white";

    if (
      text.includes("vpn") ||
      text.includes("wifi") ||
      text.includes("network") ||
      text.includes("connect") ||
      text.includes("internet")
    ) {
      icon = Wifi;
      bg = "bg-blue-50 text-blue-600 border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white";
    } else if (
      text.includes("password") ||
      text.includes("access") ||
      text.includes("login") ||
      text.includes("locked") ||
      text.includes("account") ||
      text.includes("permission") ||
      text.includes("mfa") ||
      text.includes("security")
    ) {
      icon = KeyRound;
      bg = "bg-amber-50 text-amber-600 border-amber-200/80 group-hover:bg-amber-600 group-hover:text-white";
    } else if (
      text.includes("hardware") ||
      text.includes("laptop") ||
      text.includes("computer") ||
      text.includes("mac") ||
      text.includes("screen") ||
      text.includes("monitor") ||
      text.includes("device") ||
      text.includes("broken") ||
      text.includes("repair")
    ) {
      icon = Laptop;
      bg = "bg-purple-50 text-purple-600 border-purple-200/80 group-hover:bg-purple-600 group-hover:text-white";
    } else if (
      text.includes("software") ||
      text.includes("license") ||
      text.includes("app") ||
      text.includes("tool") ||
      text.includes("install") ||
      text.includes("saas")
    ) {
      icon = Layers;
      bg = "bg-indigo-50 text-indigo-600 border-indigo-200/80 group-hover:bg-indigo-600 group-hover:text-white";
    } else if (
      text.includes("onboard") ||
      text.includes("employee") ||
      text.includes("user") ||
      text.includes("team") ||
      text.includes("contractor") ||
      text.includes("badge")
    ) {
      icon = Users;
      bg = "bg-emerald-50 text-emerald-600 border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white";
    } else if (
      text.includes("incident") ||
      text.includes("bug") ||
      text.includes("error") ||
      text.includes("urgent") ||
      text.includes("outage")
    ) {
      icon = AlertCircle;
      bg = "bg-rose-50 text-rose-600 border-rose-200/80 group-hover:bg-rose-600 group-hover:text-white";
    }

    return {
      icon,
      bg,
    };
  };

  const { icon: IconComponent, bg } = getMetadata();

  // -------------------------------------------------------------
  // VARIANT 1: COMPACT LIST VIEW
  // -------------------------------------------------------------
  if (variant === "list") {
    return (
      <button
        onClick={onClick}
        className="group w-full p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${bg}`}
          >
            <IconComponent className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base leading-snug tracking-tight">
                {requestType.name}
              </h3>
              {boardName && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                  {boardName}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
              {requestType.description || "Submit a request to the IT team."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-blue-600 group-hover:border-blue-600 text-slate-700 group-hover:text-white text-xs font-semibold transition-all duration-300">
            <span>Start</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </button>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 2: ENHANCED GRID VIEW
  // -------------------------------------------------------------
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col justify-between text-left bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full h-full cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-100 group-hover:bg-blue-500 transition-colors duration-300" />

      <div>
        <div className="flex items-start justify-between mb-5 gap-2">
          <div
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 shadow-sm shrink-0 ${bg}`}
          >
            <IconComponent className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
          </div>
          {boardName && (
            <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-lg border border-slate-200/60 line-clamp-2 text-right">
              {boardName}
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors text-base sm:text-lg leading-snug tracking-tight mb-2">
          {requestType.name}
        </h3>

        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {requestType.description ||
            "Submit a structured ticket request for our IT and operations teams."}
        </p>
      </div>

      <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-end text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-blue-600 group-hover:border-blue-600 text-slate-700 group-hover:text-white text-xs font-semibold transition-all duration-300">
          <span>Request</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </button>
  );
};
