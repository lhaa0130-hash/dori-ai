"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const AnimatedGradient = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden", // Ensure relative positioning for absolute children
        className
      )}
      {...props}
    >
      {/* Mesh Gradient Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-60 dark:opacity-40" // Adjust opacity for subtle effect
        style={{
          background: `
            radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 30% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 70% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)
          `,
          backgroundSize: "200% 200%",
          animation: "mesh-gradient-animation 15s ease infinite alternate",
        }}
      ></div>

      {/* Noise Texture Overlay */}
      <div
        className="absolute inset-0 z-10 opacity-10 pointer-events-none" // Subtle noise, non-interactive
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "100px 100px", // Adjust as needed
        }}
      ></div>

      {/* Tailwind CSS Keyframe for Mesh Gradient */}
      <style jsx global>{`
        @keyframes mesh-gradient-animation {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 100%;
          }
        }
      `}</style>
    </div>
  );
});

AnimatedGradient.displayName = "AnimatedGradient";