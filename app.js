const icons = {
  0:"☀",1:"🌤",2:"⛅",3:"☁",
  45:"🌫",48:"🌫",61:"🌧",
  71:"❄",95:"⛈"
};

/* AQI logic (India PM2.5) */
function aqiInfo(pm) {
  if (pm <= 30) return { label:"Good", cls:"aqi-good", advice:"Safe for all activities 🙂" };
  if (pm <= 60) return { label:"Moderate", cls:"aqi-moderate", advice:"Sensitive people should reduce outdoor time" };
  if (pm <= 90) return { label:"Poor", cls:"aqi-poor", advice:"Avoid long outdoor exposure 😷" };
  return { label:"Severe", cls:"aqi-severe", advice:"Stay indoors, wear mask 🚫" };
}

/* Load weather */
async function loadWeather(lat, lon, name, country) {

  const weatherURL =
   `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`+
   `&current_weather=true`+
   `&hourly=temperature_2m,surface_pressure`+
   `&daily=temperature_2m_min,temperature_2m_max,weathercode`+
   `&timezone=auto`;

  const data = await fetch(weatherURL).then(r=>r.json());

  const aqiURL =
   `https://air-quality-api.open-meteo.com/v1/air-quality`+
   `?latitude=${lat}&longitude=${lon}&hourly=pm2_5&timezone=auto`;

  const aqiData = await fetch(aqiURL).then(r=>r.json());

  /* Current */
  location.innerText = `${name} ${country}`;
  temp.innerText = `🌡 ${data.current_weather.temperature}°C`;
  wind.innerText = `🌬 ${data.current_weather.windspeed} km/h`;
  pressure.innerText = `📟 ${data.hourly.surface_pressure[0]} hPa`;
  icon.innerText = icons[data.current_weather.weathercode] || "⛅";

  /* AQI */
  const pm25 = aqiData.hourly.pm2_5[0];
  const aqi = aqiInfo(pm25);
  aqiValue.className = aqi.cls;
  aqiValue.innerText = `${aqi.label} (PM2.5: ${pm25} µg/m³)`;
  aqiAdvice.innerText = aqi.advice;

  /* 24 hour temperature */
  hourlyTemp.innerHTML = "";
  data.hourly.temperature_2m.slice(0,24).forEach((t,i)=>{
    hourlyTemp.innerHTML += `
      <div class="hour">
        <p>${i}h</p>
        <p>${t}°</p>
      </div>`;
  });

  /* 7 day min/max */
  forecast.innerHTML = "";
  data.daily.time.forEach((d,i)=>{
    forecast.innerHTML += `
      <div class="day">
        <p>${d.slice(5)}</p>
        <div>${icons[data.daily.weathercode[i]]||"⛅"}</div>
        <p>⬆ ${data.daily.temperature_2m_max[i]}°</p>
        <p>⬇ ${data.daily.temperature_2m_min[i]}°</p>
      </div>`;
  });
}

/* Search */
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
