const mongoose = require('mongoose');

const AIToolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subtitle: { type: String, required: true },
  rating: { type: Number, required: true },
  websiteLink: { type: String, required: true },
  imageLink: { type: String, required: true },
  features: { type: String, required: true },
  sharableLink: { type: String, required: true }
});

module.exports = mongoose.model('AITool', AIToolSchema);
