const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const groupsRoutes = require('./routes/groups');
const globalChallengeRoutes = require('./routes/globalChallenges');
const groupChallengeRoutes = require('./routes/groupChallenges');
const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Route mounting
app.use('/api', authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api', globalChallengeRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api', userRoutes); 
app.use('/api', groupChallengeRoutes);

// Only start server if this file is run directly
if (require.main === module) {
  app.listen(process.env.PORT || 4000, () => {
    console.log('Server running...');
  });
}

module.exports = app;
