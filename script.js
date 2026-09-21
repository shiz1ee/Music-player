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
const queueContainer = document.querySelector('.queue-container')
const volume = document.querySelector('#volume')
const addPlaylistBtn = document.querySelector('#add-playlist')
const folderInput = document.querySelector('#folder-input')
const playlistsContainer = document.querySelector('#playlists')
const playlistPlayBtn = document.querySelector('#playlist-play')
const playlistShuffleBtn = document.querySelector('#playlist-shuffle')
const currentPlaylistName = document.querySelector('#current-playlist-name')
const playlistRepeatBtn = document.querySelector('#playlist-repeat')
const upNextList = document.querySelector('#up-next')


//song titles
const songs = ['hey', 'summer', 'ukulele']
const localPlaylist = {
    id: 'local',
    name: 'local',
    songs: songs,
    shuffleEnabled: false,
    repeatEnabled: false
}
let playlist = [...songs]
let upNext = []
let playHistory = {}


//keep trak of da song
let songIndex = 2

// Initial load song 
loadSong(songs[songIndex])
renderUpNext()

//update song details 
function loadSong(song) {
    if (typeof song === 'string') {
        title.innerText = song
        audio.src = `music/${song}.mp3`
        cover.src = `images/${song}.jpg`
    } else {
        title.innerText = song.name.replace('.mp3', '')
        audio.src = URL.createObjectURL(song)
    }
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
    if (upNext.length > 0) {
        const queued = upNext.shift()
        loadSong(queued)
        renderUpNext()
        playSong()
        return
    }

    if (playlist.length === 0) return

    songIndex++
    if (songIndex >= playlist.length) songIndex = 0

    loadSong(playlist[songIndex])

    if (queueContainer.style.display === 'block') {
        displayQueue()
    }
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

function showQueue() {
    queueContainer.style.display = 'block'

}

function displayQueue() {
    showQueue()

    queue.innerHTML = ''

    playlist.forEach((song, index) => {

        const li = document.createElement('li')

        const songName = document.createElement('span')

        songName.innerText = typeof song === 'string'
            ? song
            : song.name.replace('.mp3', '')

        const addBtn = document.createElement('button')
        addBtn.innerText = '+'
        addBtn.classList.add('add-queue-btn')

        addBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            upNext.push(song)
            renderUpNext()
        })

        li.addEventListener('click', () => {
            songIndex = index
            loadSong(playlist[songIndex])
            playSong()
        })

        li.appendChild(songName)
        li.appendChild(addBtn)
        queue.appendChild(li)
    })
}

function getSongName(song) {
    return typeof song === 'string' ? song : song.name.replace('.mp3', '')
}

function renderUpNext() {
    upNextList.innerHTML = ''

    if (upNext.length === 0) {
        const empty = document.createElement('li')
        empty.innerText = 'nothing queued'
        empty.classList.add('empty')
        upNextList.appendChild(empty)
        return
    }

    upNext.forEach((song, index) => {
        const li = document.createElement('li')
        const name = document.createElement('span')
        name.innerText = getSongName(song)

        const removeBtn = document.createElement('button')
        removeBtn.innerText = 'x'
        removeBtn.classList.add('add-quque-btn')
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            upNext.splice(index, 1)
            renderUpNext()
        })

        li.appendChild(name)
        li.appendChild(removeBtn)
        upNextList.appendChild(li)
    })
}

function shufflePlaylist(keepCurrent) {
    const current = playlist[songIndex]

    for (let i = playlist.length - 1; i> 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = playlist[i]
        playlist[i] = playlist[j]
        playlist[j] = temp
    }

    if (keepCurrent) {
        playlist.splice(playlist.indexOf(current), 1)
        playlist.unshift(current)
    }
    songIndex = 0
}

function unshufflePlaylist() {
    const current = playlist[songIndex]
    playlist = [...currentPlaylist.songs]
    songIndex = Math.max(0, playlist.indexOf(current))
}

function selectPlaylist(selected) {
    currentPlaylist = selected
    playlist = [...selected.songs]
    songIndex = 0

    if (selected.shuffleEnabled) shufflePlaylist(false)

    loadSong(playlist[songIndex])
    displayQueue()
    updatePlaylistControls()
    playSong()
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
        playlistsContainer.innerHTML = ''

        const localPlaylistElement = document.createElement('div')
        localPlaylistElement.classList.add('playlist-item')

        const localName = document.createElement('h3')
        localName.innerText = 'Local'

        const localSongCount = document.createElement('p')
        localSongCount.innerText = `${songs.length} songs`


        localPlaylistElement.addEventListener('click', () => {
            selectPlaylist(localPlaylist)
        })

        

        localPlaylistElement.appendChild(localName)
        localPlaylistElement.appendChild(localSongCount)

        playlistsContainer.appendChild(localPlaylistElement)

        request.result.forEach(savedPlaylist => {
            if (savedPlaylist.repeatEnabled === undefined) {
                savedPlaylist.repeatEnabled = false
            }

            if (savedPlaylist.shuffleEnabled === undefined) {
                savedPlaylist.shuffleEnabled = false
            }

            const playlistElement = document.createElement('div')
            playlistElement.classList.add('playlist-item')

            const playlistName = document.createElement('h3')
            playlistName.innerText = savedPlaylist.name

            const songCount = document.createElement('p')
            songCount.innerText =
                `${savedPlaylist.songs.length} songs`


            playlistElement.addEventListener('click', () => {
                selectPlaylist(savedPlaylist)
            })


            playlistElement.appendChild(playlistName)
            playlistElement.appendChild(songCount)

            playlistsContainer.appendChild(playlistElement)
        })
    }

    request.onerror = (e) => {
        console.error(
            'could not load playlists:',
            e.target.error
        )
    }
}

function updatePlaylistControls() {
    if (!currentPlaylist) return

    currentPlaylistName.innerText = currentPlaylist.name

    playlistShuffleBtn.classList.toggle(
        'active',
        currentPlaylist.shuffleEnabled
    )

    playlistRepeatBtn.classList.toggle(
        'active',
        currentPlaylist.repeatEnabled
    )
}

// Event listeners
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
//idk
audio.addEventListener('ended', () => {
    if (currentPlaylist && currentPlaylist.repeatEnabled) {
        loadSong(playlist[songIndex])
        playSong()
    } else {
        nextSong()
    }
})

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

    const playlistName = prompt('Enter playlist name:')
    console.log("FILES:", files)
    console.log("PATH:", files[0].webkitRelativePath)
    console.log("PLAYLIST NAME:", playlistName)

    savePlaylist(playlistName, mp3files)
})

playlistPlayBtn.addEventListener('click', () => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return
    selectPlaylist(currentPlaylist)
})

playlistShuffleBtn.addEventListener('click', () => {
    if (!currentPlaylist) return

    currentPlaylist.shuffleEnabled = !currentPlaylist.shuffleEnabled

    if (currentPlaylist.shuffleEnabled) {
        shufflePlaylist(true)
    } else {
        unshufflePlaylist()
    }

    displayQueue()
    updatePlaylistControls()
})

playlistRepeatBtn.addEventListener('click', () => {
    if (!currentPlaylist) return

    currentPlaylist.repeatEnabled = 
        !currentPlaylist.repeatEnabled

    updatePlaylistControls()
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

let currentPlaylist = null
