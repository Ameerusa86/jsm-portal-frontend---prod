"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white text-slate-500 text-xs py-4 mt-auto">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
        <p>© {new Date().getFullYear()} EMSMC</p>
        {/* <div className="flex items-center gap-4 text-slate-400">
          <span>Enterprise Portal</span>
          <span>•</span>
          <span>Helpdesk Support</span>
        </div> */}
      </div>
    </footer>
  );
};
