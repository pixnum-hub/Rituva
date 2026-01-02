// Weather icons
const icons = {0:"☀",1:"🌤",2:"⛅",3:"☁",45:"🌫",61:"🌧",71:"❄",95:"⛈"};

// AQI helper
function aqiInfo(pm){
  if(pm<=30) return {label:"Good", advice:"Safe outdoors"};
  if(pm<=60) return {label:"Moderate", advice:"Sensitive reduce exposure"};
  if(pm<=90) return {label:"Poor", advice:"Avoid long outdoor stay"};
  return {label:"Severe", advice:"Stay indoors"};
}

// Compass helper
function compassDirection(deg){
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg/45)%8];
}

// Main weather loader
async function loadWeather(lat, lon, name="Your Location"){
  try{
    const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m&daily=temperature_2m_min,temperature_2m_max,weathercode&timezone=auto`);
    const w = await wRes.json();

    const aRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5&timezone=auto`);
    const a = await aRes.json();

    document.getElementById("location").textContent = name;
    document.getElementById("temp").textContent = "🌡 "+w.current_weather.temperature+"°C";
    document.getElementById("wind").textContent = "🌬 "+w.current_weather.windspeed+" km/h";
    document.getElementById("icon").textContent = icons[w.current_weather.weathercode] || "⛅";

    // AQI
    let pm = a.hourly.pm2_5[0];
    let ai = aqiInfo(pm);
    const aqiCard = document.getElementById("aqiCard");
    aqiCard.innerHTML = `<h4>🌫 AQI (PM2.5)</h4>
      <div>${pm} µg/m³</div>
      <div>${ai.label}</div>
      <div style="font-size:12px">${ai.advice}</div>`;

    // HOURLY
    const hourlyDiv = document.getElementById("hourlyTemp");
    hourlyDiv.innerHTML="";
    const temps = w.hourly.temperature_2m.slice(0,24);
    const nowHour = new Date().getHours();
    const minT = Math.min(...temps), maxT = Math.max(...temps), range = maxT-minT||1;
    temps.forEach((t,i)=>{
      const h = 20 + ((t-minT)/range)*100;
      const hourLabel = i===0?"Now":(nowHour+i)%24+":00";
      const div = document.createElement("div");
      div.style.cssText="display:flex;flex-direction:column;align-items:center";
      div.innerHTML=`<div style="height:${h}px;width:20px;background:#4fc3f7;border-radius:6px"></div><div style="font-size:11px;margin-top:2px">${hourLabel}</div>`;
      hourlyDiv.appendChild(div);
    });

    // 7-DAY
    const forecastDiv = document.getElementById("forecast");
    forecastDiv.innerHTML="";
    const minAll = Math.min(...w.daily.temperature_2m_min);
    const maxAll = Math.max(...w.daily.temperature_2m_max);
    const rangeD = maxAll-minAll||1;
    w.daily.time.forEach((d,i)=>{
      const minH = 20 + ((w.daily.temperature_2m_min[i]-minAll)/rangeD)*60;
      const maxH = 20 + ((w.daily.temperature_2m_max[i]-minAll)/rangeD)*60;
      const div = document.createElement("div");
      div.style.cssText="display:flex;flex-direction:column;align-items:center";
      div.innerHTML=`<div style="display:flex;flex-direction:column;justify-content:flex-end;height:80px;width:16px;margin-bottom:4px">
        <div style="height:${maxH}px;background:#ff6347;border-radius:6px 6px 0 0;width:100%"></div>
        <div style="height:${minH}px;background:#4fc3f7;border-radius:6px 6px 0 0;width:100%"></div>
      </div>
      <div>${icons[w.daily.weathercode[i]]||"⛅"}</div>
      <div style="font-size:11px">${d.slice(5)}</div>`;
      forecastDiv.appendChild(div);
    });

    // Compass
    if("DeviceOrientationEvent" in window){
      window.addEventListener("deviceorientation", e=>{
        if(e.alpha!=null){
          const deg = Math.round(e.alpha);
          const compassDiv = document.getElementById("compassDiv");
          compassDiv.innerHTML = `<h4>🧭 Wind Direction</h4>
            <div>${deg}°</div>
            <div>${compassDirection(deg)}</div>`;
        }
      });
    }

  }catch(err){alert("Weather load failed"); console.error(err);}
}

// Mobile + Desktop geolocation
function detectLocation(){
  const locEl = document.getElementById("location");
  locEl.textContent = "Detecting location…";

  const fallback = ()=>loadWeather(28.6139,77.2090,"Delhi, IN");
  if(!navigator.geolocation){ fallback(); return; }

  let called = false;
  const timer = setTimeout(()=>{
    if(!called){ called = true; console.warn("Geolocation timeout"); fallback(); }
  }, 10000);

  navigator.geolocation.getCurrentPosition(
    pos => { if(called) return; called = true; clearTimeout(timer); loadWeather(pos.coords.latitude,pos.coords.longitude,"Current Location"); },
    err => { if(called) return; called = true; clearTimeout(timer); console.warn("Geolocation error:",err.message); fallback(); },
    {timeout:10000, enableHighAccuracy:true}
  );
}

// Search city
async function searchCity(){
  const city = document.getElementById("cityInput").value.trim();
  if(!city) return;
  try{
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
    const data = await res.json();
    if(!data.results || !data.results.length) return alert("City not found");
    const c = data.results[0];
    loadWeather(c.latitude, c.longitude, c.name + (c.country?", "+c.country:""));
  }catch(err){alert("City search failed"); console.error(err);}
}

// DARK MODE
const darkToggle = document.getElementById("darkToggle");
darkToggle.onclick = ()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
};
if(localStorage.getItem("darkMode")==="true") document.body.classList.add("dark");

// PWA INSTALL
const installBtn = document.getElementById("installBtn");
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display="block";
});
installBtn.onclick = async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  installBtn.style.display="none";
  deferredPrompt = null;
};

// Service worker
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(e=>console.error(e));
}

// Start
document.getElementById("locateBtn").onclick = detectLocation;
detectLocation();
