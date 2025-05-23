// Función para obtener los mensajes del usuario
function getMessages() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Necesitas iniciar sesión para ver tus mensajes.');
        return;
    }

    fetch('http://localhost:5000/messages', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            displayMessages(data);
        }
    })
    .catch(error => {
        console.error('Error al obtener los mensajes:', error);
        alert('Hubo un error al cargar los mensajes.');
    });
}

// Función para mostrar los mensajes en la interfaz
function displayMessages(messages) {
    const messageList = document.getElementById('message-list');
    messageList.innerHTML = '';

    messages.forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.classList.add('message-item');
        messageItem.innerHTML = `
            <p><strong>De: </strong>${message.fromUserId.name}</p>
            <p><strong>Video: </strong>${message.videoId.title}</p>
            <p><strong>Mensaje: </strong>${message.content}</p>
        `;
        messageList.appendChild(messageItem);
    });
}

// Llamada a la función para cargar los mensajes cuando se carga la página
window.onload = getMessages;
