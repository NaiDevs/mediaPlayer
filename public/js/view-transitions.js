// Script to fetch videos from JSONPlaceholder and enable view transitions between pages

async function fetchVideos() {
  const res = await fetch('https://jsonplaceholder.typicode.com/photos?_limit=30');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

function createRow(item) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${item.id}</td>
    <td>${item.title}</td>
    <td><img src="${item.thumbnailUrl}" width="80" alt="${item.title}"></td>
    <td><a href="/player/${item.id}" data-vt="true">Open</a></td>
  `;
  return tr;
}

async function initVideosTable() {
  const tbody = document.getElementById('videos-tbody');
  try {
    const items = await fetchVideos();
    tbody.innerHTML = '';
    items.forEach(it => tbody.appendChild(createRow(it)));
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4">Error loading videos</td></tr>';
    console.error(err);
  }
}

// View Transitions logic (simple progressive enhancement)
function supportsViewTransitions() {
  return document.startViewTransition !== undefined;
}

function hijackLinks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-vt]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!supportsViewTransitions()) return; // fallback to normal nav
    e.preventDefault();
    document.startViewTransition(() => {
      window.location.href = href;
    });
  });
}

if (document.getElementById('videos-tbody')) {
  initVideosTable();
}

hijackLinks();
