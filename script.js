const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const canvas = $("#fx-canvas");
const ctx = canvas?.getContext("2d");
let particles = [];

function resizeCanvas(){
  if(!canvas) return;
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
addEventListener("resize", resizeCanvas);
resizeCanvas();

function burst(kind="confetti", count=120){
  for(let i=0;i<count;i++){
    particles.push({
      x: innerWidth/2, y: innerHeight*.42,
      vx:(Math.random()-.5)*12, vy:(Math.random()*-8)-3,
      g:.16+Math.random()*.12, life:90+Math.random()*70,
      size:4+Math.random()*8,
      color: kind==="petal" ? ["#ff9fc5","#ffd5e7","#fff7fb"][i%3] : ["#ff6fa7","#ffd86f","#ffffff","#f8a7ca"][i%4],
      kind
    });
  }
}
function ambience(){
  if(Math.random()<.35) particles.push({x:Math.random()*innerWidth,y:-20,vx:(Math.random()-.5)*.5,vy:.5+Math.random()*1.2,g:0,life:260,size:5+Math.random()*10,color:Math.random()>.5?"#ffd3e5":"#fff",kind:Math.random()>.55?"heart":"spark"});
}
function drawFx(){
  if(!ctx) return;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  ambience();
  particles = particles.filter(p=>p.life-- > 0);
  for(const p of particles){
    p.vy += p.g; p.x += p.vx; p.y += p.vy;
    ctx.save(); ctx.globalAlpha=Math.max(0,p.life/130); ctx.fillStyle=p.color; ctx.translate(p.x,p.y); ctx.rotate(p.life*.05);
    if(p.kind==="heart"){ ctx.font=`${p.size*2}px serif`; ctx.fillText("♡",0,0); }
    else if(p.kind==="petal"){ ctx.beginPath(); ctx.ellipse(0,0,p.size*.7,p.size*1.5,0,0,Math.PI*2); ctx.fill(); }
    else { ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); }
    ctx.restore();
  }
  requestAnimationFrame(drawFx);
}
drawFx();

const gsap = {
  to(el, vars){ const node = typeof el==="string" ? $(el) : el; Object.assign(node.style, vars.css || {}); if(vars.x !== undefined) node.style.transform = `translateX(${vars.x}px)`; return wait((vars.duration || 0) * 1000).then(()=>vars.onComplete?.()); },
  set(el, vars){ const node = typeof el==="string" ? $(el) : el; Object.assign(node.style, vars); }
};

function speak(text, onWord){
  return new Promise((resolve) => {
    if(!("speechSynthesis" in window)){ resolve(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = .9; u.pitch = 1.55; u.volume = 1;
    const voices = speechSynthesis.getVoices();
    u.voice = voices.find(v => /female|zira|samantha|google uk english female/i.test(v.name)) || voices[0] || null;
    u.onboundary = (e) => onWord?.(e);
    u.onend = resolve; u.onerror = resolve;
    speechSynthesis.speak(u);
  });
}

function showScene(id){
  document.querySelectorAll(".scene").forEach(s=>s.classList.remove("active"));
  $(id)?.classList.add("active");
}

async function runHome(){
  const ribbon = $("#ribbon");
  let startY = 0, pulled = false;
  function openGift(){
    if(pulled) return; pulled = true;
    ribbon.style.transition = "transform .7s ease";
    ribbon.style.transform = "translateX(-50%) translateY(190px)";
    $("#giftBox").classList.add("open");
    burst("confetti",170); burst("petal",90);
    wait(5000).then(runCatIntro);
  }
  function drag(y){
    const dy = Math.max(0, Math.min(210, y - startY));
    ribbon.style.transform = `translateX(-50%) translateY(${dy}px)`;
    if(dy>150) openGift();
  }
  ribbon.addEventListener("pointerdown", e=>{ startY=e.clientY; ribbon.setPointerCapture(e.pointerId); });
  ribbon.addEventListener("pointermove", e=>{ if(e.pressure || e.buttons) drag(e.clientY); });
  ribbon.addEventListener("click", openGift);
  ribbon.addEventListener("keydown", e=>{ if(e.key==="Enter" || e.key===" ") openGift(); });
}

async function runCatIntro(){
  showScene("#cat-scene");
  const cat = $("#cat");
  await wait(300);
  cat.style.transition = "left 6s linear";
  cat.style.left = "calc(50% - 130px)";
  await wait(6000);
  cat.classList.remove("walk"); cat.classList.add("sit");
  cat.style.left = "50%";
  cat.style.transform = "translateX(-50%)";
  await wait(600);
  runWishes();
}

async function runWishes(){
  showScene("#wish-scene");
  const bubble = $("#speechBubble");
  const lines = [
    "Hi little princess!",
    "Happy Birthday, Shivani!",
    "Today is your special day.",
    "I wish you lots of happiness, love, success, and beautiful memories.",
    "May all your dreams come true.",
    "May your smile shine brighter every day.",
    "May your life be filled with wonderful memories and endless laughter.",
    "Have the most magical birthday ever, Shivani!",
    "Happy Birthday once again, little princess!"
  ];
  for(const line of lines){
    bubble.textContent = line;
    await speak(line);
    await wait(180);
  }
  await runCake();
}

async function runCake(){
  showScene("#cake-scene");
  $(".cake-wrap").classList.add("rise");
  burst("petal",70);
  await wait(1800);
  await speak("Make a wish, Little Princess!");
  await wait(3000);
  location.href = "video.html";
}

function runVideo(){
  const v = $("#birthdayVideo");
  const go = () => location.href = "gallery.html";
  v.addEventListener("ended", go);
  v.play().catch(()=>{ v.muted = true; v.play().catch(()=>{}); });
}

function runGallery(){
  const photos = document.querySelectorAll(".polaroid");
  let i = 0;
  setInterval(()=>{
    photos.forEach((p,n)=>p.style.zIndex = n===i ? 3 : 1);
    photos[i].animate([{transform:"scale(1.02) rotate(0deg)"},{transform:"scale(1.12) rotate(1deg)"},{transform:"scale(1.02) rotate(0deg)"}],{duration:2600,easing:"ease-in-out"});
    i = (i+1)%photos.length;
  },3000);
  setTimeout(()=>location.href="end.html",25000);
}

async function runEnd(){
  const bubble = $("#byeBubble");
  const lines = [
    "Bye, Shivani!",
    "Thank you for watching your birthday story.",
    "Once again... Happy Birthday, Shivani!",
    "Keep smiling. Keep shining. Keep loving cats."
  ];
  for(const line of lines){ bubble.textContent = line; await speak(line); await wait(250); }
  $("#byeCat").classList.add("walkout");
  await wait(4300);
  showScene("#finalScene");
  burst("confetti",140);
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if(page==="home") runHome();
  if(page==="video") runVideo();
  if(page==="gallery") runGallery();
  if(page==="end") runEnd();
});
