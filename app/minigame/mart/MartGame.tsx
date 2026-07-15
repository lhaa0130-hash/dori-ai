"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Lightbulb, LockKeyhole, PackagePlus, Pause, RotateCcw, Settings, Volume2, VolumeX, Vibrate } from "lucide-react";
import IlloGameShell from "@/components/game/illo-play/IlloGameShell";
import IlloGameDialog from "@/components/game/illo-play/IlloGameDialog";
import IlloGameResult from "@/components/game/illo-play/IlloGameResult";
import levelsJson from "@/data/minigames/mart-levels.json";
import { loadGameState, saveGameState } from "@/lib/gameSave";
import { trackGameEvent } from "@/lib/minigames/analytics";
import { getMiniGame } from "@/lib/minigames/registry";
import {
  PRODUCT_CATALOG,
  addBasketShelf,
  calculateStars,
  canMove,
  createInitialState,
  moveItem,
  undoMove,
  type MartLevel,
  type MartState,
  type ProductCategory,
  type ProductId,
} from "@/lib/minigames/mart-engine";
import {
  DEFAULT_ILLO_PLAY_PROGRESS,
  clearLocalRun,
  normalizeProgress,
  readLocalRun,
  readLocalProgress,
  writeLocalRun,
  writeLocalProgress,
} from "@/lib/minigames/storage";
import type { IlloPlayProgress } from "@/lib/minigames/types";

const LEVELS = levelsJson as MartLevel[];
const ERROR_MESSAGES = {
  "same-shelf": "같은 선반이에요.",
  "source-empty": "옮길 상품이 없어요.",
  "source-locked": "먼저 주문을 완성해 이 선반을 열어주세요.",
  "target-locked": "아직 잠긴 선반이에요.",
  "target-full": "이 선반은 가득 찼어요.",
  "type-mismatch": "빈 선반이나 같은 상품 앞에만 놓을 수 있어요.",
} as const;

interface SavedRun {
  level: number;
  state: MartState;
}

function categoryLabel(category: ProductCategory) {
  const product = Object.values(PRODUCT_CATALOG).find((item) => item.category === category);
  return product?.categoryLabel || category;
}

function difficultyLabel(levelId: number) {
  if (levelId <= 3) return "처음 진열";
  if (levelId <= 10) return "주문 시작";
  if (levelId <= 18) return "잠금 선반";
  if (levelId <= 24) return "우선 주문";
  return "마감 러시";
}

function ProductToken({ productId, isFront, peek }: { productId: ProductId; isFront: boolean; peek: boolean }) {
  const product = PRODUCT_CATALOG[productId];
  return (
    <div
      className={`mart-product mart-product-${product.shape} ${isFront ? "is-front" : "is-back"} ${peek ? "is-peeking" : ""}`}
      style={{ "--product-color": product.color } as React.CSSProperties}
      data-product={productId}
      aria-label={`${product.label}${isFront ? ", 이동 가능" : ", 뒤쪽 상품"}`}
    >
      <span className="mart-product-cap" />
      <span className="mart-product-brand" aria-hidden="true">illo</span>
      <span className="mart-product-art" aria-hidden="true"><i /><i /><i /></span>
      <span className="mart-product-label">{product.label}</span>
    </div>
  );
}

export default function MartGame() {
  const router = useRouter();
  const [levelNumber, setLevelNumber] = useState(1);
  const level = LEVELS[levelNumber - 1];
  const [state, setState] = useState<MartState>(() => createInitialState(LEVELS[0]));
  const [history, setHistory] = useState<MartState[]>([]);
  const [progress, setProgress] = useState<IlloPlayProgress>(DEFAULT_ILLO_PLAY_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [peekUsed, setPeekUsed] = useState(false);
  const [invalidShelf, setInvalidShelf] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [celebration, setCelebration] = useState<ProductId | null>(null);
  const [hint, setHint] = useState<{ from: number; to: number } | null>(null);
  const handledResult = useRef(false);

  const persistProgress = useCallback((next: IlloPlayProgress) => {
    const saved = writeLocalProgress(next);
    setProgress(saved);
    void saveGameState("illo-mart", JSON.stringify(saved));
    return saved;
  }, []);

  useEffect(() => {
    let active = true;
    const local = readLocalProgress();
    const apply = (loaded: IlloPlayProgress) => {
      if (!active) return;
      const run = readLocalRun<SavedRun>() || loaded.currentRun as SavedRun | undefined;
      if (
        run?.level
        && run.level >= 1
        && run.level <= 30
        && run.state?.status === "playing"
        && run.state.shelves?.length === LEVELS[run.level - 1].shelfCount
      ) {
        setLevelNumber(run.level);
        setState(run.state);
      } else {
        const nextLevel = Math.min(30, Math.max(1, loaded.recentLevels[0] || loaded.unlockedLevel));
        setLevelNumber(nextLevel);
        setState(createInitialState(LEVELS[nextLevel - 1]));
      }
      setProgress(loaded);
      setHydrated(true);
    };

    apply(local);
    void loadGameState("illo-mart").then((cloud) => {
      if (!cloud || !active) return;
      try {
        const parsed = normalizeProgress(JSON.parse(cloud));
        if (parsed.updatedAt > local.updatedAt) apply(writeLocalProgress(parsed));
      } catch {
        // A damaged cloud save falls back to the already loaded local save.
      }
    });
    trackGameEvent("game_open", { level: local.unlockedLevel });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || state.status !== "playing") return;
    const timer = window.setTimeout(() => {
      const currentRun = { level: levelNumber, state } satisfies SavedRun;
      writeLocalRun(currentRun);
      persistProgress({ ...progress, currentRun });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [hydrated, levelNumber, state]); // progress intentionally omitted to avoid save loops

  useEffect(() => {
    if (!hydrated || state.status === "playing" || handledResult.current) return;
    handledResult.current = true;
    const won = state.status === "won";
    const stars = calculateStars(state, level);
    const key = String(level.id);
    const previousBest = progress.bestMoves[key];
    const next: IlloPlayProgress = {
      ...progress,
      unlockedLevel: won ? Math.max(progress.unlockedLevel, Math.min(30, level.id + 1)) : progress.unlockedLevel,
      bestStars: won ? { ...progress.bestStars, [key]: Math.max(progress.bestStars[key] || 0, stars) } : progress.bestStars,
      bestMoves: won ? { ...progress.bestMoves, [key]: previousBest ? Math.min(previousBest, state.moves) : state.moves } : progress.bestMoves,
      recentLevels: [level.id, ...progress.recentLevels.filter((id) => id !== level.id)].slice(0, 5),
      currentStreak: won ? progress.currentStreak + 1 : 0,
      bestStreak: won ? Math.max(progress.bestStreak, progress.currentStreak + 1) : progress.bestStreak,
      consecutiveFails: won ? 0 : progress.consecutiveFails + 1,
      currentRun: undefined,
    };
    clearLocalRun();
    persistProgress(next);
    trackGameEvent("game_end", { level: level.id, result: won ? "win" : "lose", moves: state.moves, stars });
    if (!won) trackGameEvent("no_move", { level: level.id, moves: state.moves });
  }, [hydrated, state.status]);

  const feedback = useCallback((kind: "move" | "complete" | "invalid") => {
    if (progress.settings.vibration && navigator.vibrate) navigator.vibrate(kind === "complete" ? [22, 28, 22, 30, 65] : kind === "invalid" ? 35 : 12);
    if (!progress.settings.sound) return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audio = new AudioContextClass();
      const notes = kind === "complete" ? [523.25, 659.25, 783.99] : [kind === "invalid" ? 180 : 360];
      notes.forEach((frequency, index) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + index * 0.08;
        oscillator.type = kind === "complete" ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(kind === "complete" ? 0.055 : 0.04, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.17);
      });
    } catch {
      // Audio feedback is optional.
    }
  }, [progress.settings]);

  const flashInvalid = (shelf: number, message: string) => {
    setInvalidShelf(shelf);
    setAnnouncement(message);
    feedback("invalid");
    window.setTimeout(() => setInvalidShelf(null), 520);
  };

  const handleShelf = (index: number) => {
    if (paused || settingsOpen || state.status !== "playing") return;
    setHint(null);
    const shelf = state.shelves[index];
    if (selectedShelf === null) {
      if (!shelf || shelf.locked || shelf.items.length === 0) {
        flashInvalid(index, shelf?.locked ? ERROR_MESSAGES["source-locked"] : ERROR_MESSAGES["source-empty"]);
        return;
      }
      setSelectedShelf(index);
      setAnnouncement(`${PRODUCT_CATALOG[shelf.items[shelf.items.length - 1]].label} 선택`);
      return;
    }
    if (selectedShelf === index) {
      setSelectedShelf(null);
      setAnnouncement("선택 취소");
      return;
    }

    const result = moveItem(state, level, selectedShelf, index);
    if (!result.ok) {
      flashInvalid(index, result.error ? ERROR_MESSAGES[result.error] : "옮길 수 없어요.");
      return;
    }
    setHistory((items) => [...items.slice(-19), state]);
    setState(result.state);
    setSelectedShelf(null);
    feedback(result.setCompleted ? "complete" : "move");
    trackGameEvent("item_move", { level: level.id, from: selectedShelf, to: index, moves: result.state.moves });
    if (result.setCompleted) {
      setCelebration(result.setCompleted);
      setAnnouncement(`${PRODUCT_CATALOG[result.setCompleted].label} 세트 완성`);
      trackGameEvent("set_complete", { level: level.id, product: result.setCompleted });
      window.setTimeout(() => setCelebration(null), 1450);
    }
    if (result.orderCompleted) {
      trackGameEvent("order_complete", { level: level.id, category: result.orderCompleted });
    }
  };

  const startLevel = useCallback((number: number, retry = false) => {
    const safe = Math.min(30, Math.max(1, number));
    setLevelNumber(safe);
    setState(createInitialState(LEVELS[safe - 1]));
    setHistory([]);
    setSelectedShelf(null);
    setHint(null);
    setPeek(false);
    setPeekUsed(false);
    setPaused(false);
    handledResult.current = false;
    trackGameEvent(retry ? "game_retry" : "game_start", { level: safe });
  }, []);

  const useUndo = () => {
    const previous = history[history.length - 1];
    const restored = undoMove(state, previous);
    if (!restored) return;
    setState(restored);
    setHistory((items) => items.slice(0, -1));
    setSelectedShelf(null);
    trackGameEvent("booster_use", { level: level.id, booster: "undo" });
  };

  const useBasket = () => {
    if (level.id <= 3 || state.basketAdded) return;
    setHistory((items) => [...items.slice(-19), state]);
    setState(addBasketShelf(state));
    trackGameEvent("booster_use", { level: level.id, booster: "basket" });
  };

  const usePeek = () => {
    if (level.id <= 3 || peekUsed) return;
    setPeek(true);
    setPeekUsed(true);
    trackGameEvent("booster_use", { level: level.id, booster: "peek" });
    window.setTimeout(() => setPeek(false), 3000);
  };

  const showHint = () => {
    for (let from = 0; from < state.shelves.length; from += 1) {
      for (let to = 0; to < state.shelves.length; to += 1) {
        if (canMove(state, from, to)) {
          setHint({ from, to });
          setAnnouncement(`${from + 1}번 선반에서 ${to + 1}번 선반으로 옮겨보세요.`);
          return;
        }
      }
    }
  };

  const updateSetting = (key: keyof IlloPlayProgress["settings"]) => {
    persistProgress({ ...progress, settings: { ...progress.settings, [key]: !progress.settings[key] } });
  };

  const ordersComplete = useMemo(
    () => level.orders.filter((order) => (state.completed[order.category] || 0) >= order.count).length,
    [level.orders, state.completed],
  );
  const stars = calculateStars(state, level);
  const bestMoves = progress.bestMoves[String(level.id)];
  const selectedShelfState = selectedShelf === null ? undefined : state.shelves[selectedShelf];
  const selectedProduct = selectedShelfState?.items[selectedShelfState.items.length - 1] || null;
  const completionPercent = Math.round((state.completedProducts.length / level.products.length) * 100);
  const recommendation = getMiniGame("mart")?.relatedGame === "illo-tower"
    ? { name: "illo tower", path: "/minigame/illo-tower" }
    : undefined;
  const moveCount = level.moveLimit === null ? state.moves : Math.max(0, level.moveLimit - state.moves);
  const moveCaption = level.moveLimit === null ? "MOVES" : "LEFT";

  if (!level) {
    return <div className="mart-fatal">레벨을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</div>;
  }

  return (
    <IlloGameShell
      gameName="illo : MART"
      levelLabel={`LEVEL ${level.id} · ${level.title}`}
      movesLabel={level.moveLimit === null ? `${state.moves} MOVES` : `${Math.max(0, level.moveLimit - state.moves)} LEFT`}
      onPause={() => setPaused(true)}
      onSettings={() => setSettingsOpen(true)}
      announcement={announcement}
      reducedMotion={progress.settings.reducedMotion}
      controls={(
        <div className="mart-booster-row">
          <button type="button" onClick={useUndo} disabled={history.length === 0} aria-label="직전 이동 취소">
            <RotateCcw aria-hidden="true" /><span>Undo</span><small>{history.length ? "1회" : "없음"}</small>
          </button>
          <button type="button" onClick={useBasket} disabled={level.id <= 3 || state.basketAdded} aria-label="임시 보관 선반 추가">
            <PackagePlus aria-hidden="true" /><span>Basket</span><small>{level.id <= 3 ? "Lv.4" : state.basketAdded ? "사용함" : "1회"}</small>
          </button>
          <button type="button" onClick={usePeek} disabled={level.id <= 3 || peekUsed} aria-label="뒤쪽 상품 3초 보기">
            <Eye aria-hidden="true" /><span>Peek</span><small>{level.id <= 3 ? "Lv.4" : peekUsed ? "사용함" : "3초"}</small>
          </button>
        </div>
      )}
    >
      <div className="mart-store-scene">
      <header className="mart-cabinet-header">
        <button type="button" className="mart-cabinet-back" onClick={() => router.push("/minigame")} aria-label="미니게임 목록으로 돌아가기">
          <ArrowLeft aria-hidden="true" />
        </button>
        <div className="mart-level-plaque"><span>LEVEL</span><strong>{level.id}</strong></div>
        <div className="mart-cabinet-logo" aria-label="illo MART"><b>illo</b><i>:</i><strong>MART</strong></div>
        <div className="mart-moves-plaque"><strong>{moveCount}</strong><span>{moveCaption}</span></div>
        <div className="mart-cabinet-actions">
          <button type="button" onClick={() => setSettingsOpen(true)} aria-label="설정 열기"><Settings aria-hidden="true" /></button>
          <button type="button" onClick={() => setPaused(true)} aria-label="게임 일시정지"><Pause aria-hidden="true" /></button>
        </div>
      </header>
      <section className="mart-rule-banner" aria-labelledby="mart-rule-title">
        <div className="mart-rule-step mart-rule-pick" aria-hidden="true">
          <span className="mart-rule-products"><i /><i /><i /></span>
          <strong><b>1</b> 앞 상품 선택</strong>
        </div>
        <div className="mart-rule-copy">
          <span>{difficultyLabel(level.id)} · LEVEL {level.id}</span>
          <h1 id="mart-rule-title">같은 상품 3개를 모아<br />주문을 완성하세요</h1>
        </div>
        <div className="mart-rule-step mart-rule-place" aria-hidden="true">
          <span className="mart-rule-target"><i /></span>
          <strong><b>2</b> 같은 상품 위 또는 빈 칸</strong>
        </div>
      </section>

      <section className="mart-order-card" aria-labelledby="mart-orders-title">
        <div className="mart-order-heading">
          <div><span>오늘의 주문</span><h2 id="mart-orders-title">완성할 상품 세트</h2></div>
          <strong>{ordersComplete}/{level.orders.length}</strong>
        </div>
        <div className="mart-orders">
          {level.orders.map((order, index) => {
            const done = Math.min(order.count, state.completed[order.category] || 0);
            const isNext = index === ordersComplete;
            return (
              <div key={`${order.category}-${index}`} className={`mart-order ${done >= order.count ? "is-done" : ""} ${isNext ? "is-next" : ""}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{categoryLabel(order.category)} 세트</strong>
                <em>{done}/{order.count}</em>
              </div>
            );
          })}
        </div>
        <div className={`mart-flow ${state.flowIntact ? "is-active" : ""}`}>
          <span>FLOW</span>{state.flowIntact ? "주문 순서 보너스 유지 중" : "모든 주문은 계속 완성할 수 있어요"}
        </div>
        <div className="mart-order-progress" aria-label={`전체 진열 ${completionPercent}% 완료`}>
          <span style={{ width: `${completionPercent}%` }} />
        </div>
      </section>

      {progress.consecutiveFails >= 3 && state.status === "playing" && (
        <button type="button" className="mart-free-hint" onClick={showHint}>
          <Lightbulb aria-hidden="true" size={17} /> 막혔나요? 무료 힌트 보기
        </button>
      )}

      <div className="mart-aisle-heading" aria-hidden="true">
        <span>GAME BOARD</span>
        <strong>상품 진열대</strong>
        <i />
      </div>

      <div className={`mart-action-guide ${selectedProduct ? "has-selection" : ""}`}>
        <span className="mart-guide-dot" aria-hidden="true" />
        {selectedProduct
          ? <><strong>{PRODUCT_CATALOG[selectedProduct].label}</strong> 선택됨 · 빛나는 선반을 눌러주세요</>
          : <>가장 앞쪽 상품을 눌러 시작하세요</>}
      </div>

      <section
        className="mart-shelves"
        aria-label="상품 선반"
        style={{ "--shelf-count": Math.min(state.shelves.length, 8) } as React.CSSProperties}
      >
        {state.shelves.map((shelf, index) => (
          <button
            type="button"
            key={shelf.id}
            className={`mart-shelf ${selectedShelf === index ? "is-selected" : ""} ${selectedShelf !== null && selectedShelf !== index && canMove(state, selectedShelf, index) ? "is-valid-target" : ""} ${invalidShelf === index ? "is-invalid" : ""} ${hint?.from === index ? "is-hint-from" : ""} ${hint?.to === index ? "is-hint-to" : ""} ${shelf.basket ? "is-basket" : ""}`}
            onClick={() => handleShelf(index)}
            aria-label={`${index + 1}번 ${shelf.basket ? "바구니" : "선반"}, ${shelf.locked ? "잠김" : `${shelf.items.length}개 상품`}`}
          >
            <span className="mart-shelf-topline" aria-hidden="true"><i /><i /><i /></span>
            <span className="mart-shelf-number">{shelf.basket ? "B" : String(index + 1).padStart(2, "0")}</span>
            {shelf.locked ? (
              <span className="mart-lock"><LockKeyhole aria-hidden="true" /><small>{level.unlockAfterSets}세트 후 열림</small></span>
            ) : (
              <>
                <span className="mart-product-stack">
                  {[0, 1, 2].map((slot) => {
                    const productId = shelf.items[slot];
                    return (
                      <span key={slot} className={`mart-slot mart-slot-${slot + 1}`}>
                        {productId && <ProductToken productId={productId} isFront={slot === shelf.items.length - 1} peek={peek} />}
                      </span>
                    );
                  })}
                </span>
                {shelf.items.length === 0 && (
                  <span className="mart-empty-target" aria-hidden="true"><i>↓</i><strong>여기에 놓기</strong></span>
                )}
              </>
            )}
            <span className="mart-shelf-base" />
          </button>
        ))}
      </section>
      <div className="mart-checkout-line" aria-hidden="true"><span>ILLO MART</span><i /><i /><i /></div>
      </div>

      {celebration && (
        <div className="mart-celebration" role="status" aria-live="assertive">
          <div className="mart-confetti" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
          </div>
          <div className="mart-complete-card">
            <span className="mart-complete-kicker">ORDER COMPLETE</span>
            <span className="mart-complete-products" data-product={celebration} aria-hidden="true"><i /><i /><i /></span>
            <strong>{PRODUCT_CATALOG[celebration].label} 3개 완성!</strong>
            <span className="mart-complete-stamp">PACKED ✓</span>
          </div>
        </div>
      )}

      {hydrated && !progress.tutorialComplete && (
        <IlloGameDialog
          title="같은 상품 3개를 모아주세요"
          description="앞에 있는 상품을 골라 같은 상품 위나 빈 선반으로 옮기면 돼요."
          primaryLabel="바로 시작하기"
          onPrimary={() => {
            persistProgress({ ...progress, tutorialComplete: true });
            trackGameEvent("game_start", { level: level.id, tutorial: true });
          }}
        >
          <div className="mart-tutorial-steps">
            <div><span>1</span><strong>앞 상품 선택</strong><p>각 선반의 가장 앞 상품만 움직여요.</p></div>
            <div><span>2</span><strong>같은 곳에 놓기</strong><p>빈칸 또는 같은 상품 앞에 놓아요.</p></div>
            <div><span>3</span><strong>세트 완성</strong><p>같은 상품 3개가 모이면 주문에 담겨요.</p></div>
          </div>
        </IlloGameDialog>
      )}

      {paused && (
        <IlloGameDialog title="잠시 멈췄어요" description="상품은 그대로 기다리고 있어요." primaryLabel="계속하기" onPrimary={() => setPaused(false)} secondaryLabel="처음부터" onSecondary={() => startLevel(level.id, true)}>
          <label className="mart-level-select">
            <span>해금된 레벨</span>
            <select value={level.id} onChange={(event) => startLevel(Number(event.target.value))}>
              {LEVELS.slice(0, progress.unlockedLevel).map((item) => <option key={item.id} value={item.id}>LEVEL {item.id} · {item.title}</option>)}
            </select>
          </label>
        </IlloGameDialog>
      )}

      {settingsOpen && (
        <IlloGameDialog title="플레이 설정" description="변경 사항은 다음 플레이에도 유지돼요." primaryLabel="완료" onPrimary={() => setSettingsOpen(false)}>
          <div className="mart-settings">
            <button type="button" onClick={() => updateSetting("sound")}>
              {progress.settings.sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}<span>사운드</span><strong>{progress.settings.sound ? "켜짐" : "꺼짐"}</strong>
            </button>
            <button type="button" onClick={() => updateSetting("vibration")}>
              <Vibrate aria-hidden="true" /><span>진동</span><strong>{progress.settings.vibration ? "켜짐" : "꺼짐"}</strong>
            </button>
            <button type="button" onClick={() => updateSetting("reducedMotion")}>
              <span className="mart-motion-icon">↝</span><span>모션 감소</span><strong>{progress.settings.reducedMotion ? "켜짐" : "꺼짐"}</strong>
            </button>
          </div>
        </IlloGameDialog>
      )}

      {state.status !== "playing" && (
        <IlloGameResult
          won={state.status === "won"}
          stars={stars}
          moves={state.moves}
          bestMoves={bestMoves ? Math.min(bestMoves, state.moves) : state.status === "won" ? state.moves : bestMoves}
          onRetry={() => startLevel(level.id, true)}
          onNext={state.status === "won" ? () => {
            trackGameEvent("next_game_click", { level: level.id, nextLevel: level.id + 1 });
            if (level.id < 30) startLevel(level.id + 1);
            else router.push("/minigame");
          } : undefined}
          nextLabel={level.id < 30 ? "다음 레벨" : "게임 목록"}
          recommendation={recommendation}
        />
      )}
    </IlloGameShell>
  );
}
