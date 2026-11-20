'use strict';
/* ===== utilidades ===== */
const $=(s,r=document)=>r.querySelector(s);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function el(tag,attrs,...kids){const e=document.createElement(tag);for(const k in (attrs||{})){const v=attrs[k];if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(k,v===true?'':v);}kids.flat().forEach(c=>{if(c!=null)e.append(c.nodeType?c:document.createTextNode(c));});return e;}
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toastT);toastT=setTimeout(()=>t.style.display='none',5200);}
const ICON_CAM='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const ICON_IMG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/></svg>';
const ICON_BACK='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>';
const secVis=(proj,k)=>{const s=SECS[k];if(s.bess)return proj.variant==='con';if(s.tog)return !!proj.applies[k];return true;};
const fmtDate=ms=>{const d=new Date(ms);return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;};

/* ===== base de datos local (IndexedDB) ===== */
let db;
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open('jelener-iviv',1);
 r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('clients',{keyPath:'id'});d.createObjectStore('projects',{keyPath:'id'});d.createObjectStore('photos',{keyPath:'id'}).createIndex('byProject','projectId');};
 r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
const rq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
const st=(n,m='readonly')=>db.transaction(n,m).objectStore(n);
const dbPut=(n,o)=>rq(st(n,'readwrite').put(o));
const dbGet=(n,id)=>rq(st(n).get(id));
const dbAll=n=>rq(st(n).getAll());
const dbDel=(n,id)=>rq(st(n,'readwrite').delete(id));
const photosOf=pid=>rq(st('photos').index('byProject').getAll(pid));
async function delProject(id){const keys=await rq(st('photos').index('byProject').getAllKeys(id));const tx=db.transaction(['photos','projects'],'readwrite');keys.forEach(k=>tx.objectStore('photos').delete(k));tx.objectStore('projects').delete(id);await new Promise((a,b)=>{tx.oncomplete=a;tx.onerror=()=>b(tx.error);});}
let persistAsked=false;
function askPersist(){if(persistAsked)return;persistAsked=true;try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}}

/* ===== modelos ===== */
const CLIENT_FIELDS=[['name','Nombre del cliente'],['rut','RUT'],['address','Dirección'],['comuna','Comuna / Región'],['dist','Empresa distribuidora'],['cliente','N° de cliente (distribuidora)'],['phone','Teléfono'],['email','Correo'],['notes','Notas']];
const newClient=()=>({id:uid(),name:'',rut:'',address:'',comuna:'',dist:'',cliente:'',phone:'',email:'',notes:'',created:Date.now(),updated:Date.now()});
function newProject(client,title,variant){
 const f={name:title,empresa:'Jel-Ener',fecha:isoLocal(Date.now()).slice(0,10)};
 if(client){Object.assign(f,{owner:client.name,rut:client.rut,address:client.address,comuna:client.comuna,dist:client.dist,cliente:client.cliente});}
 return {id:uid(),clientId:client?client.id:null,title,variant,applies:{V:true,VIII:false,IX:false,X:false},fields:f,items:{},regMotivo:'',regDetalle:'',opts:{stamp:true,pending:false},created:Date.now(),updated:Date.now()};
}

/* ===== GPS del dispositivo ===== */
let lastPos=null;
function getPos(){return new Promise(res=>{if(!navigator.geolocation)return res(null);
 navigator.geolocation.getCurrentPosition(p=>{lastPos={lat:p.coords.latitude.toFixed(6),lon:p.coords.longitude.toFixed(6),t:Date.now()};res(lastPos);},()=>res(null),{enableHighAccuracy:true,timeout:9000,maximumAge:60000});});}

/* ===== sheet (ventana inferior) ===== */
function openSheet(...kids){const s=$('#sheet');s.innerHTML='';s.append(el('div',{class:'pane',role:'dialog','aria-modal':'true'},kids));s.classList.add('on');}
function closeSheet(){const s=$('#sheet');s.classList.remove('on');s.innerHTML='';}

/* ===== enrutador ===== */
let cur=null;      // {proj, photos}
let ptab='datos';
const openSecs=new Set(['II']);
const root=()=>$('#app');
function go(h){location.hash=h;}
async function route(){
 closeSheet();
 const h=location.hash||'#/';const m=h.split('/');
 try{
  if(h.startsWith('#/proyecto/'))return await viewProject(m[2]);
  if(h.startsWith('#/cliente/'))return await viewClient(m[2]);
  if(h.startsWith('#/clientes'))return await viewHome('clientes');
  return await viewHome('proyectos');
 }catch(e){console.error(e);root().replaceChildren(el('div',{class:'wrap'},el('div',{class:'card'},'No se pudo abrir esta pantalla. ',el('a',{href:'#/',text:'Volver al inicio'}))));}
}
function topbar(title,back,right){
 return el('div',{class:'bar'},back?el('button',{class:'iconbtn',type:'button','aria-label':'Volver',html:ICON_BACK,onclick:()=>{typeof back==='function'?back():history.length>1?history.back():go('#/')}}):el('img',{class:'logo',alt:'Jel-Ener',src:LOGO_HEAD}),el('h1',{text:title}),right||null);
}
function navbar(active){
 return el('nav',{class:'nav','aria-label':'Secciones'},el('a',{href:'#/','aria-current':active==='proyectos'?'page':null,text:'Proyectos'}),el('a',{href:'#/clientes','aria-current':active==='clientes'?'page':null,text:'Clientes'}));
}

/* ===== inicio ===== */
let installEvt=null;
async function viewHome(tab){
 cur=null;
 const [projs,clients]=await Promise.all([dbAll('projects'),dbAll('clients')]);
 const byId=Object.fromEntries(clients.map(c=>[c.id,c]));
 const right=installEvt?el('button',{class:'iconbtn',type:'button',text:'Instalar',onclick:async()=>{installEvt.prompt();await installEvt.userChoice;installEvt=null;route();}}):null;
 const wrap=el('div',{class:'wrap'});
 const q=el('input',{class:'inp',type:'search',placeholder:tab==='clientes'?'Buscar cliente…':'Buscar proyecto o cliente…','aria-label':'Buscar'});
 const list=el('div',{class:'list'});
 const draw=()=>{const t=q.value.trim().toLowerCase();list.innerHTML='';
  if(tab==='proyectos'){
   const rows=projs.filter(p=>!t||(p.title+' '+((byId[p.clientId]||{}).name||'')).toLowerCase().includes(t)).sort((a,b)=>b.updated-a.updated);
   if(!rows.length)list.append(el('div',{class:'empty'},projs.length?'Sin resultados.':'Aún no hay proyectos. Toque «Nuevo proyecto» para crear el primero.'));
   rows.forEach(p=>list.append(el('button',{class:'li',type:'button',onclick:()=>go('#/proyecto/'+p.id)},el('div',{class:'grow'},el('div',{class:'t',text:p.title||'(sin nombre)'}),el('div',{class:'s',text:((byId[p.clientId]||{}).name||'Sin cliente')+' · '+(p.variant==='con'?'Con BESS':'Sin BESS')+' · '+fmtDate(p.updated)})),el('span',{class:'chev',text:'›'}))));
  }else{
   const rows=clients.filter(c=>!t||(c.name+' '+c.rut+' '+c.address).toLowerCase().includes(t)).sort((a,b)=>a.name.localeCompare(b.name));
   if(!rows.length)list.append(el('div',{class:'empty'},clients.length?'Sin resultados.':'Aún no hay clientes. Toque «Nuevo cliente».'));
   rows.forEach(c=>{const n=projs.filter(p=>p.clientId===c.id).length;list.append(el('button',{class:'li',type:'button',onclick:()=>go('#/cliente/'+c.id)},el('div',{class:'grow'},el('div',{class:'t',text:c.name||'(sin nombre)'}),el('div',{class:'s',text:[c.comuna,c.phone,n+(n===1?' proyecto':' proyectos')].filter(Boolean).join(' · ')})),el('span',{class:'chev',text:'›'})));});
  }};
 q.addEventListener('input',draw);draw();
 wrap.append(q,list);
 if(tab==='proyectos'){
  const bk=el('div',{class:'card'},el('h3',{text:'Respaldo de datos',style:'font-size:16px;margin-bottom:6px'}),el('p',{class:'hint',text:'Los clientes, proyectos y fotos se guardan solo en este teléfono. Haga un respaldo antes de cambiar de equipo o borrar los datos del navegador.'}),
   el('div',{class:'row'},el('button',{class:'btn ghost small',type:'button',text:'Guardar respaldo',onclick:exportAll}),el('label',{class:'btn ghost small',for:'restore',text:'Restaurar respaldo'}),el('input',{id:'restore',type:'file',accept:'.json,application/json',hidden:true,onchange:e=>{if(e.target.files[0])importAll(e.target.files[0]);e.target.value='';}})));
  wrap.append(bk);
 }
 root().replaceChildren(topbar('Informe de imágenes TE-4',null,right),wrap,navbar(tab),
  el('button',{class:'btn fab',type:'button',text:tab==='clientes'?'+ Nuevo cliente':'+ Nuevo proyecto',onclick:()=>tab==='clientes'?go('#/cliente/nuevo'):sheetNewProject(clients)}));
}
function sheetNewProject(clients,preId){
 const sel=el('select',{id:'npc',class:'inp'},el('option',{value:'',text:'Sin cliente por ahora'}),el('option',{value:'__new',text:'+ Crear cliente nuevo'}),clients.sort((a,b)=>a.name.localeCompare(b.name)).map(c=>el('option',{value:c.id,text:c.name||'(sin nombre)'})));
 if(preId)sel.value=preId;
 const nm=el('input',{id:'npn',class:'inp',placeholder:'Ej.: Planta FV 10 kW, casa López'});
 const vs=el('select',{id:'npv',class:'inp'},el('option',{value:'sin',text:'Sin BESS'}),el('option',{value:'con',text:'Con BESS'}));
 openSheet(el('h2',{text:'Nuevo proyecto'}),el('label',{class:'lab',for:'npc'},'Cliente',sel),el('label',{class:'lab',for:'npn'},'Nombre del proyecto',nm),el('label',{class:'lab',for:'npv'},'Tipo de informe',vs),
  el('div',{class:'row'},el('button',{class:'btn grow',type:'button',text:'Crear proyecto',onclick:async()=>{
    if(sel.value==='__new'){closeSheet();return go('#/cliente/nuevo');}
    const c=clients.find(x=>x.id===sel.value)||null;const p=newProject(c,nm.value.trim()||'Proyecto sin nombre',vs.value);await dbPut('projects',p);askPersist();go('#/proyecto/'+p.id);}}),
   el('button',{class:'btn ghost',type:'button',text:'Cancelar',onclick:closeSheet})));
}

/* ===== clientes ===== */
async function viewClient(id){
 cur=null;const isNew=id==='nuevo';let c=isNew?newClient():await dbGet('clients',id);
 if(!c){return go('#/clientes');}
 let saved=!isNew;let t;
 const save=async()=>{c.updated=Date.now();await dbPut('clients',c);saved=true;askPersist();};
 const fields=el('div',{class:'fields'});
 CLIENT_FIELDS.forEach(([k,l])=>{const ta=k==='notes';const i=el(ta?'textarea':'input',{id:'c_'+k,rows:ta?'3':null,type:ta?null:k==='email'?'email':k==='phone'?'tel':'text'});i.value=c[k]||'';i.addEventListener('input',()=>{c[k]=i.value;clearTimeout(t);t=setTimeout(()=>{if(c.name.trim()||saved)save();},400);});fields.append(el('label',{for:'c_'+k},l,i));});
 const wrap=el('div',{class:'wrap'},el('div',{class:'card'},fields));
 if(!isNew){
  const projs=(await dbAll('projects')).filter(p=>p.clientId===c.id).sort((a,b)=>b.updated-a.updated);
  wrap.append(el('div',{class:'card'},el('h3',{text:'Proyectos del cliente',style:'font-size:16px;margin-bottom:8px'}),
   el('div',{class:'list'},projs.length?projs.map(p=>el('button',{class:'li',type:'button',onclick:()=>go('#/proyecto/'+p.id)},el('div',{class:'grow'},el('div',{class:'t',text:p.title}),el('div',{class:'s',text:(p.variant==='con'?'Con BESS':'Sin BESS')+' · '+fmtDate(p.updated)})),el('span',{class:'chev',text:'›'}))):[el('div',{class:'hint',text:'Este cliente aún no tiene proyectos.'})]),
   el('div',{class:'row',style:'margin-top:10px'},el('button',{class:'btn small',type:'button',text:'+ Nuevo proyecto para este cliente',onclick:async()=>sheetNewProject(await dbAll('clients'),c.id)}))));
  wrap.append(el('button',{class:'btn bad',type:'button',text:'Eliminar cliente',onclick:async()=>{if(!confirm('¿Eliminar este cliente? Sus proyectos se conservan, sin cliente asignado.'))return;for(const p of projs){p.clientId=null;await dbPut('projects',p);}await dbDel('clients',c.id);go('#/clientes');}}));
 }else{wrap.append(el('button',{class:'btn',type:'button',text:'Guardar cliente',onclick:async()=>{if(!c.name.trim()){toast('Escriba el nombre del cliente.');return;}await save();toast('Cliente guardado.');go('#/cliente/'+c.id);}}));}
 root().replaceChildren(topbar(isNew?'Nuevo cliente':(c.name||'Cliente'),()=>go('#/clientes')),wrap);
}

/* ===== proyecto ===== */
const activeItems=()=>ITEMS.filter(i=>secVis(cur.proj,i.s));
const photosOfItem=n=>cur.photos.filter(p=>p.n===n);
const itemNA=n=>!!(cur.proj.items[n]&&cur.proj.items[n].na);
function stats(){
 let min=0,minOk=0,noGps=0,total=0;const missing=[];
 activeItems().forEach(i=>{if(itemNA(i.n))return;const ph=photosOfItem(i.n);if(i.o===M){min++;if(ph.length)minOk++;else missing.push(i);}ph.forEach(p=>{total++;if(!(p.lat&&p.lon))noGps++;});});
 return {min,minOk,noGps,total,missing};
}
let saveT;
function saveProj(){cur.proj.updated=Date.now();clearTimeout(saveT);saveT=setTimeout(()=>dbPut('projects',cur.proj),300);}
async function viewProject(id){
 const proj=await dbGet('projects',id);if(!proj)return go('#/');
 const photos=await photosOf(id);photos.forEach(p=>p.url=URL.createObjectURL(p.blob));
 if(cur&&cur.photos)cur.photos.forEach(p=>p.url&&URL.revokeObjectURL(p.url));
 cur={proj,photos};ptab=(location.hash.split('/')[3])||ptab;renderProject();
}
function renderProject(){
 const {proj}=cur;
 const s=stats();
 const pill=el('span',{class:'pill '+(s.minOk===s.min?'ok':'warn'),id:'pstat',text:`Mín. ${s.minOk}/${s.min}`});
 const tabs=el('div',{class:'tabs',role:'tablist'},[['datos','Datos'],['fotos','Fotos'],['informe','Informe']].map(([k,l])=>el('button',{role:'tab','aria-selected':String(ptab===k),text:l,onclick:()=>{ptab=k;renderProject();window.scrollTo(0,0);}})));
 const body=ptab==='datos'?tabDatos():ptab==='fotos'?tabFotos():tabInforme();
 root().replaceChildren(topbar(proj.title||'Proyecto',()=>go('#/'),pill),tabs,body);
}
function refreshPill(){const s=stats();const p=$('#pstat');if(p){p.className='pill '+(s.minOk===s.min?'ok':'warn');p.textContent=`Mín. ${s.minOk}/${s.min}`;}}
function tabDatos(){
 const {proj}=cur;const wrap=el('div',{class:'wrap'});
 const nm=el('input',{id:'p_title',value:proj.title});nm.addEventListener('input',()=>{proj.title=nm.value;saveProj();});
 const seg=el('div',{class:'seg',role:'group','aria-label':'Tipo de informe'},[['sin','Sin BESS'],['con','Con BESS']].map(([v,l])=>el('button',{type:'button','aria-pressed':String(proj.variant===v),text:l,onclick:()=>{proj.variant=v;saveProj();renderProject();}})));
 const tg=el('div',{});Object.keys(SECS).filter(k=>SECS[k].tog).forEach(k=>{const cb=el('input',{type:'checkbox',id:'ap'+k});cb.checked=!!proj.applies[k];cb.addEventListener('change',()=>{proj.applies[k]=cb.checked;saveProj();refreshPill();});tg.append(el('label',{class:'chk',for:'ap'+k},cb,el('span',{text:SECS[k].tog})));});
 wrap.append(el('div',{class:'card'},el('div',{class:'fields'},el('label',{for:'p_title'},'Nombre del proyecto',nm)),el('div',{class:'sub',text:'Tipo de informe'}),seg,el('div',{class:'sub',text:'Secciones opcionales'}),tg));
 const grp=(title,list)=>{const g=el('div',{class:'fields'});list.forEach(([k,l,t])=>{const i=el('input',{id:'f_'+k,type:t||'text'});i.value=proj.fields[k]||'';i.addEventListener('input',()=>{proj.fields[k]=i.value;saveProj();});g.append(el('label',{for:'f_'+k},l,i));});return el('div',{class:'card'},el('div',{class:'sub',style:'margin-top:0',text:title}),g);};
 wrap.append(grp('Antecedentes del proyecto',FIELDS));
 if(proj.variant==='con')wrap.append(grp('Sistema de almacenamiento (BESS)',FIELDS_BESS));
 wrap.append(grp('Instalador eléctrico responsable',FIELDS_INST));
 if(proj.variant==='con')wrap.append(el('p',{class:'hint',text:'Los proyectos con baterías solo pueden ser declarados por instaladores clase A o B (RGR 01/2024 §6).'}));
 wrap.append(el('button',{class:'btn bad',type:'button',text:'Eliminar proyecto',onclick:async()=>{if(!confirm('¿Eliminar este proyecto y todas sus fotos? No se puede deshacer.'))return;await delProject(proj.id);cur=null;go('#/');}}));
 return wrap;
}
const camIn=()=>$('#in_cam'),galIn=()=>$('#in_gal');
let target=null;
function tabFotos(){
 const {proj}=cur;const wrap=el('div',{class:'wrap'});
 wrap.append(el('p',{class:'note',text:'Saque las fotos con «Tomar foto». Active la ubicación del teléfono para que cada imagen quede georreferenciada (WGS84).'}));
 Object.keys(SECS).filter(k=>secVis(proj,k)).forEach(k=>{
  const its=ITEMS.filter(i=>i.s===k);
  const done=its.filter(i=>photosOfItem(i.n).length||itemNA(i.n)).length;
  const d=el('details',{class:'sec',id:'sec'+k});if(openSecs.has(k))d.open=true;
  d.addEventListener('toggle',()=>{d.open?openSecs.add(k):openSecs.delete(k);});
  d.append(el('summary',{},el('span',{text:SECS[k].t}),el('span',{class:'pill '+(done===its.length?'ok':'warn'),style:'margin-left:auto',id:'sc'+k,text:`${done}/${its.length}`})));
  const b=el('div',{class:'sec-body'});
  if(SECS[k].note)b.append(el('p',{class:'note',text:SECS[k].note}));
  its.forEach(i=>b.append(itemEl(i)));
  if(k==='X'){const m=el('textarea',{id:'regM',rows:'3',class:'inp',placeholder:'Motivo de la regularización (si aplica)'});m.value=proj.regMotivo;m.addEventListener('input',()=>{proj.regMotivo=m.value;saveProj();});const dt=el('textarea',{id:'regD',rows:'3',class:'inp',placeholder:'Detalle de las modificaciones'});dt.value=proj.regDetalle;dt.addEventListener('input',()=>{proj.regDetalle=dt.value;saveProj();});b.append(m,dt);}
  d.append(b);wrap.append(d);
 });
 return wrap;
}
function itemEl(i){const e=el('div',{class:'item','data-n':i.n});fillItem(e,i);return e;}
function refreshItem(n){const e=document.querySelector(`.item[data-n="${n}"]`);if(e)fillItem(e,ITEMS.find(x=>x.n===n));
 const i=ITEMS.find(x=>x.n===n);const its=ITEMS.filter(x=>x.s===i.s);const done=its.filter(x=>photosOfItem(x.n).length||itemNA(x.n)).length;const sc=$('#sc'+i.s);if(sc){sc.textContent=`${done}/${its.length}`;sc.className='pill '+(done===its.length?'ok':'warn');}refreshPill();}
function fillItem(e,i){
 const na=itemNA(i.n),ph=photosOfItem(i.n);e.innerHTML='';e.className='item '+(na?'na':ph.length?'done':'pending');
 e.append(el('div',{class:'ih'},el('span',{class:'n',text:i.n}),el('span',{class:'t',text:i.t}),el('span',{class:'tag '+(i.o===M?'m':'c'),text:i.o===M?'MÍNIMA':'RESPALDO'})));
 const b=el('div',{class:'ib'});
 b.append(el('details',{},el('summary',{text:'Qué debe mostrar'}),el('p',{class:'req',text:i.r}),el('div',{class:'ref',text:i.ref})));
 b.append(el('div',{class:'row'},
  el('button',{class:'btn grow',type:'button',html:ICON_CAM+'<span>Tomar foto</span>',onclick:()=>{target=i.n;getPos();camIn().click();}}),
  el('button',{class:'btn ghost',type:'button',html:ICON_IMG+'<span>Galería</span>',onclick:()=>{target=i.n;getPos();galIn().click();}})));
 if(ph.length){b.append(el('div',{class:'thumbs'},ph.sort((a,c)=>a.added-c.added).map(p=>el('button',{class:'thumb',type:'button','aria-label':'Editar foto de '+i.n,onclick:()=>sheetPhoto(p,i)},el('img',{src:p.url,alt:''}),el('i',{class:(p.lat&&p.lon)?'y':'n',text:(p.lat&&p.lon)?'GPS':'sin GPS'})))));}
 const cb=el('input',{type:'checkbox',id:'na'+i.n});cb.checked=na;cb.addEventListener('change',()=>{cur.proj.items[i.n]={na:cb.checked};saveProj();refreshItem(i.n);});
 b.append(el('label',{class:'chk',for:'na'+i.n},cb,el('span',{text:'No aplica a esta instalación'})));
 e.append(b);
}
async function downscaleBlob(file,max){
 const url=URL.createObjectURL(file);try{const img=await loadImg(url);let w=img.naturalWidth,h=img.naturalHeight;const k=Math.min(1,max/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.82));return {blob,w,h};}finally{URL.revokeObjectURL(url);}
}
async function addFiles(n,files){
 if(!cur||!n)return;let bad=0,noGps=0,added=0;
 for(const f of files){
  if(!/^image\//.test(f.type)&&!/\.(jpe?g|png|webp)$/i.test(f.name)){bad++;continue;}
  try{
   const ex=parseExif(await f.arrayBuffer());const d=await downscaleBlob(f,1600);
   let lat=ex.lat||'',lon=ex.lon||'',src=ex.lat?'foto':'';
   const fresh=Date.now()-(f.lastModified||0)<10*60*1000;
   if(!lat&&fresh){const pos=(lastPos&&Date.now()-lastPos.t<10*60*1000)?lastPos:await getPos();if(pos){lat=pos.lat;lon=pos.lon;src='dispositivo';}}
   const p={id:uid(),projectId:cur.proj.id,n,blob:d.blob,w:d.w,h:d.h,lat,lon,src,date:ex.date||isoLocal(f.lastModified||Date.now()),obs:'',status:'',name:f.name,added:Date.now()+added};
   await dbPut('photos',p);p.url=URL.createObjectURL(p.blob);cur.photos.push(p);added++;if(!lat)noGps++;
  }catch(e){console.error(e);bad++;}
 }
 cur.proj.items[n]={na:false};saveProj();askPersist();refreshItem(n);
 if(bad)toast(bad+' archivo(s) no se pudieron leer. Use JPG o PNG.');
 else if(noGps)toast(noGps+' foto(s) sin coordenadas. Ábralas y escríbalas o use «Usar mi ubicación actual».');
}
function sheetPhoto(p,i){
 const fld=(id,label,type,key,extra)=>{const inp=el(type==='textarea'?'textarea':'input',Object.assign({id,class:'inp',rows:type==='textarea'?'3':null,type:type==='textarea'?null:type},extra||{}));inp.value=p[key]||'';inp.addEventListener('input',()=>{p[key]=inp.value;if(key==='lat'||key==='lon')p.src='manual';touch();});return el('label',{class:'lab',for:id},label,inp);};
 let t;const touch=()=>{clearTimeout(t);t=setTimeout(()=>dbPut('photos',{...p,url:undefined}),300);};
 const sel=el('select',{id:'ph_st',class:'inp'},[['','Estado…'],['Cumple','Cumple'],['No cumple','No cumple'],['N/A','N/A']].map(([v,l])=>el('option',{value:v,text:l})));sel.value=p.status;sel.addEventListener('change',()=>{p.status=sel.value;touch();});
 const latF=fld('ph_lat','Latitud (WGS84)','text','lat',{inputmode:'decimal',placeholder:'-33.456789'}),lonF=fld('ph_lon','Longitud (WGS84)','text','lon',{inputmode:'decimal',placeholder:'-70.654321'});
 const srcTxt={foto:'Coordenadas leídas de la foto',dispositivo:'Coordenadas del teléfono al agregar la foto',manual:'Coordenadas ingresadas a mano','':'Sin coordenadas'};
 openSheet(el('h2',{text:i.n+' · '+i.t}),el('img',{class:'big',src:p.url,alt:'Foto'}),el('div',{class:'hint',text:srcTxt[p.src||'']}),
  el('div',{class:'fields'},latF,lonF),
  el('button',{class:'btn ghost small',type:'button',text:'Usar mi ubicación actual',onclick:async()=>{toast('Buscando ubicación…');const pos=await getPos();if(!pos){toast('No se pudo obtener la ubicación. Active el GPS y permita el acceso.');return;}p.lat=pos.lat;p.lon=pos.lon;p.src='dispositivo';touch();$('#ph_lat').value=p.lat;$('#ph_lon').value=p.lon;toast('Ubicación aplicada.');}}),
  el('div',{class:'fields'},fld('ph_date','Fecha y hora','datetime-local','date'),el('label',{class:'lab',for:'ph_st'},'Estado',sel),fld('ph_obs','Observaciones / datos visibles','textarea','obs')),
  el('div',{class:'row'},el('button',{class:'btn grow',type:'button',text:'Listo',onclick:async()=>{await dbPut('photos',{...p,url:undefined});closeSheet();refreshItem(i.n);}}),
   el('button',{class:'btn bad',type:'button',text:'Eliminar',onclick:async()=>{if(!confirm('¿Eliminar esta foto de la app?'))return;await dbDel('photos',p.id);URL.revokeObjectURL(p.url);cur.photos=cur.photos.filter(x=>x.id!==p.id);closeSheet();refreshItem(i.n);}})));
}
function tabInforme(){
 const {proj}=cur;const s=stats();const wrap=el('div',{class:'wrap'});
 const ul=el('ul',{class:'issues'});
 if(!s.missing.length&&!s.noGps)ul.append(el('li',{class:'g',text:'Todos los puntos mínimos tienen foto y todas las fotos tienen coordenadas.'}));
 s.missing.slice(0,6).forEach(i=>ul.append(el('li',{class:'w',text:'Falta foto mínima: '+i.n+' '+i.t})));
 if(s.missing.length>6)ul.append(el('li',{class:'w',text:'y '+(s.missing.length-6)+' puntos mínimos más sin foto.'}));
 if(s.noGps)ul.append(el('li',{class:'w',text:s.noGps+' foto(s) sin latitud/longitud. La RGR 01/2024 §7.3.5 exige coordenadas WGS84 en cada imagen.'}));
 const o=(k,l)=>{const cb=el('input',{type:'checkbox',id:'o_'+k});cb.checked=proj.opts[k];cb.addEventListener('change',()=>{proj.opts[k]=cb.checked;saveProj();});return el('label',{class:'chk',for:'o_'+k},cb,el('span',{text:l}));};
 wrap.append(el('div',{class:'card'},el('div',{class:'row',style:'margin-bottom:10px'},el('span',{class:'pill '+(s.minOk===s.min?'ok':'warn'),text:`Mínimas ${s.minOk}/${s.min}`}),el('span',{class:'pill',style:'background:#e8ecf3;color:var(--navy)',text:s.total+' fotos'})),ul),
  el('div',{class:'card'},o('stamp','Estampar coordenadas y fecha sobre cada foto'),o('pending','Incluir tarjetas vacías para los puntos sin foto')),
  el('button',{class:'btn',id:'gen',type:'button',text:'Generar y descargar Word',onclick:()=>generar(false)}),
  el('button',{class:'btn dark',id:'shr',type:'button',text:'Generar y compartir',onclick:()=>generar(true)}),
  el('p',{class:'hint',text:'Las fotos se procesan en el teléfono. Para obtener un PDF, abra el Word y use «Guardar como PDF».'}));
 return wrap;
}
const safeName=s=>(s||'proyecto').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w\-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,50)||'proyecto';
async function generar(share){
 const g=$('#gen'),sh=$('#shr');g.disabled=sh.disabled=true;const t0=g.textContent;g.textContent='Generando…';
 try{
  const {proj,photos}=cur;const by={};photos.forEach(p=>(by[p.n]=by[p.n]||[]).push(p));Object.values(by).forEach(a=>a.sort((x,y)=>x.added-y.added));
  const doc=await buildDoc(proj,by,proj.opts);const blob=await docx.Packer.toBlob(doc);
  const name=`IVIV_TE4_${proj.variant==='con'?'ConBESS':'SinBESS'}_${safeName(proj.title)}.docx`;
  const file=new File([blob],name,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  if(share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:name});return;}catch(e){if(e&&e.name==='AbortError')return;}}
  else if(share)toast('Este teléfono no permite compartir archivos desde la app. Se descargará el Word.');
  const a=el('a',{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);toast('Word generado. Búsquelo en Descargas.');
 }catch(e){console.error(e);toast('No se pudo generar el informe: '+(e&&e.message||e));}
 finally{g.disabled=sh.disabled=false;g.textContent=t0;}
}

/* ===== respaldo ===== */
const blobToB64=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b);});
async function exportAll(){
 try{toast('Preparando respaldo…');const [clients,projects,photos]=await Promise.all([dbAll('clients'),dbAll('projects'),dbAll('photos')]);
  const ph=[];for(const p of photos){ph.push({...p,url:undefined,blob:await blobToB64(p.blob)});}
  const blob=new Blob([JSON.stringify({v:1,clients,projects,photos:ph})],{type:'application/json'});
  const a=el('a',{href:URL.createObjectURL(blob),download:`respaldo_jelener_${isoLocal(Date.now()).slice(0,10)}.json`});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);toast('Respaldo guardado en Descargas.');
 }catch(e){toast('No se pudo crear el respaldo.');}
}
async function importAll(file){
 try{const d=JSON.parse(await file.text());if(!d||d.v!==1)throw 0;
  for(const c of d.clients)await dbPut('clients',c);for(const p of d.projects)await dbPut('projects',p);
  for(const p of d.photos){p.blob=await (await fetch(p.blob)).blob();await dbPut('photos',p);}
  toast('Respaldo restaurado.');route();
 }catch(e){toast('El archivo no es un respaldo válido.');}
}

/* ===== arranque ===== */
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;if(!location.hash.startsWith('#/proyecto')&&!location.hash.startsWith('#/cliente/'))route();});
document.addEventListener('DOMContentLoaded',async()=>{
 try{db=await openDB();}catch(e){root().replaceChildren(el('div',{class:'wrap'},el('div',{class:'card'},'Este navegador no permite guardar datos locales. Abra la app en Chrome.')));return;}
 $('#sheet').addEventListener('click',e=>{if(e.target.id==='sheet')closeSheet();});
 camIn().addEventListener('change',e=>{const f=[...e.target.files];e.target.value='';addFiles(target,f);});
 galIn().addEventListener('change',e=>{const f=[...e.target.files];e.target.value='';addFiles(target,f);});
 window.addEventListener('hashchange',route);
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
 route();
});
