const API_BASE = "https://verumsignal.com";

function extractDomain(url) {
  try {
    const u = new URL(url);
    let host = u.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    return host;
  } catch (e) {
    return null;
  }
}

function formatDate(isoOrString) {
  if (!isoOrString) return "—";
  try {
    const d = new Date(isoOrString);
    if (isNaN(d)) return isoOrString;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return isoOrString;
  }
}

function renderLoading() {
  return `
    <div class="empty-body">
      <div class="wave-loader">
        <svg viewBox="0 0 120 40">
          <path d="M8 20 Q20 4 32 20 Q44 36 56 20 Q68 4 80 20 Q92 36 104 20"/>
          <circle cx="110" cy="20" r="3"/>
        </svg>
      </div>
      <div style="text-align:center;">
        <div class="empty-title">Reading the signal<span class="italic">…</span></div>
        <div class="empty-sub" style="margin-top:4px;">Checking source against our database</div>
      </div>
    </div>
  `;
}

function renderRating(domain, data) {
  const score = Math.round(data.score ?? 0);

  let band = "low";
  if (score >= 75) band = "high";
  else if (score >= 45) band = "medium";

  const tierLabel = data.tier || (band.charAt(0).toUpperCase() + band.slice(1));

  const earlyData =
    data.tier === "Limited Data" ||
    (!data.tier && (data.verdict_count ?? data.total_claims ?? 0) < 50);

  const verdictCount = data.verdict_count ?? data.total_claims ?? 0;
  const asOf = formatDate(data.as_of || data.last_updated);

  return `
    <div class="body">
      <div class="domain fu fu-1">
        <span class="domain-dot"></span>
        <span>Current source</span>
        <span style="flex:1"></span>
        <span class="domain-name">${domain}</span>
      </div>
      <div class="score-block fu fu-2">
        <div class="score-row">
          <span class="score-value ${band}">${score}</span>
          <span class="score-suffix">/100</span>
          <span class="rating-pill ${band}">
            <span class="bullet"></span>
            ${tierLabel}
          </span>
        </div>
        <div class="score-bar">
          <div class="score-bar-fill ${band}" style="width: ${score}%;"></div>
        </div>
        <div class="last-updated">
          <span class="last-updated-label">${verdictCount} verdict${verdictCount === 1 ? "" : "s"}${earlyData ? " · early data" : ""}</span>
          <span class="last-updated-value">${asOf}</span>
        </div>
      </div>
    </div>
    <div class="footer fu fu-3">
      <button class="primary-btn" id="analyze-btn">
        Analyze this article
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/>
          <path d="M12 5l7 7-7 7"/>
        </svg>
      </button>
      <button class="ghost-btn" id="report-btn">View full outlet report →</button>
    </div>
  `;
}

function renderNotFound(domain) {
  return `
    <div class="empty-body fu fu-1">
      <div class="empty-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 21h8"/>
          <path d="M12 17v4"/>
          <rect x="3" y="3" width="18" height="14" rx="2"/>
        </svg>
      </div>
      <div class="empty-title">No <span class="italic">signal</span> yet</div>
      <div class="empty-sub">We haven't built a reliability profile for this source. Analyze an article to start one.</div>
      <div class="empty-domain">${domain}</div>
    </div>
    <div class="footer fu fu-2">
      <button class="primary-btn" id="analyze-btn">
        Analyze this article
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/>
          <path d="M12 5l7 7-7 7"/>
        </svg>
      </button>
      <button class="ghost-btn" id="leaderboard-btn">Browse the leaderboard →</button>
    </div>
  `;
}

function renderError() {
  return `
    <div class="empty-body fu fu-1">
      <div class="empty-icon error">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
      <div class="empty-title">No connection</div>
      <div class="empty-sub">We couldn't reach the Verum Signal API. Check your network and try again.</div>
    </div>
    <div class="footer fu fu-2">
      <button class="primary-btn" id="retry-btn">
        Retry
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6L21 8"/>
          <path d="M21 3v5h-5"/>
        </svg>
      </button>
    </div>
  `;
}

function bindFooterActions(domain, tabUrl) {
  const analyzeBtn = document.getElementById("analyze-btn");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", () => {
      const target = `https://verumsignal.com/report?url=${encodeURIComponent(tabUrl || "")}`;
      chrome.tabs.create({ url: target });
    });
  }
  const reportBtn = document.getElementById("report-btn");
  if (reportBtn && domain) {
    reportBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: `https://verumsignal.com/outlet/${domain}` });
    });
  }
  const leaderboardBtn = document.getElementById("leaderboard-btn");
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://verumsignal.com/leaderboard" });
    });
  }
  const retryBtn = document.getElementById("retry-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", init);
  }
}

async function fetchSource(domain) {
  const url = `${API_BASE}/api/source?domain=${encodeURIComponent(domain)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function init() {
  const contentEl = document.getElementById("content");
  contentEl.innerHTML = renderLoading();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabUrl = tab?.url || "";
    const domain = extractDomain(tabUrl);

    if (!domain || domain === "newtab" || tabUrl.startsWith("chrome://")) {
      contentEl.innerHTML = renderNotFound("—");
      bindFooterActions(null, tabUrl);
      return;
    }

    const data = await fetchSource(domain);

    if (data && data.status === "found") {
      contentEl.innerHTML = renderRating(domain, data);
    } else {
      contentEl.innerHTML = renderNotFound(domain);
    }
    bindFooterActions(domain, tabUrl);
  } catch (err) {
    console.error("Verum Signal popup error:", err);
    contentEl.innerHTML = renderError();
    bindFooterActions(null, null);
  }
}

document.addEventListener("DOMContentLoaded", init);
