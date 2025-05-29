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
    const { name, category, subscription, page = 1, limit = 10 } = req.query;

    let query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' }; // updated for loose match
    }

    if (subscription) {
      query.subscription = subscription;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tools = await AITool.find(query)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AITool.countDocuments(query);

    res.json({
      data: tools,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api', importToolsRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
