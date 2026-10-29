/* Rendering only. World coordinates, collision bounds and game rules live in game.js. */
const atmosphere = (() => {
  const palette = {sky:'#17112B',far:'#302044',stone:'#51465F',red:'#B52239',moon:'#C8B9E8',fire:'#FF812B',green:'#86C44A',fog:'#827B9E'};
  const images = {};
  const assetNames = ['ska-palace','skyline','graveyard','web'];
  const ready = Promise.all(assetNames.map(async name => {
    const image = new Image(); image.src = `assets/environment/${name}.svg`;
    await image.decode();
    const raster = document.createElement('canvas');
    raster.width=image.naturalWidth; raster.height=image.naturalHeight;
    raster.getContext('2d').drawImage(image,0,0);
    images[name] = raster;
  }));
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
    stones = platforms.map(([x,y,w,h],index)=>{
      const image=document.createElement('canvas');image.width=(w+6)*2;image.height=(h+12)*2;
      const c=image.getContext('2d');c.scale(2,2);c.translate(3,5);
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#655972');g.addColorStop(1,'#342d42');
      round(c,0,0,w,h,4,g,'#282232');
      for(let row=0;row<h;row+=22){
        const offset=(Math.floor(row/22)%2)*26;
        for(let col=-offset;col<w;col+=52){
          const left=Math.max(1,col+1),right=Math.min(w-1,col+50);
          if(right<=left)continue;
          round(c,left,row+1,right-left,Math.min(20,h-row-2),2,(Math.floor((col+offset)/52)+row+index)%3===0?'#62566f':'#51465f','#362e44');
          line(c,[[left+3,row+3],[right-3,row+3]],'#80718b',.7);
          if((col+offset+index*13)%5===0)line(c,[[left+12,row+2],[left+18,row+9],[left+14,row+14]],'#30283c');
        }
      }
      round(c,0,-2,w,8,3,'#95869e','#b3a1bb');
      for(let moss=15;moss<w-5;moss+=71){
        line(c,[[moss,-1],[moss+18,0],[moss+22,5],[moss+33,4]],'#697c4f',3);
        line(c,[[moss+18,1],[moss+16,9]],'#86a05b',1.5);
      }
      if(h<30){
        for(const a of [16,w-16]){line(c,[[a,h-2],[a+5,h+3],[a+10,h-2]],'#82728f',2);}
      }
      return {x,y,w,h,image};
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
  function background(c,camera){
    const sky=c.createLinearGradient(0,0,0,510);sky.addColorStop(0,palette.sky);sky.addColorStop(.65,'#382441');sky.addColorStop(1,'#715066');c.fillStyle=sky;c.fillRect(0,0,960,510);
    for(const s of stars)oval(c,(s.x-camera*.025+960)%960,s.y,s.r,s.r,`rgba(200,185,232,${.25+.45*(.5+.5*Math.sin(time*.8+s.phase))})`);
    const moonX=755-camera*.035;
    glow(c,moonX,99,140,'#b522393e');glow(c,moonX,99,100,'#db5c5335');
    const moon=c.createRadialGradient(moonX-20,75,4,moonX,99,65);moon.addColorStop(0,'#efb4a8');moon.addColorStop(.7,'#cb666c');moon.addColorStop(1,'#a53e57');
    oval(c,moonX,99,63,63,moon);
    for(let i=0;i<9;i++)oval(c,moonX+Math.sin(i*3.7)*43,99+Math.cos(i*2.1)*43,5+i%4*2,3+i%3,'#70354d24');
    // Five depth speeds: stars/moon, clouds, palace, skyline, graveyard.
    for(let i=0;i<7;i++){
      const x=((i*233+time*5-camera*.065)%1450+1450)%1450-220,y=60+(i%3)*47;
      oval(c,x,y,101,12,'#a495b321');oval(c,x+65,y-8,76,19,'#a495b31a');
    }
    if(images['ska-palace']){c.globalAlpha=.85;c.drawImage(images['ska-palace'],320-camera*.11,114,570,323);c.globalAlpha=1;}
    if(images.skyline){c.globalAlpha=.34;for(let i=-1;i<3;i++)c.drawImage(images.skyline,i*1080-camera*.22,180,1080,300);c.globalAlpha=1;}
    // Slow, low-opacity distant lightning: one brief flash per 23 seconds.
    const phase=time%23;
    if(phase>17&&phase<17.2){
      c.globalAlpha=Math.sin((phase-17)/.2*Math.PI)*.4;
      line(c,[[142,0],[124,47],[145,42],[111,103],[132,94],[96,158]],'#c8b9e8',2);
      c.fillStyle='#c8b9e80a';c.fillRect(0,0,960,510);c.globalAlpha=1;
    }
    for(let i=0;i<8;i++)bat(c,((i*148+time*(9+i%3)-camera*.16)%1200+1200)%1200-80,75+(i%4)*21+Math.sin(time+i)*7,.35+i%3*.1,time*6+i,'#20162e');
    // Graveyard props always behind collision silhouettes and actors.
    c.save();c.translate(-camera*.43,0);c.globalAlpha=.68;
    if(images.graveyard)for(let i=-1;i<5;i++)c.drawImage(images.graveyard,i*560,260,512,144);
    c.globalAlpha=1;
    for(let i=-1;i<65;i++){
      const x=i*31;line(c,[[x,410],[x,358],[x-4,365],[x,353],[x+4,365],[x,358]],'#42364e',2);
    }
    line(c,[[-100,382],[2000,382]],'#58465e',2);line(c,[[-100,399],[2000,399]],'#58465e',2);c.restore();
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
  function worldDecor(c,camera){
    c.save();c.translate(-camera,0);
    // Decorations are deliberately absent from floating platform tops and gaps.
    if(images.graveyard)for(let i=0;i<decorations.length;i++){
      const x=decorations[i];if(x<camera-120||x>camera+1050)continue;
      const kind=i%4;
      const crops=[[270,112,63,65],[150,82,65,90],[505,68,58,108],[566,118,62,57]];
      const [sx,sy,sw,sh]=crops[kind];c.drawImage(images.graveyard,sx,sy,sw,sh,x,430-sh*.65,sw*.65,sh*.65);
      if(kind===0)glow(c,x+22,416,30,'#ff812b20');if(kind===3)glow(c,x+20,416,28,'#86c44a20');
    }
    for(const x of lights){
      if(x<camera-70||x>camera+1030)continue;
      // Carved iron lantern post.
      line(c,[[x,430],[x,361],[x-7,352],[x+9,352]],'#24202e',4);
      round(c,x+3,353,13,22,3,'#c16d3866','#97839d');
      line(c,[[x+1,352],[x+10,346],[x+19,352]],'#8d7596',2);flame(c,x+9,372,.65);
      round(c,x-20,421,5,9,1,'#d8c1bd');flame(c,x-18,421,.5);
    }
    c.restore();
  }
  function platforms(c,camera){for(const p of stones)if(p.x+p.w>=camera&&p.x<=camera+960){c.drawImage(p.image,p.x-3,p.y-5,p.w+6,p.h+12);if(p.h<30&&images.web){c.globalAlpha=.45;c.drawImage(images.web,p.x+2,p.y+p.h-1,39,31);c.globalAlpha=1;}}}
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
  return {ready,prepare,background,worldDecor,platforms,burst,effects,tick,reset,hud,palette};
})();
