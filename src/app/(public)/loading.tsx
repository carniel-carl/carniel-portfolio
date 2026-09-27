import SVGIcon from "@/components/general/SVGIcon";

const NAME = "Carniel";
const STATUS = ["resolving route", "fetching content", "rendering", "almost there"];

// Pure CSS so it animates the instant it streams in, before any JS hydrates.
// Styles live under "ROUTE LOADER" in globals.css.
const Loading = () => {
  return (
    <div role="status" className="route-loader">
      <span className="sr-only">Loading</span>

      {/* Oversized monogram drifting behind the wordmark */}
      <div aria-hidden="true" className="route-loader__mark">
        <SVGIcon width="100%" height="100%" />
      </div>

      <div aria-hidden="true" className="relative flex flex-col items-center">
        <p className="route-loader__name">
          {NAME.split("").map((ch, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.11}s` }}>
              {ch}
            </span>
          ))}
          <span className="route-loader__dot">.</span>
        </p>

        <div className="route-loader__track">
          <div />
        </div>

        <div className="route-loader__status">
          <span className="text-accent">&rsaquo;</span>
          <span className="route-loader__ticker">
            <span>
              {[...STATUS, STATUS[0]].map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </span>
          </span>
          <span className="route-loader__caret" />
        </div>
      </div>
    </div>
  );
};

export default Loading;
