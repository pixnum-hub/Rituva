const cloudMap = document.getElementById("cloudMap");

const icons = {
  0:"☀",1:"🌤",2:"⛅",3:"☁",
  45:"🌫",48:"🌫",51:"🌦",
  61:"🌧",71:"❄",95:"⛈"
};

/* PWA */
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("service-worker.js");

if ("Notification" in window)
  Notification.requestPermission();

/* Compass */
if ("DeviceOrientationEvent" in window) {
  window.addEventListener("deviceorientation", e => {
    if (e.alpha !== null)
      compass.innerText = `🧭 ${Math.round(e.alpha)}°`;
  });
}

/* AQI logic */
function aqiFromPM25(pm) {
  if (pm <= 30) return { label: "Good", class: "aqi-good" };
  if (pm <= 60) return { label: "Moderate", class: "aqi-moderate" };
  if (pm <= 90) return { label: "Poor", class: "aqi-poor" };
  return { label: "Severe", class: "aqi-severe" };
}

/* AI summary */
function aiSummaryText(data, pm25) {
  const t = data.current_weather.temperature;
  const r = data.hourly.precipitation_probability[0];

  if (pm25 > 90) return "Air quality is poor. Avoid outdoor activity 😷";
  if (r > 70) return "Heavy rain likely. Travel carefully ☔";
  if (t > 35) return "Very hot today. Stay hydrated 🥵";
  if (t < 15) return "Cool weather. Light jacket advised 🧥";
  return "Weather looks comfortable 🙂";
}

/* Satellite clouds (NO cookies) */
function loadSatellite(lat, lon) {
  const zoom = 5;
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor(
    (1 - Math.log(
      Math.tan(lat * Math.PI / 180) +
      1 / Math.cos(lat * Math.PI / 180)
    ) / Math.PI) / 2 * Math.pow(2, zoom)
  );

  cloudMap.src =
    `https://maps.open-meteo.com/weather-layer/clouds/${zoom}/${x}/${y}.png`;
}

/* Main loader */
async function loadWeather(lat, lon, name, country) {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`+
    `&current_weather=true`+
    `&hourly=temperature_2m,precipitation_probability,surface_pressure`+
    `&daily=temperature_2m_max,weathercode`+
    `&timezone=auto`;

  const data = await fetch(weatherUrl).then(r=>r.json());
  localStorage.setItem("forecastData", JSON.stringify(data));

  const aqiUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality`+
    `?latitude=${lat}&longitude=${lon}`+
    `&hourly=pm2_5&timezone=auto`;

  const aqiData = await fetch(aqiUrl).then(r=>r.json());
  localStorage.setItem("aqiData", JSON.stringify(aqiData));

  const pm25 = aqiData.hourly.pm2_5[0];
  const aqi = aqiFromPM25(pm25);

  location.innerText = `${name} ${country}`;
  temp.innerText = `${data.current_weather.temperature}°C`;
  wind.innerText = `Wind ${data.current_weather.windspeed} km/h`;
  pressure.innerText = `Pressure ${data.hourly.surface_pressure[0]} hPa`;
  icon.innerText = icons[data.current_weather.weathercode] || "⛅";

  aqiEl = document.getElementById("aqi");
  aqiEl.className = aqi.class;
  aqiEl.innerText = `🌫 AQI: ${aqi.label} (PM2.5 ${pm25} µg/m³)`;

  aiSummary.innerText = "🧠 " + aiSummaryText(data, pm25);

  forecast.innerHTML = "";
  data.daily.time.forEach((d,i)=>{
    forecast.innerHTML += `
      <div class="day">
        <p>${d.slice(5)}</p>
        <div>${icons[data.daily.weathercode[i]] || "⛅"}</div>
        <p>${data.daily.temperature_2m_max[i]}°</p>
      </div>`;
  });

  // ✅ FINAL SATELLITE CALL
  loadSatellite(lat, lon);
}

/* City search */
async function searchCity() {
  const city = cityInput.value;
  if (!city) return;

  const geo = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
  ).then(r=>r.json());

  if (!geo.results) return alert("City not found");

  const {latitude,longitude,name,country} = geo.results[0];
  loadWeather(latitude,longitude,name,country);
}

/* Auto location */
navigator.geolocation.getCurrentPosition(p=>{
  loadWeather(p.coords.latitude,p.coords.longitude,"Your Location","");
});
