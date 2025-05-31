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

// app.get('/api/categories', async (req, res) => {
//   try {
//     const categories = await Category.find().sort({ name: 1 }); // Optional: sort alphabetically
//     res.status(200).json(categories);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch categories' });
//   }
// });


// app.post('/api/sync-categories', async (req, res) => {
//     try {
//       // 1. Fetch all category strings from AITool
//       const tools = await AITool.find({}, 'category'); // only get category field
  
//       const categorySet = new Map(); // key: lowercase, value: original
  
//       tools.forEach(tool => {
//         if (tool.category) {
//           const cats = tool.category.split(',').map(cat => cat.trim());
//           cats.forEach(cat => {
//             const lower = cat.toLowerCase();
//             if (!categorySet.has(lower)) {
//               categorySet.set(lower, cat); // store original case only once
//             }
//           });
//         }
//       });
  
//       const added = [];
  
//       // 2. Check each unique category in the Category collection
//       for (const [lowercaseName, originalName] of categorySet.entries()) {
//         const exists = await Category.findOne({ name: originalName })
//           .collation({ locale: 'en', strength: 2 }); // case-insensitive match
  
//         if (!exists) {
//           await new Category({ name: originalName }).save();
//           added.push(originalName);
//         }
//       }
  
//       res.status(200).json({
//         code: 200,
//         status: 'success',
//         message: 'Categories synced successfully',
//         added
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({
//         code: 500,
//         status: 'error',
//         message: err.message
//       });
//     }
//   });
