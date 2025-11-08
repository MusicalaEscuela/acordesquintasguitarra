/* Acordes de quinta – Musicala (versión solfeo, 6ª abajo)
   - Raíz + forma (6ª o 5ª) + octava opcional
   - Diagrama invertido y TAB invertida (1ª arriba, 6ª abajo)
*/

const NOTES = ["Do","Do#","Re","Re#","Mi","Fa","Fa#","Sol","Sol#","La","La#","Si"];
const NOMBRES = {
  "Do":"Do",
  "Do#":"Do♯ / Reb",
  "Re":"Re",
  "Re#":"Re♯ / Mib",
  "Mi":"Mi",
  "Fa":"Fa",
  "Fa#":"Fa♯ / Sol♭",
  "Sol":"Sol",
  "Sol#":"Sol♯ / Lab",
  "La":"La",
  "La#":"La♯ / Sib",
  "Si":"Si"
};

// Afinación estándar 6→1: Mi, La, Re, Sol, Si, Mi (en índices según NOTES)
const TUNING = ["Mi","La","Re","Sol","Si","Mi"].map(n => NOTES.indexOf(n)); // [4,9,2,7,11,4]

const rootSel   = document.getElementById('root');
const shapeSel  = document.getElementById('shape');
const octaveChk = document.getElementById('octave');
const fretInp   = document.getElementById('fret');
const btnSuggest= document.getElementById('btnSuggest');

const fretboardEl = document.getElementById('fretboard');
const nameOut     = document.getElementById('nameOut');
const tabOut      = document.getElementById('tabOut');

const FRETS = 15;

/* =========================
   Construcción del diagrama
   ========================= */
function buildBoard(){
  fretboardEl.innerHTML = "";
  fretboardEl.style.setProperty("--frets", FRETS);

  // Dibujar de 1ª (arriba) a 6ª (abajo) → índices internos siguen siendo 0=6ª ... 5=1ª
  for(let s=5; s>=0; s--){
    const row = document.createElement('div');
    row.className = 'row';
    for(let f=0; f<FRETS; f++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      if(f===0){
        const lbl = document.createElement('span');
        lbl.className = 'string-label';
        lbl.textContent = `${6-s}ª`; // muestra 1ª arriba ... 6ª abajo
        cell.appendChild(lbl);
      }
      row.appendChild(cell);
    }
    fretboardEl.appendChild(row);
  }

  // Números de traste en la base
  const nums = document.createElement('div');
  nums.className = 'fretnums';
  for(let f=0; f<FRETS; f++){
    const sp = document.createElement('span');
    sp.textContent = f;
    nums.appendChild(sp);
  }
  fretboardEl.appendChild(nums);
}

/* ====================================
   Utilidades para búsqueda y colocación
   ==================================== */
function findFretForRoot(root, baseStringIndex){
  // Busca un traste cómodo (2–7) donde la cuerda base coincida con la raíz
  const target = NOTES.indexOf(root);
  let best = 3;
  for(let f=1; f<=12; f++){
    const pitch = (TUNING[baseStringIndex] + f) % 12;
    if(pitch === target){
      best = f;
      if(f>=2 && f<=7) break;
    }
  }
  return best;
}

function getCell(stringIdxFromTop, fret){
  // stringIdxFromTop: 0=6ª (abajo), 5=1ª (arriba) en el modelo lógico
  // En el DOM, las filas están de 1ª→6ª (arriba→abajo), por eso espejamos:
  const rows = [...fretboardEl.querySelectorAll('.row')];
  const row = rows[5 - stringIdxFromTop];
  if(!row) return null;
  return row.children[fret] || null;
}

function addMute(stringIdxFromTop, fret){
  const cell = getCell(stringIdxFromTop, fret);
  if(!cell) return;
  const mk = document.createElement('div');
  mk.className = 'marker mute';
  mk.textContent = 'X';
  cell.appendChild(mk);
}

/* =========================
   Render principal del acorde
   ========================= */
function render(){
  // limpiar marcadores anteriores
  [...fretboardEl.querySelectorAll('.marker')].forEach(n => n.remove());

  const root   = rootSel.value;
  const addOct = octaveChk.checked;
  const shape  = shapeSel.value; // 'E' (6ª) o 'A' (5ª)
  let fret     = parseInt(fretInp.value||"5",10);
  if(Number.isNaN(fret)) fret = 5;
  fret = Math.max(0, Math.min(14, fret));

  // Índices lógicos: 0=6ª, 1=5ª, 2=4ª, 3=3ª, 4=2ª, 5=1ª
  const baseString = (shape === 'E') ? 0 : 1;

  // Si el traste actual no coincide con la raíz en la cuerda base, sugerimos uno
  const pitchAtFret = (TUNING[baseString] + fret) % 12;
  if(pitchAtFret !== NOTES.indexOf(root)){
    fret = findFretForRoot(root, baseString);
    fretInp.value = fret;
  }

  // Calcular puntos (1–5–8)
  let points = [];
  if(shape === 'E'){
    // 6ª base → (6, f)=1 ; (5, f+2)=5 ; (4, f+2)=8 opcional
    points.push({s:0, f:fret,   type:'root'});
    points.push({s:1, f:fret+2, type:'fifth'});
    if(addOct) points.push({s:2, f:fret+2, type:'oct'});
    // Mutes sugeridos (1ª–3ª)
    ['mute','mute','mute'].forEach((_,i)=> addMute(5-i, 0));
  }else{
    // 5ª base → (5, f)=1 ; (4, f+2)=5 ; (3, f+2)=8 opcional
    points.push({s:1, f:fret,   type:'root'});
    points.push({s:2, f:fret+2, type:'fifth'});
    if(addOct) points.push({s:3, f:fret+2, type:'oct'});
    // Mutes sugeridos (1ª–2ª y 6ª)
    addMute(0,0); addMute(4,0); addMute(5,0);
  }

  // Pintar puntos
  points.forEach(p=>{
    if(p.f<0 || p.f>=FRETS) return;
    const cell = getCell(p.s, p.f);
    if(!cell) return;
    const mk = document.createElement('div');
    mk.className = `marker ${p.type}`;
    cell.appendChild(mk);
  });

  // Encabezado y TAB
  nameOut.textContent = `Acorde: ${NOMBRES[root]}5 — Forma en ${shape==='E'?'6ª':'5ª'} cuerda, traste ${fret}`;
  tabOut.textContent  = makeTab(points);
}

/* =========================
   Generación de TAB invertida
   ========================= */
// 1ª arriba → 6ª abajo
function makeTab(points){
  const LINES_TOP_TO_BOTTOM = ["1ra","2da","3ra","4ta","5ta","6ta"]; // etiquetas visibles
  const lines = LINES_TOP_TO_BOTTOM.map(n => `${n}|`);

  // Elegir una sola nota por cuerda (si hubiera duplicados, nos quedamos con la más grave por defecto)
  const byString = new Map(); // clave: s (0=6ª ... 5=1ª), valor: {s,f,type}
  points.forEach(p=>{
    if(p.type==='mute') return;
    const s = p.s;
    if(byString.has(s)){
      const prev = byString.get(s);
      if(p.f < prev.f) byString.set(s,p);
    }else{
      byString.set(s,p);
    }
  });

  const maxFret = Math.max(0, ...points.map(p=>p.f));
  const pad = String(maxFret).length;
  const col = "-".repeat(2);
  lines.forEach((_,i)=> lines[i] += col);

  // Escribir en la línea espejo para coincidir con el diagrama (1ª arriba, 6ª abajo)
  byString.forEach((p, sIdx)=>{
    const num = String(p.f).padStart(pad,' ');
    lines[5 - sIdx] += num;  // espejo
  });

  // Relleno de cuerdas sin nota
  for(let i=0;i<6;i++){
    if(!byString.has(i)){
      lines[5 - i] += "-".repeat(pad);
    }
    lines[5 - i] += "—";
  }
  return lines.join("\n");
}

/* ===============
   Interacciones UI
   =============== */
btnSuggest.addEventListener('click', ()=>{
  const root = rootSel.value;
  const baseString = (shapeSel.value === 'E') ? 0 : 1;
  const suggested = findFretForRoot(root, baseString);
  fretInp.value = suggested;
  render();
});

[rootSel, shapeSel, octaveChk, fretInp].forEach(el=> el.addEventListener('input', render));

/* Init */
buildBoard();
render();
