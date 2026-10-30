/* Stable world-tile identities: crossing a tile boundary never resets visible content. */
const parallax=(()=>{
 const patterns=new WeakMap();
 function tiles(camera,speed,period,viewport=960,margin=160){
  const offset=camera*speed,first=Math.floor((offset-margin)/period),last=Math.ceil((offset+viewport+margin)/period);
  return Array.from({length:last-first+1},(_,i)=>({index:first+i,x:(first+i)*period-offset}));
 }
 const moonX=camera=>755-Math.sin(camera*.00008)*80;
 const palaceX=camera=>320-Math.sin(camera*.00006)*70;
 function repeatX(c,image,camera,speed,period,y,height){
  let cache=patterns.get(c);if(!cache){cache=new Map();patterns.set(c,cache);}let pattern=cache.get(image);if(!pattern){pattern=c.createPattern(image,'repeat-x');cache.set(image,pattern);}
  pattern.setTransform({a:period/image.width,b:0,c:0,d:height/image.height,e:-camera*speed,f:y});
  c.save();c.fillStyle=pattern;c.fillRect(0,y,960,height);c.restore();
 }
 return {tiles,moonX,palaceX,repeatX};
})();
