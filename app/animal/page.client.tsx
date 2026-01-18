"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { 
  Database, 
  Image as ImageIcon, 
  Layout, 
  BookOpen,
  Sparkles
} from "lucide-react";

export default function AnimalPageClient() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  // 워크플로우 단계
  const workflowSteps = [
    {
      id: "collect",
      label: "동물 데이터 수집",
      icon: <Database className="w-6 h-6" />,
      color: "#3b82f6",
      glowColor: "rgba(59, 130, 246, 0.4)",
    },
    {
      id: "generate",
      label: "AI 이미지 생성",
      icon: <ImageIcon className="w-6 h-6" />,
      color: "#8b5cf6",
      glowColor: "rgba(139, 92, 246, 0.4)",
    },
    {
      id: "layout",
      label: "도감 레이아웃 구성",
      icon: <Layout className="w-6 h-6" />,
      color: "#ec4899",
      glowColor: "rgba(236, 72, 153, 0.4)",
    },
    {
      id: "complete",
      label: "도감 완성",
      icon: <BookOpen className="w-6 h-6" />,
      color: "#10b981",
      glowColor: "rgba(16, 185, 129, 0.4)",
    },
  ];

  return (
    <main 
      className="animal-page"
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        paddingTop: '80px',
      }}
    >
      {/* 오로라 배경 효과 */}
      <div className="aurora-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Hero Section */}
      <section 
        className="animal-hero-section"
        style={{
          minHeight: '60vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '80px 24px',
        }}
      >
        <div className="animal-header fade-in-up">
          <h1>DORI'S 동물도감</h1>
          
          {/* 알록달록 움직이는 그라데이션 바 */}
          <div className="colorful-bar fade-in-up delay-1">
            <div className="gradient-bar animated-gradient"></div>
          </div>

          <p className="animal-description">
            아이들의 상상력을 자극하는 AI 기반 맞춤형 동물 백과사전
          </p>
        </div>

        {/* 워크플로우 애니메이션 */}
        <div className="workflow-container fade-in-up delay-2">
          <div className="workflow-steps">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="workflow-step-wrapper">
                {/* 워크플로우 아이템 */}
                <div 
                  className="workflow-step"
                  style={{
                    animation: `fadeInUpStagger 0.8s ease-out ${index * 0.2 + 0.5}s both`,
                  }}
                >
                  <div
                    className="workflow-icon-container"
                    style={{
                      background: isDark
                        ? 'rgba(15, 23, 42, 0.6)'
                        : 'rgba(255, 255, 255, 0.8)',
                      border: isDark
                        ? `1.5px solid ${step.color}40`
                        : `1.5px solid ${step.color}30`,
                      color: step.color,
                      boxShadow: isDark
                        ? `0 0 20px ${step.color}40, 0 0 40px ${step.color}20, inset 0 0 20px ${step.color}10`
                        : `0 0 15px ${step.color}30, 0 0 30px ${step.color}15`,
                      animation: `workflowIconPulse 2.5s ease-in-out infinite ${index * 0.4}s`,
                    }}
                  >
                    {step.icon}
                    {/* 내부 글로우 */}
                    <div 
                      className="workflow-inner-glow"
                      style={{
                        background: `radial-gradient(circle at center, ${step.color}25, transparent 70%)`,
                        animation: `workflowInnerGlow 2.5s ease-in-out infinite ${index * 0.4}s`,
                        opacity: 0.6,
                      }}
                    />
                    {/* 외부 글로우 링 */}
                    <div 
                      className="workflow-outer-glow"
                      style={{
                        background: `radial-gradient(circle, ${step.color}30, transparent 70%)`,
                        filter: 'blur(8px)',
                        animation: `workflowOuterGlow 2.5s ease-in-out infinite ${index * 0.4}s`,
                        opacity: 0.4,
                      }}
                    />
                  </div>
                  <span 
                    className="workflow-label"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {/* 연결선 및 애니메이션 글로우 */}
                {index < workflowSteps.length - 1 && (
                  <div className="workflow-connector-wrapper">
                    {/* 정적 배경선 */}
                    <div 
                      className="workflow-line-bg"
                      style={{
                        background: isDark
                          ? `linear-gradient(90deg, ${step.color}30, ${workflowSteps[index + 1].color}30)`
                          : `linear-gradient(90deg, ${step.color}20, ${workflowSteps[index + 1].color}20)`,
                      }}
                    />
                    {/* 애니메이션 글로우 (동글동글한 효과) */}
                    <div
                      className="workflow-glow-animation"
                      style={{
                        background: `radial-gradient(circle, ${step.color}, transparent)`,
                        animation: `workflowGlowMove 3s ease-in-out infinite ${index * 0.3}s`,
                        filter: 'blur(12px)',
                        opacity: 0.6,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 갤러리 섹션 (Placeholder) */}
      <section 
        className="animal-gallery-section"
        style={{
          width: '100%',
          padding: '80px 24px',
          position: 'relative',
        }}
      >
        <div className="container max-w-7xl mx-auto">
          <div className="gallery-header">
            <h2 
              className="gallery-title"
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
              }}
            >
              동물 도감 갤러리
            </h2>
            <p 
              className="gallery-subtitle"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              }}
            >
              곧 Notion DB와 연결되어 다양한 동물 정보를 만나볼 수 있습니다
            </p>
          </div>

          {/* Skeleton 카드 그리드 */}
          <div className="gallery-grid">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="gallery-card-skeleton"
                style={{
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(0, 0, 0, 0.01)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: isDark
                    ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                    : '0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  animation: `fadeInUpStagger 0.8s ease-out ${index * 0.1 + 1}s both`,
                }}
              >
                {/* Glassmorphism 오버레이 */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, transparent 50%, rgba(0, 0, 0, 0.02) 100%)',
                  }}
                />
                
                {/* 이미지 placeholder */}
                <div 
                  className="skeleton-image"
                  style={{
                    background: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <Sparkles 
                    className="w-12 h-12"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </div>
                
                {/* 텍스트 placeholder */}
                <div className="skeleton-content">
                  <div 
                    className="skeleton-line skeleton-title"
                    style={{
                      background: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.08)',
                    }}
                  />
                  <div 
                    className="skeleton-line skeleton-text"
                    style={{
                      background: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <div 
                    className="skeleton-line skeleton-text short"
                    style={{
                      background: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.05)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 스타일 */}
      <style jsx global>{`
        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUpStagger {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes workflowIconPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.1);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.4), inset 0 0 30px rgba(59, 130, 246, 0.2);
            transform: scale(1.02);
          }
        }

        @keyframes workflowInnerGlow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes workflowOuterGlow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        @keyframes workflowGlowMove {
          0% {
            transform: translateX(-100%) scale(1);
            opacity: 0;
          }
          50% {
            transform: translateX(0%) scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: translateX(100%) scale(1);
            opacity: 0;
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .delay-1 {
          animation-delay: 0.1s;
        }

        .delay-2 {
          animation-delay: 0.2s;
        }

        /* Aurora Background */
        .aurora-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: blobFloat 20s ease-in-out infinite;
        }

        .blob-1 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          top: -200px;
          left: -200px;
        }

        .blob-2 {
          width: 450px;
          height: 450px;
          background: linear-gradient(135deg, #ec4899, #f472b6);
          bottom: -200px;
          right: -200px;
          animation-delay: 2s;
        }

        @keyframes blobFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(50px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-50px, 50px) scale(0.9);
          }
        }

        /* Hero Section */
        .animal-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .animal-header h1 {
          font-size: 64px;
          font-weight: 700;
          margin-bottom: 32px;
          color: ${isDark ? '#ffffff' : '#111'};
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .animal-description {
          font-size: 20px;
          font-weight: 400;
          color: ${isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'};
          margin: 0;
          line-height: 1.7;
          letter-spacing: -0.01em;
        }

        /* 알록달록 움직이는 그라데이션 바 */
        .colorful-bar {
          max-width: 700px;
          margin: 0 auto 36px;
          padding: 0;
        }

        .gradient-bar {
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: linear-gradient(90deg, 
            #ff6b9d 0%, 
            #ff8c42 25%, 
            #ffd23f 50%, 
            #06ffa5 75%, 
            #4ecdc4 100%
          );
          background-size: 200% 100%;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }

        .animated-gradient {
          animation: gradientMove 3s ease infinite;
        }

        /* Workflow Container */
        .workflow-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .workflow-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 2rem;
          position: relative;
        }

        .workflow-step-wrapper {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .workflow-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        .workflow-icon-container {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
        }

        .workflow-inner-glow,
        .workflow-outer-glow {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
        }

        .workflow-label {
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        /* Workflow Connector */
        .workflow-connector-wrapper {
          position: relative;
          width: 120px;
          height: 2px;
          min-width: 80px;
        }

        .workflow-line-bg {
          position: absolute;
          inset: 0;
          border-radius: 2px;
        }

        .workflow-glow-animation {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
        }

        /* Gallery Section */
        .gallery-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .gallery-title {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
        }

        .gallery-subtitle {
          font-size: 18px;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .gallery-card-skeleton {
          border-radius: 1.5rem;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .skeleton-image {
          width: 100%;
          aspect-ratio: 16 / 10;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .skeleton-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }

        .skeleton-line {
          height: 1rem;
          border-radius: 0.5rem;
          animation: skeletonPulse 2s ease-in-out infinite;
        }

        .skeleton-title {
          height: 1.5rem;
          width: 70%;
        }

        .skeleton-text {
          width: 100%;
        }

        .skeleton-text.short {
          width: 60%;
        }

        @keyframes skeletonPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* 반응형 */
        @media (max-width: 768px) {
          .animal-header h1 {
            font-size: 42px;
          }

          .animal-description {
            font-size: 16px;
          }

          .workflow-steps {
            flex-direction: column;
            gap: 3rem;
          }

          .workflow-step-wrapper {
            flex-direction: column;
            gap: 1rem;
          }

          .workflow-connector-wrapper {
            width: 2px;
            height: 60px;
            transform: rotate(90deg);
          }

          .workflow-glow-animation {
            width: 40px;
            height: 40px;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
          }

          .gallery-grid {
            grid-template-columns: 1fr;
          }

          .gallery-title {
            font-size: 32px;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .workflow-steps {
            gap: 1.5rem;
          }

          .workflow-connector-wrapper {
            width: 100px;
          }

          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </main>
  );
}

