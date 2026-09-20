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


//song titles
const songs = ['hey', 'summer', 'ukulele']
const localPlaylist = {
    id: 'local',
    name: 'local',
    songs: songs
}
let playlist = [...songs]

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
    songIndex++

    if (songIndex >= playlist.length) {
        songIndex = 0
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

        const localControls = document.createElement('div')
        localControls.classList.add('playlist-controls')

        const localPlayBtn = document.createElement('button')
        localPlayBtn.classList.add('playlist-btn')
        localPlayBtn.innerHTML = '<i class="fas fa-play"></i>'

        localPlayBtn.addEventListener('click', (e) => {
            e.stopPropagation()

            currentPlaylist = localPlaylist
            playlist = [...localPlaylist.songs]
            songIndex = 0

            loadSong(playlist[songIndex])
            displayQueue()
            playSong()
        })

        const localShuffleBtn = document.createElement('button')
        localShuffleBtn.classList.add('playlist-btn')
        localShuffleBtn.innerHTML = '<i class="fas fa-random"></i>'

        if (localPlaylist.shuffleEnabled) {
            localShuffleBtn.classList.add('active')
        }

        localShuffleBtn.addEventListener('click', (e) => {
            e.stopPropagation()

            localPlaylist.shuffleEnabled =
                !localPlaylist.shuffleEnabled

            localShuffleBtn.classList.toggle(
                'active',
                localPlaylist.shuffleEnabled
            )

            console.log(
                'Local shuffle:',
                localPlaylist.shuffleEnabled
            )
        })

        const localRepeatBtn = document.createElement('button')
        localRepeatBtn.classList.add('playlist-btn')
        localRepeatBtn.innerHTML = '<i class="fas fa-redo"></i>'

        if (localPlaylist.repeatEnabled) {
            localRepeatBtn.classList.add('active')
        }

        localRepeatBtn.addEventListener('click', (e) => {
            e.stopPropagation()

            localPlaylist.repeatEnabled =
                !localPlaylist.repeatEnabled

            localRepeatBtn.classList.toggle(
                'active',
                localPlaylist.repeatEnabled
            )

            console.log(
                'Local repeat:',
                localPlaylist.repeatEnabled
            )
        })

        localPlaylistElement.addEventListener('click', () => {
            currentPlaylist = localPlaylist

            document.querySelector('#current-playlist-name').innerText =
                'local'

            playlist = [...localPlaylist.songs]
            songIndex = 0

            loadSong(playlist[songIndex])
            displayQueue()
            playSong()
        })

        localControls.appendChild(localPlayBtn)
        localControls.appendChild(localShuffleBtn)
        localControls.appendChild(localRepeatBtn)

        localPlaylistElement.appendChild(localName)
        localPlaylistElement.appendChild(localSongCount)
        localPlaylistElement.appendChild(localControls)

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

            const playlistControls = document.createElement('div')
            playlistControls.classList.add('playlist-controls')

            const playButton = document.createElement('button')
            playButton.classList.add('playlist-btn')
            playButton.innerHTML =
                '<i class="fas fa-play"></i>'

            playButton.addEventListener('click', (e) => {
                e.stopPropagation()

                currentPlaylist = savedPlaylist
                playlist = [...savedPlaylist.songs]
                songIndex = 0

                loadSong(playlist[songIndex])
                displayQueue()
                playSong()
            })

            const shuffleButton = document.createElement('button')
            shuffleButton.classList.add('playlist-btn')
            shuffleButton.innerHTML =
                '<i class="fas fa-random"></i>'

            if (savedPlaylist.shuffleEnabled) {
                shuffleButton.classList.add('active')
            }

            shuffleButton.addEventListener('click', (e) => {
                e.stopPropagation()

                savedPlaylist.shuffleEnabled =
                    !savedPlaylist.shuffleEnabled

                shuffleButton.classList.toggle(
                    'active',
                    savedPlaylist.shuffleEnabled
                )

                console.log(
                    savedPlaylist.name,
                    'shuffle:',
                    savedPlaylist.shuffleEnabled
                )
            })

            const repeatButton = document.createElement('button')
            repeatButton.classList.add('playlist-btn')
            repeatButton.innerHTML =
                '<i class="fas fa-redo"></i>'

            if (savedPlaylist.repeatEnabled) {
                repeatButton.classList.add('active')
            }

            repeatButton.addEventListener('click', (e) => {
                e.stopPropagation()

                savedPlaylist.repeatEnabled =
                    !savedPlaylist.repeatEnabled

                repeatButton.classList.toggle(
                    'active',
                    savedPlaylist.repeatEnabled
                )

                console.log(
                    savedPlaylist.name,
                    'repeat:',
                    savedPlaylist.repeatEnabled
                )
            })

            playlistElement.addEventListener('click', () => {
                currentPlaylist = savedPlaylist

                document.querySelector('#current-playlist-name').innerText =
                    savedPlaylist.name

                playlist = [...savedPlaylist.songs]
                songIndex = 0

                loadSong(playlist[songIndex])
                displayQueue()
                playSong()
            })

            playlistControls.appendChild(playButton)
            playlistControls.appendChild(shuffleButton)
            playlistControls.appendChild(repeatButton)

            playlistElement.appendChild(playlistName)
            playlistElement.appendChild(songCount)
            playlistElement.appendChild(playlistControls)

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
    if (repeatEnabled) {
        songIndex = 0
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

