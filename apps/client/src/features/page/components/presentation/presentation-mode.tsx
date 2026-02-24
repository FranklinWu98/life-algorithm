import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconArrowRight, IconX } from "@tabler/icons-react";
import { Editor } from "@tiptap/react";

// Split the editor HTML at every <hr> element into slide sections.
function splitIntoSlides(html: string): string[] {
  const parts = html.split(/<hr[^>]*\/?>/gi);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

// Auto-scale font size based on visible text length of the slide.
// Font size scales with both content length and viewport width for any resolution.
function computeSlideFontSize(html: string): string {
  const textLen = html.replace(/<[^>]*>/g, "").length;
  if (textLen < 150) return "clamp(1.5rem, 2.8vw, 2.4rem)";
  if (textLen < 350) return "clamp(1.3rem, 2.2vw, 1.9rem)";
  if (textLen < 700) return "clamp(1.1rem, 1.8vw, 1.6rem)";
  if (textLen < 1400) return "clamp(0.95rem, 1.5vw, 1.3rem)";
  return "clamp(0.85rem, 1.2vw, 1.1rem)";
}

interface PresentationModeProps {
  editor: Editor;
  pageTitle: string;
  pageIcon?: string | null;
  onClose: () => void;
}

export default function PresentationMode({
  editor,
  pageTitle,
  pageIcon,
  onClose,
}: PresentationModeProps) {
  const contentSlides = useMemo(() => {
    const html = editor.getHTML();
    return splitIntoSlides(html);
  }, [editor]);

  // Slide 0 = title, 1..N = content sections
  const totalSlides = 1 + contentSlides.length;
  const [current, setCurrent] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Guard against double-close (fullscreenchange + our handler both firing)
  const isClosingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  // Enter fullscreen on mount; exit on unmount
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Exit presentation when browser exits fullscreen natively (e.g. OS Escape)
  useEffect(() => {
    const onFSChange = () => {
      if (!document.fullscreenElement) {
        handleClose();
      }
    };
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, [handleClose]);

  const goNext = useCallback(
    () => setCurrent((c) => Math.min(c + 1, totalSlides - 1)),
    [totalSlides],
  );
  const goPrev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, handleClose]);

  // Auto-hide controls after inactivity
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setControlsVisible(false), 2500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentSlideHtml = contentSlides[current - 1] ?? "";
  const slideFontSize =
    current === 0 ? "1.2rem" : computeSlideFontSize(currentSlideHtml);

  const titleSlide = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 24,
        padding: "0 10vw",
        textAlign: "center",
      }}
    >
      {pageIcon && (
        <span style={{ fontSize: 80, lineHeight: 1 }}>{pageIcon}</span>
      )}
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 4rem)",
          fontWeight: 700,
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {pageTitle || "Untitled"}
      </h1>
    </div>
  );

  const contentSlide = (
    <div
      className="ProseMirror presentation-content"
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        padding: "4vh 8vw",
        fontSize: slideFontSize,
        lineHeight: 1.65,
        textAlign: "left",
        boxSizing: "border-box",
      }}
      dangerouslySetInnerHTML={{ __html: currentSlideHtml }}
    />
  );

  return createPortal(
    <div
      onMouseMove={resetHideTimer}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--mantine-color-body)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: controlsVisible ? "default" : "none",
      }}
    >
      {/* Responsive media styles for slide content */}
      <style>{`
        .presentation-content iframe {
          max-width: 100%;
          min-height: 360px;
          aspect-ratio: 16 / 9;
          display: block;
          height: auto;
        }
        .presentation-content div[data-youtube-video] {
          max-width: 100%;
        }
        .presentation-content img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        .presentation-content video {
          max-width: 100%;
          height: auto;
          display: block;
        }
      `}</style>

      {/* Close button — top-right */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          opacity: controlsVisible ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: controlsVisible ? "auto" : "none",
        }}
      >
        <Tooltip label="Exit (Esc)" withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={handleClose} size="lg">
            <IconX size={20} />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Slide content — fills remaining space, title centered, content fills width */}
      <div
        style={{
          width: "100%",
          flex: 1,
          display: "flex",
          alignItems: current === 0 ? "center" : "stretch",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {current === 0 ? titleSlide : contentSlide}
      </div>

      {/* Navigation controls — bottom-right, auto-hide */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          opacity: controlsVisible ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: controlsVisible ? "auto" : "none",
        }}
      >
        <Group
          gap={8}
          px={12}
          py={6}
          style={{
            borderRadius: 8,
            background: "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))",
            backdropFilter: "blur(4px)",
          }}
        >
          <Tooltip label="Previous (←)" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={goPrev}
              disabled={current === 0}
              size="sm"
            >
              <IconArrowLeft size={16} />
            </ActionIcon>
          </Tooltip>
          <Text size="xs" c="dimmed" style={{ minWidth: 48, textAlign: "center" }}>
            {current + 1} / {totalSlides}
          </Text>
          <Tooltip label="Next (→)" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={goNext}
              disabled={current === totalSlides - 1}
              size="sm"
            >
              <IconArrowRight size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>
    </div>,
    document.body,
  );
}
