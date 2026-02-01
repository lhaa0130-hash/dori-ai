"use client";

import { useEffect, useRef } from "react";

// CSS to hide scrollbar
const hideScrollbarStyle = `
  .left-side-ad-container::-webkit-scrollbar {
    display: none;
  }
`;

/**
 * Left Side dual floating ad section
 * Symmetric design to RightSideAd
 */
export default function LeftSideAd() {
    const adTopRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLElement>(null);
    const adTopInitialized = useRef(false);

    useEffect(() => {
        // Add scrollbar hide style
        const styleId = "left-side-ad-scrollbar-hide";
        if (typeof document !== "undefined" && !document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = hideScrollbarStyle;
            document.head.appendChild(style);
        }

        const checkAndInit = () => {
            if (typeof window === "undefined") return;

            const isVisible = containerRef.current && containerRef.current.offsetWidth > 0;
            if (!isVisible) {
                setTimeout(checkAndInit, 500);
                return;
            }

            if (!adTopInitialized.current && (window as any).adsbygoogle && adTopRef.current) {
                const adElement = adTopRef.current.querySelector('.adsbygoogle') as HTMLElement;
                if (adElement && adElement.offsetWidth > 0) {
                    try {
                        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                        adTopInitialized.current = true;
                    } catch (e) {
                        console.error("AdSense left ad initialization error:", e);
                    }
                }
            }

            if (!adTopInitialized.current) {
                setTimeout(checkAndInit, 100);
            }
        };

        checkAndInit();
    }, []);

    return (
        <aside
            ref={containerRef}
            className="left-side-ad-container fixed left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col z-40"
            style={{
                width: "160px",
                maxWidth: "200px",
                maxHeight: "90vh",
                overflowY: "auto",
                overflowX: "hidden",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
            }}
        >
            {/* Box */}
            <div
                className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md border border-orange-500 dark:border-orange-500 rounded-2xl p-4 shadow-xl dark:shadow-black/50 transition-colors duration-300"
            >
                {/* Label */}
                <div
                    className="text-[10px] text-orange-500 dark:text-orange-500 tracking-widest uppercase text-center mb-3 font-medium"
                >
                    ADVERTISEMENT
                </div>

                {/* AdSense Area */}
                <div ref={adTopRef} style={{ minHeight: "600px", height: "auto", width: "100%" }}>
                    <ins
                        className="adsbygoogle"
                        style={{
                            display: "block",
                            width: "100%",
                            minHeight: "600px",
                            height: "auto",
                        }}
                        data-ad-client="ca-pub-1868839951780851"
                        data-ad-slot="5937639143" // Using same slot for now, or use a new one if available
                        data-ad-format="auto"
                        data-full-width-responsive="false"
                    />
                </div>
            </div>
        </aside>
    );
}
