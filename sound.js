/* Uploaded looping music plus synthesized effects. Playback starts after a user gesture. */
const gameAudio=(()=>{
 let context,master,music,musicPlaying=false,enabled=false,step=0;try{enabled=localStorage.getItem('upyr.sound')==='on';}catch{}
 function syncButton(){document.querySelector('#sound').textContent=enabled?'Звук: вкл':'Звук: выкл';}
 function setMusic(playing){
  const wanted=enabled&&playing&&!document.hidden;
  if(!music||wanted===musicPlaying)return;musicPlaying=wanted;
  if(wanted)music.play().catch(()=>{});else music.pause();
 }
 function activate(){
  if(!enabled)return;
  if(!music){music=new Audio('assets/audio/background.mp3');music.loop=true;music.preload='none';music.volume=.32;}
  // Retry on a new gesture if the browser previously blocked playback.
  musicPlaying=false;setMusic(true);
  try{context??=new(window.AudioContext||window.webkitAudioContext)();if(!master){master=context.createGain();master.gain.value=.12;master.connect(context.destination);}context.resume().catch(()=>{});}catch{}
  syncButton();
 }
 function tone(frequency,duration=.1,type='triangle',volume=.12){if(!enabled||!context||context.state!=='running')return;const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(volume,context.currentTime);g.gain.exponentialRampToValueAtTime(.0001,context.currentTime+duration);o.connect(g);g.connect(master);o.start();o.stop(context.currentTime+duration);o.onended=()=>{o.disconnect();g.disconnect();};}
 function effect(name){if(name==='achievement'){tone(659,.35,'triangle',.15);tone(988,.45,'sine',.1);return;}tone(name==='hit'?105:name==='hurt'?67:440,.13,name==='hurt'?'sawtooth':'triangle',.2);}
 function tick(dt,playing,moving){setMusic(playing);if(!enabled||!context||!playing)return;step-=dt;if(moving&&step<=0){tone(60,.035,'square',.025);step=.2;}}
 function toggle(){enabled=!enabled;try{localStorage.setItem('upyr.sound',enabled?'on':'off');}catch{}if(enabled)activate();else {setMusic(false);if(master)master.gain.value=0;}if(master&&enabled)master.gain.value=.12;syncButton();}
 window.addEventListener('pagehide',()=>setMusic(false));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)setMusic(false);});
 return {activate,effect,tick,toggle,syncButton};
})();
