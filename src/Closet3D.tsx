import {useEffect, useRef, useState} from 'react';
import './closet3d.css';

const base = `${import.meta.env.BASE_URL}closet3d/`;
type Actions = {zoom:(factor:number)=>void; reset:()=>void; turn:(direction:number)=>void};
export default function Closet3D(){
 const host=useRef<HTMLDivElement>(null);
 const actions=useRef<Actions|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'static'>('loading');
 const [staticMode,setStaticMode]=useState(false);
 useEffect(()=>{
  if(staticMode){setStatus('static');return;}
  let cancelled=false;
  let dispose=()=>{};
  setStatus('loading');
  async function start(){
   try {
    const [T,{GLTFLoader},{OrbitControls},manifest]=await Promise.all([
     import('three'),import('three/addons/loaders/GLTFLoader.js'),import('three/addons/controls/OrbitControls.js'),
     fetch(`${base}model-manifest.json`).then(r=>{if(!r.ok)throw Error('Manifest unavailable');return r.json();})
    ]);
    if(cancelled||!host.current)return;
    const el=host.current;
    const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.toneMapping=T.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.25;
    const scene=new T.Scene();scene.background=new T.Color(manifest.background);
    const camera=new T.PerspectiveCamera(manifest.camera.fov,1,.05,100);
    const target=new T.Vector3(...manifest.camera.target as [number,number,number]);
    const initial=new T.Vector3(...manifest.camera.position as [number,number,number]);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.target.copy(target);controls.enablePan=false;controls.enableZoom=false;
    controls.minPolarAngle=.3;controls.maxPolarAngle=Math.PI*.49;
    controls.minDistance=3;controls.maxDistance=16;
    controls.touches.ONE=T.TOUCH.ROTATE;
    renderer.domElement.style.touchAction='pan-y';
    renderer.domElement.setAttribute('aria-label','Interactive Smart Closet. Drag to rotate, or use the view controls.');
    el.appendChild(renderer.domElement);
    scene.add(new T.HemisphereLight(0xffffff,0x918376,3));
    const key=new T.DirectionalLight(0xfff3df,4);key.position.set(3,7,5);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;scene.add(key);
    const fill=new T.DirectionalLight(0xe4ecff,2);fill.position.set(-4,3,2);scene.add(fill);
    const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.16}));ground.rotation.x=-Math.PI/2;ground.position.y=-.015;ground.receiveShadow=true;scene.add(ground);
    const render=()=>{if(!cancelled)renderer.render(scene,camera);};
    const reset=()=>{const ratio=el.clientWidth/Math.max(el.clientHeight,1);camera.position.copy(target).add(initial.clone().sub(target).multiplyScalar(Math.max(1,1.12/ratio)));controls.target.copy(target);controls.update();render();};
    const resize=()=>{renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/Math.max(el.clientHeight,1);camera.updateProjectionMatrix();reset();};
    const observer=new ResizeObserver(resize);observer.observe(el);
    controls.addEventListener('change',render);
    const lost=(event:Event)=>{event.preventDefault();setStatus('static');actions.current=null;};
    renderer.domElement.addEventListener('webglcontextlost',lost);
    actions.current={reset,zoom:(factor)=>{const offset=camera.position.clone().sub(controls.target);offset.setLength(T.MathUtils.clamp(offset.length()*factor,3,16));camera.position.copy(controls.target).add(offset);controls.update();render();},turn:(direction)=>{camera.position.sub(target).applyAxisAngle(new T.Vector3(0,1,0),direction*.22).add(target);controls.update();render();}};
    dispose=()=>{observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(obj=>{if(obj instanceof T.Mesh){obj.geometry.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(m=>{Object.values(m).forEach(v=>{if(v instanceof T.Texture)v.dispose();});m.dispose();});}});renderer.dispose();renderer.domElement.remove();actions.current=null;};
    resize();
    const gltf=await new GLTFLoader().loadAsync(`${base}model.glb`);
    if(cancelled){gltf.scene.traverse(obj=>{if(obj instanceof T.Mesh){obj.geometry.dispose();}});return;}
    gltf.scene.traverse(obj=>{if(obj instanceof T.Mesh){obj.castShadow=true;obj.receiveShadow=true;}});
    scene.add(gltf.scene);reset();setStatus('ready');
   }catch{if(!cancelled){dispose();setStatus('static');}}
  }
  void start();
  return()=>{cancelled=true;dispose();};
 },[staticMode]);
 return <div className="hero-visual closet-stage">
  <div className="closet-heading"><span>MEET YOUR SMART CLOSET</span><span>PRODUCT CONCEPT</span></div>
  <div ref={host} className={`closet-canvas ${status==='ready'?'is-ready':''}`} aria-hidden={status!=='ready'}/>
  {status!=='ready'&&<img className="closet-preview" src={`${base}preview.png`} alt="Confirmed Smart Closet concept with wardrobe, illuminated mirror and companion dashboard"/>}
  <div className="closet-caption"><span className="cue-dot"/><span role="status">{status==='loading'?'Preparing your 3D closet…':status==='ready'?'A fresh perspective on your everyday.':'Static preview · Smart Closet concept'}</span></div>
  <div className="closet-toolbar" aria-label="3D product controls">
   {status==='ready'?<><p>Drag to rotate · Explore every angle</p><div className="closet-buttons"><button onClick={()=>actions.current?.turn(-1)} aria-label="Rotate left">↶</button><button onClick={()=>actions.current?.turn(1)} aria-label="Rotate right">↷</button><button onClick={()=>actions.current?.zoom(.85)} aria-label="Zoom in">+</button><button onClick={()=>actions.current?.zoom(1.18)} aria-label="Zoom out">−</button><button onClick={()=>actions.current?.reset()}>Reset view</button></div></>:<p>{status==='loading'?'Your confirmed concept is loading.':'Explore the concept in this saved model preview.'}</p>}
   <button className="closet-mode" onClick={()=>{setStaticMode(status==='ready'||status==='loading');if(status==='static'&&!staticMode){setStaticMode(true);setTimeout(()=>setStaticMode(false),0);}}}>{status==='static'?'Try interactive 3D':'View static preview'}</button>
  </div>
 </div>;
}
