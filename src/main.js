import * as THREE from 'three';

const scene=new THREE.Scene();scene.background=new THREE.Color(0x70aadd);scene.fog=new THREE.Fog(0x70aadd,75,155);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,300);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xccecff,0x375b35,2));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(-30,50,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);

const arena={w:80,d:120};
const field=new THREE.Mesh(new THREE.BoxGeometry(arena.w,.8,arena.d),new THREE.MeshStandardMaterial({color:0x248c55,roughness:.8}));field.position.y=-.4;field.receiveShadow=true;scene.add(field);
const stripes=new THREE.Mesh(new THREE.PlaneGeometry(arena.w,.12),new THREE.MeshBasicMaterial({color:0x55aa64}));stripes.rotation.x=-Math.PI/2;for(let z=-55;z<60;z+=10){let s=stripes.clone();s.position.set(0,.02,z);scene.add(s)}
function wall(x,z,w,d,c){const m=new THREE.Mesh(new THREE.BoxGeometry(w,4,d),new THREE.MeshStandardMaterial({color:c,roughness:.45}));m.position.set(x,1.5,z);m.receiveShadow=true;scene.add(m)}
wall(-41,0,2,124,0x365c95);wall(41,0,2,124,0x365c95);wall(0,-62,82,2,0x365c95);wall(0,62,82,2,0x365c95);
// goals
wall(-29,-61,24,2,0x2b78a4);wall(29,-61,24,2,0x2b78a4);wall(-29,61,24,2,0xa96c32);wall(29,61,24,2,0xa96c32);
const goalL=new THREE.Mesh(new THREE.BoxGeometry(34,10,.8),new THREE.MeshBasicMaterial({color:0x56cfff,transparent:true,opacity:.28,side:THREE.DoubleSide}));goalL.position.set(0,4,-61.5);scene.add(goalL);
const goalR=goalL.clone();goalR.material=goalL.material.clone();goalR.material.color.set(0xff9b45);goalR.position.z=61.5;scene.add(goalR);

// ball
const ball=new THREE.Mesh(new THREE.SphereGeometry(3.1,28,18),new THREE.MeshStandardMaterial({color:0x20282f,roughness:.35,metalness:.15}));ball.position.set(0,3.1,0);ball.castShadow=true;scene.add(ball);for(let i=0;i<12;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(.55,.12,2),new THREE.MeshBasicMaterial({color:i%3?0x81909a:0xffd34d}));p.position.copy(ball.position);p.userData.i=i;p.lookAt(0,3.1,0);scene.add(p)}

function makeCar(color,isBlue){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(6,1.8,9),new THREE.MeshStandardMaterial({color,roughness:.25,metalness:.25}));body.position.y=2;body.castShadow=true;g.add(body);const hood=new THREE.Mesh(new THREE.BoxGeometry(5.4,1,3.2),new THREE.MeshStandardMaterial({color:0xf5f8ff,roughness:.3}));hood.position.set(0,3,-3.8);g.add(hood);const cabin=new THREE.Mesh(new THREE.BoxGeometry(4.7,2,4),new THREE.MeshStandardMaterial({color:0x15344f,roughness:.15,metalness:.3}));cabin.position.set(0,3.6,-.2);g.add(cabin);for(const x of [-3,3])for(const z of [-3,3]){const w=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,1,12),new THREE.MeshStandardMaterial({color:0x111318}));w.rotation.z=Math.PI/2;w.position.set(x,1,z);w.castShadow=true;g.add(w)}return g}
const player=makeCar(0x2fa9df,true);player.position.set(0,0,38);scene.add(player);const enemy=makeCar(0xf59632,false);enemy.position.set(0,0,-38);enemy.rotation.y=Math.PI;scene.add(enemy);

const keys={},touch={};addEventListener('keydown',e=>{keys[e.key.toLower];keys[e.key.toLower?e.key.toLower():e.key]=true});addEventListener('keyup',e=>{keys[e.key.toLower?e.key.toLower():e.key]=false});
for(const el of document.querySelectorAll('.touch')){const k=el.dataset.key;el.addEventListener('pointerdown',e=>{e.preventGame?.();touch[k]=true});el.addEventListener('pointerup',()=>touch[k]=false);el.addEventListener('pointercancel',()=>touch[k]=false)}

let vel=new THREE.Vector3(),boost=100,score=[0,0],remaining=120,started=false,item=null,itemType=null,noticeT=0;
function notice(t){const n=document.querySelector('#notice');n.textContent=t;n.style.opacity=1;n.style.transform='translate(-50%,-50%) scale(1)';noticeT=1}
const boxes=[];const itemTypes=[['⚡','BOOST'],['🍄','SPEED'],['🐢','SPIKE'],['★','STAR']];
function makeBox(x,z){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(3.4,3.4,3.4),new THREE.MeshStandardMaterial({color:0xf2b900,emissive:0x7a4e00,emissiveIntensity:.45,roughness:.35}));g.add(b);const q=new THREE.Mesh(new THREE.BoxGeometry(.45,3.5,.45),new THREE.MeshBasicMaterial({color:0xfff6a1}));g.add(q);const q2=q.clone();q2.rotation.z=Math.PI/2;g.add(q2);g.position.set(x,4,z);scene.add(g);boxes.push(g)}
makeBox(-25,15);makeBox(25,-15);makeBox(0,48);

function randomItem(){const n=Math.floor(Math.random()*itemTypes.length);itemType=itemTypes[n][1];document.querySelector('#itemIcon').textContent=itemTypes[n][0];document.querySelector('#itemLabel').textContent=itemType}
document.querySelector('#play').onclick=()=>{document.querySelector('#start').style.display='none';started=true;notice('KICK OFF');last=performance.now();};
let last=performance.now();
function resetBall(){ball.position.set(0,3.1,0);ballVel.set(0,0,0)}
const ballVel=new THREE.Vector3();

function useItem(){if(!itemType)return;if(itemType==='BOOST'||itemType==='SPEED'){boost=Math.min(100,boost+35);vel.multiplyScalar(itemType==='SPEED'?1.25:1.1);notice(itemType)}else if(itemType==='SPIKE'){const to=new THREE.Vector3().subVectors(enemy.position,player.position);if(to.length()<20){enemy.position.add(to.normalize().multiplyScalar(-8));notice('HIT!')}}else{boost=100;vel.multiplyScalar(1.35);notice('STAR POWER')}itemType=null;document.querySelector('#itemIcon').textContent='?';document.querySelector('#itemLabel').textContent='ITEM BOX'}

function update(dt){
 if(!started)return;
 remaining-=dt;if(remaining<0)remaining=0;document.querySelector('#time').textContent=`${Math.floor(remaining/60)}:${String(Math.ceil(remaining%60)).padStart(2,'0')}`;
 const left=keys.ArrowLeft||keys.a||touch.left,right=keys.ArrowRight||keys.d||touch.right,forward=keys.ArrowUp||keys.w||touch.boost,brake=keys.ArrowDown||keys.s;
 const turn=(right?1:0)-(left?1:0);player.rotation.y-=turn*dt*1.9;
 if(forward&&boost>0){boost-=23*dt;vel.add(new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y)).multiplyScalar(dt*25))}else boost=Math.min(100,boost+7*dt);
 if(brake)vel.multiplyScalar(1-Math.min(.12,dt*2));
 vel.multiplyScalar(1-dt*.28);const dir=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));vel.add(dir.multiplyScalar((forward&&boost>0?42:24)*dt));player.position.addScaledVector(vel,dt);
 if(player.position.x<-37||player.position.x>37){player.position.x=Math.max(-37,Math.min(37,player.position.x));vel.x*=-.3}if(player.position.z<-57||player.position.z>57){player.position.z=Math.max(-57,Math.min(57,player.position.z));vel.z*=-.3}
 if(keys[' ']||keys.space||touch.use){useItem();touch.use=false}
 document.querySelector('#boostFill').style.width=boost+'%';
 // simple enemy AI
 const ep=new THREE.Vector3().subVectors(ball.position,enemy.position);enemy.rotation.y=Math.atan2(ep.x,ep.z);enemy.position.add(ep.normalize().multiplyScalar(dt*18));enemy.position.clamp(new THREE.Vector3(-37,-2,-57),new THREE.Vector3(37,2,57));
 // ball movement
 ball.position.addScaledVector(ballVel,dt);ballVel.multiplyScalar(1-dt*.45);ball.position.y=3.1;
 for(const c of [player,enemy]){const d=ball.position.distanceTo(c.position);if(d<6){const push=new THREE.Vector3().subVectors(ball.position,c.position).normalize();ballVel.add(push.multiplyScalar(c===player?18:12));ballVel.y=0}}
 if(ball.position.x<-37||ball.position.x>37)ballVel.x*=-.75;if(ball.position.z<-57||ball.position.z>57){if(Math.abs(ball.position.x)<17){if(ball.position.z<0){score[0]++;notice('BLUE SCORES')}else{score[1]++;notice('ORANGE SCORES')}document.querySelector('#bs').textContent=score[0];document.querySelector('#os').textContent=score[1];resetBall()}else ballVel.z*=-.75}
 ball.position.x=Math.max(-37,Math.min(37,ball.position.x));
 for(let i=boxes.length-1;i>=0;i--){const b=boxes[i];b.rotation.y+=dt*2;b.position.y=4+Math.sin(performance.now*.004+i)*.25;if(b.position.distanceTo(player.position)<6){scene.remove(b);boxes.splice(i,1);randomItem();setTimeout(()=>makeBox(b.position.x,b.position.z),5000)}}
 if(noticeT>0){noticeT-=dt;if(noticeT<0){document.querySelector('#notice').style.opacity=0;document.querySelector('#notice').style.transform='translate(-50%,-50%) scale(.7)'}}
 // sky clouds and markings are static; follow camera
 const target=player.position.clone();camera.position.lerp(target.clone().add(new THREE.Vector3(Math.sin(player.rotation.y)*-18,16,Math.cos(player.rotation.y)*-18)),dt*3);camera.lookAt(player.position.clone().add(new THREE.Vector3(0,0,-8)));
}
let frame=0;function animate(now){requestAnimationFrame(animate);const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);frame++;if(frame%2===0){const d=ball.position.clone();for(let i=0;i<12;i++){const p=scene.children.find(o=>o.userData?.i===i);if(p){p.position.copy(d);p.rotation.y=(i/12)*Math.PI*2+now*.0002;p.rotation.x=Math.sin(i*1.7)*.5}}}renderer.render(scene,camera)}requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
