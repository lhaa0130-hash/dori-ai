"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { useRef, useState } from "react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ref.current) {
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      setMousePosition({ x: e.clientX - left, y: e.clientY - top });
    }
  };

  const gradientSize = 150; // Size of the spotlight gradient

  return (
    <motion.div
      ref={ref}
      whileHover={{ scale: 1.02 }} // Card lift effect
      onMouseMove={handleMouseMove}
      className={cn(
        "relative row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 bg-white/5 backdrop-blur-md border border-white/10 justify-between flex flex-col space-y-4 overflow-hidden", // using glassmorphism
        className
      )}
    >
      {/* Spotlight effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 transition duration-300 group-hover/bento:opacity-100"
        style={{
          background: `radial-gradient(${gradientSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 100%)`,
        }}
      />

      {/* Animated Border (placeholder for Border Beam) */}
      <div className="absolute inset-0 rounded-xl pointer-events-none animate-border-glow" />

      <motion.div
        className="group-hover/bento:translate-x-2 transition duration-200"
        whileHover={{ rotate: 5 }} // Icon rotation effect
      >
        {icon}
        <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200 mb-2 mt-2">
          {title}
        </div>
        <div className="font-sans font-normal text-neutral-600 text-xs dark:text-neutral-300">
          {description}
        </div>
      </motion.div>
    </motion.div>
  );
};
