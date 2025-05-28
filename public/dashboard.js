const token = localStorage.getItem('token');

if (!token) {
    alert('Necesitas iniciar sesión');
    window.location.href = 'login.html';
}

fetch('http://localhost:5000/dashboard', {
    method: 'GET',
    headers: {
        'Authorization': token
    }
})
.then(response => response.json())
.then(data => {
    if (data.message) {
        document.getElementById('user-info').innerHTML = `Hola, ${data.user.name}`;
        
        if(data.user.avatar){
            const userIconImg = document.querySelector('.user-icon img');
            if(userIconImg){
                userIconImg.src = data.user.avatar;
            }
        }

        const background = data.user.background;
        if (background) {
            setBackground(background);
        }
    } else {
        alert('Token no válido');
        window.location.href = 'login.html';
    }
})
.catch(error => {
    console.error('Error al acceder al Dashboard:', error);
    alert('Error en la conexión');
});

function toggleLogoutMenu() {
    const logoutMenu = document.getElementById('logout-menu');
    logoutMenu.classList.toggle('show');
}

function logout() {
    localStorage.removeItem('token'); 
    window.location.href = 'login.html'; 
}

function toggleUploadForm() {
    const form = document.getElementById('upload-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    const logoutMenu = document.getElementById('logout-menu');
    logoutMenu.classList.remove('show');
}

function loadVideos() {
    fetch('http://localhost:5000/videos', {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.length > 0) {
            const videoContainer = document.getElementById('video-container');
            videoContainer.innerHTML = ''; // limpiar antes de agregar
            data.forEach(video => {
                const videoElement = document.createElement('div');
                videoElement.classList.add('video-item');
                videoElement.innerHTML = `
                <h3>${video.title}</h3>
                    <video controls>
                        <source src="${video.videoUrl}" type="video/mp4">
                        Tu navegador no soporta el formato de video.
                    </video>
                    <div class="video-info">
                        <p>${video.description}</p>
                    </div>
                    <button id="btn-share-${video._id}" onclick="toggleShareVideo('${video._id}', ${video.sharedWithCommunity})">
  ${video.sharedWithCommunity ? 'Dejar de compartir' : 'Compartir'}
</button>

                `;
                videoContainer.appendChild(videoElement);
            });
        } else {
            alert('No hay videos disponibles');
        }
    })
    .catch(err => {
        console.error('Error al cargar los videos', err);
        alert('Error al cargar los videos.');
    });
}

loadVideos();

document.querySelector('.sidebar li:nth-child() a').addEventListener('click', function(e) {
    e.preventDefault(); 
    const menu = document.getElementById('config-menu');
    menu.classList.toggle('show');
});

function changeBackground() {
    const url = document.getElementById('background-url').value;
    setBackground(url);
}

function toggleConfigMenu() {
    var configMenu = document.getElementById('config-menu');
    if (configMenu.style.display === 'none') {
        configMenu.style.display = 'block'; 
    } else {
        configMenu.style.display = 'none'; 
    }
}

function applyLocalBackground() {
    const fileInput = document.getElementById('background-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecciona un archivo.');
        return;
    }

    const formData = new FormData();
    formData.append('background', file);

    fetch('http://localhost:5000/api/user/background', {
        method: 'POST',
        headers: {
            'Authorization': token
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.backgroundUrl) {
            setBackground(data.backgroundUrl);
        } else {
            alert('No se pudo actualizar el fondo.');
        }
    })
    .catch(err => {
        console.error('Error al subir fondo:', err);
        alert('Error al subir fondo.');
    });
}

function setBackground(url) {
    const content = document.querySelector('.content');
    if (!content) return;

    content.style.background = '';
    content.style.backgroundImage = '';

    const existingVideo = document.getElementById('bg-video');
    if (existingVideo) existingVideo.remove();

    if (url.endsWith('.mp4')) {
        const videoBg = document.createElement('video');
        videoBg.id = 'bg-video';
        videoBg.src = url;
        videoBg.autoplay = true;
        videoBg.loop = true;
        videoBg.muted = true;
        videoBg.style.position = 'absolute';
        videoBg.style.top = '0';
        videoBg.style.left = '0';
        videoBg.style.width = '100%';
        videoBg.style.height = '100%';
        videoBg.style.objectFit = 'cover';
        videoBg.style.zIndex = '-1';
        videoBg.style.pointerEvents = 'none';
        content.prepend(videoBg);
    } else {
        content.style.backgroundImage = `url(${url})`;
        content.style.backgroundRepeat = 'no-repeat';
        content.style.backgroundSize = 'cover';
        content.style.backgroundPosition = 'center center';
    }
}

function shareVideo(videoId) {
    fetch('http://localhost:5000/share-video', {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
    })
    .then(response => response.json())
    .then(data => {
        alert('Video compartido con la comunidad');
    })
    .catch(error => {
        console.error('Error al compartir el video', error);
        alert('Error al compartir el video.');
    });
}

function applyAvatar() {
    const fileInput = document.getElementById('avatar-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecciona un archivo de imagen.');
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    fetch('http://localhost:5000/api/user/avatar', {
        method: 'POST',
        headers: {
            'Authorization': token
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.avatarUrl) {
            alert('Avatar actualizado correctamente.');
            const userIconImg = document.querySelector('.user-icon img');
            if (userIconImg) {
                userIconImg.src = data.avatarUrl + '?t=' + new Date().getTime();
            }
        } else {
            alert('No se pudo actualizar el avatar.');
        }
    })
    .catch(err => {
        console.error('Error al subir avatar:', err);
        alert('Error al subir avatar.');
    });
}

function fetchCommunityVideos() {
    fetch('http://localhost:5000/community-videos', {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        const videoList = document.getElementById('community-video-list');
        videoList.innerHTML = '';

        data.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.classList.add('video-item');
            videoElement.innerHTML = `
                <h3>${video.title}</h3>
                <p>Compartido por: ${video.userId.name}</p>
                <video width="300" controls>
                    <source src="${video.videoUrl}" type="video/mp4">
                    Tu navegador no soporta el formato de video.
                </video>
                <button onclick="saveVideo('${video._id}', '${video.userId._id}')">Guardar</button>
                <details>
                    <summary>Enviar mensaje</summary>
                    <textarea id="msg-${video._id}" rows="2" cols="40" placeholder="Escribe un mensaje..."></textarea>
                    <br>
                    <button onclick="sendMessage('${video._id}', '${video.userId._id}')">Enviar</button>
                </details>
            `;
            videoList.appendChild(videoElement);
        });
    })
    .catch(error => {
        console.error('Error al cargar los videos de la comunidad', error);
        alert('Error al cargar los videos.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCommunityVideos();
});

function saveVideo(videoId, userId) {
    if (!token) {
        alert('Necesitas iniciar sesión para guardar el video.');
        return;
    }

    if (!videoId || !userId) {
        alert('Faltan datos necesarios');
        return;
    }

    fetch('http://localhost:5000/save-video', {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId, userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Video guardado correctamente');
        } else {
            alert('Error al guardar el video');
        }
    })
    .catch(error => {
        console.error('Error al guardar el video:', error);
        alert('Error en la conexión');
    });
}

function sendMessage(videoId, receiverId) {
    const content = document.getElementById(`msg-${videoId}`).value;

    if (!content.trim()) {
        alert('El mensaje no puede estar vacío');
        return;
    }

    fetch('http://localhost:5000/send-message', {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId, receiverId, content })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || 'Mensaje enviado');
        document.getElementById(`msg-${videoId}`).value = ''; // Limpiar el textarea
    })
    .catch(error => {
        console.error('Error al enviar mensaje', error);
        alert('Error al enviar el mensaje');
    });
}

function toggleShareVideo(videoId, isCurrentlyShared) {
    const url = isCurrentlyShared ? 'http://localhost:5000/unshare-video' : 'http://localhost:5000/share-video';

    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            const btn = document.getElementById(`btn-share-${videoId}`);
            if (btn) {
                const newState = !isCurrentlyShared;
                btn.textContent = newState ? 'Dejar de compartir' : 'Compartir';
                btn.setAttribute('onclick', `toggleShareVideo('${videoId}', ${newState})`);
            }
        } else {
            alert('Error: ' + (data.error || 'No se pudo cambiar estado'));
        }
    })
    .catch(error => {
        console.error('Error al cambiar estado de compartir:', error);
        alert('Error al cambiar estado de compartir');
    });
}