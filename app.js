require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const AITool = require('./models/AITool');
const Category = require('./models/Category');
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
  const { category, ...toolData } = req.body;

  try {
    const categoryList = category
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    for (const catName of categoryList) {
      const existingCategory = await Category.findOne({
        name: catName
      }).collation({ locale: 'en', strength: 2 }); // Case-insensitive match

      if (!existingCategory) {
        await new Category({ name: catName }).save(); // Save in original case
      }
    }

    // Store original-case categories (you can also store as an array if preferred)
    const tool = new AITool({
      ...toolData,
      category: categoryList.join(',') // Original case
    });

    const savedTool = await tool.save();

    res.status(201).json({
      code: 201,
      status: "success",
      message: "Tool added successfully",
      data: [savedTool]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: err.message,
    });
  }
});

// GET API - Fetch all AI tools

app.get('/api/tools', async (req, res) => {
  try {
    const { search, category, subscription, page = 1, limit = 10 } = req.query;

    let query = {};

    // OR condition for search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { features: { $regex: search, $options: 'i'}}
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (subscription) {
      query.subscription = { $regex: `^${subscription}$`, $options: 'i' }; // Case-insensitive exact match
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tools = await AITool.find(query).skip(skip).limit(parseInt(limit));
    const total = await AITool.countDocuments(query);

    res.status(200).json({
      code: 200,
      status: "success",
      message: "Tools fetched successfully",
      data: tools,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: err.message,
    });
  }
});

//get categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.status(200).json({
      code: 200,
      status: "success",
      message: "Categories fetched successfully",
      data: categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to fetch categories",
    });
  }
});

// /api/proxy?url=https://target-image-url.png

app.get('/api/proxy', async (req, res) => {
  const imageUrl = req.query.url;
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
        // Spoof Referer if needed
        Referer: 'https://www.google.com',
      },
    });

    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (error) {
    console.error('Proxy failed:', error.message);
    res.status(500).send('Image load failed');
  }
});

// Lightweight health check endpoint
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

app.use('/api', importToolsRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

require('./pingCron');