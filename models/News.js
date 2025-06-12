const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: true },
  image: { type: String },
  reference: { type: String }
});

module.exports = mongoose.model('News', NewsSchema);
