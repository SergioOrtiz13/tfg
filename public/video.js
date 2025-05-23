function uploadVideo() {
    const videoFile = document.getElementById('video-file').files[0];
    const title = document.getElementById('video-title').value;
    const description = document.getElementById('video-description').value;

    if (!videoFile || !title || !description) {
        alert('Por favor, completa todos los campos');
        return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', title);
    formData.append('description', description);

    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: {
            'Authorization': token 
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Video subido correctamente');
            toggleUploadForm(); 
            loadVideos(); 
        } else {
            alert('Error al subir el video');
        }
    })
    .catch(error => {
        console.error('Error al subir el video:', error);
        alert('Error en la conexión');
    });
}

function loadVideos() {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/videos', {
        method: 'GET',
        headers: {
            'Authorization': token 
        }
    })
    .then(response => response.json())
    .then(data => {
        const videoList = document.getElementById('video-list');
        videoList.innerHTML = ''; 

        if (data.videos && data.videos.length > 0) {
            data.videos.forEach(video => {
                const videoItem = document.createElement('div');
                videoItem.classList.add('video-item');
                videoItem.innerHTML = `
                    <video controls>
                        <source src="${video.videoUrl}" type="video/mp4">
                        Tu navegador no soporta la etiqueta de video.
                    </video>
                    <h3>${video.title}</h3>
                    <p>${video.description}</p>
                `;
                videoList.appendChild(videoItem);
            });
        } else {
            videoList.innerHTML = '<p>No hay videos disponibles</p>';
        }
    })
    .catch(error => {
        console.error('Error al cargar los videos:', error);
        alert('Error al cargar los videos');
    });
}
