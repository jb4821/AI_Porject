const mongoose = require('mongoose');

const AIToolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  subtitle: { type: String },
  rating: { type: Number },
  websiteLink: { type: String },
  imageLink: { type: String },
  features: { type: String },
  sharableLink: { type: String }
});

module.exports = mongoose.model('AITool', AIToolSchema);
