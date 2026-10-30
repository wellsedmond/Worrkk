/* Visual-only crouch poses. The existing 80/44px physics hitboxes remain independent. */
const heroAnimator=(()=>{
 const image=new Image();image.src='assets/hero-crouch.png';
 const atlas={"scale":0.34980988593155893,"baseline":-1.8748180494905426,"frames":[{"x":23,"y":59,"w":142,"h":263,"pivotX":96.0,"pivotY":322},{"x":204,"y":85,"w":156,"h":237,"pivotX":277.5,"pivotY":322},{"x":399,"y":103,"w":158,"h":219,"pivotX":470.0,"pivotY":322},{"x":597,"y":119,"w":156,"h":203,"pivotX":660.0,"pivotY":322},{"x":786,"y":136,"w":156,"h":186,"pivotX":848.0,"pivotY":322},{"x":977,"y":156,"w":152,"h":166,"pivotX":1041.0,"pivotY":322},{"x":1165,"y":156,"w":154,"h":167,"pivotX":1228.5,"pivotY":323},{"x":1358,"y":156,"w":155,"h":167,"pivotX":1422.5,"pivotY":323},{"x":293,"y":424,"w":165,"h":193,"pivotX":365.0,"pivotY":617},{"x":552,"y":424,"w":166,"h":194,"pivotX":624.0,"pivotY":618},{"x":813,"y":424,"w":166,"h":193,"pivotX":884.0,"pivotY":617},{"x":1071,"y":428,"w":164,"h":189,"pivotX":1142.0,"pivotY":617},{"x":42,"y":779,"w":147,"h":163,"pivotX":100.5,"pivotY":942},{"x":233,"y":760,"w":149,"h":181,"pivotX":290.5,"pivotY":941},{"x":425,"y":742,"w":145,"h":199,"pivotX":480.0,"pivotY":941},{"x":611,"y":730,"w":141,"h":211,"pivotX":667.5,"pivotY":941},{"x":792,"y":711,"w":131,"h":230,"pivotX":852.5,"pivotY":941},{"x":972,"y":697,"w":132,"h":244,"pivotX":1036.5,"pivotY":941},{"x":1163,"y":685,"w":137,"h":256,"pivotX":1224.0,"pivotY":941},{"x":1347,"y":682,"w":136,"h":259,"pivotX":1413.5,"pivotY":941}],"down":[0,1,2,3,4,5,6,7],"hold":[5,6,7,6],"up":[12,13,14,15,16,17,18,19]};
 const ready=image.decode();
 let depth=0,holdTime=0,direction='down';
 const duration=.28;
 function reset(){depth=0;holdTime=0;direction='down';}
 function update(dt,crouching){
  const wasFull=depth===1;direction=crouching?'down':'up';
  depth=Math.max(0,Math.min(1,depth+(crouching?1:-1)*dt/duration));
  holdTime=depth===1?(wasFull?holdTime+dt:0):0;
 }
 function pose(){
  if(depth===0)return {phase:'stand',frame:null,depth};
  if(depth===1)return {phase:'hold',frame:atlas.hold[Math.floor(holdTime/.14)%atlas.hold.length],depth};
  const sequence=atlas[direction],progress=direction==='down'?depth:1-depth;
  return {phase:direction,frame:sequence[Math.round(progress*(sequence.length-1))],depth};
 }
 function geometry(){
  const frame=pose().frame;if(frame===null)return null;const f=atlas.frames[frame];if(!f)return null;
  return {sx:f.x,sy:f.y,sw:f.w,sh:f.h,dx:(f.x-f.pivotX)*atlas.scale,dy:(f.y-f.pivotY)*atlas.scale+atlas.baseline,dw:f.w*atlas.scale,dh:f.h*atlas.scale};
 }
 function draw(c){
  const g=geometry();if(!g||!image.complete||!image.naturalWidth)return false;
  c.drawImage(image,g.sx,g.sy,g.sw,g.sh,g.dx,g.dy,g.dw,g.dh);return true;
 }
 function effectOffset(){const g=geometry();return g?g.dy+92:0;}
 return {ready,reset,update,pose,geometry,draw,effectOffset};
})();
