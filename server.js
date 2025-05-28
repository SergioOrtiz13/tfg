const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // Requerimos multer
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const SECRET_KEY = process.env.SECRET_KEY;

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/videos');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

const backgroundStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isVideo = file.mimetype.startsWith('video/');
        const uploadPath = isVideo ? 'public/videos' : 'public/img';
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `bg-${Date.now()}${ext}`);
    }
});
const backgroundUpload = multer({ storage: backgroundStorage });


mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.log(err));


const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    background: { type: String, default: null },
    avatar: { type: String, default: null },
    savedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'videos' }]  // Campo para los videos guardados

});
const User = mongoose.model('usuarios', UserSchema);

const VideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true }, // Relacionando con la colección de usuarios
    sharedWithCommunity: { type: Boolean, default: false }, // Nueva propiedad
    createdAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('videos', VideoSchema);

const MessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'videos', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('mensajes', MessageSchema);


const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Token no válido' });
    }
};


app.post('/upload', verifyToken, upload.single('video'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const videoUrl = `/videos/${req.file.filename}`; 

        const newVideo = new Video({
            title,
            description,
            videoUrl,
            userId: req.user.id
        });

        await newVideo.save();
        res.json({ message: 'Video subido correctamente', video: newVideo });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Error al subir video' });
    }
});


app.get('/videos', verifyToken, async (req, res) => {
    try {
        const videos = await Video.find({ userId: req.user.id });
        res.json(videos);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Error al obtener videos' });
    }
});


app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.json({ message: 'Usuario registrado correctamente' });
    } catch (err) {
        res.status(400).json({ error: 'Error al registrar usuario' });
    }
});


app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(400).json({ error: 'Error en el login' });
    }
});


app.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ message: `Bienvenido al Dashboard, ${user.name}`, user });
    } catch (err) {
        res.status(400).json({ error: 'Error al obtener datos del usuario' });
    }
});

app.post('/api/user/background', verifyToken, backgroundUpload.single('background'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const isVideo = req.file.mimetype.startsWith('video/');
        const filePath = isVideo
            ? `/videos/${req.file.filename}`
            : `/img/${req.file.filename}`;

        user.background = filePath;
        await user.save();

        res.json({ message: 'Fondo actualizado', backgroundUrl: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar el fondo' });
    }
});

app.post('/share-video', verifyToken, async (req, res) => {
    try {
        const { videoId } = req.body;
        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ error: 'Video no encontrado' });
        if (video.sharedWithCommunity) {
            return res.status(400).json({ error: 'Este video ya ha sido compartido con la comunidad' });
        }

        video.sharedWithCommunity = true;
        await video.save();
        res.json({ message: 'Video compartido con la comunidad', video });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al compartir video' });
    }
});

app.get('/community-videos', async (req, res) => {
    try {
        const videos = await Video.find({ sharedWithCommunity: true }).populate('userId', 'name');
        res.json(videos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener videos de la comunidad' });
    }
});

app.post('/save-video', verifyToken, async (req, res) => {
    try {
        const { videoId, userId } = req.body;

        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'No autorizado para guardar este video' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        if (!user.savedVideos.includes(videoId)) {
            user.savedVideos.push(videoId);
            await user.save();
            res.json({ message: 'Video guardado correctamente' });
        } else {
            res.status(400).json({ error: 'El video ya está guardado' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar video' });
    }
});



app.get('/dashboard-videos', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('savedVideos');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ savedVideos: user.savedVideos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los videos guardados' });
    }
});

app.post('/send-message', verifyToken, async (req, res) => {
    try {
        const { videoId, receiverId, content } = req.body;

        if (!videoId || !receiverId || !content) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const newMessage = new Message({
            senderId: req.user.id,
            receiverId,
            videoId,
            content
        });

        await newMessage.save();
        res.json({ message: 'Mensaje enviado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
});

app.get('/messages', verifyToken, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.user.id },
                { receiverId: req.user.id }
            ]
        })
        .populate('senderId', 'name')
        .populate('receiverId', 'name')
        .populate('videoId', 'title')
        .populate('senderId', 'name avatar')
        .populate('receiverId', 'name avatar');


        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
});

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'img', 'icon')); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${Date.now()}${ext}`);
    }
});
const avatarUpload = multer({ storage: avatarStorage });


app.post('/api/user/avatar', verifyToken, avatarUpload.single('avatar'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const filePath = `/img/icon/${req.file.filename}`;
        user.avatar = filePath;
        await user.save();

        res.json({ message: 'Avatar actualizado', avatarUrl: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al subir avatar' });
    }
});


app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));