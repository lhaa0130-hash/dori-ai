// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Bot,
  LineChart,
  MessageSquare,
  ShoppingBag,
  Home
} from "lucide-react";

const navItems = [
  { name: "HOME", href: "/", icon: Home },
  { name: "PROJECT", href: "/project", icon: FolderKanban },
  { name: "AI TOOLS", href: "/ai-tools", icon: Bot },
  { name: "INSIGHT", href: "/insight", icon: LineChart },
  { name: "COMMUNITY", href: "/community", icon: MessageSquare },
  { name: "MARKET", href: "/market", icon: ShoppingBag },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:!bg-black border-r border-neutral-200 dark:border-[#27272a] pt-[80px] px-4 z-40 transition-colors duration-300">
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-200 group text-[14px] font-medium tracking-tight",
                isActive
                  ? "text-orange-600 dark:text-orange-500"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-orange-50 dark:bg-orange-500/10 rounded-2xl"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}

              <item.icon className={cn(
                "w-5 h-5 relative z-10 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-orange-600 dark:text-orange-500" : "text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
              )} />

              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
