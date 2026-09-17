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