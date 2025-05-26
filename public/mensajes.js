const token = localStorage.getItem("token"); // Suponiendo login previo
const API_URL = "http://localhost:5000";

let currentReceiverId = null;

async function fetchMessages() {
    const res = await fetch(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return data;
}

async function renderConversations() {
    const messages = await fetchMessages();
    const userMap = {};

    messages.forEach(msg => {
        const other = msg.senderId._id === getUserId() ? msg.receiverId : msg.senderId;
        userMap[other._id] = other;
    });

    const userList = document.getElementById("userList");
    userList.innerHTML = "";

    for (const userId in userMap) {
        const user = userMap[userId];
        const li = document.createElement("li");
        li.style.cursor = "pointer";
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.marginBottom = "10px";
        li.onclick = () => openChatWith(userId, user.name);

        // Solo avatar o icono SVG, sin el nombre
        let avatarHTML = "";
        if (user.avatar) {
            avatarHTML = `<img src="${API_URL}${user.avatar}" alt="avatar" style="width:50px; height:50px; border-radius:50%; object-fit:cover;" />`;
        } else {
            avatarHTML = `
            <svg width="50" height="50" viewBox="0 0 24 24" fill="#7289da" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>`;
        }

        li.innerHTML = avatarHTML;
        userList.appendChild(li);
    }
}


function getUserId() {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
}

async function openChatWith(userId, name) {
    currentReceiverId = userId;
    const messages = await fetchMessages();
    const chat = document.getElementById("messages");
    chat.innerHTML = `<h4>Chat con ${name}</h4>`;

    messages
        .filter(msg =>
            (msg.senderId._id === userId && msg.receiverId._id === getUserId()) ||
            (msg.senderId._id === getUserId() && msg.receiverId._id === userId)
        )
        .forEach(msg => {
            const div = document.createElement("div");
            div.className = "message";
            div.innerHTML = `
                <span class="sender">${msg.senderId.name}:</span> 
                <span>${msg.content}</span>`;
            chat.appendChild(div);
        });

    chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
    const content = document.getElementById("messageInput").value;
    if (!content || !currentReceiverId) return;

    const res = await fetch(`${API_URL}/send-message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            receiverId: currentReceiverId,
            content,
            videoId: "000000000000000000000000"
        })
    });

    if (res.ok) {
        document.getElementById("messageInput").value = "";
        openChatWith(currentReceiverId);
    }
}

document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("messageInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") sendMessage();
});

renderConversations();
