"use client";

import { useCallback, useEffect, useState } from "react";
import type { Link, NavContent, Service } from "@/types/home";

/**
 * Hamburger + full-screen drawer + Services accordion. Renders the burger
 * and the drawer as two siblings so they occupy the same slots in the
 * header grid as the reference markup.
 */
export function MobileNav({
  nav,
  services,
  servicesHref,
}: {
  nav: NavContent;
  services: Service[];
  servicesHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    document.documentElement.style.overflow = "";
  }, []);

  const toggle = () => {
    if (open) {
      close();
    } else {
      setOpen(true);
      document.documentElement.style.overflow = "hidden";
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    };
    const onResize = () => {
      if (window.innerWidth > 860 && open) close();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  const item = (link: Link) => (
    <a href={link.href} onClick={close}>
      {link.label}
    </a>
  );

  return (
    <>
      <button
        className="nav-burger"
        id="navBurger"
        type="button"
        aria-label="Open menu"
        aria-expanded={open ? "true" : "false"}
        aria-controls="mobileNav"
        onClick={toggle}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        className={open ? "mobile-nav is-open" : "mobile-nav"}
        id="mobileNav"
        inert={!open}
      >
        <div className="mobile-nav-links">
          {item(nav.links.home)}
          <div className="mobile-nav-group">
            <button
              className="mobile-nav-toggle"
              id="mobileServicesToggle"
              type="button"
              aria-expanded={servicesOpen ? "true" : "false"}
              aria-controls="mobileServicesPanel"
              onClick={() => setServicesOpen((v) => !v)}
            >
              {nav.links.services.label}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              className={
                servicesOpen ? "mobile-nav-panel is-open" : "mobile-nav-panel"
              }
              id="mobileServicesPanel"
            >
              {services.map((s) => (
                <a key={s.slug} href={servicesHref} onClick={close}>
                  {s.name}
                </a>
              ))}
            </div>
          </div>
          {item(nav.links.about)}
          {item(nav.links.blog)}
          {item(nav.links.contact)}
        </div>
        <a
          href={nav.cta.href}
          className="btn solid mobile-nav-cta"
          onClick={close}
        >
          {nav.cta.label}
        </a>
      </div>
    </>
  );
}
