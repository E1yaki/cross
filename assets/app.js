const $=id=>document.getElementById(id);
let runs=[], laps=[], editing=false, weatherTimer=null;
const STORAGE_KEY='stride-runs-v1';
const fields=['date','place','weather','distance','moving-time','total-time','steps','pace','max-pace','speed','max-speed','elevation','alt-low','alt-high','hr-avg','hr-max','cad-avg','cad-max'];
const num=id=>{const v=$(id).value;return v===''?null:Number(v)};
const val=id=>$(id).value.trim();
const parseTime=s=>{if(!s)return null;const m=s.match(/^(\d{1,3}):([0-5]\d)$/);return m?Number(m[1])*60+Number(m[2]):null};
const fmtTime=s=>s==null?'—':`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
const paceSeconds=s=>parseTime(s);
const fmtPace=s=>s==null?'—':`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateFmt=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2600)}
function load(){try{runs=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(!Array.isArray(runs))runs=[];render()}catch(e){runs=[];toast('Impossible de lire les données locales.')}}
function saveAll(){localStorage.setItem(STORAGE_KEY,JSON.stringify(runs));}
function nav(page){$('dashboard-page').classList.toggle('hidden',page!=='dashboard');$('entry-page').classList.toggle('hidden',page!=='entry');document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('page-title').textContent=page==='dashboard'?'Ton évolution, en mouvement.':'Une nouvelle sortie, un nouveau repère.';$('top-eyebrow').textContent=page==='dashboard'?"VUE D'ENSEMBLE":'SAISIE DE PERFORMANCE';window.scrollTo({top:0,behavior:'smooth'});if(page==='dashboard')render()}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.page)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>{resetForm();nav('entry')}));
$('today').textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
function locations(){return [...new Set(runs.map(r=>r.place).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'))}
function fillPlaces(){ $('place-options').innerHTML=locations().map(p=>`<option value="${esc(p)}">`).join('') }
function render(){fillPlaces();renderStats();renderChart();renderCompareOptions();renderRecent();renderRegularity()}
function renderStats(){
 const n=runs.length,dist=runs.reduce((a,r)=>a+(+r.distance||0),0),secs=runs.reduce((a,r)=>a+(+r.movingSeconds||0),0),elev=runs.reduce((a,r)=>a+(+r.elevation||0),0);
 const paces=runs.map(r=>r.paceSeconds).filter(x=>x>0);$('run-count').textContent=`${n} course${n>1?'s':''} enregistrée${n>1?'s':''}`;$('k-distance').innerHTML=`${dist.toFixed(1)} <small>km</small>`;$('k-time').textContent=`${Math.floor(secs/3600)}h${String(Math.floor(secs%3600/60)).padStart(2,'0')}`;$('k-pace').textContent=paces.length?fmtPace(Math.min(...paces)):'—';$('k-elev').innerHTML=`${Math.round(elev)} <small>m</small>`;
}
function metricValue(r,m){return m==='pace'?r.paceSeconds:m==='distance'?+r.distance:m==='speed'?+r.speed:m==='hr'?+r.hrAvg:m==='cadence'?+r.cadAvg:+r.elevation}
function metricLabel(m){return {pace:'Allure moyenne · min/km',distance:'Distance · km',speed:'Vitesse moyenne · km/h',hr:'FC moyenne · bpm',cadence:'Cadence moyenne · ppm',elevation:'Dénivelé · m'}[m]}
function metricFormat(v,m){return m==='pace'?fmtPace(v):m==='distance'?v.toFixed(2):m==='speed'?v.toFixed(1):Math.round(v).toString()}
function renderChart(){
 const m=$('chart-metric').value,series=[...runs].filter(r=>metricValue(r,m)!=null&&Number.isFinite(metricValue(r,m))).sort((a,b)=>a.date.localeCompare(b.date));
 $('chart-legend-text').textContent=metricLabel(m);$('chart-caption').textContent=series.length?`${series.length} sortie${series.length>1?'s':''} avec cette statistique`:'Enregistre tes premières sorties pour voir ta progression.';
 const svg=$('progress-chart');if(!series.length){svg.innerHTML='<text x="380" y="120" text-anchor="middle" fill="#aab4bd" font-size="12">Pas encore de données à afficher</text>';return}
 const W=760,H=250,L=48,R=20,T=20,B=36,vals=series.map(r=>metricValue(r,m)),min=Math.min(...vals),max=Math.max(...vals),pad=(max-min)*.2||Math.max(max*.12,1),lo=min-pad,hi=max+pad;
 const x=i=>L+(series.length===1?(W-L-R)/2:i*(W-L-R)/(series.length-1)),y=v=>T+(m==='pace'?(v-lo):(hi-v))/(hi-lo)*(H-T-B);
 let html='';for(let i=0;i<4;i++){const yy=T+i*(H-T-B)/3,v=hi-i*(hi-lo)/3;html+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="#edf1f2" stroke-dasharray="3 5"/><text x="${L-9}" y="${yy+3}" text-anchor="end" fill="#a3adb7" font-size="9">${metricFormat(v,m)}</text>`}
 const pts=series.map((r,i)=>`${x(i)},${y(metricValue(r,m))}`).join(' ');const area=`${x(0)},${H-B} ${pts} ${x(series.length-1)},${H-B}`;
 html+=`<polygon points="${area}" fill="#dff5ec" opacity=".8"/><polyline points="${pts}" fill="none" stroke="#36aa85" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
 series.forEach((r,i)=>{html+=`<circle cx="${x(i)}" cy="${y(metricValue(r,m))}" r="4.5" fill="#fff" stroke="#299a76" stroke-width="2.5"><title>${dateFmt(r.date)} · ${metricFormat(metricValue(r,m),m)}</title></circle>`;if(series.length<=8||i===0||i===series.length-1||i%Math.ceil(series.length/6)===0)html+=`<text x="${x(i)}" y="${H-10}" text-anchor="middle" fill="#9ba6b0" font-size="9">${new Date(r.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}</text>`});
 svg.innerHTML=html;
}
$('chart-metric').addEventListener('change',renderChart);
function renderCompareOptions(){
 const opts=[...runs].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<option value="${esc(r.id)}">${dateFmt(r.date)} · ${esc(r.place)} (${(+r.distance).toFixed(2)} km)</option>`).join('');
 ['compare-a','compare-b'].forEach(id=>{const old=$(id).value;$(id).innerHTML=opts||'<option value="">Aucune course</option>';if([...runs].some(r=>r.id===old))$(id).value=old});
 if(runs.length>=2){if(!$('compare-a').value)$('compare-a').selectedIndex=1;if(!$('compare-b').value||$('compare-b').value===$('compare-a').value)$('compare-b').selectedIndex=0}
 compare();
}
$('compare-a').addEventListener('change',compare);$('compare-b').addEventListener('change',compare);
function compare(){
 const a=runs.find(r=>r.id===$('compare-a').value),b=runs.find(r=>r.id===$('compare-b').value),el=$('compare-result');if(!a||!b||a.id===b.id){el.className='compare-result empty';el.textContent='Sélectionne deux courses différentes pour afficher les écarts.';return}
 const days=Math.round((new Date(b.date+'T12:00:00')-new Date(a.date+'T12:00:00'))/86400000);
 const metrics=[['Distance',a.distance,b.distance,'km',2],['Allure moyenne',a.paceSeconds,b.paceSeconds,'',0],['Vitesse moyenne',a.speed,b.speed,'km/h',1],['FC moyenne',a.hrAvg,b.hrAvg,'bpm',0],['Cadence moyenne',a.cadAvg,b.cadAvg,'ppm',0],['Dénivelé',a.elevation,b.elevation,'m',0]];
 el.className='compare-result';el.innerHTML=`<div class="compare-line"><b>Écart entre les sorties</b><b>${Math.abs(days)} jour${Math.abs(days)>1?'s':''} ${days<0?'(ordre inversé)':''}</b></div>`+metrics.map(([name,x,y,u,d])=>{if(x==null||y==null)return '';let diff=y-x,better=name==='Allure moyenne'?-diff:diff,formatted=name==='Allure moyenne'?fmtPace(Math.abs(diff)):Math.abs(diff).toFixed(d);return `<div class="compare-line"><span>${name}</span><b class="${better>0?'positive':better<0?'negative':''}">${diff>0?'+':diff<0?'−':''}${formatted} ${u}</b></div>`}).join('');
}
function renderRecent(){
 const arr=[...runs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
 $('recent-body').innerHTML=arr.length?arr.map(r=>`<tr><td>${dateFmt(r.date)}</td><td class="place-cell">${esc(r.place)}</td><td>${(+r.distance).toFixed(2)} km</td><td>${r.paceSeconds?fmtPace(r.paceSeconds):'—'}</td><td>${fmtTime(r.movingSeconds)}</td><td><div class="row-actions"><button data-edit="${esc(r.id)}" title="Modifier">✎</button><button data-delete="${esc(r.id)}" title="Supprimer">×</button></div></td></tr>`).join(''):'<tr><td colspan="6" class="empty-cell">Aucune course enregistrée pour le moment.</td></tr>';
 $('recent-body').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editRun(b.dataset.edit)));$('recent-body').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteRun(b.dataset.delete)));
}
function renderRegularity(){
 const now=new Date(),since=new Date(now);since.setDate(now.getDate()-29);const recent=runs.filter(r=>new Date(r.date+'T12:00:00')>=since),counts=Array(5).fill(0);
 recent.forEach(r=>{const days=Math.floor((now-new Date(r.date+'T12:00:00'))/86400000);const idx=Math.min(4,Math.floor((29-days)/6));counts[Math.max(0,idx)]++});
 $('week-runs').innerHTML=`${recent.length} <small>sortie${recent.length>1?'s':''}</small>`;
 const max=Math.max(1,...counts);$('week-bars').innerHTML=counts.map((v,i)=>`<div class="mini-bar ${v?'active':''}" style="height:${Math.max(5,v/max*60)}px"><span>${['-30j','-24j','-18j','-12j','-6j'][i]}</span></div>`).join('');
 const last=[...runs].sort((a,b)=>b.date.localeCompare(a.date))[0];$('last-run').textContent=last?`Dernière sortie : ${dateFmt(last.date)} · ${last.place}`:'Ta prochaine sortie commence ici.';
}
function resetForm(){ $('run-form').reset();$('run-id').value='';$('date').value=new Date().toISOString().slice(0,10);$('form-heading').textContent='Enregistrer une sortie';$('cancel-edit').classList.add('hidden');$('weather').value='';$('weather-icon').textContent='—';$('weather-status').textContent='Renseignée à partir du lieu et de la date.';laps=[];renderLaps();editing=false}
function renderLaps(){
 $('laps-body').innerHTML=laps.map((l,i)=>`<tr><td>${i+1}${l.remainder?' · restant':''}</td><td><input type="number" min="0" step=".01" data-lap="distance" data-i="${i}" value="${l.distance??''}" placeholder="1.00"></td><td><input type="text" data-lap="time" data-i="${i}" value="${esc(l.time||'')}" placeholder="5:30"></td><td><input type="number" min="0" data-lap="hr" data-i="${i}" value="${l.hr??''}" placeholder="—"></td><td><input type="text" data-lap="pace" data-i="${i}" value="${esc(l.pace||'')}" placeholder="5:30"></td><td><button type="button" class="lap-delete" data-lap-del="${i}">×</button></td></tr>`).join('');
 $('laps-summary').textContent=`${laps.length} tour${laps.length>1?'s':''} renseigné${laps.length>1?'s':''}`;
 $('laps-body').querySelectorAll('[data-lap]').forEach(inp=>inp.addEventListener('change',()=>{const l=laps[+inp.dataset.i];l[inp.dataset.lap]=inp.value;if(inp.dataset.lap==='time'&&parseTime(inp.value)!=null&&Number(l.distance)>0)l.pace=fmtPace(parseTime(inp.value)/Number(l.distance));renderLaps()}));
 $('laps-body').querySelectorAll('[data-lap-del]').forEach(b=>b.addEventListener('click',()=>{laps.splice(+b.dataset.lapDel,1);renderLaps()}));
}
$('add-lap').addEventListener('click',()=>{laps.push({distance:1,time:'',hr:'',pace:''});renderLaps()});
$('generate-laps').addEventListener('click',()=>{const d=num('distance');if(!d||d<=0){toast('Saisis d’abord la distance totale.');return}const whole=Math.floor(d),rem=+(d-whole).toFixed(2);laps=Array.from({length:whole},()=>({distance:1,time:'',hr:'',pace:''}));if(rem>0.001)laps.push({distance:rem,remainder:true,time:'',hr:'',pace:''});renderLaps()});
function getRun(){
 const moving=parseTime(val('moving-time')),total=parseTime(val('total-time')),dist=num('distance'),pace=paceSeconds(val('pace'))||(moving&&dist?moving/dist:null),speed=num('speed')||(moving&&dist?+(dist/(moving/3600)).toFixed(2):null);
 return {id:val('run-id')||undefined,date:val('date'),place:val('place'),weather:val('weather'),distance:dist,movingSeconds:moving,totalSeconds:total,steps:num('steps'),paceSeconds:pace,maxPaceSeconds:paceSeconds(val('max-pace')),speed,maxSpeed:num('max-speed'),elevation:num('elevation'),altLow:num('alt-low'),altHigh:num('alt-high'),hrAvg:num('hr-avg'),hrMax:num('hr-max'),cadAvg:num('cad-avg'),cadMax:num('cad-max'),laps:laps.map(l=>({...l,seconds:parseTime(l.time),hr:l.hr===''?null:Number(l.hr),distance:l.distance===''?null:Number(l.distance)}))};
}
$('run-form').addEventListener('submit',e=>{e.preventDefault();const run=getRun();if(!run.movingSeconds&&run.paceSeconds&&run.distance)run.movingSeconds=Math.round(run.paceSeconds*run.distance);if(!run.id)run.id=crypto.randomUUID?crypto.randomUUID():String(Date.now());const idx=runs.findIndex(r=>r.id===run.id);if(idx>=0)runs[idx]=run;else runs.push(run);saveAll();render();toast(editing?'Course mise à jour.':'Course enregistrée.');resetForm();nav('dashboard')});
$('cancel-edit').addEventListener('click',()=>{resetForm();nav('dashboard')});
function editRun(id){const r=runs.find(x=>x.id===id);if(!r)return;resetForm();editing=true;$('run-id').value=r.id;$('form-heading').textContent='Modifier la course';$('cancel-edit').classList.remove('hidden');fields.forEach(id=>{const map={'moving-time':'movingSeconds','total-time':'totalSeconds','pace':'paceSeconds','max-pace':'maxPaceSeconds','speed':'speed','max-speed':'maxSpeed','elevation':'elevation','alt-low':'altLow','alt-high':'altHigh','hr-avg':'hrAvg','hr-max':'hrMax','cad-avg':'cadAvg','cad-max':'cadMax'};const key=map[id]||id;if(r[key]!=null)$(id).value=['moving-time','total-time'].includes(id)?fmtTime(r[key]):['pace','max-pace'].includes(id)?fmtPace(r[key]):r[key]});laps=(r.laps||[]).map(l=>({...l,time:l.time||fmtTime(l.seconds)}));renderLaps();nav('entry')}
function deleteRun(id){const r=runs.find(x=>x.id===id);if(!r||!confirm(`Supprimer la course du ${dateFmt(r.date)} à ${r.place} ? Cette action est définitive.`))return;runs=runs.filter(x=>x.id!==id);saveAll();render();toast('Course supprimée.');}
function findSavedPlace(place){return [...runs].reverse().find(r=>r.place.toLocaleLowerCase()===place.toLocaleLowerCase())}
$('place').addEventListener('change',async()=>{const place=val('place');if(!place)return;const saved=findSavedPlace(place);if(saved){if(!val('distance'))$('distance').value=saved.distance;if(!val('elevation'))$('elevation').value=saved.elevation??'';if(!val('alt-low'))$('alt-low').value=saved.altLow??'';if(!val('alt-high'))$('alt-high').value=saved.altHigh??'';toast('Données du lieu reprises depuis une sortie précédente.')}else await lookupPlace(place)});
$('date').addEventListener('change',()=>{if(val('place'))fetchWeather(val('place'))});
$('weather-refresh').addEventListener('click',()=>{if(val('place'))lookupPlace(val('place'),true).then(()=>fetchWeather(val('place')));else toast('Saisis d’abord un lieu.')});
async function lookupPlace(place,force=false){
 $('weather-status').textContent='Recherche du lieu…';
 try{
 const res=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(place)+'&count=1&language=fr&format=json');const j=await res.json();const p=j.results?.[0];if(!p){$('weather-status').textContent='Lieu non trouvé : météo à saisir manuellement.';return}
 const elev=p.elevation;if(elev!=null){if(!$('alt-low').value)$('alt-low').value=Math.round(elev);if(!$('alt-high').value)$('alt-high').value=Math.round(elev)}
 $('weather-status').textContent=`${p.name}${p.admin1?', '+p.admin1:''} · altitude indicative ${Math.round(elev||0)} m`;fetchWeatherCoords(p.latitude,p.longitude);
 }catch(e){$('weather-status').textContent='Géolocalisation indisponible (connexion nécessaire).'}
}
async function fetchWeather(place){try{const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(place)+'&count=1&language=fr&format=json');const j=await r.json();const p=j.results?.[0];if(p)fetchWeatherCoords(p.latitude,p.longitude)}catch(e){}}
async function fetchWeatherCoords(lat,lon){
 const date=val('date')||new Date().toISOString().slice(0,10),today=new Date().toISOString().slice(0,10);$('weather-status').textContent='Récupération de la météo…';
 try{let url;if(date<today)url=`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=weather_code,temperature_2m_mean,precipitation_sum&timezone=auto`;else url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_mean,precipitation_sum&timezone=auto&forecast_days=1`;
 const j=await (await fetch(url)).json(),code=j.daily?.weather_code?.[0],temp=j.daily?.temperature_2m_mean?.[0],rain=j.daily?.precipitation_sum?.[0];if(code==null)throw Error('No weather');const desc=weatherDesc(code);$('weather').value=`${desc.label}${temp!=null?' · '+Math.round(temp)+'°C':''}${rain>0.2?' · '+rain.toFixed(1)+' mm':''}`;$('weather-icon').textContent=desc.icon;$('weather-status').textContent='Météo récupérée automatiquement · Open-Meteo';}
 catch(e){$('weather-status').textContent='Météo indisponible pour cette date. Tu peux la renseigner manuellement.';$('weather').readOnly=false}
}
function weatherDesc(c){if(c===0)return{label:'Ensoleillé',icon:'☀️'};if([1,2].includes(c))return{label:'Peu nuageux',icon:'🌤️'};if(c===3)return{label:'Couvert',icon:'☁️'};if([45,48].includes(c))return{label:'Brouillard',icon:'🌫️'};if(c>=51&&c<=67)return{label:'Pluie',icon:'🌧️'};if(c>=71&&c<=77)return{label:'Neige',icon:'❄️'};if(c>=80&&c<=82)return{label:'Averses',icon:'🌦️'};if(c>=95)return{label:'Orage',icon:'⛈️'};return{label:'Variable',icon:'🌥️'}}
$('date').value=new Date().toISOString().slice(0,10);renderLaps();load();
$('export-data').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),runs},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`stride-sauvegarde-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast('Sauvegarde JSON téléchargée.');});
$('import-data').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.runs;if(!Array.isArray(incoming))throw Error('Format JSON non reconnu');if(!confirm(`Importer ${incoming.length} course(s) ? Les courses portant le même identifiant seront mises à jour.`))return;const map=new Map(runs.map(r=>[r.id,r]));incoming.forEach((r,i)=>{if(!r.id)r.id=`import-${Date.now()}-${i}`;map.set(r.id,r)});runs=[...map.values()];saveAll();render();toast(`${incoming.length} course(s) importée(s).`);}catch(err){toast('Import impossible : '+err.message)}finally{e.target.value='';}});
