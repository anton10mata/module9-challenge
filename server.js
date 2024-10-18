// server.js for Weather Dashboard Backend using OpenWeather API

const express = require('express');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// HTML Route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Route to get search history
app.get('/api/weather/history', (req, res) => {
  fs.readFile('searchHistory.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading search history');
    }
    res.json(JSON.parse(data));
  });
});

// API Route to get weather data
app.post('/api/weather', async (req, res) => {
  const { cityName } = req.body;

  // Fetch weather data from OpenWeather API
  const API_KEY = '57c7e926fbe03e8c6b115bcbc5770458';
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`;

  try {
    const response = await axios.get(weatherUrl);
    const weatherData = response.data;

    // Add forecast data (5-day forecast)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`;
    const forecastResponse = await axios.get(forecastUrl);
    weatherData.forecast = forecastResponse.data.list.slice(0, 5).map(day => ({
      dt: day.dt,
      weather: day.weather,
      temp: day.main.temp,
      wind_speed: day.wind.speed,
      humidity: day.main.humidity
    }));

    // Save city to search history with unique ID
    fs.readFile('searchHistory.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error reading search history');
      }

      const searchHistory = JSON.parse(data);
      if (!searchHistory.some(entry => entry.name.toLowerCase() === cityName.toLowerCase())) {
        searchHistory.push({ id: uuidv4(), name: cityName });
        fs.writeFile('searchHistory.json', JSON.stringify(searchHistory), 'utf8', (writeErr) => {
          if (writeErr) {
            console.error(writeErr);
            return res.status(500).send('Error saving to search history');
          }
          res.json(weatherData);
        });
      } else {
        res.json(weatherData);
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching weather data');
  }
});

// API Route to delete a city from search history
app.delete('/api/weather/history/:id', (req, res) => {
  const { id } = req.params;
  fs.readFile('searchHistory.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading search history');
    }

    let searchHistory = JSON.parse(data);
    searchHistory = searchHistory.filter(entry => entry.id !== id);
    fs.writeFile('searchHistory.json', JSON.stringify(searchHistory), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error(writeErr);
        return res.status(500).send('Error saving to search history');
      }
      res.send('City deleted successfully');
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});