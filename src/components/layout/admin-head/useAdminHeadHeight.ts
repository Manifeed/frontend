"use client";

import { useEffect, type RefObject } from "react";

export function useAdminHeadHeight(
  elementRef: RefObject<HTMLElement | null>,
  cssVariableName: "--admin-head-filters-height" | "--admin-head-panel-height",
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element)
      return;

    const rootStyle = document.documentElement.style;
    const syncHeight = () => {
      rootStyle.setProperty(cssVariableName, `${Math.ceil(element.getBoundingClientRect().height)}px`);
    };

    syncHeight();

    const resizeObserver = new ResizeObserver(() => {
      syncHeight();
    });
    resizeObserver.observe(element);
    window.addEventListener("resize", syncHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncHeight);
      rootStyle.setProperty(cssVariableName, "0px");
    };
  }, [cssVariableName, elementRef]);
}
