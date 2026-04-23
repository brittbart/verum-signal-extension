function getDomain() {
  return window.location.hostname.replace('www.', '');
}

function createBadge(data, domain) {
  const existing = document.getElementById('veris-badge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'veris-badge';

  const colors = {
    'High':   { bg: '#1a4a2e', border: '#2d7a4a', text: '#4ade80' },
    'Medium': { bg: '#4a3200', border: '#7a5200', text: '#fbbf24' },
    'Low':    { bg: '#4a1a1a', border: '#7a2d2d', text: '#f87171' },
  };
  const c = colors[data.rating] || colors['Medium'];

  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    background: ${c.bg};
    border: 1px solid ${c.border};
    border-radius: 10px;
    padding: 10px 14px;
    font-family: -apple-system, sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    min-width: 180px;
  `;

  const earlyData = data.total_claims < 50
    ? `<div style="font-size:10px;color:${c.text};opacity:0.6;margin-top:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;">⚠ Early data · score may change</div>`
    : '';

  badge.innerHTML = `
    <div style="font-size:9px;font-weight:500;color:${c.text};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Verum Signal · ${domain}</div>
    <div style="font-size:15px;font-weight:600;color:${c.text};">${data.rating} Reliability</div>
    <div style="font-size:11px;color:${c.text};opacity:0.8;margin-top:2px;">${data.verified} of ${data.total_claims} claims verified</div>
    <div style="font-size:10px;color:${c.text};opacity:0.6;margin-top:2px;">as of ${data.as_of}</div>
    ${earlyData}
  `;

  badge.addEventListener('click', () => badge.remove());
  document.body.appendChild(badge);
}

function checkSource() {
  const domain = getDomain();
  if (!domain || domain === 'newtab') return;

  fetch(`https://web-production-c94e7.up.railway.app/api/source?domain=${domain}`)
    .then(r => r.json())
    .then(data => {
      if (data.status === 'found') {
        createBadge(data, domain);
      }
    })
    .catch(() => {});
}

checkSource();
