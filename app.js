require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const AITool = require('./models/AITool');
const Category = require('./models/Category');
const News = require('./models/News');
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

//post news
app.post('/api/news', async (req, res) => {
  const { title, description, author, image, reference, date } = req.body;

  try {
    const news = new News({ title, description, author, image, reference, date });
    const savedNews = await news.save();

    res.status(201).json({
      code: 201,
      status: "success",
      message: "News added successfully",
      data: [savedNews]
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

//get news
app.get('/api/news', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const newsList = await News.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit));
    const total = await News.countDocuments(query);

    res.status(200).json({
      code: 200,
      status: "success",
      message: "News fetched successfully",
      data: newsList,
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

//delete news
app.delete('/api/news/:id', async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);

    if (!deletedNews) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "News not found",
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      message: "News deleted successfully"
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

// /api/proxy?url=https://target-image-url.png

app.get('/api/proxy', async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send('Missing image URL');
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'stream', // Stream ensures binary image is sent correctly
      headers: {
        'User-Agent': req.headers['user-agent'] || 
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36',
        'Referer': 'https://www.google.com',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
    response.data.pipe(res); // Stream the image to the browser
  } catch (error) {
    console.error('Proxy failed:', error.message);
    res.status(500).send('Image load failed: ' + error.message);
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