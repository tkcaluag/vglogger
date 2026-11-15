"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

export default function HomeLink() {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (window.location.pathname === "/") {
      event.preventDefault();
      window.location.reload();
    }
  }

  return (
    <Link className="brand" href="/" aria-label="VGLogger home" onClick={handleClick}>
      <span className="brand-mark">VG</span>
      <span className="brand-name">vglogger</span>
    </Link>
  );
}
