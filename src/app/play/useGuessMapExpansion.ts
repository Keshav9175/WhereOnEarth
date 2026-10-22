"use client";

import { useEffect, useState, type RefObject } from "react";

// Shrinking waits a moment, so slipping the mouse off for a split second doesn't snap the map closed.
const SHRINK_DELAY_MS = 300;
// A few pixels of grace around the map and button, so the edge doesn't flicker.
const EDGE_MARGIN_PX = 8;

function isPointOver(element: HTMLElement | null, x: number, y: number) {
  if (!element) return false;
  const box = element.getBoundingClientRect();
  return (
    x >= box.left - EDGE_MARGIN_PX &&
    x <= box.right + EDGE_MARGIN_PX &&
    y >= box.top - EDGE_MARGIN_PX &&
    y <= box.bottom + EDGE_MARGIN_PX
  );
}

// Decides when the guess map is big. Instead of relying on "mouse entered / left" events (browsers skip
// them when you leave mid-drag, and Google's map swallows some), it checks where the mouse REALLY is on
// every move. The map:
// - grows while the mouse is over the map or the Guess button,
// - never shrinks while a mouse button is held down after pressing on it (so a drag that wanders off the
//   map keeps working and its release still reaches the map — otherwise the map "sticks" to the mouse),
// - grows for keyboard focus only when the keyboard is being used. We track that ourselves (last input
//   was a key press, not a mouse press): Google's map moves focus into itself when CLICKED, and the
//   browser then wrongly reports that as keyboard focus (":focus-visible"), which kept the map big.
export function useGuessMapExpansion(
  active: boolean,
  mapRef: RefObject<HTMLElement | null>,
  buttonRef: RefObject<HTMLElement | null>,
) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!active) return;

    let pointerOver = false;
    let pressing = false;
    let keyboardFocus = false;
    let usingKeyboard = false;
    let shrinkTimer: number | null = null;

    const update = () => {
      if (pointerOver || pressing || keyboardFocus) {
        if (shrinkTimer !== null) window.clearTimeout(shrinkTimer);
        shrinkTimer = null;
        setExpanded(true);
      } else if (shrinkTimer === null) {
        shrinkTimer = window.setTimeout(() => {
          shrinkTimer = null;
          setExpanded(false);
        }, SHRINK_DELAY_MS);
      }
    };

    const locate = (event: PointerEvent) => {
      pointerOver = isPointOver(mapRef.current, event.clientX, event.clientY) || isPointOver(buttonRef.current, event.clientX, event.clientY);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return; // phones don't grow the map
      locate(event);
      update();
    };
    const onDown = (event: PointerEvent) => {
      usingKeyboard = false;
      keyboardFocus = false;
      locate(event);
      if (pointerOver) pressing = true;
      update();
    };
    const onKey = () => {
      usingKeyboard = true;
    };
    const onUp = (event: PointerEvent) => {
      pressing = false;
      locate(event);
      update();
    };
    const onFocusChange = () => {
      // Wait a frame: during "focusout" the newly focused element isn't known yet.
      requestAnimationFrame(() => {
        const focused = document.activeElement;
        keyboardFocus =
          usingKeyboard &&
          focused instanceof HTMLElement &&
          Boolean(mapRef.current?.contains(focused) || buttonRef.current?.contains(focused));
        update();
      });
    };
    const onLeaveWindow = () => {
      pointerOver = false;
      pressing = false;
      update();
    };

    // "capture" = we hear these before Google's map can stop them from travelling further.
    const options = { capture: true, passive: true };
    window.addEventListener("pointermove", onMove, options);
    window.addEventListener("pointerdown", onDown, options);
    window.addEventListener("pointerup", onUp, options);
    window.addEventListener("pointercancel", onUp, options);
    window.addEventListener("keydown", onKey, options);
    window.addEventListener("blur", onLeaveWindow);
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    document.addEventListener("focusin", onFocusChange);
    document.addEventListener("focusout", onFocusChange);

    return () => {
      window.removeEventListener("pointermove", onMove, options);
      window.removeEventListener("pointerdown", onDown, options);
      window.removeEventListener("pointerup", onUp, options);
      window.removeEventListener("pointercancel", onUp, options);
      window.removeEventListener("keydown", onKey, options);
      window.removeEventListener("blur", onLeaveWindow);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("focusin", onFocusChange);
      document.removeEventListener("focusout", onFocusChange);
      if (shrinkTimer !== null) window.clearTimeout(shrinkTimer);
      // A new round always starts with the small map.
      setExpanded(false);
    };
  }, [active, mapRef, buttonRef]);

  return active && expanded;
}
