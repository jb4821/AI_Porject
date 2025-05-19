require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const AITool = require('./models/AITool');
const importToolsRoute = require('./routes/importTools');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// POST API - Add a new AI tool
app.post('/api/tools', async (req, res) => {
  try {
    const tool = new AITool(req.body);
    const savedTool = await tool.save();
    res.status(201).json(savedTool);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET API - Fetch all AI tools
app.get('/api/tools', async (req, res) => {
  try {
    const tools = await AITool.find();
    res.json(tools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api', importToolsRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
