// Classic watchdog also runs when a browser cannot load ES modules.
(() => {
 const buttons=document.querySelectorAll('.field-dock button,.view-actions button');buttons.forEach(b=>b.disabled=true);
 document.querySelector('#reload').onclick=()=>location.reload();
 window.researchReady=()=>{clearTimeout(timer);document.querySelector('#loading').hidden=true;document.querySelector('#render-error').hidden=true;buttons.forEach(b=>b.disabled=false);};
 window.researchFailed=()=>{clearTimeout(timer);document.querySelector('#loading').hidden=true;document.querySelector('#render-error').hidden=false;buttons.forEach(b=>b.disabled=true);};
 const timer=setTimeout(()=>{document.querySelector('#loading').hidden=true;document.querySelector('#render-error').hidden=false;document.querySelector('#render-error p').textContent='资源加载较慢。可以稍候，或检查网络后重新加载。';},15000);
})();
