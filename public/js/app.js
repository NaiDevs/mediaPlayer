const list = document.getElementById('video-list');
const player = document.getElementById('video-player');
const source = document.getElementById('video-source');
const title = document.getElementById('player-title');
const playPause = document.getElementById('play-pause');
const muteToggle = document.getElementById('mute-toggle');
const volume = document.getElementById('volume');
const speed = document.getElementById('speed');
const speedUp = document.getElementById('speed-up');
const speedDown = document.getElementById('speed-down');
const pagination = document.getElementById('pagination');

const perPage = 6;
let currentPage = 1;

function getItems() {
  return Array.from(document.querySelectorAll('.video-item'));
}

function renderPagination() {
  const items = getItems();
  const total = items.length;
  const pages = Math.ceil(total / perPage);
  pagination.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    const a = document.createElement('button');
    a.textContent = i;
    a.className = i === currentPage ? 'active' : '';
    a.addEventListener('click', () => { currentPage = i; showPage(); });
    pagination.appendChild(a);
  }
}

function showPage() {
  const items = getItems();
  items.forEach((el, idx) => {
    const page = Math.floor(idx / perPage) + 1;
    el.style.display = page === currentPage ? 'flex' : 'none';
  });
  renderPagination();
}

function selectVideo(li) {
  const src = li.dataset.src;
  const videoTitle = li.querySelector('strong').textContent;
  source.src = src;
  player.load();
  player.play();
  title.textContent = videoTitle;
  document.querySelectorAll('.video-item').forEach(i => i.classList.remove('selected'));
  li.classList.add('selected');
}

list.addEventListener('click', (e) => {
  const li = e.target.closest('.video-item');
  if (!li) return;
  selectVideo(li);
});

playPause.addEventListener('click', () => {
  if (player.paused) player.play(); else player.pause();
});

muteToggle.addEventListener('click', () => {
  player.muted = !player.muted;
  muteToggle.textContent = player.muted ? 'Unmute' : 'Mute';
});

volume.addEventListener('input', () => {
  player.volume = Number(volume.value);
});

speedUp.addEventListener('click', () => {
  player.playbackRate = Math.min(player.playbackRate + 0.25, 3);
  speed.textContent = player.playbackRate + 'x';
});

speedDown.addEventListener('click', () => {
  player.playbackRate = Math.max(player.playbackRate - 0.25, 0.25);
  speed.textContent = player.playbackRate + 'x';
});

// Inicialización
showPage();
const firstVisible = document.querySelector('.video-item[style*="display: flex"]');
if (firstVisible) firstVisible.setAttribute('tabindex', '0');
