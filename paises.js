const searchCountriesInput = document.getElementById("search-countries");
const resultsContainer = document.getElementById("results-container");
const countryListDisplay = document.getElementById("country-list-display");
const countryDetailDisplay = document.getElementById("country-detail-display");

// Elementos para el detalle de un país
const flag = document.getElementById("flag");
const countryNameSpan = document.getElementById("name");
const populationSpan = document.getElementById("population");
const capitalSpan = document.getElementById("Capital");
const regionSpan = document.getElementById("Region");
const currencySpan = document.getElementById("currency");
const languageSpan = document.getElementById("language");

// Elementos para el clima
const weatherInfoDiv = document.getElementById("weather-info");
const weatherIcon = document.getElementById("weather-icon");
const weatherDescription = document.getElementById("weather-description");
const weatherTemp = document.getElementById("weather-temp");

// **TU API KEY DE OPENWEATHER**
const OPENWEATHER_API_KEY = "54ae4a29ab3f1e30eedb632f530f6a5d"; // Tu clave API

const REST_COUNTRIES_API_BASE_URL = "https://restcountries.com/v3.1";
// CAMBIO IMPORTANTE: Usamos HTTPS y la ruta completa de la API
const OPENWEATHER_API_BASE_URL =
  "https://api.openweathermap.org/data/2.5/weather"; // Tu URL base

let debounceTimeout;

searchCountriesInput.addEventListener("input", () => {
  clearTimeout(debounceTimeout);
  const searchTerm = searchCountriesInput.value.trim();

  if (searchTerm === "") {
    resultsContainer.innerHTML = "";
    countryDetailDisplay.style.display = "none";
    return;
  }

  debounceTimeout = setTimeout(() => {
    searchCountry(searchTerm);
  }, 300);
});

async function searchCountry(searchTerm) {
  resultsContainer.innerHTML = "";
  countryDetailDisplay.style.display = "none";
  countryListDisplay.innerHTML = "";

  try {
    const response = await fetch(
      `${REST_COUNTRIES_API_BASE_URL}/name/${searchTerm}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        resultsContainer.innerHTML =
          "<p>No se encontraron países con ese nombre.</p>";
      } else {
        throw new Error(`Error en la API de países: ${response.statusText}`);
      }
      return;
    }
    const data = await response.json();

    if (data.length > 10) {
      // Si hay más de 10 países en el filtrado, debe indicar que la búsqueda sea más específica.
      resultsContainer.innerHTML =
        '<p class="too-many-results">Demasiados países, especifica mejor tu búsqueda.</p>';
    } else if (data.length >= 2 && data.length <= 10) {
      // Si hay menos de 10 países en el filtrado, debería mostrar una lista de esos países con su nombre y bandera.
      displayCountryList(data);
    } else if (data.length === 1) {
      // Si hay un solo país en el filtrado, debería mostrar el nombre, capital, habitantes, región, temperatura y el clima actual de dicho país.
      displayCountryDetail(data[0]);
    } else {
      resultsContainer.innerHTML =
        "<p>No se encontraron países que coincidan con la búsqueda.</p>";
    }
  } catch (error) {
    console.error("Error al buscar países:", error);
    resultsContainer.innerHTML =
      "<p>Ocurrió un error al buscar países. Por favor, inténtalo de nuevo.</p>";
  }
}

function displayCountryList(countries) {
  countries.forEach((country) => {
    const li = document.createElement("li");
    li.classList.add("country-item");
    // Agregamos un atributo data-country-name para identificar el país al hacer clic
    li.dataset.countryName = country.name.common; //
    li.innerHTML = `
            <img src="${country.flags.svg}" alt="Bandera de ${country.name.common}">
            <span>${country.name.common}</span>
        `;
    countryListDisplay.appendChild(li);

    // Añadir el event listener para cada elemento de la lista
    li.addEventListener("click", async () => {
      //
      const countryName = li.dataset.countryName; //
      // Volvemos a buscar el país por nombre exacto para obtener todos sus detalles
      try {
        const response = await fetch(
          `${REST_COUNTRIES_API_BASE_URL}/name/${countryName}?fullText=true`
        ); //
        if (!response.ok) {
          throw new Error(
            `Error al buscar detalles del país: ${response.statusText}`
          ); //
        }
        const data = await response.json(); //
        if (data.length === 1) {
          displayCountryDetail(data[0]); //
        } else {
          console.error(
            "No se encontró un único país para el nombre seleccionado:",
            countryName
          ); //
          resultsContainer.innerHTML =
            "<p>No se pudo cargar el detalle del país seleccionado.</p>"; //
        }
      } catch (error) {
        console.error("Error al hacer clic en el país:", error); //
        resultsContainer.innerHTML =
          "<p>Ocurrió un error al cargar el detalle del país.</p>"; //
      }
    });
  });
  resultsContainer.appendChild(countryListDisplay);
  countryDetailDisplay.style.display = "none";
}

async function displayCountryDetail(countryData) {
  countryDetailDisplay.style.display = "block";
  resultsContainer.innerHTML = "";

  flag.src = countryData.flags.svg;
  countryNameSpan.innerHTML = countryData.name.common;
  populationSpan.innerHTML = countryData.population
    ? countryData.population.toLocaleString()
    : "N/A";
  capitalSpan.innerHTML = countryData.capital ? countryData.capital[0] : "N/A";
  regionSpan.innerHTML = countryData.region ? countryData.region : "N/A";

  if (countryData.currencies) {
    const currencyKey = Object.keys(countryData.currencies)[0];
    currencySpan.innerHTML =
      countryData.currencies[currencyKey].name +
      " (" +
      countryData.currencies[currencyKey].symbol +
      ")";
  } else {
    currencySpan.innerHTML = "N/A";
  }

  if (countryData.languages) {
    languageSpan.innerHTML = Object.values(countryData.languages).join(", ");
  } else {
    languageSpan.innerHTML = "N/A";
  }

  // Asegúrate de que la capital sea válida antes de intentar obtener el clima
  await getWeatherData(
    countryData.capital && countryData.capital.length > 0
      ? countryData.capital[0]
      : null
  );
}

async function getWeatherData(capital) {
  if (!capital) {
    weatherInfoDiv.innerHTML =
      "<p>No se pudo obtener el clima (capital no disponible o reconocida).</p>";
    weatherInfoDiv.style.display = "block";
    return;
  }

  try {
    // La URL completa con HTTPS, units=metric y lang=es
    const weatherResponse = await fetch(
      `${OPENWEATHER_API_BASE_URL}?q=${capital}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`
    );

    if (!weatherResponse.ok) {
      // Manejo de errores más detallado para depuración
      const errorData = await weatherResponse.json();
      console.error(
        `Error en la API del clima (estado: ${weatherResponse.status}): ${errorData.message}`
      );

      if (weatherResponse.status === 401) {
        weatherInfoDiv.innerHTML =
          "<p>Error: API Key de OpenWeather no válida o inactiva.</p>";
      } else if (weatherResponse.status === 404) {
        weatherInfoDiv.innerHTML =
          "<p>No se encontró información del clima para esta capital.</p>";
      } else {
        weatherInfoDiv.innerHTML = `<p>Ocurrió un error (${weatherResponse.status}) al obtener el clima: ${errorData.message}</p>`;
      }
      weatherInfoDiv.style.display = "block";
      return;
    }

    const weatherData = await weatherResponse.json();

    const temp = weatherData.main.temp;
    const description = weatherData.weather[0].description;
    const iconCode = weatherData.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`; // Iconos del clima.

    weatherIcon.src = iconUrl;
    weatherIcon.alt = description;
    weatherDescription.textContent = description;
    weatherTemp.textContent = `${temp.toFixed(1)} °C`; // Muestra la temperatura en grados Celsius.
    weatherInfoDiv.style.display = "flex";
  } catch (error) {
    console.error("Error al obtener el clima:", error);
    weatherInfoDiv.innerHTML =
      "<p>Ocurrió un error al obtener la información del clima. Por favor, inténtalo de nuevo.</p>";
    weatherInfoDiv.style.display = "block";
  }
}
