"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface VirtualizedCardListProps {
  count: number;
  /** Chiều cao ước lượng mỗi card (px). Card thật cao ~190-230px. */
  estimatedHeight?: number;
  /** Số item render thừa trên/dưới viewport để cuộn mượt. */
  overscan?: number;
  /** Ngưỡng: dưới ngưỡng thì render thường (giữ hành vi + test cũ). */
  threshold?: number;
  /** Index cần đảm bảo hiển thị (vd: row vừa thêm để focus). */
  activeIndex?: number | null;
  /** true = list tự cuộn trong khung riêng (dùng cho modal preview). */
  scrollable?: boolean;
  /** Chiều cao tối đa khi scrollable (px). */
  maxHeight?: number;
  getKey: (index: number) => string;
  renderItem: (index: number) => React.ReactNode;
}

/**
 * Virtual list cho editor 1000 cards.
 * - Render đủ 1000 dòng theo nghĩa "cuộn tới đâu thấy tới đó": ngoài viewport
 *   chỉ giữ spacer giữ chiều cao scroll, không mount CardRowInput thật.
 * - Dưới `threshold` thì render thường để không đổi hành vi/test.
 * - Mỗi item bọc `content-visibility: auto` để browser skip layout/paint.
 */
export function VirtualizedCardList({
  count,
  estimatedHeight = 220,
  overscan = 8,
  threshold = 60,
  activeIndex = null,
  scrollable = false,
  maxHeight = 192,
  getKey,
  renderItem,
}: VirtualizedCardListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRaf = useRef(0);
  const [range, setRange] = useState(() => ({
    start: 0,
    end: Math.min(count, threshold + overscan),
  }));
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const computeRangeWindow = useCallback(() => {
    const el = containerRef.current;
    if (!el || count <= threshold) return;
    const rect = el.getBoundingClientRect();
    // rect.top âm nghĩa là container đã trôi lên trên viewport
    const scrolledInto = Math.max(0, -rect.top);
    const viewportH =
      typeof window !== "undefined" ? window.innerHeight : 800;

    let start = Math.floor(scrolledInto / estimatedHeight) - overscan;
    let end =
      Math.ceil((scrolledInto + viewportH) / estimatedHeight) + overscan;

    // Luôn bao phủ activeIndex (row cần focus sau khi thêm)
    if (activeIndex !== null && activeIndex >= 0 && activeIndex < count) {
      start = Math.min(start, activeIndex - 2);
      end = Math.max(end, activeIndex + 3);
    }

    start = Math.max(0, start);
    end = Math.min(count, Math.max(end, start + 1));

    const prev = rangeRef.current;
    if (prev.start !== start || prev.end !== end) {
      setRange({ start, end });
    }
  }, [count, threshold, estimatedHeight, overscan, activeIndex]);

  const computeRangeInner = useCallback(() => {
    const el = containerRef.current;
    if (!el || count <= threshold) return;
    const scrollTop = el.scrollTop;
    const viewportH = el.clientHeight || maxHeight;

    let start = Math.floor(scrollTop / estimatedHeight) - overscan;
    let end =
      Math.ceil((scrollTop + viewportH) / estimatedHeight) + overscan;

    start = Math.max(0, start);
    end = Math.min(count, Math.max(end, start + 1));

    const prev = rangeRef.current;
    if (prev.start !== start || prev.end !== end) {
      setRange({ start, end });
    }
  }, [count, threshold, estimatedHeight, overscan, maxHeight]);

  // Tính lại khi count/activeIndex đổi + lắng nghe scroll/resize (rAF throttle)
  useEffect(() => {
    if (count <= threshold) {
      setRange({ start: 0, end: count });
      return;
    }
    if (scrollable) {
      computeRangeInner();
      return;
    }
    computeRangeWindow();
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeRangeWindow);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count, threshold, computeRangeWindow, computeRangeInner, scrollable]);

  // List ngắn: render thường, giữ nguyên DOM/testid cho test cũ
  if (count <= threshold) {
    if (scrollable) {
      return (
        <div
          ref={containerRef}
          className="max-h-48 overflow-y-auto rounded-xl border border-quizlet-border-light divide-y divide-quizlet-border-light bg-quizlet-surface"
          style={{ maxHeight }}
        >
          {Array.from({ length: count }, (_, i) => (
            <div
              key={getKey(i)}
              data-row-index={i}
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "auto 40px",
              }}
            >
              {renderItem(i)}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div ref={containerRef} className="space-y-4">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={getKey(i)}
            data-row-index={i}
            style={{
              contentVisibility: "auto",
              containIntrinsicSize: "auto 240px",
            }}
          >
            {renderItem(i)}
          </div>
        ))}
      </div>
    );
  }

  const { start, end } = range;
  const topSpacer = start * estimatedHeight;
  const bottomSpacer = Math.max(0, (count - end) * estimatedHeight);
  const items: React.ReactNode[] = [];
  for (let i = start; i < end; i++) {
    items.push(
      <div
        key={getKey(i)}
        data-row-index={i}
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: `auto ${estimatedHeight}px`,
        }}
      >
        {renderItem(i)}
      </div>
    );
  }

  if (scrollable) {
    return (
      <div
        ref={containerRef}
        onScroll={() => {
          cancelAnimationFrame(scrollRaf.current);
          scrollRaf.current = requestAnimationFrame(computeRangeInner);
        }}
        className="overflow-y-auto rounded-xl border border-quizlet-border-light bg-quizlet-surface"
        style={{ maxHeight }}
      >
        {topSpacer > 0 && (
          <div style={{ height: topSpacer }} aria-hidden="true" />
        )}
        {items}
        {bottomSpacer > 0 && (
          <div style={{ height: bottomSpacer }} aria-hidden="true" />
        )}
        <div className="sr-only" aria-live="polite">
          Hiển thị {end - start} / {count} cards (cuộn để tải thêm)
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {topSpacer > 0 && (
        <div style={{ height: topSpacer }} aria-hidden="true" />
      )}
      {items}
      {bottomSpacer > 0 && (
        <div style={{ height: bottomSpacer }} aria-hidden="true" />
      )}
      <div className="sr-only" aria-live="polite">
        Hiển thị {end - start} / {count} cards (cuộn để tải thêm)
      </div>
    </div>
  );
}
