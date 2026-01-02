const installBtn = document.getElementById("installBtn");
let deferredPrompt;

/* INSTALL HANDLER */
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

/* ICONS */
const icons = {0:"☀",1:"🌤",2:"⛅",3:"☁",45:"🌫",61:"🌧",71:"❄",95:"⛈"};

/* COMPASS */
function compassDirection(deg){
  const d=["North","NE","East","SE","South","SW","West","NW"];
  return d[Math.round(deg/45)%8];
}

if("DeviceOrientationEvent" in window){
  window.addEventListener("deviceorientation", e=>{
    if(e.alpha!=null){
      compassValue.innerText = `${Math.round(e.alpha)}°`;
      compassDir.innerText = `Direction: ${compassDirection(e.alpha)}`;
    }
  });
}

/* AQI */
function aqiInfo(pm){
  if(pm<=30) return {l:"Good",c:"aqi-good",a:"Safe outdoors"};
  if(pm<=60) return {l:"Moderate",c:"aqi-moderate",a:"Sensitive reduce exposure"};
  if(pm<=90) return {l:"Poor",c:"aqi-poor",a:"Avoid long outdoor stay"};
  return {l:"Severe",c:"aqi-severe",a:"Stay indoors"};
}

async function loadWeather(lat, lon, name, country){
  const w = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`+
    `&current_weather=true&hourly=temperature_2m,surface_pressure`+
    `&daily=temperature_2m_min,temperature_2m_max,weathercode&timezone=auto`
  ).then(r=>r.json());

  const a = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5&timezone=auto`
  ).then(r=>r.json());

  location.innerText = `${name} ${country}`;
  temp.innerText = `🌡 ${w.current_weather.temperature}°C`;
  wind.innerText = `🌬 ${w.current_weather.windspeed} km/h`;
  pressure.innerText = `📟 ${w.hourly.surface_pressure[0]} hPa`;
  icon.innerText = icons[w.current_weather.weathercode]||"⛅";

  const pm = a.hourly.pm2_5[0];
  const ai = aqiInfo(pm);
  aqiValue.className = `big ${ai.c}`;
  aqiValue.innerText = `${pm} µg/m³`;
  aqiLabel.innerText = `Category: ${ai.l}`;
  aqiAdvice.innerText = ai.a;

  hourlyTemp.innerHTML="";
  w.hourly.temperature_2m.slice(0,24).forEach((t,i)=>{
    hourlyTemp.innerHTML+=`<div class="hour"><p>${i}h</p><p>${t}°</p></div>`;
  });

  forecast.innerHTML="";
  w.daily.time.forEach((d,i)=>{
    forecast.innerHTML+=`
    <div class="day">
      <p>${d.slice(5)}</p>
      <div>${icons[w.daily.weathercode[i]]||"⛅"}</div>
      <p>⬆ ${w.daily.temperature_2m_max[i]}°</p>
      <p>⬇ ${w.daily.temperature_2m_min[i]}°</p>
    </div>`;
  });
}

async function searchCity(){
  const city=cityInput.value;
  if(!city) return;
  const g=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`).then(r=>r.json());
  if(!g.results) return alert("City not found");
  const {latitude,longitude,name,country}=g.results[0];
  loadWeather(latitude,longitude,name,country);
}

navigator.geolocation.getCurrentPosition(p=>{
  loadWeather(p.coords.latitude,p.coords.longitude,"Your Location","");
});

/* SERVICE WORKER */
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js");
}
