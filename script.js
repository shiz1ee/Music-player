const musicContainer = document.querySelector('.music-container')
const playBtn = document.querySelector('#play')
const prevBtn = document.querySelector('#prev')
const nextBtn = document.querySelector('#next')
const audio = document.querySelector('#audio')
const progress = document.querySelector('.progress')
const progressContainer = document.querySelector('.progress-container')
const title = document.querySelector('#title')
const cover = document.querySelector('#cover')
const queue = document.querySelector('#queue')
const addToQueueBtn = document.querySelector('#add-to-queue')
const songSelect = document.querySelector('#song-select')
const volume = document.querySelector('#volume')
const addPlaylistBtn = document.querySelector('#add-playlist')
const folderInput = document.querySelector('#folder-input')
const playlistsContainer = document.querySelector('#playlists')
//song titles
const songs = ['hey', 'summer', 'ukulele']
let playlist = [...songs]

//keep trak of da song
let songIndex = 2

// Initial load song 
loadSong(songs[songIndex])

displayQueue()

//update song details 
function loadSong(song) {
    title.innerText = song
    audio.src = `music/${song}.mp3`
    cover.src = `images/${song}.jpg`
}


function playSong() {
    musicContainer.classList.add('play');
    playBtn.querySelector('i.fas').classList.remove('fa-play');
    playBtn.querySelector('i.fas').classList.add('fa-pause');
    audio.play()
}

function pauseSong() {
    musicContainer.classList.remove('play')

    playBtn.querySelector('i.fas').classList.remove('fa-pause')
    playBtn.querySelector('i.fas').classList.add('fa-play')
    audio.pause()
}

function prevSong() {
    if (playlist.length === 0) return

    songIndex--

    if (songIndex < 0) {
        songIndex = playlist.length - 1
    }

    loadSong(playlist[songIndex])
    playSong()
}

function nextSong() {
    playlist.shift()

    if (playlist.length === 0) {
        songIndex = 0
        return
    }

    songIndex = 0 
    loadSong(playlist[songIndex])
    displayQueue()
    playSong()

}

function updateProgress(e) {
    const {duration, currentTime} = e.srcElement
    const progressPercent = (currentTime / duration) * 100
    progress.style.width = `${progressPercent}%`

}

function setProgress(e) {
    const width = this.clientWidth
    const clickX = e.offsetX
    const duration = audio.duration

    audio.currentTime = (clickX / width) * duration
}

function displayQueue() {
    queue.innerHTML = ''

    playlist.forEach((song, index) => {
        const li = document.createElement('li')

        li.innerText = song
        li.addEventListener('click', () => {
            songIndex = index
            loadSong(playlist[songIndex])
            playSong()
        })
        queue.appendChild(li)
    })
}

function addToQueue() {
    const selectedSong = songSelect.value 

    playlist.push(selectedSong)

    displayQueue()
}

function savePlaylist(name, songs) {
    const transaction = db.transaction(['playlists'], 'readwrite')
    const store = transaction.objectStore('playlists')

    store.add({
        name: name,
        songs: songs,
        createdAt: Date.now()
    })

    transaction.oncomplete = () => {
        console.log(`playlist "${name}" saved!`)
        loadPlaylists()
    }

    transaction.onerror = (e) => {
        console.error('COuld not save the playlist: ', e.target.error)
    }
}

function loadPlaylists() {
    if (!db) return

    const transaction = db.transaction(['playlists'], 'readonly')
    const store = transaction.objectStore('playlists')

    const request = store.getAll()

    request.onsuccess = () => {
        console.log('saved playlists:', request.result)

        playlistsContainer.innerHTML = '';

        request.result.forEach(playlist => {

            const playlistElement = document.createElement('div');
            playlistElement.classList.add('playlist-item');


            const playlistName = document.createElement('h3');
            playlistName.innerText = playlist.name;

            const songCount = document.createElement('p');
            songCount.innerText = 
                `${playlist.songs.length} songs`;

            playlistElement.addEventListener('click', () => {
                console.log('Clicked playlist', playlist.name)
                console.log('clicked songs', playlist.song)
            })

            playlistElement.appendChild(playlistName);
            playlistElement.appendChild(songCount);

            playlistsContainer.appendChild(playlistElement);
        });
    };

    request.onerror = (e) => {
        console.error('could not load playlists:', e.target.error);
    };
}

 playBtn.addEventListener('click', () => {
    const isPlaying = musicContainer.classList.contains('play')

    if(isPlaying) {
        pauseSong()
    } else {
        playSong()
    }
})

prevBtn.addEventListener('click', prevSong)
nextBtn.addEventListener('click', nextSong)

audio.addEventListener('timeupdate', updateProgress)

progressContainer.addEventListener('click', setProgress)

audio.addEventListener('ended', nextSong)
addToQueueBtn.addEventListener('click', addToQueue)

volume.addEventListener('input', () => {
    audio.volume = volume.value
})

addPlaylistBtn.addEventListener('click', () => {
    folderInput.click()
})

folderInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files)

    const mp3files = files.filter(file => 
        file.type === 'audio/mpeg'
    )

    if (mp3files.length === 0) {
        alert('No MP3 files Found in Tis folder.')
        return
    }

    const playlistName = files[0].webkitRelativePath.split('/')[0]

    savePlaylist(playlistName, mp3files)
})

// adding indexed datbase 

let db;

const request = indexedDB.open('musicPlayerDB', 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;

    if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', {
            keyPath: 'id',
            autoIncrement: true
        });
    }

};

request.onsuccess = (e) => {
    db = e.target.result;
    console.log('IndexedDB connected ');

    loadPlaylists();
};

request.onerror = (e) => {
    console.error('IndexedDB error:', e.target.error);
};