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
            'Authorization': localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.length > 0) {
            const videoContainer = document.getElementById('video-container');
            data.forEach(video => {
                const videoElement = document.createElement('div');
                videoElement.classList.add('video-item');
                videoElement.innerHTML = `
                    <video controls>
        <source src="${video.videoUrl}" type="video/mp4">
        Tu navegador no soporta el formato de video.
    </video>
    <div class="video-info">
        <h3>${video.title}</h3>
        <p>${video.description}</p>
    </div>
    <button onclick="shareVideo('${video._id}')">Compartir</button>
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

document.querySelector('.sidebar li:nth-child(2) a').addEventListener('click', function(e) {
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
    var fileInput = document.getElementById('background-file');
    var file = fileInput.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            document.body.style.backgroundImage = 'url(' + e.target.result + ')';
            document.body.style.backgroundSize = 'cover';
        };
        reader.readAsDataURL(file);
    }
}


function setBackground(url) {
    const body = document.body;
    body.style.background = '';
    body.style.backgroundImage = '';
    const existingVideo = document.getElementById('bg-video');
    if (existingVideo) existingVideo.remove();

    if (url.endsWith('.mp4')) {
       
        const videoBg = document.createElement('video');
        videoBg.id = 'bg-video';
        videoBg.src = url;
        videoBg.autoplay = true;
        videoBg.loop = true;
        videoBg.muted = true;
        videoBg.style.position = 'fixed';
        videoBg.style.top = '0';
        videoBg.style.left = '0';
        videoBg.style.width = '100%';
        videoBg.style.height = '100%';
        videoBg.style.objectFit = 'cover';
        videoBg.style.zIndex = '-1';
        document.body.prepend(videoBg);
    } else {
        
        body.style.backgroundImage = `url(${url})`;
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center center';
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
            'Authorization': localStorage.getItem('token')
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

function shareVideo(videoId) {
    fetch('http://localhost:5000/share-video', {
        method: 'POST',
        headers: {
            'Authorization': localStorage.getItem('token'),
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

function loadVideos() {
    fetch('http://localhost:5000/videos', {
        method: 'GET',
        headers: {
            'Authorization': localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const videoContainer = document.getElementById('video-container');
        data.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.classList.add('video-item');
            videoElement.innerHTML = `
                <h3>${video.title}</h3>
                <video width="300" controls>
                    <source src="${video.videoUrl}" type="video/mp4">
                    Tu navegador no soporta el formato de video.
                </video>
                <p>${video.description}</p>
                <button onclick="shareVideo('${video._id}')">Compartir</button>
            `;
            videoContainer.appendChild(videoElement);
        });
    })
    .catch(error => {
        console.error('Error al cargar los videos', error);
        alert('Error al cargar los videos.');
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
            'Authorization': localStorage.getItem('token')
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.avatarUrl) {
            alert('Avatar actualizado correctamente.');
            // Actualizamos la imagen del avatar en la UI
            const userIconImg = document.querySelector('.user-icon img');
            if (userIconImg) {
                userIconImg.src = data.avatarUrl + '?t=' + new Date().getTime(); // evitar cache
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


