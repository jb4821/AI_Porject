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
    const categoryList = category.split(',').map(cat => cat.trim());

    for (const catName of categoryList) {
      const exists = await Category.findOne({ name: catName });
      if (!exists) {
        await new Category({ name: catName }).save();
      }
    }

    const tool = new AITool({ ...toolData, category });
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

// app.post('/api/tools', async (req, res) => {
//   const { category, ...toolData } = req.body;

//   try {
//     const categoryList = category.split(',').map(cat => cat.trim());

//     // For each category, check and insert if not exists
//     for (const catName of categoryList) {
//       const exists = await Category.findOne({ name: catName });
//       if (!exists) {
//         await new Category({ name: catName }).save();
//       }
//     }

//     // Save the tool with original category string
//     const tool = new AITool({ ...toolData, category });
//     const savedTool = await tool.save();

//     res.status(201).json(savedTool);
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ error: err.message });
//   }
// });


// GET API - Fetch all AI tools

app.get('/api/tools', async (req, res) => {
  try {
    const { name, category, subscription, page = 1, limit = 10 } = req.query;

    let query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (subscription) {
      query.subscription = subscription;
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

// app.get('/api/tools', async (req, res) => {
//   try {
//     const { name, category, subscription, page = 1, limit = 10 } = req.query;

//     let query = {};

//     if (name) {
//       query.name = { $regex: name, $options: 'i' };
//     }

//     if (category) {
//       query.category = { $regex: category, $options: 'i' }; // updated for loose match
//     }

//     if (subscription) {
//       query.subscription = subscription;
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const tools = await AITool.find(query)
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await AITool.countDocuments(query);

//     res.json({
//       data: tools,
//       total,
//       page: parseInt(page),
//       totalPages: Math.ceil(total / parseInt(limit))
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

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

// app.get('/api/categories', async (req, res) => {
//   try {
//     const categories = await Category.find().sort({ name: 1 }); // Optional: sort alphabetically
//     res.status(200).json(categories);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch categories' });
//   }
// });

app.use('/api', importToolsRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
