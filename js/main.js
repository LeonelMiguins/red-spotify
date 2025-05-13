const server = 'https://api.jsonbin.io/v3/b/682134c18960c979a597a07c';
const container = document.getElementById('dinamic-content');
const audioPlayer = document.getElementById('audio-player');
const playerTitle = document.querySelector('.player-container-title');
const playerArtist = document.querySelector('.player-container-artist');
const playerImage = document.querySelector('.player-container-thumb img');
const playPauseButton = document.querySelector('.player-play-pause');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');

let currentTrack = null;
let currentPlaylist = [];
let currentTrackIndex = -1;

function fetchAndStoreAlbums() {
  fetch(server)
    .then(response => response.json())
    .then(data => {
      const albums = Array.isArray(data.record) ? data.record : [data.record];
      localStorage.setItem('albumsData', JSON.stringify(albums));
    })
    .catch(error => console.error('Erro ao buscar o JSON:', error));
}

function renderAlbumsFromStorage() {
  const albums = JSON.parse(localStorage.getItem('albumsData'));
  if (!albums) {
    container.innerHTML = '<p>Dados não encontrados. Recarregue a página.</p>';
    return;
  }

  container.innerHTML = '';
  albums.forEach(album => {
    const div = document.createElement('div');
    div.classList.add('dinamic-content-album');

    div.innerHTML = `
      <img src="${album.image}" alt="${album.title}" onclick="loadAlbum(${Number(album.id)})">
      <p class="dinamic-content-album-title">${album.title}</p>
      <a class="dinamic-content-album-artist">${album.artist}</a>
    `;

    container.appendChild(div);
  });
}

function loadAlbum(id) {
  const albums = JSON.parse(localStorage.getItem('albumsData'));
  const album = albums.find(a => a.id === Number(id));

  if (!album) {
    container.innerHTML = '<p>Álbum não encontrado.</p>';
    return;
  }

  container.innerHTML = `
    <div class="container-album">
      <div class="container-album-detalhe">
        <img src="${album.image}" alt="${album.title}">
        <div class="album-info">
          <h2>${album.title}</h2>
          <h3>${album.artist}</h3>
          <h4>Generos: ${album.genre}</h4>
          <h4>Ano: ${album.year}</h4>
          <h4>Upload: ${album.author}</h4>
            <div class="container-album-btns">
              <button class="play-album-btn">Ouvir</button>
              <button class="download-album-btn">Baixar Album</button>
            </div>  
        </div>
      </div>
      <h3>Faixas:</h3>
      <div class="album-musics">
        ${
          Array.isArray(album.tracks) && album.tracks.length > 0
            ? album.tracks.map((track, index) => `
                <div class="album-music" onclick="playTrack('${track.url}', '${track.name}', '${track.artist}', '${album.image}', ${id}, ${index})">
                  <span class="track-index">${index + 1}</span>
                  <span class="track-name">${track.name}</span>
                  <span class="track-artist">${track.artist}</span>
                </div>
              `).join('')
            : '<p>Sem faixas disponíveis.</p>'
        }
      </div>

      <button onclick="loadAlbuns()">Voltar</button>
    </div>
  `;

  // Atualiza playlist atual
  currentPlaylist = album.tracks;
}

// tocar música
function playTrack(url, title, artist, image, albumId = null, index = null) {
  audioPlayer.src = url;
  audioPlayer.play().catch(error => console.error("Erro ao tentar tocar a música:", error));

  playerTitle.textContent = title;
  playerArtist.textContent = artist;
  playerImage.src = image;

  playPauseButton.src = 'img/pause.png';

  currentTrack = { url, title, artist, image };

  // Atualiza o botão de download com a URL da faixa atual
  document.getElementById('download-btn').href = url;
  if (albumId !== null && index !== null) {
    const albums = JSON.parse(localStorage.getItem('albumsData'));
    const album = albums.find(a => a.id === albumId);
    if (album && Array.isArray(album.tracks)) {
      currentPlaylist = album.tracks;
      currentTrackIndex = index;
    }
  }
}

//próxima música
function nextTrack() {
  if (currentPlaylist.length > 0 && currentTrackIndex < currentPlaylist.length - 1) {
    currentTrackIndex++;
    const track = currentPlaylist[currentTrackIndex];
    playTrack(track.url, track.name, track.artist, playerImage.src, null, currentTrackIndex);
  }
}

//música anterior
function prevTrack() {
  if (currentPlaylist.length > 0 && currentTrackIndex > 0) {
    currentTrackIndex--;
    const track = currentPlaylist[currentTrackIndex];
    playTrack(track.url, track.name, track.artist, playerImage.src, null, currentTrackIndex);
  }
}

// Atualiza a barra de progresso conforme a música toca
audioPlayer.addEventListener('timeupdate', () => {
  const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progress.style.width = `${percentage}%`;
});

// Botão play/pause
playPauseButton.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playPauseButton.src = 'img/pause.png';
  } else {
    audioPlayer.pause();
    playPauseButton.src = 'img/play.png';
  }
});

// Toca próxima faixa automaticamente ao terminar
audioPlayer.addEventListener('ended', nextTrack);
window.onload = () => {
  if (!localStorage.getItem('albumsData')) {
    fetchAndStoreAlbums();
  }
  renderAlbumsFromStorage();
};

//Permitir clique na barra para pular para uma posição
progressBar.addEventListener('click', (event) => {
  const rect = progressBar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const width = rect.width;
  const duration = audioPlayer.duration;

  audioPlayer.currentTime = (clickX / width) * duration;
});

// Função de pesquisa
document.getElementById('searchButton').addEventListener('click', () => {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
  const container = document.getElementById('dinamic-content'); // corrigido aqui

  if (!container) {
    console.error("Elemento com id 'dinamic-content' não encontrado.");
    return;
  }

  container.innerHTML = ''; // Limpa o conteúdo anterior

  const savedData = localStorage.getItem('albumsData');
  if (!savedData) return;

  const albums = JSON.parse(savedData);

  // Filtra os álbuns que combinam com o título ou artista
  const filteredAlbums = albums.filter(album => {
    return (
      album.title.toLowerCase().includes(searchTerm) ||
      album.artist.toLowerCase().includes(searchTerm)
    );
  });

  if (filteredAlbums.length === 0) {
    container.innerHTML = '<p>Nenhum álbum encontrado.</p>';
    return;
  }

  // Renderiza os álbuns filtrados
  filteredAlbums.forEach(album => {
    const div = document.createElement('div');
    div.classList.add('dinamic-content-album');

    div.innerHTML = `
    <h2>Resultados da Pesquisa:</h2><br>
      <div class="album-card">
        <img src="${album.image}" alt="${album.title}" onclick="loadAlbum(${Number(album.id)})" class="album-image">
        <div class="album-info">
          <p class="dinamic-content-album-title">${album.title}</p>
          <a class="dinamic-content-album-artist">${album.artist}</a>
        </div>
      </div>
    `;

    container.appendChild(div);
  });
});





window.onload = () => {
  fetchAndStoreAlbums(); // Sempre busca os dados mais recentes
  setTimeout(renderAlbumsFromStorage, 500);
};
