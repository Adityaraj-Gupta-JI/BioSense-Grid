import { useMemo, useState } from "react";
import {
  Archive,
  ArrowDownRight,
  BookOpen,
  ChevronRight,
  CircleAlert,
  Compass,
  Download,
  FlaskConical,
  Gauge,
  Menu,
  PanelTop,
  ScanLine,
  Settings2,
  Waves,
  X,
} from "lucide-react";

type SectionKey = "index" | "apparatus" | "archives" | "calibrations";

type NavItem = {
  key: SectionKey;
  label: string;
  shortLabel: string;
  icon: typeof Compass;
};

const navItems: NavItem[] = [
  { key: "index", label: "Master Index", shortLabel: "Index", icon: Compass },
  { key: "apparatus", label: "The Apparatus", shortLabel: "Apparatus", icon: PanelTop },
  { key: "archives", label: "The Archives", shortLabel: "Archives", icon: Archive },
  { key: "calibrations", label: "Mechanical Calibrations", shortLabel: "Calibrations", icon: Settings2 },
];

function StatusStamp({ children, tone = "brass" }: { children: React.ReactNode; tone?: "brass" | "muted" | "error" }) {
  return <span className={`status-stamp status-stamp-${tone}`}>{children}</span>;
}

function PanelHeading({ index, eyebrow, title, detail }: { index: string; eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="panel-heading">
      <span className="panel-index">{index}</span>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {detail ? <p className="panel-detail">{detail}</p> : null}
      </div>
    </div>
  );
}

function EmptyReadout({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="empty-readout" role="status" aria-live="polite">
      <Waves size={24} strokeWidth={1.4} aria-hidden="true" />
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  );
}

function Home() {
  const [activeSection, setActiveSection] = useState<SectionKey>("index");
  const [menuOpen, setMenuOpen] = useState(false);

  const activeLabel = useMemo(
    () => navItems.find((item) => item.key === activeSection)?.label ?? "Master Index",
    [activeSection],
  );

  const goTo = (key: SectionKey) => {
    setActiveSection(key);
    setMenuOpen(false);
    document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="instrument-frame">
      <div className="instrument-grain" aria-hidden="true" />
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><FlaskConical size={22} strokeWidth={1.2} /></div>
          <div>
            <p className="brand-kicker">Computational Field Register</p>
            <p className="brand-name">BioSense <em>Grid</em></p>
          </div>
        </div>
        <div className="header-register" aria-label="Current register status">
          <span>REGISTER 01</span>
          <span className="register-divider" aria-hidden="true" />
          <span>OBSERVATION DECK</span>
          <StatusStamp tone="muted">MVP / FOUNDATION</StatusStamp>
        </div>
        <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          <span className="sr-only">Toggle navigation</span>
        </button>
      </header>

      <div className="instrument-rule" aria-hidden="true"><span /><span /><span /></div>

      <div className="workspace">
        <aside id="primary-navigation" className={`navigation-rail ${menuOpen ? "navigation-rail-open" : ""}`} aria-label="Primary navigation">
          <div className="rail-label">Navigation / 00</div>
          <nav>
            {navItems.map(({ key, label, shortLabel, icon: Icon }) => (
              <button key={key} className={`nav-item ${activeSection === key ? "nav-item-active" : ""}`} onClick={() => goTo(key)} aria-current={activeSection === key ? "page" : undefined}>
                <Icon size={17} strokeWidth={1.4} aria-hidden="true" />
                <span className="nav-long-label">{label}</span>
                <span className="nav-short-label">{shortLabel}</span>
                <ChevronRight className="nav-arrow" size={14} strokeWidth={1.2} aria-hidden="true" />
              </button>
            ))}
          </nav>
          <div className="rail-footer">
            <div className="rail-seal" aria-hidden="true">BG</div>
            <p>EST. / SIGNAL<br />RESEARCH UNIT</p>
          </div>
        </aside>

        <main className="main-deck">
          <section id="index" className="master-index section-anchor" aria-labelledby="index-title">
            <div className="index-copy">
              <div className="section-kicker"><span className="section-number">I</span> Master Index <span className="kicker-line" /></div>
              <h1 id="index-title">Bio-signal dynamics,<br /><em>read without invention.</em></h1>
              <p className="lede">A reproducible computational instrument for turning experimental biological time series into transparent temporal, spectral, and signal-state readings.</p>
              <div className="index-actions">
                <button className="brass-button" onClick={() => goTo("apparatus")}>
                  <ScanLine size={16} strokeWidth={1.5} /> Engage apparatus <ArrowDownRight size={15} strokeWidth={1.5} />
                </button>
                <button className="text-button" onClick={() => goTo("archives")}><BookOpen size={15} strokeWidth={1.5} /> Browse archives</button>
              </div>
            </div>
            <div className="index-plate" aria-label="Instrument foundation status">
              <div className="plate-caption">FIELD REGISTER / BG-001</div>
              <div className="plate-dial">
                <div className="dial-needle" />
                <div className="dial-center" />
                <span className="dial-mark dial-mark-top">READY</span>
                <span className="dial-mark dial-mark-right">DATA</span>
                <span className="dial-mark dial-mark-bottom">EMPTY</span>
                <span className="dial-mark dial-mark-left">VERIFY</span>
              </div>
              <div className="plate-foot"><span>INPUT</span><strong>AWAITING SPECIMEN</strong></div>
            </div>
          </section>

          <section className="metadata-ribbon" aria-label="Specimen metadata">
            <div><span>SPECIMEN</span><strong>UNREGISTERED</strong></div>
            <div><span>ORGANISM</span><strong>NOT SELECTED</strong></div>
            <div><span>MODALITY</span><strong>TIME SERIES / BIOELECTRIC</strong></div>
            <div><span>READING STATE</span><StatusStamp tone="muted">NO INPUT</StatusStamp></div>
          </section>

          <section id="apparatus" className="section-anchor apparatus-section" aria-labelledby="apparatus-title">
            <div className="section-topline"><div className="section-kicker"><span className="section-number">II</span> The Apparatus <span className="kicker-line" /></div><StatusStamp>OSCILLOGRAPH STANDBY</StatusStamp></div>
            <div className="apparatus-grid">
              <article className="instrument-panel waveform-panel">
                <PanelHeading index="01" eyebrow="Primary observation" title="Waveform viewport" detail="Measured signal trace will appear here after a verified specimen is loaded." />
                <div className="plot-viewport" role="img" aria-label="Empty waveform viewport. No biological data loaded.">
                  <div className="plot-grid" aria-hidden="true" />
                  <EmptyReadout label="[ AWAITING SPECIMEN ]" detail="No signal values are rendered in the foundation state." />
                  <div className="axis-label axis-y">AMPLITUDE</div>
                  <div className="axis-label axis-x">TIME →</div>
                </div>
                <div className="panel-footer"><span>CHANNEL / —</span><span>UNIT / SOURCE-PENDING</span><span>RATE / —</span></div>
              </article>

              <article className="instrument-panel readings-panel">
                <PanelHeading index="02" eyebrow="Statistical readings" title="Readings" detail="Derived values remain blank until source data and method parameters are present." />
                <div className="readings-list">
                  {[
                    ["MEAN", "—"],
                    ["MEDIAN", "—"],
                    ["VARIANCE", "—"],
                    ["SAMPLE COUNT", "—"],
                  ].map(([label, value]) => <div className="reading-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
                </div>
                <div className="reading-notice"><CircleAlert size={15} strokeWidth={1.4} /><span>Observed data and derived values are intentionally separated.</span></div>
              </article>
            </div>

            <div className="secondary-grid">
              <article className="instrument-panel compact-panel">
                <PanelHeading index="03" eyebrow="Spectral observation" title="Spectrum" />
                <EmptyReadout label="[ CALCULATION DORMANT ]" detail="Welch PSD requires a loaded signal." />
              </article>
              <article className="instrument-panel compact-panel">
                <PanelHeading index="04" eyebrow="Event register" title="Events" />
                <EmptyReadout label="[ NO EVENTS REGISTERED ]" detail="No annotation is inferred without an input trace." />
              </article>
              <article className="instrument-panel compact-panel state-panel">
                <PanelHeading index="05" eyebrow="Interpretation boundary" title="Bio-Signal State" />
                <div className="state-reading"><Gauge size={22} strokeWidth={1.3} /><strong>UNASSIGNED</strong><span>Mathematical patterns are not biological mechanisms.</span></div>
              </article>
            </div>
          </section>

          <section className="provenance-panel instrument-panel" aria-labelledby="provenance-title">
            <div className="provenance-heading"><PanelHeading index="06" eyebrow="Traceability" title="Chronicle of provenance" detail="Every future result must remain linked to input, method, and processing version." /><button className="icon-button" aria-label="Export is unavailable until a specimen is loaded" disabled><Download size={16} strokeWidth={1.4} /></button></div>
            <div className="chronicle">
              <div className="chronicle-line" aria-hidden="true" />
              {[
                ["01", "INPUT", "No source file registered", "Awaiting specimen"],
                ["02", "METHOD", "Analysis parameters not yet applied", "Pending input"],
                ["03", "OUTPUT", "Export becomes available after analysis", "Unavailable in foundation"],
              ].map(([number, label, title, detail]) => <div className="chronicle-entry" key={number}><span className="chronicle-node">{number}</span><div><span>{label}</span><strong>{title}</strong><small>{detail}</small></div></div>)}
            </div>
          </section>

          <section id="archives" className="placeholder-section section-anchor" aria-labelledby="archives-title">
            <div className="section-kicker"><span className="section-number">III</span> The Archives <span className="kicker-line" /></div>
            <div className="placeholder-copy"><Archive size={25} strokeWidth={1.2} /><div><h2 id="archives-title">Archival index awaiting dataset connection</h2><p>The archive shell is ready. Real experimental records will be added in the ingestion phase; no fabricated records are shown.</p></div><StatusStamp tone="muted">NEXT PHASE</StatusStamp></div>
          </section>

          <section id="calibrations" className="placeholder-section section-anchor" aria-labelledby="calibrations-title">
            <div className="section-kicker"><span className="section-number">IV</span> Mechanical Calibrations <span className="kicker-line" /></div>
            <div className="placeholder-copy"><Settings2 size={25} strokeWidth={1.2} /><div><h2 id="calibrations-title">Calibration controls not yet engaged</h2><p>Signal conditioning and method parameters will be introduced only alongside the verified data path.</p></div><StatusStamp tone="muted">NEXT PHASE</StatusStamp></div>
          </section>

          <footer className="site-footer"><span>BIOSENSE GRID / FORMAL REGISTER</span><span>ACTIVE VIEW / {activeLabel.toUpperCase()}</span><span>NO BIOLOGICAL CONCLUSION IN FOUNDATION</span></footer>
        </main>
      </div>
    </div>
  );
}

export default Home;
