import type { ServicesContent } from "@/types/home";
import { cssVars } from "@/components/ui/accent";
import { ServicePanel } from "./ServicePanel";
import { ServicesScroll } from "./ServicesScroll";

/**
 * Pinned nine-panel sequence. Server-rendered in the state the reference
 * reaches right after load (panel 01 active, first arc number and bar lit);
 * ServicesScroll then drives it from scroll position.
 */
export function ServicesSection({ services }: { services: ServicesContent }) {
  const n = services.items.length;
  return (
    <section id="services" aria-labelledby="svc-heading">
      <div className="wrap">
        <div className="head reveal">
          <h2 id="svc-heading">{services.heading}</h2>
          <span className="label">{services.label}</span>
        </div>
      </div>

      <div className="wd-track" id="wdTrack" style={cssVars({ "--n": n })}>
        <div className="wd-stage">
          {/* rotating arc index */}
          <div className="wd-rail" aria-hidden="true">
            <div className="wd-ring" id="wdRing">
              <span className="wd-arc"></span>
              {services.items.map((s, i) => (
                <b
                  key={s.slug}
                  className={i === 0 ? "wd-num is-on" : "wd-num"}
                  style={cssVars({ "--i": i })}
                >
                  {s.number}
                </b>
              ))}
            </div>
            <span className="wd-pip"></span>
          </div>

          {/* how far through the nine services */}
          <div className="wd-progress" aria-hidden="true">
            <div className="wd-progress-fill" id="wdProgressFill"></div>
          </div>

          {/* compact index for small screens */}
          <div className="wd-mini" aria-hidden="true">
            <b id="wdMiniNum">{services.items[0]?.number}</b>
            <span className="wd-bars">
              {services.items.map((s, i) => (
                <i key={s.slug} className={i === 0 ? "is-on" : undefined}></i>
              ))}
            </span>
          </div>

          <div className="wd-panels" id="wdPanels">
            {services.items.map((s, i) => (
              <ServicePanel key={s.slug} service={s} index={i} />
            ))}
          </div>
        </div>
      </div>
      <ServicesScroll />
    </section>
  );
}
