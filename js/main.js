const server = [
  'https://api.jsonbin.io/v3/b/682134c18960c979a597a07c',
  'https://api.jsonbin.io/v3/b/6824b0a28a456b79669da82a',
  'https://api.jsonbin.io/v3/b/6824bcf58561e97a5013d51c'
];
const container = document.getElementById('dinamic-content');
const audioPlayer = document.getElementById('audio-player');
const playerTitle = document.querySelector('.player-container-title');
const playerArtist = document.querySelector('.player-container-artist');
const playerTitleMobile = document.querySelector('.player-container-title-mobile');
const playerArtistMobile = document.querySelector('.player-container-artist-mobile');
const playerImage = document.querySelector('.player-container-thumb');
const playPauseButton = document.querySelector('.player-play-pause');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');

let currentTrack = null;
let currentPlaylist = [];
let currentTrackIndex = -1;
let currentAlbumId = null;
let currentServerIndex = null;

// busca os jsons nos servidores
function fetchAndStoreAlbums() {
  server.forEach((url, index) => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        const albums = Array.isArray(data.record) ? data.record : [data.record];
        const serverKey = `albumsData_${index}`;
        localStorage.setItem(serverKey, JSON.stringify(albums));
      })
      .catch(error => console.error('Erro ao buscar o JSON:', error));
  });
}

function renderAlbumsFromStorage() {
  container.innerHTML = ''; // Limpa o conteúdo anterior

  server.forEach((url, index) => {
    const serverKey = `albumsData_${index}`;
    const albums = JSON.parse(localStorage.getItem(serverKey));

    if (albums && albums.length > 0) {
      albums.forEach(album => {
        const div = document.createElement('div');
        div.classList.add('dinamic-content-album');

        div.innerHTML = `
          <img src="${album.image}" alt="${album.title}" onclick="loadAlbum(${Number(album.id)}, ${index})" style="cursor:pointer;">
          <p class="dinamic-content-album-title">${album.title}</p>
          <a class="dinamic-content-album-artist">${album.artist}</a>
        `;

        container.appendChild(div);
      });
    }
  });
}

function loadAlbum(id, serverIndex) {

  const serverKey = `albumsData_${serverIndex}`;
  const albums = JSON.parse(localStorage.getItem(serverKey));
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
            <button class="play-album-btn" onclick="playFirstTrack(${id}, ${serverIndex})">Ouvir</button>
            <button class="back-album-btn" onclick="renderAlbumsFromStorage()">Voltar</button>
          </div>  
        </div>
      </div>
      <div class="album-musics">
        ${
          Array.isArray(album.tracks) && album.tracks.length > 0
            ? album.tracks.map((track, index) => `
                <div class="album-music" onclick="playTrack('${track.url}', '${track.name}', '${track.artist}', '${album.image}', ${id}, ${index}, ${serverIndex})" style="cursor:pointer;">
                  <span class="track-index">${index + 1}</span>
                  <span class="track-name">${track.name}</span>
                  <span class="track-artist">${track.artist}</span>
                </div>
              `).join('')
            : '<p>Sem faixas disponíveis.</p>'
        }
      </div>
    </div>
  `;
}

function playTrack(url, title, artist, image, albumId = null, index = null, serverIndex = null) {
  //salva o id e o servidor do album atual, para ser usado em outras partes
  localStorage.setItem('currentAlbumServer', serverIndex);
  localStorage.setItem('currentAlbumId', albumId);

  audioPlayer.src = url;
  audioPlayer.play().catch(error => console.error("Erro ao tentar tocar a música:", error));

  playerTitle.textContent = title;
  playerArtist.textContent = artist;
  playerTitleMobile.textContent = title;
  playerArtistMobile.textContent = artist;

  playerImage.src = image;

  playPauseButton.src = 'img/pause.png';

  currentTrack = { url, title, artist, image };

  // Atualiza o botão de download
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.href = url;
    downloadBtn.setAttribute('download', ''); // Força o navegador a baixar o arquivo
  }

  if (albumId !== null && index !== null && serverIndex !== null) {
    const serverKey = `albumsData_${serverIndex}`;
    const albums = JSON.parse(localStorage.getItem(serverKey));
    const album = albums.find(a => a.id === Number(albumId));
    if (album && Array.isArray(album.tracks)) {
      currentPlaylist = album.tracks;
      currentTrackIndex = index;
      currentAlbumId = albumId;
      currentServerIndex = serverIndex;
    }
  }
}

function nextTrack() {
  if (currentPlaylist.length > 0 && currentTrackIndex < currentPlaylist.length - 1) {
    currentTrackIndex++;
    const track = currentPlaylist[currentTrackIndex];
    playTrack(track.url, track.name, track.artist, playerImage.src, currentAlbumId, currentTrackIndex, currentServerIndex);
  }
}

function prevTrack() {
  if (currentPlaylist.length > 0 && currentTrackIndex > 0) {
    currentTrackIndex--;
    const track = currentPlaylist[currentTrackIndex];
    playTrack(track.url, track.name, track.artist, playerImage.src, currentAlbumId, currentTrackIndex, currentServerIndex);
  }
}

function playFirstTrack(albumId, serverIndex) {
  const serverKey = `albumsData_${serverIndex}`;
  const albums = JSON.parse(localStorage.getItem(serverKey));

  if (!albums) {
    console.error('Nenhum álbum encontrado para este servidor.');
    return;
  }
  const album = albums.find(a => a.id === Number(albumId));
  if (!album || !Array.isArray(album.tracks) || album.tracks.length === 0) {
    console.error('Álbum não encontrado ou sem faixas.');
    return;
  }
  const firstTrack = album.tracks[0];
  currentPlaylist = album.tracks;
  currentTrackIndex = 0;
  currentAlbumId = albumId;
  currentServerIndex = serverIndex;

  playTrack(firstTrack.url, firstTrack.name, firstTrack.artist, album.image, albumId, 0, serverIndex);
}

// Atualiza a barra de progresso conforme a música toca
audioPlayer.addEventListener('timeupdate', () => {
  if (!audioPlayer.duration) return;
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

// Permitir clique na barra para pular para uma posição
progressBar.addEventListener('click', (event) => {
  const rect = progressBar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const width = rect.width;
  const duration = audioPlayer.duration;

  audioPlayer.currentTime = (clickX / width) * duration;
});

// Quando a música termina, toca a próxima automaticamente
audioPlayer.addEventListener('ended', function () {
  nextTrack();
});

// Pesquisa de álbuns
document.getElementById('searchButton').addEventListener('click', () => {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!container) {
    console.error("Elemento com id 'dinamic-content' não encontrado.");
    return;
  }

  container.innerHTML = '';

  let albums = [];

  server.forEach((url, index) => {
    const savedData = localStorage.getItem(`albumsData_${index}`);
    if (savedData) {
      const serverAlbums = JSON.parse(savedData);

      // Adiciona o serverIndex a cada álbum
      const albumsWithIndex = serverAlbums.map(album => ({
        ...album,
        serverIndex: index
      }));

      albums = albums.concat(albumsWithIndex);
    }
  });

  const filteredAlbums = albums.filter(album =>
    album.title.toLowerCase().includes(searchTerm) ||
    album.artist.toLowerCase().includes(searchTerm)
  );

  if (filteredAlbums.length === 0) {
    container.innerHTML = '<p>Nenhum álbum encontrado.</p>';
    return;
  }

  filteredAlbums.forEach(album => {
    const div = document.createElement('div');
    div.classList.add('dinamic-content-album');
    div.innerHTML = `
      <div class="album-card">
        <img src="${album.image}" alt="${album.title}" onclick="loadAlbum(${Number(album.id)}, ${album.serverIndex})" class="album-image" style="cursor:pointer;">
        <div class="album-info">
          <p class="dinamic-content-album-title">${album.title}</p>
          <p class="dinamic-content-album-artist">${album.artist}</p>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
});



document.getElementById('viewPlaylistBtn').addEventListener('click', () => {
  const serverIndex = localStorage.getItem('currentAlbumServer');
  const albumId = localStorage.getItem('currentAlbumId');

  loadAlbum(Number(albumId), Number(serverIndex));

});



// Inicializa tudo
fetchAndStoreAlbums();
renderAlbumsFromStorage();
