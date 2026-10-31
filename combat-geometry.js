/* Combat contours follow solid artwork; smoke, glow and helmet plumes are decorative. */
const CombatGeometry=(()=>{
 const garlic=[[-3,-60],[22,-35],[50,-25],[65,0],[55,35],[25,53],[-22,53],[-58,35],[-70,8],[-57,-22],[-26,-40]];
 const helmet=[[-60,-140],[20,-144],[60,-115],[67,-60],[50,-18],[-15,-7],[-70,-28],[-88,-72],[-82,-115]];
 const hurt=[[-65,-190],[45,-185],[90,-145],[98,-70],[65,-12],[-48,-8],[-103,-65],[-100,-135]];
 function transform(points,x,y,sx=1,sy=sx,angle=0){const c=Math.cos(angle),s=Math.sin(angle);return points.map(([a,b])=>({x:x+a*sx*c-b*sy*s,y:y+a*sx*s+b*sy*c}));}
 function garlicPose(e,time){const stride=Math.sin(time*9+e.origin)*2;return {x:e.x+19,y:e.y+17+stride,angle:stride*.025};}
 function enemy(e,time){
  if(e.type==='helmet'){const damaged=e.hurt>0,scale=damaged?.26:.3;return transform(damaged?hurt:helmet,e.x+e.w/2,e.y+e.h,scale*(e.dir<0?-1:1),scale);}
  const p=garlicPose(e,time);return transform(garlic,p.x,p.y,48/130*(e.dir<0?-1:1),50/130,p.angle);
 }
 function fire(t){return transform([[0,-49],[7,-34],[13,-25],[19,-15],[23,-4],[-23,-4],[-20,-14],[-12,-26],[-6,-37]],t.x+t.w/2,t.y+t.h);}
 function bolt(p){
  if(p.kind==='rain')return bolt({x:-24,y:-4,w:48,h:8,vx:-1}).map(q=>({x:p.x+p.w/2-q.y,y:p.y+p.h/2+q.x}));
  // Same 48 x 16 placement as levelArt.flyingBolt; the halo is excluded.
  const points=[[.08,0],[.25,-5],[.35,-2],[.70,-2],[.78,-5],[.94,-5],[.85,0],[.94,5],[.78,5],[.70,2],[.35,2],[.25,5]];
  return points.map(([x,y])=>({x:p.vx>0?p.x+p.w-x*p.w:p.x+x*p.w,y:p.y+p.h/2+y}));
 }
 function bounds(points){const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
 function inside(p,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
 function touches(rect,points){
  const b=bounds(points);if(rect.x>=b.x+b.w||rect.x+rect.w<=b.x||rect.y>=b.y+b.h||rect.y+rect.h<=b.y)return false;
  const corners=[{x:rect.x,y:rect.y},{x:rect.x+rect.w,y:rect.y},{x:rect.x+rect.w,y:rect.y+rect.h},{x:rect.x,y:rect.y+rect.h}];
  if(points.some(p=>p.x>rect.x&&p.x<rect.x+rect.w&&p.y>rect.y&&p.y<rect.y+rect.h)||corners.some(p=>inside(p,points)))return true;
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  for(let i=0;i<points.length;i++)for(let j=0;j<4;j++){const a=points[i],b=points[(i+1)%points.length],c=corners[j],d=corners[(j+1)%4];if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return true;}
  return false;
 }
 function draw(c,points,color){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.strokeStyle=color;c.lineWidth=1;c.stroke();}
 return {enemy,garlicPose,fire,bolt,bounds,touches,draw};
})();
