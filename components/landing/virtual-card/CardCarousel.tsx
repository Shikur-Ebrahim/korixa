"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AUTO_PLAY_INTERVAL_MS,
  DEFAULT_CARD_INDEX,
  virtualCards,
  type VirtualCardConfig,
} from "@/components/landing/virtual-card/card-data";
import { VirtualCardFace } from "@/components/landing/virtual-card/VirtualCardFace";

const CARD_GAP = 16;
const CARD_COUNT = virtualCards.length;
const SCROLL_DURATION_MS = 450;

function getCardWidth() {
  if (typeof window === "undefined") return 260;
  if (window.innerWidth >= 768) return 340;
  if (window.innerWidth >= 640) return 300;
  return 260;
}

function toLoopedIndex(realIndex: number) {
  return realIndex + 1;
}

function buildLoopedCards(): VirtualCardConfig[] {
  const last = virtualCards[CARD_COUNT - 1];
  const first = virtualCards[0];

  return [
    { ...last, id: `${last.id}-clone-start` },
    ...virtualCards,
    { ...first, id: `${first.id}-clone-end` },
  ];
}

export function CardCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const isJumping = useRef(false);
  const prevIndex = useRef(DEFAULT_CARD_INDEX);
  const activeIndexRef = useRef(DEFAULT_CARD_INDEX);
  const [activeIndex, setActiveIndex] = useState(DEFAULT_CARD_INDEX);
  const [cardWidth, setCardWidth] = useState(260);
  const [paused, setPaused] = useState(false);
  const [highlightLooped, setHighlightLooped] = useState(toLoopedIndex(DEFAULT_CARD_INDEX));

  const loopedCards = useMemo(() => buildLoopedCards(), []);

  activeIndexRef.current = activeIndex;

  useEffect(() => {
    const updateWidth = () => setCardWidth(getCardWidth());
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const scrollToLooped = useCallback(
    (loopedIndex: number, smooth = true) => {
      const container = trackRef.current;
      if (!container) return;

      const offset = loopedIndex * (cardWidth + CARD_GAP);
      if (smooth) {
        container.scrollTo({ left: offset, behavior: "smooth" });
      } else {
        container.scrollLeft = offset;
      }

      setHighlightLooped(loopedIndex);
    },
    [cardWidth]
  );

  const jumpWithoutAnimation = useCallback(
    (loopedIndex: number) => {
      isJumping.current = true;
      scrollToLooped(loopedIndex, false);
      requestAnimationFrame(() => {
        isJumping.current = false;
      });
    },
    [scrollToLooped]
  );

  useEffect(() => {
    jumpWithoutAnimation(toLoopedIndex(activeIndexRef.current));
  }, [cardWidth, jumpWithoutAnimation]);

  useEffect(() => {
    if (isJumping.current) return;

    const prev = prevIndex.current;
    const next = activeIndex;

    if (prev === next) {
      jumpWithoutAnimation(toLoopedIndex(next));
      return;
    }

    if (prev === CARD_COUNT - 1 && next === 0) {
      scrollToLooped(CARD_COUNT + 1, true);
      const timer = window.setTimeout(() => {
        jumpWithoutAnimation(toLoopedIndex(0));
      }, SCROLL_DURATION_MS);
      prevIndex.current = next;
      return () => window.clearTimeout(timer);
    }

    if (prev === 0 && next === CARD_COUNT - 1) {
      scrollToLooped(0, true);
      const timer = window.setTimeout(() => {
        jumpWithoutAnimation(toLoopedIndex(CARD_COUNT - 1));
      }, SCROLL_DURATION_MS);
      prevIndex.current = next;
      return () => window.clearTimeout(timer);
    }

    scrollToLooped(toLoopedIndex(next), true);
    prevIndex.current = next;
  }, [activeIndex, jumpWithoutAnimation, scrollToLooped]);

  useEffect(() => {
    if (paused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CARD_COUNT);
    }, AUTO_PLAY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [paused]);

  const goTo = (index: number) => {
    setActiveIndex(index);
  };

  const sidePadding = `calc(50% - ${cardWidth / 2}px)`;

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => window.setTimeout(() => setPaused(false), 3000)}
    >
      <div
        ref={trackRef}
        className="scrollbar-hide flex gap-4 overflow-x-hidden pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingInline: sidePadding }}
      >
        {loopedCards.map((card, loopedIndex) => (
          <div key={card.id} className="shrink-0">
            <VirtualCardFace card={card} active={loopedIndex === highlightLooped} />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 px-2">
        {virtualCards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            aria-label={`Show ${card.label} card`}
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "w-6 bg-primary"
                : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
