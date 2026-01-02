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

/* Compass (low-end safe) */
if ("DeviceOrientationEvent" in window) {
  window.addEventListener("deviceorientation", e => {
    if (e.alpha !== null)
      compass.innerText = `🧭 ${Math.round(e.alpha)}°`;
  });
} else compass.innerText = "🧭 N/A";

/* AQI (India PM2.5 based) */
function aqiFromPM25(pm) {
  if (pm <= 30) return { label: "Good", class: "aqi-good" };
  if (pm <= 60) return { label: "Moderate", class: "aqi-moderate" };
  if (pm <= 90) return { label: "Poor", class: "aqi-poor" };
  return { label: "Severe", class: "aqi-severe" };
}

/* Local AI Summary */
function aiSummaryText(data, pm25) {
  const t = data.current_weather.temperature;
  const w = data.current_weather.windspeed;
  const r = data.hourly.precipitation_probability[0];

  if (pm25 > 90) return "Air quality is poor. Avoid outdoor activity 😷";
  if (r > 70) return "Heavy rain likely. Travel carefully ☔";
  if (t > 35) return "Very hot weather. Stay hydrated 🥵";
  if (t < 15) return "Cool conditions. Light jacket advised 🧥";
  if (w > 30) return "Strong winds expected 🌬";
  return "Weather looks comfortable today 🙂";
}

/* India Monsoon Logic */
function isMonsoon(lat, month) {
  return lat >= 6 && lat <= 37 && month >= 6 && month <= 9;
}

/* Smart Monsoon Alert */
function monsoonAlert(data, lat) {
  if (Notification.permission !== "granted") return;

  const month = new Date().getMonth() + 1;
  if (!isMonsoon(lat, month)) return;

  const heavy = data.hourly.precipitation_probability
    .slice(0,6).some(p=>p>=70);

  const today = new Date().toDateString();
  if (heavy && localStorage.getItem("monsoonAlert") !== today) {
    navigator.serviceWorker.ready.then(sw=>{
      sw.showNotification("🌧 Monsoon Alert – Rituva", {
        body: "Heavy monsoon rain expected today.",
        icon: "icons/icon-192.png"
      });
    });
    localStorage.setItem("monsoonAlert", today);
  }
}

/* Hourly Chart (low-end optimized) */
function drawHourly(temps) {
  const c = hourlyChart;
  const ctx = c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);

  const max = Math.max(...temps);
  const min = Math.min(...temps);

  temps.slice(0,24).forEach((t,i)=>{
    const x = i*(c.width/24);
    const y = c.height-((t-min)/(max-min))*c.height;
    ctx.fillRect(x,y,2,2);
  });
  ctx.save(); ctx.restore();
}

/* MAIN WEATHER LOADER */
async function loadWeather(lat, lon, name, country) {

  const lastFetch = localStorage.getItem("lastFetch");
  if (lastFetch && Date.now()-lastFetch < 30*60*1000) return;
  localStorage.setItem("lastFetch", Date.now());

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

  const aqiEl = document.getElementById("aqi");
  aqiEl.className = aqi.class;
  aqiEl.innerText = `🌫 AQI: ${aqi.label} (PM2.5 ${pm25} µg/m³)`;

  aiSummary.innerText = "🧠 " + aiSummaryText(data, pm25);

  drawHourly(data.hourly.temperature_2m);
  monsoonAlert(data, lat);

  forecast.innerHTML="";
  data.daily.time.forEach((d,i)=>{
    forecast.innerHTML+=`
      <div class="day">
        <p>${d.slice(5)}</p>
        <div>${icons[data.daily.weathercode[i]]||"⛅"}</div>
        <p>${data.daily.temperature_2m_max[i]}°</p>
      </div>`;
  });
}

/* City Search */
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

/* Offline Load */
const savedWeather = localStorage.getItem("forecastData");
const savedAQI = localStorage.getItem("aqiData");

if (savedWeather && savedAQI) {
  const data = JSON.parse(savedWeather);
  const aqiData = JSON.parse(savedAQI);
}

/* Auto Location */
navigator.geolocation.getCurrentPosition(p=>{
  loadWeather(p.coords.latitude,p.coords.longitude,"Your Location","");
});
