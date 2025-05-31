// pingCron.js
const cron = require('node-cron');
const axios = require('axios');

cron.schedule('*/10 * * * *', async () => {
  try {
    const res = await axios.get('https://ai-porject.onrender.com/ping');
    console.log('Ping successful:', res.data);
  } catch (err) {
    console.error('Ping failed:', err.message);
  }
});
