const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const groupsRoutes = require('./routes/groups');
const challengeRoutes = require('./routes/challenges');
const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user'); // Add this line

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api', challengeRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api', userRoutes); // Add this line

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running`));