"use client";

import { useState } from "react";
import { Copy, Check, Mail, X as XIcon } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

// 위챗 QR 팝업
function WeChatModal({ url, onClose }: { url: string; onClose: () => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3 max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
          위챗(WeChat)으로 공유
        </p>
        <p className="text-xs text-neutral-500 text-center">
          QR코드를 위챗 앱으로 스캔하세요
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="WeChat QR Code" width={200} height={200} className="rounded-xl border border-neutral-100 dark:border-zinc-700" />
        <button
          onClick={onClose}
          className="mt-1 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

const SHARE_ITEMS = [
  {
    id: "kakao",
    label: "카카오톡",
    color: "#FEE500",
    textColor: "#3C1E1E",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.518 5.077 3.816 6.535L4.8 21l4.41-2.397A11.4 11.4 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
      </svg>
    ),
    action: (url: string, title: string) => {
      const encoded = encodeURIComponent(url);
      const encodedTitle = encodeURIComponent(title);
      window.open(
        `https://story.kakao.com/share?url=${encoded}&text=${encodedTitle}`,
        "_blank",
        "noopener,noreferrer,width=600,height=500"
      );
    },
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    textColor: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
    action: (url: string, title: string) => {
      const text = encodeURIComponent(`${title}\n${url}`);
      window.open(
        `https://api.whatsapp.com/send?text=${text}`,
        "_blank",
        "noopener,noreferrer,width=600,height=500"
      );
    },
  },
  {
    id: "telegram",
    label: "텔레그램",
    color: "#26A5E4",
    textColor: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.820 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    action: (url: string, title: string) => {
      const encoded = encodeURIComponent(url);
      const encodedTitle = encodeURIComponent(title);
      window.open(
        `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`,
        "_blank",
        "noopener,noreferrer,width=600,height=500"
      );
    },
  },
  {
    id: "line",
    label: "라인",
    color: "#06C755",
    textColor: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
      </svg>
    ),
    action: (url: string, title: string) => {
      window.open(
        `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        "_blank",
        "noopener,noreferrer,width=600,height=500"
      );
    },
  },
  {
    id: "facebook",
    label: "페이스북",
    color: "#1877F2",
    textColor: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    action: (url: string) => {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,noreferrer,width=600,height=500"
      );
    },
  },
  {
    id: "twitter",
    label: "X(트위터)",
    color: "#000",
    textColor: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.835L2.195 2.25H8.94l4.272 5.65zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    action: (url: string, title: string) => {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        "_blank",
        "noopener,noreferrer,width=600,height=500"
      );
    },
  },
  {
    id: "wechat",
    label: "위챗",
    color: "#07C160",
    textColor: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.912 3.12c.535 0 .969.44.969.982a.976.976 0 0 1-.969.982.976.976 0 0 1-.969-.982c0-.542.434-.982.969-.982zm3.952 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.982.976.976 0 0 1-.969-.982c0-.542.434-.982.969-.982z"/>
      </svg>
    ),
    action: null, // WeChat은 QR 코드 팝업
  },
  {
    id: "email",
    label: "이메일",
    color: "#6B7280",
    textColor: "#fff",
    icon: <Mail className="w-4 h-4" />,
    action: (url: string, title: string) => {
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`;
    },
  },
];

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showWechat, setShowWechat] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {showWechat && (
        <WeChatModal url={url} onClose={() => setShowWechat(false)} />
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">공유하기</span>

        <div className="flex items-center gap-2 flex-wrap">
          {SHARE_ITEMS.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => {
                  if (item.id === "wechat") {
                    setShowWechat(true);
                  } else if (item.action) {
                    item.action(url, title);
                  }
                }}
                onMouseEnter={() => setTooltip(item.id)}
                onMouseLeave={() => setTooltip(null)}
                title={item.label}
                style={{ backgroundColor: item.color, color: item.textColor }}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
              >
                {item.icon}
              </button>
              {tooltip === item.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-medium whitespace-nowrap pointer-events-none z-10">
                  {item.label}
                </div>
              )}
            </div>
          ))}

          {/* 링크 복사 */}
          <div className="relative">
            <button
              onClick={handleCopy}
              onMouseEnter={() => setTooltip("copy")}
              onMouseLeave={() => setTooltip(null)}
              title="링크 복사"
              className={`flex items-center justify-center w-8 h-8 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-[#F9954E] text-white"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            {tooltip === "copy" && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-medium whitespace-nowrap pointer-events-none z-10">
                {copied ? "복사됨!" : "링크 복사"}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
