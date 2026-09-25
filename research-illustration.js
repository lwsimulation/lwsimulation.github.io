// Small rotatable 3D projections for projects without supplied images. No extra WebGL context.
export function illustrate(canvas, kind, isPaused) {
 const c=canvas.getContext('2d'); let yaw=.55,tilt=.24,old=null,alive=true,time=0,last=0,stamp=0;
 const project=([x,y,z])=>{const X=x*Math.cos(yaw)-z*Math.sin(yaw),Z=x*Math.sin(yaw)+z*Math.cos(yaw),Y=y*Math.cos(tilt)-Z*Math.sin(tilt),D=y*Math.sin(tilt)+Z*Math.cos(tilt),s=Math.min(canvas.width/7.7,canvas.height/5.4)*10/(10-D);return [canvas.width/2+X*s,canvas.height/2-Y*s];};
 function line(points,color,width=1,fill){c.beginPath();points.forEach((p,i)=>{const q=project(p);if(i)c.lineTo(...q);else c.moveTo(...q);});if(fill){c.closePath();c.fillStyle=fill;c.fill();}c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 const ring=(r,y)=>Array.from({length:65},(_,i)=>[r*Math.cos(i/64*Math.PI*2),y,r*Math.sin(i/64*Math.PI*2)]);
 function dot(p,color,r=3){const q=project(p);c.beginPath();c.arc(q[0],q[1],r,0,Math.PI*2);c.fillStyle=color;c.fill();}
 function label(text,p){const q=project(p);c.fillStyle='#526c89';c.font=`${Math.max(11,canvas.width/58)}px Arial`;c.fillText(text,q[0],q[1]);}
 function draw(now){if(!alive)return;requestAnimationFrame(draw);const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!isPaused()&&!document.hidden)time+=dt;if(now-stamp<40)return;stamp=now;
 const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio,1.5);if(!r.width||!r.height)return;if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}
 c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#f4f8fc';c.fillRect(0,0,canvas.width,canvas.height);
 if(kind==='pump'){
 for(const y of [-1.7,1.7])line(ring(.8,y),'#6988a6',2);
 for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])line([[.8*Math.cos(a),-1.7,.8*Math.sin(a)],[.8*Math.cos(a),1.7,.8*Math.sin(a)]],'#b9cbd9');
 for(let j=0;j<7;j++){const y=1.35-j*.43;line(ring(.74,y),'#7999b2');for(let k=0;k<10;k++){const a=k/10*Math.PI*2+time*.6;line([[.15*Math.cos(a),y,.15*Math.sin(a)],[.7*Math.cos(a+.35),y,.7*Math.sin(a+.35)],[.7*Math.cos(a+.55),y-.09,.7*Math.sin(a+.55)]],'#829eb5',1,'#c5d6e3');}}
 for(let j=0;j<3;j++){const y=1.35-j*.9;line([[-2.3,y,0],[-.85,y,0]],['#528fb7','#71aeb2','#ab91c5'][j],4);label(['入口 A','入口 B','入口 C'][j],[-2.9,y+.15,0]);for(let k=0;k<12;k++){const u=(time*.15+k/12)%1;const p=u<.36?[-2.2+u/.36*1.7,y,0]:[.34*Math.cos(u*12),y-(u-.36)/.64*(y+2),.34*Math.sin(u*12)];dot(p,['#3f8dbc','#62a7aa','#9c79b9'][j],2.5);}}
 line([[0,-1.7,0],[0,-2.1,0]],'#6591b3',5);label('分级抽气',[.9,-1.8,0]);
 }else{
 for(let i=0;i<=8;i++){const x=-2.8+i*.7;line(Array.from({length:65},(_,j)=>[x,.64*Math.cos(j/64*Math.PI*2),.64*Math.sin(j/64*Math.PI*2)]),'#88a6be',i===0||i===8?2:1);}
 for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])line([[-2.8,.64*Math.cos(a),.64*Math.sin(a)],[2.8,.64*Math.cos(a),.64*Math.sin(a)]],'#a4bccc');
 for(let i=0;i<90;i++){const u=(time*.13+i/90)%1,a=i*2.4,r=.12+.35*((i*13)%31)/31;if(i%5<u*3)continue;dot([-2.8+u*5.6,r*Math.cos(a),r*Math.sin(a)],`rgba(72,142,179,${1-u*.65})`,2.5);}
 for(let i=0;i<45;i++){const u=i/45,a=i*2.4;dot([-2.75+u*5.5,.62*Math.cos(a),.62*Math.sin(a)],`rgba(201,143,80,${.65-u*.42})`,2.5);}
 label('输入',[-3.1,.95,0]);label('沿程输运 →',[0,1.0,0]);label('内壁沉积',[-.3,-1.1,0]);
 }}
 function down(e){old=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);}
 function move(e){if(!old)return;yaw+=(e.clientX-old[0])*.008;tilt=Math.max(-.8,Math.min(.8,tilt+(e.clientY-old[1])*.006));old=[e.clientX,e.clientY];}
 function up(){old=null;}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 requestAnimationFrame(draw);return()=>{alive=false;canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);};
}
