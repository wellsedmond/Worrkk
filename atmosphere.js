/* Rendering only. World coordinates, collision bounds and game rules live in game.js. */
const atmosphere = (() => {
  const palette = {sky:'#080b16',far:'#141322',stone:'#22212b',red:'#B52239',moon:'#C8B9E8',fire:'#FF812B',green:'#86C44A',fog:'#827B9E'};
  const images = {};const textureCache=new Map();
  const assetNames = ['ska-palace','skyline','graveyard','web'];
  const gothicArena=new Image();gothicArena.src='assets/environment/gothic-arena.png';
  const lightingImage=new Image();lightingImage.src='assets/environment/lighting-atlas.png';
  const lightingFrames={"candle":[{"x":0,"y":0,"w":248,"h":345,"pivotX":138,"pivotY":340},{"x":248,"y":0,"w":248,"h":345,"pivotX":379,"pivotY":340},{"x":496,"y":0,"w":248,"h":345,"pivotX":620,"pivotY":340},{"x":744,"y":0,"w":248,"h":345,"pivotX":864,"pivotY":340},{"x":992,"y":0,"w":247,"h":345,"pivotX":1101,"pivotY":340},{"x":1239,"y":0,"w":248,"h":345,"pivotX":1351,"pivotY":340},{"x":1487,"y":0,"w":248,"h":345,"pivotX":1595,"pivotY":340},{"x":1735,"y":0,"w":248,"h":345,"pivotX":1846,"pivotY":340}],"lantern":[{"x":0,"y":345,"w":248,"h":440,"pivotX":68,"pivotY":765},{"x":248,"y":345,"w":248,"h":440,"pivotX":310,"pivotY":765},{"x":496,"y":345,"w":248,"h":440,"pivotX":554,"pivotY":765},{"x":744,"y":345,"w":248,"h":440,"pivotX":799,"pivotY":765},{"x":992,"y":345,"w":247,"h":440,"pivotX":1043,"pivotY":765},{"x":1239,"y":345,"w":248,"h":440,"pivotX":1287,"pivotY":765},{"x":1487,"y":345,"w":248,"h":440,"pivotX":1534,"pivotY":765},{"x":1735,"y":345,"w":248,"h":440,"pivotX":1779,"pivotY":765}]},lightingScale={candle:.2,lantern:.36};
  const ready = Promise.all([lightingImage.decode(),gothicArena.decode(), ...assetNames.map(async name => {
    const image = new Image(); image.src = `assets/environment/${name}.svg`;
    await image.decode();
    const raster = document.createElement('canvas');
    raster.width=image.naturalWidth; raster.height=image.naturalHeight;
    raster.getContext('2d').drawImage(image,0,0);
    images[name] = raster;
  })]);
  let time = 0, stones = [], particles = [], previousHud = '';
  const stars = Array.from({length:64},(_,i)=>({x:(i*149.7)%960,y:15+(i*37.3)%220,r:i%5===0?1.4:.7,phase:i*2.7}));
  const decorations = [190,600,800,1230,1510,2020,2260,2700];
  const lights = [230,620,970,1280,1510,2040,2250,2730];
  function line(c,points,color,width=1){c.beginPath();c.strokeStyle=color;c.lineWidth=width;points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
  function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
  function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);}
  function prepare(platforms){
    // Rasterize once at 2x: no per-frame stone geometry, filters or large blur passes.
    stones = platforms.map((ref,index)=>{
      const [x,y,w,h]=ref;const key=[w,h,index%3].join(':');
      if(textureCache.has(key)&&gothicArena.complete&&gothicArena.naturalWidth)return {ref,w,h,image:textureCache.get(key)};
      const image=document.createElement('canvas');image.width=(w+6)*2;image.height=(h+12)*2;
      const c=image.getContext('2d');c.scale(2,2);c.translate(3,5);
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#36333b');g.addColorStop(.25,'#191a22');g.addColorStop(1,'#080a10');
      c.fillStyle=g;c.fillRect(0,0,w,h);c.strokeStyle='#08080d';c.lineWidth=2;c.strokeRect(0,0,w,h);
      // Deterministic fractured basalt: cache once, retain exact collision surfaces.
      const noise=n=>{const v=Math.sin(n*127.1+index*31.7)*43758.5453;return v-Math.floor(v);};
      for(let row=0;row<h;row+=27){
        const offset=(Math.floor(row/27)%2)*23;
        for(let col=-offset;col<w;col+=47){
          const left=Math.max(0,col),right=Math.min(w,col+46),bottom=Math.min(h,row+26);if(right<=left)continue;
          const n=col+row*37;
          c.fillStyle=['#25252f','#1d1f28','#303039','#161922'][Math.floor(noise(n)*4)];
          c.beginPath();c.moveTo(left+3,row+2);c.lineTo(right-5,row+noise(n+1)*5);c.lineTo(right,bottom-5);c.lineTo(right-8,bottom);c.lineTo(left+2,bottom-2);c.closePath();c.fill();
          line(c,[[left+3,row+3],[right-6,row+2],[right-2,row+9]],'#69606b',.8);
          line(c,[[left+12,row+3],[left+20,row+13],[left+17,bottom],[left+24,bottom-3]],'#08090f',2);
          if(noise(n+2)>.6)line(c,[[left+20,row+13],[right-5,row+19]],'#a2172c',.8);
          for(let j=0;j<4;j++){c.fillStyle=j%2?'#7c6a7033':'#0005';c.fillRect(left+noise(n+j+5)*(right-left),row+noise(n+j+20)*20,1,1);}
        }
      }
      // Reuse the painted basalt from the scene for every ground and floating surface.
      if(gothicArena.complete&&gothicArena.naturalWidth){
        for(let yy=0;yy<h;yy+=70)for(let xx=0;xx<w;xx+=150){
          const dw=Math.min(150,w-xx),dh=Math.min(70,h-yy);
          const sx=(noise(xx+index*11)*.65+.05)*gothicArena.naturalWidth;
          c.drawImage(gothicArena,sx,gothicArena.naturalHeight*.84,gothicArena.naturalWidth*.16*dw/150,gothicArena.naturalHeight*.12*dh/70,xx,yy,dw,dh);
        }
      }
      // Pale chipped lip and a thin ember seam keep ledges easy to read.
      c.fillStyle='#82747a';c.beginPath();c.moveTo(0,0);
      for(let x=0;x<=w;x+=7)c.lineTo(x,-2+noise(x+7)*4);
      c.lineTo(w,5);for(let x=w;x>=0;x-=9)c.lineTo(x,3+noise(x+33)*4);c.closePath();c.fill();
      line(c,[[0,0],[w,0]],'#c5acaa',1);
      for(let x=7;x<w-4;x+=39){line(c,[[x,6],[Math.min(w,x+14),7],[Math.min(w,x+21),12]],'#9e1c32',1);}
      if(h<30)for(const x of [12,w-12]){line(c,[[x,7],[x,Math.min(h-2,20)]],'#ad8584',2);oval(c,x,9,2,2,'#0a0b11');}
      if(gothicArena.complete&&gothicArena.naturalWidth)textureCache.set(key,image);return {ref,w,h,image};
    });
  }
  function bat(c,x,y,size,phase,color='#171124'){
    c.save();c.translate(x,y);c.scale(size,size);c.fillStyle=color;
    const flap=Math.sin(phase)*5;
    c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-7,-10-flap,-17,-8-flap);
    c.lineTo(-13,1);c.quadraticCurveTo(-6,-4,-3,4);c.lineTo(0,7);c.lineTo(3,4);
    c.quadraticCurveTo(6,-4,13,1);c.lineTo(17,-8-flap);c.quadraticCurveTo(7,-10-flap,0,0);c.fill();
    c.beginPath();c.moveTo(-3,1);c.lineTo(-3,-5);c.lineTo(0,-2);c.lineTo(3,-5);c.lineTo(3,1);c.fill();c.restore();
  }
  function background(c,camera,zone=0,cameraY=0){
    c.fillStyle='#080b16';c.fillRect(0,0,960,510);
    if(gothicArena.complete&&gothicArena.naturalWidth){
      const height=640,width=height*gothicArena.naturalWidth/gothicArena.naturalHeight;
      const drift=Math.sin(camera*.00008)*45;
      c.drawImage(gothicArena,(960-width)/2-drift,-95-cameraY*.035,width,height);
      c.fillStyle=zone===3?'#06081670':zone===1?'#0d101c30':'#080a1415';c.fillRect(0,0,960,510);
    }
    // Fine moving mist and bats add life without repainting the backdrop.
    for(let i=0;i<5;i++){
      const x=((i*283+time*5-camera*.065)%1450+1450)%1450-220;
      oval(c,x,375+(i%3)*13,115,8,'#bfb3c00a');
    }
    // Slow, low-opacity distant lightning: one brief flash per 23 seconds.
    const phase=time%23;
    if(phase>17&&phase<17.2){
      c.globalAlpha=Math.sin((phase-17)/.2*Math.PI)*.4;
      line(c,[[142,0],[124,47],[145,42],[111,103],[132,94],[96,158]],'#c8b9e8',2);
      c.fillStyle='#c8b9e80a';c.fillRect(0,0,960,510);c.globalAlpha=1;
    }
    for(let i=0;i<8;i++)bat(c,((i*148+time*(9+i%3)-camera*.16)%1200+1200)%1200-80,75+(i%4)*21+Math.sin(time+i)*7,.35+i%3*.1,time*6+i,'#20162e');
    // Suspended dust remains subtle and avoids obscuring silhouettes.
    for(let i=0;i<20;i++){
      const x=((i*83+Math.sin(time*.3+i)*20-camera*.3)%1000+1000)%1000;
      oval(c,x,170+(i*37)%220+Math.sin(time*.4+i)*10,.8,.8,'#d9b7ab55');
    }
  }
  function flame(c,x,y,scale=1){
    c.save();c.translate(x,y);c.scale(scale,scale);
    glow(c,0,-9,36,'#ff812b22');
    const sway=Math.sin(time*9+x)*2;
    c.fillStyle='#ff812b';c.beginPath();c.moveTo(-4,0);c.bezierCurveTo(-10,-10,3+sway,-14,sway,-24);c.bezierCurveTo(15,-9,8,2,-4,0);c.fill();
    oval(c,1,-7,3,7,'#ffdf8c');c.restore();
  }
  function lightingFrame(elapsed,phase=0){return ((Math.floor((elapsed+phase)*10+1e-7)%8)+8)%8;}
  function lightingObjects(camera){
    const objects=[];
    const grounded=(x,w)=>stones.some(p=>p.ref.kind==='ground'&&x>=p.ref[0]&&x+w<=p.ref[0]+p.w);
    for(let i=Math.floor(camera/600)-1;i<Math.floor(camera/600)+3;i++){
      const x=i*600+230;if(x<camera-100||x>camera+1030)continue;
      if(grounded(x-20,74))objects.push({kind:'lantern',x,y:430,phase:i*.137});
      if(grounded(x-47,50))objects.push({kind:'candle',x:x-22,y:430,phase:i*.137+.23});
    }
    return objects;
  }
  function worldDecor(c,camera){
    if(!lightingImage.complete||!lightingImage.naturalWidth)return;
    c.save();c.translate(-camera,0);
    for(const object of lightingObjects(camera)){
      const f=lightingFrames[object.kind][lightingFrame(time,object.phase)],scale=object.kind==='lantern'?lightingScale.lantern:lightingScale.candle;
      const flicker=.8+.2*Math.sin(time*11+object.x);
      if(object.kind==='lantern')glow(c,object.x+40,object.y-88,46,`rgba(255,112,31,${.17*flicker})`);
      else glow(c,object.x,object.y-28,25,`rgba(255,129,40,${.14*flicker})`);
      c.drawImage(lightingImage,f.x,f.y,f.w,f.h,(f.x-f.pivotX)*scale+object.x,(f.y-f.pivotY)*scale+object.y,f.w*scale,f.h*scale);
    }
    c.restore();
  }
  function platforms(c,camera,cameraY=0){
    for(const p of stones){const [x,y]=p.ref;if(x+p.w<camera-20||x>camera+980||y+p.h<cameraY-100||y>cameraY+620)continue;
      if(!p.ref.active){if(p.ref.restore>.5)continue;c.globalAlpha=1-p.ref.restore*2;}
      const fall=!p.ref.active?p.ref.restore*180:0;
      c.drawImage(p.image,x-3,y-5+fall,p.w+6,p.h+12);c.globalAlpha=1;
      if(p.ref.kind==='moving'){line(c,[[x+12,y+14],[x+p.w-12,y+14]],'#e8b8ae',2);}
      if(p.ref.kind==='crumble'){line(c,[[x+20,y],[x+38,y+8],[x+28,y+17]],p.ref.collapse>=0?'#f1a36f':'#a59aa9',2);}
      if(p.h<30&&images.web){c.globalAlpha=.35;c.drawImage(images.web,x+2,y+p.h-1+fall,39,31);c.globalAlpha=1;}
    }
  }
  function burst(x,y,kind){
    const count=kind==='landing'?8:18;
    for(let i=0;i<count;i++){
      if(particles.length>=90)particles.shift();
      const angle=(i/count)*Math.PI*2;
      particles.push({x,y,vx:Math.cos(angle)*(kind==='landing'?45:95),vy:-25-Math.abs(Math.sin(angle))*80,life:0,max:kind==='landing'?.4:.65,kind,i});
    }
  }
  function effects(c,camera){
    for(const p of particles){
      c.globalAlpha=1-p.life/p.max;
      if(p.kind==='landing')oval(c,p.x-camera,p.y,2+p.life*8,1+p.life*4,'#b6a2be');
      else if(p.kind==='garlic'){
        c.save();c.translate(p.x-camera,p.y);c.rotate(p.life*(p.i%2?8:-8));
        c.fillStyle=p.i%3?'#eee1d6':'#b52239';c.beginPath();c.moveTo(-3,3);c.quadraticCurveTo(-6,-4,2,-7);c.quadraticCurveTo(1,-1,5,2);c.closePath();c.fill();c.restore();
      }else oval(c,p.x-camera,p.y,2,2,'#e83e55');
    }
    c.globalAlpha=1;
    // Ground fog sits below the walking surface: never hides ledges or feet.
    for(let i=-1;i<9;i++){
      const x=((i*180+time*8-camera*.55)%1450+1450)%1450-220;
      oval(c,x,474+Math.sin(time*.4+i)*7,125,14,'#827b9e12');
    }
  }
  function tick(dt){time+=dt;particles=particles.filter(p=>(p.life+=dt)<p.max);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;}}
  function reset(){particles=[];previousHud='';}
  function hud(node,player,score,progress){
    const key=`${player.hp}:${score}:${progress}`;if(key===previousHud)return;previousHud=key;
    node.querySelector('#health').dataset.hp=player.hp;
    node.querySelector('#health').setAttribute('aria-label',`Жизни: ${player.hp} из 3`);
    node.querySelector('#coin-count').textContent=score;
    node.querySelector('#progress-count').textContent=progress+'%';
  }
  return {ready,prepare,background,worldDecor,platforms,burst,effects,tick,reset,hud,palette,lightingFrame,lightingObjects};
})();
