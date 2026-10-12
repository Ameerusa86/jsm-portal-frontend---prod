"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface TechnologyCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  gradientFrom: string;
  gradientTo: string;
}

export const TechnologyCard: React.FC<TechnologyCardProps> = ({
  title,
  description,
  icon: Icon,
  href,
  gradientFrom,
  gradientTo,
}) => {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between text-left bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden cursor-pointer h-full`}
    >
      <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-70 group-hover:opacity-100 transition-opacity`} />
      
      <div>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white group-hover:scale-110`}
          >
            <Icon className="w-7 h-7" />
          </div>
        </div>

        <h3 className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors text-lg sm:text-xl leading-snug tracking-tight mb-2">
          {title}
        </h3>

        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-end text-sm text-blue-600 font-semibold group-hover:text-blue-700">
        <span className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
          <span>Browse Request Types</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
};
