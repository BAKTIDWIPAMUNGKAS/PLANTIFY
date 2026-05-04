// ── DOM refs ────────────────────────────────────────────
const uploadZone  = document.getElementById('uploadZone');
const fileInput   = document.getElementById('fileInput');
const uploadUI    = document.getElementById('uploadUI');
const previewWrap = document.getElementById('previewWrap');
const imgPreview  = document.getElementById('imgPreview');
const analyzeBtn  = document.getElementById('analyzeBtn');
const changeBtn   = document.getElementById('changeBtn');
const output      = document.getElementById('output');
const form        = document.getElementById('analyzeForm');

let hasImage = false;

// ── Upload interactions ──────────────────────────────────
uploadZone.addEventListener('click', e => {
  if (changeBtn && (e.target === changeBtn || changeBtn.contains(e.target))) return;
  if (!uploadZone.classList.contains('has-image')) fileInput.click();
});
changeBtn && changeBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });

uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', ()  => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) {
    fileInput.files = e.dataTransfer.files;
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  if (file.size > 10 * 1024 * 1024) { alert('File size maximum 10MB'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    imgPreview.src = e.target.result;
    uploadUI.style.display    = 'none';
    previewWrap.style.display = 'block';
    uploadZone.classList.add('has-image');
    hasImage = true;
    checkReady();
  };
  reader.readAsDataURL(file);
}

function checkReady() {
  analyzeBtn.disabled = !hasImage;
}

// ── Form submit ──────────────────────────────────────────
form.addEventListener('submit', async e => {
  e.preventDefault();
  analyzeBtn.disabled = true;

  output.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p class="loading-text">Analyzing plant image…</p>
      <p class="loading-sub">Please wait a moment</p>
    </div>`;

  const formData = new FormData(form);

  try {
    const res  = await fetch('/analyze', { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || 'HTTP ' + res.status);
    renderResult(json.data);
  } catch (err) {
    output.innerHTML =
      '<div class="error-block">' +
        '<div class="error-block-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' +
          '</svg>' +
        '</div>' +
        '<div><strong>Error occurred</strong><br>' + err.message + '</div>' +
      '</div>';
  } finally {
    analyzeBtn.disabled = false;
    checkReady();
  }
});

// ── Render result ────────────────────────────────────────
function renderResult(r) {
  if (!r.terdeteksi) {
    output.innerHTML =
      '<div class="healthy-block">' +
        '<div class="healthy-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">' +
            '<path d="M12 22C12 22 4 18 4 12V5l8-3 8 3v7c0 6-8 10-8 10z"/>' +
            '<polyline points="9 12 11 14 15 10"/>' +
          '</svg>' +
        '</div>' +
        '<h2>Plant Looks Healthy</h2>' +
        '<p>No significant pests or diseases detected. Try photographing closer if symptoms persist.</p>' +
      '</div>';
    return;
  }

  const sev      = (r.tingkat_keparahan || 'ringan').toLowerCase();
  const pipCount = sev === 'ringan' ? 1 : sev === 'sedang' ? 2 : 3;
  const bars     = [1,2,3].map(i =>
    '<div class="sev-bar ' + (i <= pipCount ? 'on ' + sev : '') + '"></div>'
  ).join('');
  const persen       = Math.min(100, Math.max(0, r.persentase_kerusakan || 0));
  const gejalaTags   = (r.gejala_terlihat || []).map(g => '<span class="tag">' + g + '</span>').join('');
  const langkahItems = (r.langkah_penanganan || []).map(l => '<li>' + l + '</li>').join('');
  const prevItems    = (r.pencegahan || []).map(p => '<li>' + p + '</li>').join('');

  let html = '<div class="result-card">';

  // Hero block
  html += '<div class="result-hero-block">';
  html += '<div class="result-type-tag">' + (r.jenis || 'Pest / Disease') + '</div>';
  html += '<div class="result-name">' + (r.nama_hama_penyakit || 'Unknown') + '</div>';
  html += r.nama_ilmiah ? '<div class="result-sci">' + r.nama_ilmiah + '</div>' : '<div style="margin-bottom:16px;"></div>';
  html += '<div class="sev-row">';
  html += '<span class="sev-label">Severity</span>';
  html += '<div class="sev-bars">' + bars + '</div>';
  html += '<span class="sev-badge ' + sev + '">' + (r.tingkat_keparahan || '-') + '</span>';
  if (persen > 0) html += '<span class="sev-pct">' + persen + '% damage</span>';
  html += '</div></div>';

  // Description + symptoms
  html += '<div class="info-row' + (gejalaTags ? '' : ' full') + '">';
  html += '<div class="info-block"><div class="ib-label">Description</div><div class="ib-body">' + (r.deskripsi || '-') + '</div></div>';
  if (gejalaTags) html += '<div class="info-block"><div class="ib-label">Detected Symptoms</div><div class="tags">' + gejalaTags + '</div></div>';
  html += '</div>';

  // Recommendation
  html += '<div class="rec-block"><div class="rec-block-title">Treatment Recommendation</div><div class="rec-grid">';
  html += '<div><div class="rec-cell-label">Pesticide</div><div class="rec-cell-val">' + (r.pestisida_rekomendasi || '-') + '</div></div>';
  html += '<div><div class="rec-cell-label">Dosage</div><div class="rec-cell-val">' + (r.dosis || '-') + '</div></div>';
  html += '<div><div class="rec-cell-label">Application</div><div class="rec-cell-val">' + (r.cara_aplikasi || '-') + '</div></div>';
  if (r.frekuensi_aplikasi) html += '<div style="grid-column:1/-1;"><div class="rec-cell-label">Frequency</div><div class="rec-cell-val">' + r.frekuensi_aplikasi + '</div></div>';
  html += '</div></div>';

  // Steps + prevention
  if (langkahItems) {
    html += '<div class="info-row">';
    html += '<div class="info-block"><div class="ib-label">Treatment Steps</div><ol class="step-list">' + langkahItems + '</ol>';
    if (r.waktu_pemulihan) html += '<div class="recovery-row">Estimated recovery: <strong>' + r.waktu_pemulihan + '</strong></div>';
    html += '</div>';
    if (prevItems) html += '<div class="info-block"><div class="ib-label">Prevention Tips</div><ul class="prev-list">' + prevItems + '</ul></div>';
    html += '</div>';
  }

  html += '</div>';
  output.innerHTML = html;
}

// ── Scroll reveal ────────────────────────────────────────
const revealEls = document.querySelectorAll('[data-reveal]');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('revealed'), i * 90);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
revealEls.forEach(el => io.observe(el));

// ── Navbar scroll ────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  nav.style.background = window.scrollY > 60
    ? 'rgba(7,30,7,0.96)'
    : 'rgba(7,30,7,0.72)';
});