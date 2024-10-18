document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-button');
  const cityInput = document.getElementById('city-name');
  const currentWeatherDiv = document.getElementById('current-weather');
  const forecastDiv = document.getElementById('forecast');
  const searchHistoryDiv = document.getElementById('search-history');

  if (!searchButton || !cityInput || !currentWeatherDiv || !forecastDiv || !searchHistoryDiv) {
    console.error('One or more required elements are missing from the DOM.');
    return;
  }

  // Event listener for the search button
  searchButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const cityName = cityInput.value.trim();

    if (!cityName) {
      console.error('City name is empty. Please enter a valid city.');
      return;
    }

    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const weatherData = await response.json();
      displayCurrentWeather(weatherData);
      displayForecast(weatherData.forecast);
      saveCityToHistory({ id: weatherData.id, name: cityName });
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  });

  // Display current weather data
  function displayCurrentWeather(data) {
    if (!data || !data.main || !data.weather) {
      console.error('Invalid weather data received:', data);
      return;
    }

    currentWeatherDiv.innerHTML = `
      <h2>${data.name} (${new Date().toLocaleDateString()})</h2>
      <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">
      <p>Temperature: ${data.main.temp.toFixed(1)}°C</p>
      <p>Wind: ${data.wind.speed} m/s</p>
      <p>Humidity: ${data.main.humidity}%</p>
    `;
  }

  // Display 5-day forecast data
  function displayForecast(forecast) {
    if (!Array.isArray(forecast)) {
      console.error('Invalid forecast data received:', forecast);
      return;
    }

    forecastDiv.innerHTML = '';
    forecast.forEach(day => {
      const forecastDayDiv = document.createElement('div');
      forecastDayDiv.className = 'forecast-day';
      forecastDayDiv.innerHTML = `
        <p>${new Date(day.dt * 1000).toLocaleDateString()}</p>
        <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
        <p>Temp: ${day.temp.toFixed(1)}°C</p>
        <p>Wind: ${day.wind_speed} m/s</p>
        <p>Humidity: ${day.humidity}%</p>
      `;
      forecastDiv.appendChild(forecastDayDiv);
    });
  }

  // Save city to search history and create history buttons
  function saveCityToHistory(city) {
    const cityButton = document.createElement('button');
    cityButton.textContent = city.name;
    cityButton.addEventListener('click', () => {
      fetchWeatherFromHistory(city.id);
    });
    searchHistoryDiv.appendChild(cityButton);
  }

  // Fetch weather data for a city from search history
  async function fetchWeatherFromHistory(cityId) {
    try {
      const response = await fetch(`/api/weather/history`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const searchHistory = await response.json();
      const city = searchHistory.find(entry => entry.id === cityId);
      if (city) {
        cityInput.value = city.name;
        searchButton.click();
      }
    } catch (error) {
      console.error('Error fetching weather data from history:', error);
    }
  }

  // Fetch and display search history on load
  async function loadSearchHistory() {
    try {
      const response = await fetch('/api/weather/history');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const searchHistory = await response.json();
      searchHistory.forEach(city => saveCityToHistory(city));
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }

  loadSearchHistory();
});
