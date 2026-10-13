"use client";

import React from "react";
import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TechnologyCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  gradientFrom: string;
  gradientTo: string;
}

export const TechnologyCard: React.FC<TechnologyCardProps> = ({
  title,
  icon: Icon,
  href,
  gradientFrom,
  gradientTo,
}) => {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between text-left bg-white hover:bg-linear-to-b hover:from-white hover:to-slate-50/70 rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-blue-400/80 p-5 sm:p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden cursor-pointer min-h-[140px] sm:min-h-[150px]"
    >
      {/* Top Gradient Accent Bar */}
      <div
        className={`absolute top-0 inset-x-0 h-1 bg-linear-to-r ${gradientFrom} ${gradientTo} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Top Row: Domain Icon + Explore Arrow Button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md bg-linear-to-br ${gradientFrom} ${gradientTo} text-white group-hover:scale-105 group-hover:shadow-lg`}
        >
          <Icon className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
        </div>

        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all text-slate-400 shrink-0">
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Bottom Area: Title */}
      <div>
        <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-base sm:text-lg leading-snug tracking-tight break-words">
          {title}
        </h3>
      </div>
    </Link>
  );
};
