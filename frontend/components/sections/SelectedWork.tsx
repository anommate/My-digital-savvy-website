import type { WorkContent } from "@/types/home";

export function SelectedWork({ work }: { work: WorkContent }) {
  return (
    <section className="wrap" id="work" aria-labelledby="work-heading">
      <div className="head reveal">
        <h2 id="work-heading">{work.heading}</h2>
        <span className="label">{work.label}</span>
      </div>
      <ul className="work-list reveal-group">
        {work.items.map((w) => (
          <li className="work-row" key={w.name}>
            <span className="work-name">{w.name}</span>
            <span className="work-tag">{w.tag}</span>
          </li>
        ))}
      </ul>
      <p className="work-note">{work.note}</p>
    </section>
  );
}
