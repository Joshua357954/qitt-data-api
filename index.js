const express = require('express');
const cors = require('cors')
const app = express();

const router1 = require('./api.js')

app.use(cors())
app.use('/api', router1)
app.use(express.json() )

const port = process.env.PORT || 3000; 


app.get('/', async (req, res) => {
  res.send("Josh's Express Puppeteer Running :) ")

});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});

