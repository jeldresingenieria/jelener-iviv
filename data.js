'use strict';
const NAVY='0B2545',AMBER='F5A800',GREYC='3B4A63',LIGHT='F3F5F8',AMBERL='FFF4D6',LINE='BFC7D5';
const SECS={
 I:{t:'I. Datos generales',n:'RGR 01/2024 §8, I'},
 II:{t:'II. Equipos de generación',n:'RGR 01/2024 §8, II'},
 III:{t:'III. Equipos de conversión',n:'RGR 01/2024 §8, III'},
 IV:{t:'IV. Tableros eléctricos',n:'RGR 01/2024 §8, IV'},
 V:{t:'V. Protecciones eléctricas',n:'RGR 01/2024 §8, V',tog:'Hay protecciones RI / limitación / potencia inversa / acoplamiento',note:'Según corresponda: marque «No aplica» en las que no existan en la instalación.'},
 VI:{t:'VI. Sistema de puesta a tierra',n:'RGR 01/2024 §8, VI',note:'Sistema nuevo: construcción, uniones, camarilla y valores de medición. Sistema existente: camarillas, puntos accesibles y valores de medición.'},
 VII:{t:'VII. Equipos de almacenamiento (BESS)',n:'RGR 01/2024 §8, VII · RGR 06/2024',bess:true},
 VIII:{t:'VIII. Sistemas fotovoltaicos flotantes',n:'RGR 01/2024 §8, VIII',tog:'Instalación flotante'},
 IX:{t:'IX. Instalaciones en techumbres',n:'RGR 01/2024 §8, IX · RGR 02/2024',tog:'Instalación en techumbre ≥ 10 kW',note:'≥ 30 kW: acceso, pasillo técnico, cuerda de vida y vía de tránsito. Entre 10 y 30 kW: acceso y cuerda de vida (RGR 02/2024). Eximición posible si se cumplen las condiciones de RGR 02/2024, p. 17.'},
 X:{t:'X. Casos especiales',n:'RGR 01/2024 §8, X',tog:'Instalación múltiple, EGPC o regularización'}
};
const M='M',C='C';
const ITEMS=[
 ['I','1.1','Numeración de la propiedad y fachada','Numeración de la propiedad y fachada del inmueble.',M,'RGR 01 §8·I.a'],
 ['I','1.2','Equipo de medida con placa de advertencia','Equipo de medida con la placa «PRECAUCIÓN: ESTA PROPIEDAD CUENTA CON UN SISTEMA DE GENERACIÓN FOTOVOLTAICA» (mín. 70×40 mm, letra mín. 5 mm). La instrucción de lectura la instala la distribuidora en el protocolo de conexión.',C,'RGR 02 §18'],
 ['II','2.1','Unidad de generación: vista general','Vista general de los módulos fotovoltaicos instalados (todos los arreglos).',M,'RGR 01 §8·II.a'],
 ['II','2.2','Placa característica del módulo FV','Placa característica del módulo fotovoltaico, legible.',M,'RGR 01 §8·II.a'],
 ['II','2.3','Método de aterrizaje de estructura y módulos','Conexión de la estructura y partes metálicas a la tierra de protección.',M,'RGR 01 §8·II.a · RGR 02 §24.3.5'],
 ['II','2.4','Señalética de seguridad FV','Señalética de seguridad (mín. 100×200 mm, letra mín. 10 mm) cerca de los paneles, en la estructura o en el acceso.',M,'RGR 01 §8·II.a · RGR 02 Anexo 7'],
 ['II','2.5','Fijación de estructura y módulos','Fijación de la estructura y de los módulos a ella; módulos sin daños.',C,'RGR 02 §24.3.2–24.3.4'],
 ['II','2.6','Conexiones CC, conectores y rotulación de strings','Conectores MC4 o equivalente (sin empalmes retorcidos ni regletas en CC), conductor fotovoltaico (H1Z2Z2-K o equivalente) y rotulación indeleble del N° de string en polos + y −.',C,'RGR 02 §9, §18'],
 ['II','2.7','Canalización CC y cajas de conexión','Bandejas con tapa o cajas de derivación, protección UV de conductores, junction box con placa de identificación y etiqueta de peligro (si aplica).',C,'RGR 02 §9, §18'],
 ['III','3.1','Inversor / microinversores: montaje y señalética','Inversor o microinversores instalados, con su señalética y rotulación.',M,'RGR 01 §8·III.a'],
 ['III','3.2','Inversor: perfil de red y N° de serie','Placa del inversor y visualización del perfil de red y del número de serie (display, dispositivo móvil u otra interfaz).',M,'RGR 01 §8·III.a'],
 ['III','3.3','Condiciones de montaje del inversor','Altura de montaje (0,60 m a 2,0 m sobre piso terminado), espacio mínimo de 15 cm a cada lado, IP55 y protección solar si está a la intemperie. Excepciones: microinversores y según fabricante.',C,'RGR 02 p. 30'],
 ['III','3.4','Procedimiento de apagado de emergencia','Procedimiento abreviado de apagado junto al inversor (microinversores: en el tablero FV), letra mín. 6 mm.',C,'RGR 02 §18'],
 ['IV','4.1','Tablero con las protecciones del sistema de generación','Tablero abierto: capacidad, clase y tipo de cada protección, rotulación y cableado interior claramente visibles.',M,'RGR 01 §8·IV.a'],
 ['IV','4.2','Punto de inyección del sistema de generación','Barra de distribución dentro del tablero donde se inyecta la generación, correctamente señalizada y diferenciada de las demás barras.',M,'RGR 01 §8·IV.b · RGR 02 §18'],
 ['IV','4.3','Placa de identificación del tablero FV','Placa con nombre del tablero, corriente y tensión de operación CC, tensión máxima del sistema CC, potencia máxima CA e indicación de isla interna (SI/NO). Microinversores: cantidad de microinversores.',C,'RGR 02 §18'],
 ['IV','4.4','Tablero general y protecciones diferenciales','Tablero general (existente o nuevo) con la protección diferencial (tipo A o B) y su sensibilidad.',C,'RGR 01 Anexos 2.1 / 2.2'],
 ['V','5.1','Sistema de limitación de inyección','Ubicación dentro de la instalación y valores de ajuste.',M,'RGR 01 §8·V.a'],
 ['V','5.2','Protección de potencia inversa','Transformadores de corriente, instrumentos de medición y actuadores, junto a los valores de ajuste.',M,'RGR 01 §8·V.b'],
 ['V','5.3','Protección RI centralizada','Ubicación, valores ajustados y cableado de control hacia el interruptor de acoplamiento.',M,'RGR 01 §8·V.c'],
 ['V','5.4','Interruptor de acoplamiento','Ubicación y valores nominales de corriente.',M,'RGR 01 §8·V.d'],
 ['V','5.5','Tablero de punto de conexión','Placa de identificación con las protecciones que contiene y cerradura apta para sello de la distribuidora.',C,'RGR 02 §18'],
 ['VI','6.1','Puesta a tierra: construcción y uniones','Construcción del sistema nuevo y sus uniones (en sistemas existentes, marque «No aplica»).',M,'RGR 01 §8·VI.a'],
 ['VI','6.2','Puesta a tierra: camarilla de registro','Camarilla de registro o punto accesible (sistema nuevo o existente).',M,'RGR 01 §8·VI.a/b'],
 ['VI','6.3','Puesta a tierra: valor de medición','Instrumento y lectura de la medición de resistencia de puesta a tierra, ambos visibles.',M,'RGR 01 §8·VI.a/b'],
 ['VII','7.1','Baterías: placa característica','Placa característica con química, marca, modelo, capacidad y tensión de operación.',M,'RGR 01 §8·VII.a'],
 ['VII','7.2','Gabinete o carcasa: anclaje y aterrizaje','Gabinete o carcasa del BESS, con su método de anclaje y aterrizaje.',M,'RGR 01 §8·VII.b'],
 ['VII','7.3','Protecciones eléctricas del BESS','Fusibles, disyuntores, BMS, etc., mostrando valores nominales y clases CC.',M,'RGR 01 §8·VII.c'],
 ['VII','7.4','Canalización de conductores del BESS','Canalización de los conductores del BESS (CC y CA).',M,'RGR 01 §8·VII.d'],
 ['VII','7.5','Placa de identificación en tableros CC / baterías','Capacidad nominal (kWh), química, corriente de carga máx. (A), tensión máx. CC (V), corriente máx. de operación CC (A), generador adicional (SI/NO) e isla interna (SI/NO); más etiqueta de peligro.',C,'RGR 06 §15'],
 ['VII','7.6','Señalética de apagado del BESS','Procedimiento de apagado permanente, junto al PCE y visible desde el equipo a operar, con teléfono de emergencia y advertencia de puerto de almacenamiento del inversor energizado.',C,'RGR 06 §15'],
 ['VII','7.7','Rotulación de polos y de bancos de baterías','Polos «+» y «−» rotulados en los alimentadores del banco; numeración de bancos (p. ej. «Banco 1 de N») y de los dispositivos de desconexión.',C,'RGR 06 §15'],
 ['VII','7.8','Placa de advertencia del sistema de baterías','Placa «PRECAUCIÓN: ESTA PROPIEDAD CUENTA CON UN SISTEMA DE ALMACENAMIENTO DE ENERGÍA A TRAVÉS DE BATERÍAS (PLOMO ÁCIDO O LITIO)» junto a la unidad de medida y/o al tablero general (mín. 70×40 mm, letra mín. 5 mm).',C,'RGR 06 §15'],
 ['VII','7.9','Recinto, sala o caseta del BESS (si aplica)','Letrero «Peligro Área Restringida» en puertas y diagrama unilineal actualizado, visible y protegido (requisito según punto 7.10 de RGR 06).',C,'RGR 06 §15'],
 ['VII','7.10','Inversor bidireccional y ATS (si aplica)','Puertos numerados e identificados y tablero de transferencia automática (ATS) correctamente señalizado.',C,'RGR 01 §7.3.1.3.3'],
 ['VIII','8.1','Sistema de flotadores y soportes','Flotadores y sistema de soportes.',M,'RGR 01 §8·VIII.a'],
 ['VIII','8.2','Canalización','Canalizaciones sobre flotadores, sin tramos sumergidos.',M,'RGR 01 §8·VIII.b · RGR 02 §23.11'],
 ['VIII','8.3','Plataforma o pasillo de acceso a los módulos','Pasillo de flotadores (ancho mín. 1 m), con pasamanos y piso antideslizante; plantas > 100 kW: al menos dos accesos.',M,'RGR 01 §8·VIII.c · RGR 02 §23.13'],
 ['VIII','8.4','Anclaje y soporte de la planta flotante','Sistema de anclaje y soporte de la planta.',M,'RGR 01 §8·VIII.d'],
 ['IX','9.1','Infraestructura de acceso, pasillo técnico y cuerda de vida','Infraestructura de acceso, pasillo técnico, cuerda de vida y vía de tránsito.',M,'RGR 01 §8·IX.a · RGR 02 p. 17'],
 ['IX','9.2','Señalización de áreas de tránsito seguro','Delimitación con pintura o señalética de las áreas de tránsito seguro y mantención (techumbre plana o inclinada).',M,'RGR 01 §8·IX.b'],
 ['IX','9.3','Respaldo de exención (si aplica)','Evidencia de inclinación ≤ 5°, cubierta rígida transitable y desplazamiento seguro; se justifica además en la memoria explicativa.',M,'RGR 01 §8·IX.c · RGR 02 p. 17'],
 ['IX','9.4','Carport: altura máxima y protección de estructura','Señalética de altura máxima y elementos que protejan la estructura de soporte en el uso normal del estacionamiento.',C,'RGR 02 p. 17'],
 ['X','10.1','Instalación múltiple: identificación','Imágenes diferenciadas e identificadas por vivienda o tecnología de generación (puede subir varias fotos).',M,'RGR 01 §8·X.a'],
 ['X','10.2','EGPC: N° de condominio / recinto de la unidad de medida','Imagen del N° del condominio, recinto o lugar donde está la unidad de medida de uso exclusivo.',M,'RGR 01 §8·X.b'],
 ['X','10.3','Regularización: evidencia de la modificación','Imágenes de los ajustes hechos en la instalación.',M,'RGR 01 §8·X.c']
].map(([s,n,t,r,o,ref])=>({s,n,t,r,o,ref}));
const FIELDS=[
 ['name','Nombre del proyecto'],['fecha','Fecha de inspección','date'],['owner','Propietario / mandante'],['rut','RUT propietario'],
 ['address','Dirección de la instalación'],['comuna','Comuna / Región'],['dist','Empresa distribuidora'],['cliente','N° de cliente'],
 ['scr','Folio SCR / Solicitud Netbilling'],['scrfecha','Fecha SCR'],['pfv','Potencia FV instalada (kWp)'],['pinv','Potencia inversores (kW)'],
 ['inyec','Inyección de excedentes autorizada (kW)'],['conv','Tipo de convertidor (micro / string / central; uni / bidireccional)'],
 ['tipoinst','Tipo de instalación (unitaria / múltiple / EGPC)'],['empl','Emplazamiento (techo / suelo / carport / flotante)'],['coords','Coordenadas generales (lat / long, WGS84)']];
const FIELDS_BESS=[['kwh','Capacidad nominal (kWh)'],['pbess','Potencia (kW)'],['quim','Química (plomo ácido / ion-litio)'],['marca','Marca y modelo'],['nbancos','N° de bancos de baterías'],['ubic','Ubicación (gabinete / caseta / sala / interior)'],['isla','Isla interna (SI / NO)'],['gen','Generador adicional (SI / NO)']];
const FIELDS_INST=[['inst','Nombre del instalador'],['irut','RUT'],['clase','Clase de licencia SEC (A / B / C / D)'],['nlic','N° de licencia / vigencia'],['empresa','Empresa'],['tel','Teléfono / correo']];

