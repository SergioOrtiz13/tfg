const token = localStorage.getItem('token');

if (token) {
    const decoded = jwt_decode(token);  
    console.log(decoded); 
} else {
    alert('No hay token');
}

document.addEventListener('DOMContentLoaded', () => {
    cargarAvatar();
    fetchCommunityVideos();
});

async function cargarAvatar() {
    if (!token) return; // No hay sesión

    try {
        const res = await fetch('http://localhost:5000/dashboard', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (res.ok) {
            const avatarUrl = data.user.avatar || 'https://www.w3schools.com/w3images/avatar2.png';
            const avatarImg = document.querySelector('.user-icon img');
            if (avatarImg) avatarImg.src = avatarUrl;
        } else {
            console.error(data.error);
        }
    } catch (err) {
        console.error('Error cargando avatar:', err);
    }
}

function fetchCommunityVideos() {
    fetch('http://localhost:5000/community-videos', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
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

function saveVideo(videoId, userId) {
    if (!token) {
        alert('Necesitas iniciar sesión para guardar el video.');
        return;
    }

    const decodedToken = jwt_decode(token);
    const currentUserId = decodedToken.id;

    if (!videoId || !currentUserId) {
        alert('Faltan datos necesarios');
        return;
    }

    fetch('http://localhost:5000/save-video', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId, userId: currentUserId })
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

function shareVideo(videoId) {
    fetch('http://localhost:5000/share-video', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
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

function sendMessage(videoId, receiverId) {
    const content = document.getElementById(`msg-${videoId}`).value;

    if (!content.trim()) {
        alert('El mensaje no puede estar vacío');
        return;
    }
    console.log({ videoId, receiverId, content });

    fetch('http://localhost:5000/send-message', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId, receiverId, content })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || 'Mensaje enviado');
        document.getElementById(`msg-${videoId}`).value = ''; // Limpiar textarea
    })
    .catch(error => {
        console.error('Error al enviar mensaje', error);
        alert('Error al enviar el mensaje');
    });
}
