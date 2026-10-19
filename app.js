const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("search-btn");
const statusText = document.getElementById("status");

const currentWeather = document.getElementById("current-weather");
const cityName = document.getElementById("city-name");
const conditionText = document.getElementById("weather-condition");
const temperatureText = document.getElementById("temperature");
const highTemp = document.getElementById("high-temp");
const lowTemp = document.getElementById("low-temp");
const forecastContainer = document.getElementById("forecast");

// Weather code descriptions
const weatherCodes = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Cloudy",
    45: "Foggy",
    48: "Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Heavy Drizzle",
    61: "Light Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Light Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    80: "Rain Showers",
    81: "Moderate Rain Showers",
    82: "Heavy Rain Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Hail",
    99: "Heavy Thunderstorm"
};

// Find city using Geocoding API
async function findCity(name) {
    const url =
        "https://geocoding-api.open-meteo.com/v1/search?count=1&name=" +
        encodeURIComponent(name);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Network problem. Please try again.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please check the city name.");
    }

    const city = data.results[0];

    return {
        name: city.name,
        country: city.country || "",
        latitude: city.latitude,
        longitude: city.longitude
    };
}

// Fetch current weather and 5-day forecast
async function getWeather(latitude, longitude) {
    const url =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + latitude +
        "&longitude=" + longitude +
        "&current=temperature_2m,weather_code" +
        "&daily=temperature_2m_max,temperature_2m_min,weather_code" +
        "&forecast_days=5&timezone=auto";

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to load weather data. Try again.");
    }

    return await response.json();
}

// Convert weather codes into readable descriptions
function getWeatherDescription(code) {
    return weatherCodes[code] || "Weather information unavailable";
}

// Display current weather
function displayCurrentWeather(city, weather) {
    cityName.textContent = city.name + ", " + city.country;

    conditionText.textContent = getWeatherDescription(
        weather.current.weather_code
    );

    temperatureText.textContent =
        Math.round(weather.current.temperature_2m);

    highTemp.textContent =
        Math.round(weather.daily.temperature_2m_max[0]);

    lowTemp.textContent =
        Math.round(weather.daily.temperature_2m_min[0]);

    currentWeather.hidden = false;
}

// Display five-day forecast
function displayForecast(weather) {
    forecastContainer.replaceChildren();

    for (let i = 0; i < weather.daily.time.length; i++) {
        const card = document.createElement("article");
        card.className = "forecast-card";

        const date = document.createElement("h3");
        const dateValue = new Date(
            weather.daily.time[i] + "T12:00:00"
        );

        date.textContent = dateValue.toLocaleDateString(
            "en-IN",
            {
                weekday: "short",
                day: "numeric",
                month: "short"
            }
        );

        const condition = document.createElement("p");
        condition.className = "forecast-condition";
        condition.textContent = getWeatherDescription(
            weather.daily.weather_code[i]
        );

        const maximum = document.createElement("p");
        maximum.textContent =
            "High: " +
            Math.round(weather.daily.temperature_2m_max[i]) +
            "°C";

        const minimum = document.createElement("p");
        minimum.textContent =
            "Low: " +
            Math.round(weather.daily.temperature_2m_min[i]) +
            "°C";

        card.append(date, condition, maximum, minimum);
        forecastContainer.appendChild(card);
    }
}

// Handle city search
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        statusText.textContent = "Please enter a city name.";
        cityInput.focus();
        return;
    }

    searchBtn.disabled = true;
    statusText.textContent = "Loading weather...";
    currentWeather.hidden = true;
    forecastContainer.replaceChildren();

    try {
        const cityData = await findCity(city);

        const weatherData = await getWeather(
            cityData.latitude,
            cityData.longitude
        );

        displayCurrentWeather(cityData, weatherData);
        displayForecast(weatherData);

        statusText.textContent = "Weather loaded successfully.";

        localStorage.setItem("lastCity", cityData.name);

    } catch (error) {
        statusText.textContent =
            error instanceof TypeError
                ? "Network problem. Check your internet connection."
                : error.message;

    } finally {
        searchBtn.disabled = false;
    }
});

// Load the last searched city
const lastCity = localStorage.getItem("lastCity");

if (lastCity) {
    cityInput.value = lastCity;
}
