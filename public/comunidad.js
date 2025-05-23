// Decodificando el JWT
const token = localStorage.getItem('token');
if (token) {
    const decoded = jwt_decode(token);  // Decodifica el token JWT
    console.log(decoded); // Aquí puedes ver los datos decodificados del token
} else {
    alert('No hay token');
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCommunityVideos();
});

function fetchCommunityVideos() {
    fetch('http://localhost:5000/community-videos', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`  // Agrega el prefijo 'Bearer'
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

function saveVideo(videoId, userId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Necesitas iniciar sesión para guardar el video.');
        return;
    }

    // Decodificar el token JWT para obtener el id del usuario
    const decodedToken = jwt_decode(token);
    const currentUserId = decodedToken.id;  // El ID del usuario debe estar en el token

    // Verificamos que se haya extraído correctamente el videoId y el userId
    if (!videoId || !currentUserId) {
        alert('Faltan datos necesarios');
        return;
    }

    // Realizamos la solicitud POST para guardar el video
    fetch('http://localhost:5000/save-video', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,  // Asegúrate de usar 'Bearer'
            'Content-Type': 'application/json'  // Aseguramos que estamos enviando JSON
        },
        body: JSON.stringify({ videoId, userId: currentUserId })  // Enviamos los datos correctamente
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
            'Authorization': `Bearer ${localStorage.getItem('token')}`,  // Asegúrate de usar 'Bearer'
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
    const token = localStorage.getItem('token');

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
