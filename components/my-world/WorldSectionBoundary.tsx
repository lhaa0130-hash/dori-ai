"use client";

// My World — 섹션 단위 오류 경계.
//  한 카드(일기·방·상호작용)의 렌더 오류가 페이지 전체를 빈 화면으로 만들지 않게 격리한다.
//  Next.js 의 error.tsx 는 라우트 전체를 대체하므로, 카드 단위 격리는 이 경계가 맡는다.
//  ⚠️ 여기서 오류를 삼켜도 데이터는 손상되지 않는다 — 표시만 대체하고 다시 시도할 수 있게 한다.
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  /** 대체 화면에 쓸 섹션 이름 — 사용자가 무엇이 안 보이는지 알 수 있어야 한다. */
  title: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
  /** 재시도 시 하위 트리를 새로 마운트하기 위한 키. */
  attempt: number;
}

export default class WorldSectionBoundary extends Component<Props, State> {
  state: State = { failed: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 개발 중 원인 추적용. 사용자에게는 기술 메시지를 노출하지 않는다.
    if (process.env.NODE_ENV !== "production") {
      console.error(`[My World] ${this.props.title} 렌더 실패`, error, info.componentStack);
    }
  }

  private retry = () => {
    this.setState((prev) => ({ failed: false, attempt: prev.attempt + 1 }));
  };

  render() {
    if (this.state.failed) {
      return (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40 sm:p-5" role="alert">
          <h2 className="text-[15px] font-extrabold text-amber-900 dark:text-amber-100">{this.props.title}</h2>
          <p className="mt-1 break-keep text-[13px] font-semibold text-amber-800 dark:text-amber-200">
            이 부분을 표시하지 못했어요. 다른 기능은 그대로 쓸 수 있어요.
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="mt-3 flex min-h-[44px] items-center rounded-xl bg-white px-4 text-[13px] font-bold text-amber-800 shadow-sm transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] dark:bg-zinc-900 dark:text-amber-200"
          >
            다시 시도
          </button>
        </section>
      );
    }
    return <div key={this.state.attempt}>{this.props.children}</div>;
  }
}
