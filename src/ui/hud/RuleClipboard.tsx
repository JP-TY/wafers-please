"use client";

export function RuleClipboard() {
  return (
    <section className="console-panel">
      <div className="panel-head">
        <span className="panel-tag">Process Flow</span>
        <span className="panel-subtag">Day 1 Rules</span>
      </div>
      <div className="panel-block">
        <h3>Inspection Protocol</h3>
        <p>1) Inspect each wafer before disposition.</p>
        <p>2) Reject on strong red/pink continuity breaks or dense persistent clusters.</p>
        <p>3) Use fix path for medium-risk signatures that stay visible but look localized.</p>
        <p>4) Accept only when marks are sparse, faint, and non-structured across views.</p>
        <p>5) If two bad accepts happen, switch to strict reject bias until stable.</p>
      </div>
      <div className="inline-row">
        <span className="status-chip">I Inspect</span>
        <span className="status-chip">1 Accept</span>
        <span className="status-chip">2 Reject</span>
        <span className="status-chip">3 Rework</span>
      </div>
    </section>
  );
}
