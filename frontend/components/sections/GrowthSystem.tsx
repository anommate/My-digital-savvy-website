import type { GrowthContent } from "@/types/home";
import { accentStyle, cssVars } from "@/components/ui/accent";
import { GrowthScroll } from "@/components/interactions/GrowthScroll";

export function GrowthSystem({ growth }: { growth: GrowthContent }) {
  const n = growth.stages.length;
  const pad = (k: number) => String(k).padStart(2, "0");
  return (
    <section id="growth-system" aria-labelledby="growth-heading">
      <div
        className="growth-track"
        id="growthTrack"
        style={cssVars({ "--n": n })}
      >
        <div className="growth-stage">
          <div className="growth-head reveal">
            <span className="label">{growth.label}</span>
            <h2 id="growth-heading">{growth.heading}</h2>
          </div>

          <div className="growth-body">
            <ol className="growth-rail" id="growthRail" aria-hidden="true">
              {growth.stages.map((s, i) => (
                <li
                  key={s.title}
                  data-i={i}
                  className={i === 0 ? "is-on" : undefined}
                >
                  {s.railLabel}
                </li>
              ))}
            </ol>

            <div className="growth-cards" id="growthCards">
              {growth.stages.map((s, i) => (
                <article
                  key={s.title}
                  className={i === 0 ? "growth-card is-on" : "growth-card"}
                  data-i={i}
                  style={accentStyle(s.color)}
                >
                  <span className="growth-num">
                    {pad(i + 1)} / {pad(n)}
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
      <GrowthScroll />
    </section>
  );
}
