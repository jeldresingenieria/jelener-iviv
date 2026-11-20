/* ---------- Informe Word ---------- */
const b64u8=s=>{const b=atob(s.split(',')[1]||s);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
async function stamped(p,opts){
 const buf=new Uint8Array(await p.blob.arrayBuffer());
 if(!opts.stamp)return {data:buf,w:p.w,h:p.h};
 const url=URL.createObjectURL(p.blob);
 try{const img=await loadImg(url);const c=document.createElement('canvas');c.width=p.w;c.height=p.h;const x=c.getContext('2d');x.drawImage(img,0,0);
  const txt=(p.lat&&p.lon?`Lat ${p.lat}  Lon ${p.lon} (WGS84)`:'Sin coordenadas')+(p.date?'  ·  '+fmtDT(p.date):'');
  const fs=Math.max(14,Math.round(p.w/48));x.font=`600 ${fs}px Arial, sans-serif`;const bh=fs*1.8;
  x.fillStyle='rgba(11,37,69,.78)';x.fillRect(0,p.h-bh,p.w,bh);x.fillStyle='#fff';x.textBaseline='middle';x.fillText(txt,fs*.6,p.h-bh/2);
  const out=await new Promise(r=>c.toBlob(r,'image/jpeg',0.85));return {data:new Uint8Array(await out.arrayBuffer()),w:p.w,h:p.h};
 }finally{URL.revokeObjectURL(url);}
}
async function buildDoc(proj,photosBy,opts){
 const secVisible=k=>secVis(proj,k);
 const activeItems=()=>ITEMS.filter(i=>secVisible(i.s));
 const ST=n=>({na:!!(proj.items[n]&&proj.items[n].na),photos:photosBy[n]||[]});
 const D=docx;const {Document,Paragraph,TextRun,Table,TableRow,TableCell,ImageRun,Header,Footer,AlignmentType,BorderStyle,WidthType,ShadingType,VerticalAlign,HeightRule,PageNumber,TabStopType,LevelFormat,HeadingLevel,PageBreak,TableLayoutType}=D;
 const W=10080,bess=proj.variant==='con',pr=proj.fields;
 const bd=(c=LINE,s=4,st=BorderStyle.SINGLE)=>({style:st,size:s,color:c});
 const allB=(c,s,st)=>({top:bd(c,s,st),bottom:bd(c,s,st),left:bd(c,s,st),right:bd(c,s,st)});
 const run=(t,o={})=>new TextRun({text:t,font:'Arial',size:o.size||18,color:o.color||'222222',bold:o.bold,italics:o.italics});
 const P=(ch,o={})=>new Paragraph({children:Array.isArray(ch)?ch:[ch],alignment:o.align,spacing:{before:o.before||0,after:o.after??60,line:o.line},keepNext:o.keepNext,border:o.border});
 const cell=(paras,o={})=>new TableCell({children:paras,columnSpan:o.span,width:{size:o.w,type:WidthType.DXA},shading:o.fill?{type:ShadingType.CLEAR,fill:o.fill,color:'auto'}:undefined,borders:o.borders||allB(),verticalAlign:o.va||VerticalAlign.CENTER,margins:{top:50,bottom:50,left:100,right:100}});
 const tbl=(w,rows)=>new Table({width:{size:W,type:WidthType.DXA},columnWidths:w,layout:TableLayoutType.FIXED,rows});
 const H1=t=>new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun({text:t,font:'Arial'})]});
 const H2=t=>new Paragraph({heading:HeadingLevel.HEADING_2,children:[new TextRun({text:t,font:'Arial'})]});
 const kp=(a,k=true)=>P(a,{after:0,keepNext:k});
 const val=k=>pr[k]||' ';
 const fieldTable=(pairs)=>{const rows=pairs.map(r=>{const cs=[];r.forEach(([k,l])=>{cs.push(cell([P(run(l,{bold:true,size:16,color:NAVY}),{after:0})],{w:2000,fill:LIGHT}));cs.push(cell([P(run(val(k),{size:17}),{after:0})],{w:3040}));});
   if(r.length===1){cs.pop();cs.push(cell([P(run(val(r[0][0]),{size:17}),{after:0})],{w:8080,span:3}));}
   return new TableRow({cantSplit:true,height:{value:420,rule:HeightRule.AT_LEAST},children:cs});});return tbl([2000,3040,2000,3040],rows);};
 const pairs=a=>{const o=[];for(let i=0;i<a.length;i+=2)o.push(a.slice(i,i+2));return o;};
 const F=Object.fromEntries([...FIELDS,...FIELDS_BESS,...FIELDS_INST].map(([k,l])=>[k,[k,l]]));
 const f=(...ks)=>ks.map(k=>F[k]);
 const AR=1100/(1100*176/676*1.0);const lw=360,lh=Math.round(lw*176/676);
 const body=[];
 body.push(P(new ImageRun({type:'png',data:b64u8(LOGO_FULL),transformation:{width:lw,height:lh}}),{after:300}));
 body.push(P(run('INFORME VISUAL DE INSTALACIÓN Y VERIFICACIÓN (IVIV)',{bold:true,size:36,color:NAVY}),{after:80,line:300}));
 body.push(P(run('Informe de imágenes para la declaración TE-4',{size:26,color:GREYC}),{after:80}));
 body.push(P(run('Generadora residencial fotovoltaica '+(bess?'CON sistema de almacenamiento (BESS)':'SIN sistema de almacenamiento (BESS)'),{bold:true,size:22}),{after:160,border:{bottom:{style:BorderStyle.SINGLE,size:18,color:AMBER,space:8}}}));
 body.push(P(run('Base normativa: '+(bess?'RGR N°01/2024 (§7.3.5 y §8), RGR N°02/2024 y RGR N°06/2024 (sistemas de almacenamiento).':'RGR N°01/2024 (§7.3.5 y §8) y RGR N°02/2024.'),{size:16,color:GREYC,italics:true}),{after:120}));
 body.push(H2('1. Antecedentes del proyecto'));
 body.push(fieldTable(pairs(f('name','fecha','owner','rut','address','comuna','dist','cliente','scr','scrfecha','pfv','pinv','inyec','conv','tipoinst','empl')).concat([[F.coords]])));
 let nn=2;
 if(bess){body.push(H2(nn+++'. Sistema de almacenamiento (BESS)'));body.push(fieldTable(pairs(f('kwh','pbess','quim','marca','nbancos','ubic','isla','gen'))));}
 body.push(H2(nn+'. Instalador eléctrico responsable'));
 body.push(fieldTable(pairs(f('inst','irut','clase','nlic','empresa','tel'))));
 // checklist
 body.push(new Paragraph({children:[new PageBreak()]}));
 body.push(H1('Lista de verificación de imágenes'));
 const cw=[800,5400,1500,1190,1190];
 const rows=[new TableRow({tableHeader:true,cantSplit:true,children:['N°','Imagen','Tipo','Aplica','Incluida'].map((t,i)=>cell([P(run(t,{bold:true,size:15,color:'FFFFFF'}),{after:0,align:i>1?AlignmentType.CENTER:undefined})],{w:cw[i],fill:NAVY}))})];
 const keys=Object.keys(SECS).filter(k=>!SECS[k].bess||bess);
 keys.forEach(k=>{
  const on=secVisible(k);
  rows.push(new TableRow({cantSplit:true,children:[cell([P(run(SECS[k].t+(on?'':'  (no aplica)'),{bold:true,size:15,color:NAVY}),{after:0})],{w:W,span:5,fill:AMBERL})]}));
  if(!on)return;
  ITEMS.filter(i=>i.s===k).forEach(i=>{const st=ST(i.n);const inc=st.photos.length>0;
   rows.push(new TableRow({cantSplit:true,children:[cell([P(run(i.n,{size:15}),{after:0})],{w:cw[0]}),cell([P(run(i.t,{size:15}),{after:0})],{w:cw[1]}),
    cell([P(run(i.o===M?'Mínima':'Respaldo',{size:15,bold:i.o===M,color:i.o===M?NAVY:GREYC}),{after:0,align:AlignmentType.CENTER})],{w:cw[2]}),
    cell([P(run(st.na?'☐':'☒',{size:16}),{after:0,align:AlignmentType.CENTER})],{w:cw[3]}),
    cell([P(run(st.na?'N/A':inc?'☒':'☐ pendiente',{size:inc||st.na?16:13}),{after:0,align:AlignmentType.CENTER})],{w:cw[4]})]}));});
 });
 body.push(tbl(cw,rows));
 // sections
 const maxW=650,maxH=285;
 for(const k of keys){
  if(!secVisible(k))continue;
  const list=ITEMS.filter(i=>i.s===k&&!ST(i.n).na&&(ST(i.n).photos.length||opts.pending));
  const regOn=k==='X'&&(proj.regMotivo||proj.regDetalle);
  if(!list.length&&!regOn)continue;
  body.push(new Paragraph({children:[new PageBreak()]}));
  body.push(H1(SECS[k].t));
  body.push(P(run(SECS[k].n,{size:15,color:GREYC,italics:true}),{after:100,keepNext:true}));
  for(const i of list){
   const st=ST(i.n);const ph=st.photos.length?st.photos:[null];
   for(let idx=0;idx<ph.length;idx++){
    const p=ph[idx];const suf=ph.length>1?`  ·  foto ${idx+1} de ${ph.length}`:'';
    const rA=new TableRow({cantSplit:true,height:{value:440,rule:HeightRule.AT_LEAST},children:[
     cell([kp(run(i.n,{bold:true,size:22,color:NAVY}))],{w:900,fill:AMBER}),
     cell([kp(run(i.t+suf,{bold:true,size:20,color:'FFFFFF'}))],{w:6000,span:4,fill:NAVY}),
     cell([kp(run(i.o===M?'MÍNIMA':'RESPALDO',{bold:true,size:16,color:i.o===M?AMBER:'C9D1DF'})),kp(run(i.ref,{size:14,color:'FFFFFF'}))],{w:3180,fill:NAVY})]});
    const rB=new TableRow({cantSplit:true,children:[cell([kp([run('Debe mostrar: ',{bold:true,size:16,color:NAVY}),run(i.r,{size:16,color:GREYC})])],{w:W,span:6,fill:LIGHT})]});
    let photoPars;
    if(p){const s=await stamped(p,opts);const k2=Math.min(maxW/s.w,maxH/s.h,1);const w=Math.round(s.w*k2),h=Math.round(s.h*k2);
     photoPars=[P(new ImageRun({type:'jpg',data:s.data,transformation:{width:w,height:h}}),{align:AlignmentType.CENTER,after:0,keepNext:true})];}
    else photoPars=[P(run('Pendiente: insertar fotografía aquí',{size:18,color:'8A94A6',bold:true}),{align:AlignmentType.CENTER,after:0,keepNext:true})];
    const rC=new TableRow({cantSplit:true,height:{value:p?400:3700,rule:HeightRule.AT_LEAST},children:[cell(photoPars,{w:W,span:6,borders:p?allB():allB('A0A8B8',6,BorderStyle.DASHED)})]});
    const lab=(l,v)=>kp([run(l+'  ',{size:15,bold:true,color:NAVY}),run(v||'',{size:17})]);
    const rD=new TableRow({cantSplit:true,height:{value:380,rule:HeightRule.AT_LEAST},children:[cell([lab('Latitud:',p&&p.lat)],{w:2600,span:2}),cell([lab('Longitud:',p&&p.lon)],{w:3400,span:2}),cell([lab('Fecha / hora:',p&&fmtDT(p.date))],{w:4080,span:2})]});
    const chk=s=>(p&&p.status===s?'☒ ':'☐ ')+s;
    const rE=new TableRow({cantSplit:true,height:{value:460,rule:HeightRule.AT_LEAST},children:[
     cell([P([run('Observaciones / datos visibles: ',{size:15,bold:true,color:NAVY}),run((p&&p.obs)||'',{size:17})],{after:0})],{w:6000,span:4,va:VerticalAlign.TOP}),
     cell([P([run([chk('Cumple'),chk('No cumple'),chk('N/A')].join('   '),{size:15,color:GREYC})],{after:0})],{w:4080,span:2})]});
    body.push(tbl([900,1700,1700,1700,1700,2380],[rA,rB,rC,rD,rE]));
    body.push(P(run(' ',{size:8}),{after:80}));
   }
  }
  if(regOn){body.push(P(run('Regularización',{bold:true,size:18,color:NAVY}),{before:100,after:60,keepNext:true}));
   body.push(tbl([2400,7680],[['Motivo de la regularización',proj.regMotivo],['Detalle de las modificaciones',proj.regDetalle]].map(([l,v])=>new TableRow({cantSplit:true,height:{value:800,rule:HeightRule.AT_LEAST},children:[cell([P(run(l,{bold:true,size:16,color:NAVY}),{after:0})],{w:2400,fill:LIGHT}),cell([P(run(v||' ',{size:17}),{after:0})],{w:7680})]}))));}
 }
 // cierre
 body.push(new Paragraph({children:[new PageBreak()]}));
 body.push(H1('Cierre del informe'));
 const tot=activeItems().reduce((a,i)=>a+ST(i.n).photos.length,0);
 body.push(P(run(`Total de imágenes incluidas: ${tot}      Fecha de elaboración: ${fmtDT(isoLocal(Date.now())).slice(0,10)}`,{size:18}),{after:200}));
 body.push(tbl([2400,3000,2400,2280],[
  new TableRow({cantSplit:true,height:{value:420,rule:HeightRule.AT_LEAST},children:[cell([P(run('Instalador responsable',{bold:true,size:16,color:NAVY}),{after:0})],{w:2400,fill:LIGHT}),cell([P(run(val('inst'),{size:17}),{after:0})],{w:3000}),cell([P(run('RUT',{bold:true,size:16,color:NAVY}),{after:0})],{w:2400,fill:LIGHT}),cell([P(run(val('irut'),{size:17}),{after:0})],{w:2280})]}),
  new TableRow({cantSplit:true,height:{value:1200,rule:HeightRule.AT_LEAST},children:[cell([P(run('Firma y timbre',{bold:true,size:16,color:NAVY}),{after:0})],{w:2400,fill:LIGHT}),cell([P(run(' ',{size:16}),{after:0})],{w:7680,span:3})]})]));
 const short=bess?'Con BESS':'Sin BESS';
 const hl=44,hw=Math.round(hl*676/176);
 const header=new Header({children:[new Paragraph({tabStops:[{type:TabStopType.RIGHT,position:W}],spacing:{after:0},border:{bottom:{style:BorderStyle.SINGLE,size:12,color:AMBER,space:4}},children:[new ImageRun({type:'png',data:b64u8(LOGO_HEAD),transformation:{width:hw,height:hl}}),new TextRun({text:'\tIVIV · Informe de imágenes TE-4 · '+short,font:'Arial',size:16,color:GREYC})]})]});
 const footer=new Footer({children:[new Paragraph({tabStops:[{type:TabStopType.RIGHT,position:W}],border:{top:{style:BorderStyle.SINGLE,size:4,color:LINE,space:4}},children:[new TextRun({text:'Jel-Ener · Ingeniería eléctrica · Proyectos renovables\tPágina ',font:'Arial',size:15,color:GREYC}),new TextRun({children:[PageNumber.CURRENT],font:'Arial',size:15,color:GREYC}),new TextRun({text:' de ',font:'Arial',size:15,color:GREYC}),new TextRun({children:[PageNumber.TOTAL_PAGES],font:'Arial',size:15,color:GREYC})]})]});
 return new Document({creator:'Jel-Ener',title:'Informe visual de instalación y verificación (IVIV) TE-4 – '+short,
  styles:{default:{document:{run:{font:'Arial',size:18}}},paragraphStyles:[
   {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,run:{font:'Arial',size:30,bold:true,color:NAVY},paragraph:{spacing:{before:120,after:80},keepNext:true,outlineLevel:0,border:{bottom:{style:BorderStyle.SINGLE,size:8,color:AMBER,space:3}}}},
   {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,run:{font:'Arial',size:22,bold:true,color:NAVY},paragraph:{spacing:{before:140,after:80},keepNext:true,outlineLevel:1}}]},
  sections:[{properties:{titlePage:true,page:{size:{width:12240,height:15840},margin:{top:1300,bottom:1000,left:1080,right:1080,header:500,footer:450}}},
   headers:{default:header,first:new Header({children:[new Paragraph({children:[]})]})},footers:{default:footer,first:new Footer({children:[new Paragraph({children:[]})]})},children:body}]});
}
