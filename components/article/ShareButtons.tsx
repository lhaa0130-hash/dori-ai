"use client";

import { useState } from "react";
import { Copy, Check, Twitter, MessageCircle } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKakao = () => {
    window.open(
      `https://story.kakao.com/share?url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mr-1">공유</span>

      {/* 카카오톡 */}
      <button
        onClick={handleKakao}
        title="카카오톡으로 공유"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEE500] text-[#3C1E1E] text-xs font-bold hover:bg-[#F5D800] hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>카카오</span>
      </button>

      {/* 트위터/X */}
      <button
        onClick={handleTwitter}
        title="X(트위터)로 공유"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:opacity-80 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
      >
        <Twitter className="w-3.5 h-3.5" />
        <span>X</span>
      </button>

      {/* 링크 복사 */}
      <button
        onClick={handleCopy}
        title="링크 복사"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm ${
          copied
            ? "bg-green-500 text-white"
            : "bg-[#F9954E] text-white hover:bg-[#E8832E]"
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>복사됨!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>링크 복사</span>
          </>
        )}
      </button>
    </div>
  );
}
