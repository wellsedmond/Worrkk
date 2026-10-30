/* Small synthesized ambience. No AudioContext is created before a user gesture. */
const gameAudio=(()=>{
 let context,master,enabled=false,nextNote=0,step=0;try{enabled=localStorage.getItem('upyr.sound')==='on';}catch{}
 function syncButton(){document.querySelector('#sound').textContent=enabled?'Звук: вкл':'Звук: выкл';}
 function activate(){if(!enabled)return;try{context??=new(window.AudioContext||window.webkitAudioContext)();if(!master){master=context.createGain();master.gain.value=.12;master.connect(context.destination);}context.resume().catch(()=>{});}catch{enabled=false;}syncButton();}
 function tone(frequency,duration=.1,type='triangle',volume=.12){if(!enabled||!context||context.state!=='running')return;const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(volume,context.currentTime);g.gain.exponentialRampToValueAtTime(.0001,context.currentTime+duration);o.connect(g);g.connect(master);o.start();o.stop(context.currentTime+duration);o.onended=()=>{o.disconnect();g.disconnect();};}
 function effect(name){if(name==='achievement'){tone(659,.35,'triangle',.15);tone(988,.45,'sine',.1);return;}tone(name==='hit'?105:name==='hurt'?67:440,.13,name==='hurt'?'sawtooth':'triangle',.2);}
 function tick(dt,playing,moving){if(!enabled||!context||!playing)return;nextNote-=dt;step-=dt;if(nextNote<=0){const notes=[146.83,174.61,220,207.65,146.83,130.81,110,138.59];tone(notes[Math.floor(context.currentTime/.3)%notes.length],.2,'triangle',.08);nextNote=.3;}if(moving&&step<=0){tone(60,.035,'square',.025);step=.2;}}
 function toggle(){enabled=!enabled;try{localStorage.setItem('upyr.sound',enabled?'on':'off');}catch{}if(enabled)activate();else if(master)master.gain.value=0;if(master&&enabled)master.gain.value=.12;syncButton();}
 return {activate,effect,tick,toggle,syncButton};
})();
