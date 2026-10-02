import type { ProcessContent } from "@/types/home";

export function Process({ process }: { process: ProcessContent }) {
  return (
    <section className="wrap" id="process" aria-labelledby="process-heading">
      <div className="head reveal">
        <h2 id="process-heading">{process.heading}</h2>
        <span className="label">{process.label}</span>
      </div>
      <div className="steps reveal-group">
        {process.steps.map((s) => (
          <div className="step" key={s.number}>
            <div className="n" aria-hidden="true">
              {s.number}
            </div>
            {/* h5 kept for parity: the reference styles `.step h5`. */}
            <h5>{s.title}</h5>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
