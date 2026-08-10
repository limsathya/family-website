"use client";

import { useEffect } from "react";

export function DevtoolsBlocker() {
  useEffect(() => {
    // Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Block common devtools keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I (Chrome devtools)
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.keyCode === 73)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J (Chrome console)
      if (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j" || e.keyCode === 74)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C (Chrome element picker)
      if (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c" || e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View source)
      if (e.ctrlKey && (e.key === "U" || e.key === "u" || e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (Save page)
      if (e.ctrlKey && (e.key === "S" || e.key === "s" || e.keyCode === 83)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+P (Print)
      if (e.ctrlKey && (e.key === "P" || e.key === "p" || e.keyCode === 80)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+K (Firefox console)
      if (e.ctrlKey && e.shiftKey && (e.key === "K" || e.key === "k" || e.keyCode === 75)) {
        e.preventDefault();
        return false;
      }
    };

    // Detect devtools open via timing threshold
    const checkDevtools = () => {
      const threshold = 160;
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      if (end - start > threshold) {
        // Devtools is open — could redirect or show warning
        console.clear();
        document.body.innerHTML = "<div style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:24px;color:#999'>Devtools not allowed on this page.</div>";
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // Periodic devtools check
    const interval = setInterval(checkDevtools, 2000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  return null;
}
