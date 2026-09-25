import { topics, anchors } from './research-content.js';
import { illustrate } from './research-illustration.js';
export function createGallery() {
 const layer=document.querySelector('#research-hotspots'),card=document.querySelector('#research-card'),index=document.querySelector('#research-index'),zoom=document.querySelector('#research-zoom');
 let restoringFocus=false,active=null,pinned=false,hoverTimer,closeTimer,stopAnimation=null,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,opener=null;
 function clearMedia(){if(stopAnimation)stopAnimation();stopAnimation=null;}
 function close(){clearTimeout(hoverTimer);clearTimeout(closeTimer);clearMedia();card.hidden=true;active=null;pinned=false;document.querySelectorAll('.research-hotspot').forEach(b=>b.setAttribute('aria-expanded','false'));}
 function delayedClose(){clearTimeout(hoverTimer);if(!pinned)closeTimer=setTimeout(close,260);}
 function show(topic,pin=false,source=null){clearTimeout(closeTimer);clearTimeout(hoverTimer);if(pinned&&!pin)return;clearMedia();active=topic;pinned=pin;opener=source||opener;card.hidden=false;card.classList.toggle('is-pinned',pin);
 card.innerHTML=`<header class="card-heading"><span>${topic.kind}</span><button class="card-close" type="button" aria-label="关闭研究预览">×</button></header><h2 id="research-card-title">${topic.title}</h2><div class="research-media"></div><p class="research-caption"></p><p class="research-summary">${topic.summary}</p><div class="card-more"></div>`;
 card.querySelector('.card-close').onclick=()=>{close();restoringFocus=true;opener?.focus({preventScroll:true});restoringFocus=false;};
 const media=card.querySelector('.research-media'),caption=card.querySelector('.research-caption');
 if(topic.animation){const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',topic.title+'，可拖拽旋转的概念动画');media.append(canvas);stopAnimation=illustrate(canvas,topic.animation,()=>paused);caption.textContent='示意动画 · 可拖拽旋转';}
 else{let current=0;const image=document.createElement('img');image.decoding='async';image.alt=topic.media[0].caption;const enlarge=document.createElement('button');enlarge.type='button';enlarge.className='enlarge-image';enlarge.setAttribute('aria-label','放大研究原图');enlarge.append(image);media.append(enlarge);
 function change(i){current=i;image.src=topic.media[i].src;image.alt=topic.media[i].caption;caption.textContent=topic.media[i].caption;card.querySelectorAll('.media-thumb').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));}
 image.onerror=()=>{caption.textContent='图片暂未加载，请点击重试。';};
 enlarge.onclick=()=>{zoom.querySelector('img').src=topic.media[current].src;zoom.querySelector('img').alt=topic.media[current].caption;zoom.querySelector('p').textContent=topic.media[current].caption;zoom.showModal();};
 if(pin&&topic.media.length>1){const thumbnails=document.createElement('div');thumbnails.className='media-thumbnails';topic.media.forEach((m,i)=>{const b=document.createElement('button');b.type='button';b.className='media-thumb';b.setAttribute('aria-label',m.caption);const im=document.createElement('img');im.src=m.src;im.alt='';im.loading='lazy';b.append(im);b.onclick=()=>change(i);thumbnails.append(b);});media.after(thumbnails);}
 change(0);
 }
 const more=card.querySelector('.card-more');
 if(pin){const siblings=topics.filter(t=>t.anchor===topic.anchor);if(siblings.length>1){const tabs=document.createElement('div');tabs.className='topic-tabs';tabs.setAttribute('aria-label','同一区域的研究');siblings.forEach(t=>{const b=document.createElement('button');b.type='button';b.textContent=t.title.split(' · ')[0];b.setAttribute('aria-pressed',String(t.id===topic.id));b.onclick=()=>show(t,true,opener);tabs.append(b);});more.append(tabs);}
 const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='方法与研究来源';details.append(summary);const p=document.createElement('p');p.textContent=topic.detail;details.append(p);if(topic.paper){const p=document.createElement('p');p.textContent=topic.paper;details.append(p);}const source=document.createElement('p');source.className='source-note';source.textContent='来源：个人简历 · '+(topic.animation?'项目经历':'工作展示')+'。位置表示研究关联。';details.append(source);more.append(details);
 }else{const b=document.createElement('button');b.className='pin-card';b.type='button';b.textContent='展开研究 ↗';b.onclick=()=>show(topic,true,opener);more.append(b);}
 document.querySelectorAll('.research-hotspot').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.anchor===topic.anchor)));
 }
 card.addEventListener('pointerenter',()=>clearTimeout(closeTimer));card.addEventListener('pointerleave',delayedClose);
 card.addEventListener('focusin',()=>clearTimeout(closeTimer));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!zoom.open&&!index.open&&!card.hidden)close();});
 const buttons=anchors.map(anchor=>{const b=document.createElement('button');b.type='button';b.className='research-hotspot';b.dataset.anchor=anchor.id;b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','research-card');b.innerHTML=`<span class="hotspot-dot"></span><span>${anchor.label}</span>`;layer.append(b);
 b.addEventListener('pointerenter',e=>{if(e.pointerType==='touch'||pinned)return;clearTimeout(closeTimer);hoverTimer=setTimeout(()=>show(topics.find(t=>t.anchor===anchor.id),false,b),250);});b.addEventListener('pointerleave',delayedClose);
 b.addEventListener('focus',()=>{if(!pinned&&!restoringFocus)show(topics.find(t=>t.anchor===anchor.id),false,b);});b.onclick=()=>show(topics.find(t=>t.anchor===anchor.id),true,b);return {anchor,b};});
 const list=index.querySelector('.research-index-list');for(const anchor of anchors){const group=document.createElement('section');const h=document.createElement('h3');h.textContent=anchor.label;group.append(h);topics.filter(t=>t.anchor===anchor.id).forEach(t=>{const b=document.createElement('button');b.type='button';b.innerHTML=`<strong>${t.title}</strong><small>${t.short}</small>`;b.onclick=()=>{index.close();show(t,true,document.querySelector('#research-index-trigger'));card.querySelector('.card-close').focus();};group.append(b);});list.append(group);}
 document.querySelector('#research-index-trigger').onclick=()=>{clearTimeout(hoverTimer);index.showModal();};
 index.querySelector('.dialog-dismiss').onclick=()=>index.close();zoom.querySelector('.dialog-dismiss').onclick=()=>zoom.close();
 for(const dialog of [index,zoom])dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 return {setPaused(value){paused=value;},update(camera,T,fields){
 const w=layer.clientWidth,h=layer.clientHeight,placed=[];
 for(const {anchor,b}of buttons){const available=!anchor.conditional||anchor.fields.some(f=>fields[f]);b.hidden=!available;if(!available)continue;
 b.classList.toggle('is-active',anchor.fields.some(f=>fields[f]));const p=new T.Vector3(...anchor.point).project(camera);if(p.z>1){b.hidden=true;continue;}
 let x=(p.x*.5+.5)*w+(anchor.side==='left'?-b.offsetWidth-35:35),y=(-p.y*.5+.5)*h-14;
 const minX=10,maxX=Math.max(10,w-b.offsetWidth-10);x=Math.min(maxX,Math.max(minX,x));y=Math.min(h-155,Math.max(90,y));
 for(const r of placed)if(Math.abs(r.y-y)<36&&Math.abs(r.x-x)<150)y=Math.min(h-150,r.y+38);
 b.style.transform=`translate(${x}px,${y}px)`;placed.push({x,y});}
 }};
}
