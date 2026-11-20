/* ---------- EXIF ---------- */
function parseExif(buf){
 const out={};try{
  const v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return out;let off=2;
  while(off<v.byteLength-4){const m=v.getUint16(off);off+=2;const len=v.getUint16(off);
   if(m===0xFFE1&&v.getUint32(off+2)===0x45786966){readTiff(v,off+8,out);return out;}
   if((m&0xFF00)!==0xFF00||m===0xFFDA)break;off+=len;}
 }catch(e){}return out;}
function readTiff(v,t,out){
 const le=v.getUint16(t)===0x4949;const u16=o=>v.getUint16(o,le),u32=o=>v.getUint32(o,le);
 const readIfd=p=>{const n=u16(p),tags={};for(let i=0;i<n;i++){const e=p+2+i*12;tags[u16(e)]={type:u16(e+2),count:u32(e+4),valOff:e+8};}return tags;};
 const sizes={1:1,2:1,3:2,4:4,5:8,7:1};
 const ptr=tag=>((sizes[tag.type]||1)*tag.count<=4)?tag.valOff:t+u32(tag.valOff);
 const rat=o=>u32(o)/u32(o+4);
 const t0=readIfd(t+u32(t+4));
 if(t0[0x8769]){const ex=readIfd(t+u32(t0[0x8769].valOff));const d=ex[0x9003]||ex[0x9004];
  if(d){const p=ptr(d);let s='';for(let i=0;i<d.count-1;i++)s+=String.fromCharCode(v.getUint8(p+i));
   const m=s.match(/^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d)/);if(m)out.date=`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;}}
 if(t0[0x8825]){const g=readIfd(t+u32(t0[0x8825].valOff));
  if(g[2]&&g[4]){const dms=k=>{const p=ptr(g[k]);return rat(p)+rat(p+8)/60+rat(p+16)/3600;};
   let lat=dms(2),lon=dms(4);const ref=k=>String.fromCharCode(v.getUint8(g[k].valOff));
   if(g[1]&&ref(1)==='S')lat=-lat;if(g[3]&&ref(3)==='W')lon=-lon;
   if(isFinite(lat)&&isFinite(lon)&&!(lat===0&&lon===0)){out.lat=lat.toFixed(6);out.lon=lon.toFixed(6);}}}
}
const pad=n=>String(n).padStart(2,'0');
const isoLocal=ms=>{const d=new Date(ms);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const fmtDT=s=>{if(!s)return '';const m=s.match(/^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d):(\d\d))?/);return m?`${m[3]}/${m[2]}/${m[1]}${m[4]?' '+m[4]+':'+m[5]:''}`:s;};
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
