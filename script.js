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
const volume = document.querySelector('#volume')
const addPlaylistBtn = document.querySelector('#add-playlist')
const folderInput = document.querySelector('#folder-input')
const playlistsContainer = document.querySelector('#playlists')
const playlistPlayBtn = document.querySelector('#playlist-play')
const playlistShuffleBtn = document.querySelector('#playlist-shuffle')
const currentPlaylistName = document.querySelector('#current-playlist-name')
const playlistRepeatBtn = document.querySelector('#playlist-repeat')


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
let shuffleQueue = []
let shuffleIndex = 0
let playHistory = {}


//keep trak of da song
let songIndex = 2

// Initial load song 
loadSong(songs[songIndex])

displayQueue()

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
    if (playlist.length === 0) return 
    
    if (currentPlaylist && currentPlaylist.shuffleEnabled) {
        let nextIndex

        do {
            nextIndex = Math.floor(Math.random()* playlist.length)
        } while (playlist.length > 1 && nextIndex === songIndex)

        songIndex = nextIndex

        console.log('shuffle PLAYING:', playlist[songIndex])
    } else {
        songIndex++
        
        if (songIndex >= playlist.length) {
            songIndex = 0
        }

        console.log('NORMAL PLAYING:', playlist[songIndex])
    }
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

        const songName = document.createElement('span')

        songName.innerText = typeof song === 'string'
            ? song
            : song.name.replace('.mp3', '')

        const addBtn = document.createElement('button')
        addBtn.innerText = '+'

        addBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            playlist.push(song)
            displayQueue()
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
            currentPlaylist = localPlaylist

            playlist = [...localPlaylist.songs]
            songIndex = 0

            loadSong(playlist[songIndex])
            displayQueue()
            updatePlaylistControls()
            playSong()
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
                currentPlaylist = savedPlaylist

                playlist = [...savedPlaylist.songs]
                songIndex = 0

                loadSong(playlist[songIndex])
                displayQueue()
                updatePlaylistControls()
                playSong()
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

function createShuffleQueue() {
    shuffleQueue = [...playlist]

    for (let i = shuffleQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random()* (i +1))

        const temp = shuffleQueue[i]
        shuffleQueue[i] = shuffleQueue[j]
        shuffleQueue[j] = temp
    }
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

    playlist = [...currentPlaylist.songs]
    songIndex = 0

    loadSong(playlist[songIndex])
    displayQueue()
    playSong()
})

playlistShuffleBtn.addEventListener('click', () => {
    if (!currentPlaylist) return

    currentPlaylist.shuffleEnabled =
        !currentPlaylist.shuffleEnabled

        console.log(
            'SHUFFLE:',
            currentPlaylist.shuffleEnabled
        )

    if (currentPlaylist.shuffleEnabled) {
        createShuffleQueue()
        console.log('shuffle QUEUE:', shuffleQueue)
    } else {
        shuffleQueue = []
        shuffleIndex = 0
    }

    //mlem
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
