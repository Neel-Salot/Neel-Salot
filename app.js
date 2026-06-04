/* ==========================================================================
   NEEL SALOT // CYBERNETIC CONSOLE RUNTIME ENVIRONMENT
   ========================================================================== */

// --- 1. Sound Synthesizer Engine (Web Audio API) ---
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.humNode = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.enabled = true;
      this.startAmbientHum();
    } catch (e) {
      console.warn("Web Audio API not supported in this browser.", e);
    }
  }

  toggle() {
    if (!this.ctx) {
      this.init();
      return this.enabled;
    }
    if (this.enabled) {
      if (this.ctx.state === 'running') {
        this.ctx.suspend();
      }
      this.enabled = false;
    } else {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.enabled = true;
    }
    return this.enabled;
  }

  playKey() {
    if (!this.enabled || !this.ctx) return;
    // Short mechanical click sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000 + Math.random() * 400, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playReturn() {
    if (!this.enabled || !this.ctx) return;
    // Dynamic slide sound for enter key
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.17);
  }

  playChime(type) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    if (type === 'success') {
      // Harmonic arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.06, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === 'error') {
      // Discard chime
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.frequency.setValueAtTime(150, now);
      osc2.frequency.setValueAtTime(147, now);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    }
  }

  startAmbientHum() {
    if (!this.ctx) return;
    // Low mechanical core hum
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, this.ctx.currentTime); // 60Hz hum
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.015, this.ctx.currentTime); // very quiet
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    this.humNode = { osc, gain };
  }
}

const synth = new SoundSynth();

// --- 2. Interactive Terminal Engine ---
const terminalHistory = document.getElementById('terminal-history');
const terminalInput = document.getElementById('terminal-input');
const container = document.getElementById('terminal-container');

// Bio databases
const profileText = `[SYSTEM PROFILE DECRYPTION COMPLETE]
------------------------------------
SUBJECT: NEEL SALOT
FOCUS: Full Stack Developer · AI Builder · Systems Thinker
STATUS: Final-Year B.Sc. IT (CGPA: 9.46)
LOCATION: Surat, Gujarat, India 🇮🇳

Comfortable cross-stack, from building responsive web frontends
to constructing agentic AI orchestrators and serverless systems.
A drawn-to-complexity engineer who builds functional platforms
presented at conferences and deployed in hackathons.

CONTACT CHANNELS:
- Email: neelsalot.work@gmail.com
- GitHub: github.com/Neel-Salot
- LinkedIn: linkedin.com/in/neel-salot`;

const projectsText = `[MANIFEST: ACTIVE REPOSITORIES]
------------------------------
Run "run [project_name]" to execute dynamic simulator logs.

1. MOMENTUM_AI (Meeting Intelligence Platform)
   Command: run momentum-ai
   Stack: Whisper ➔ Gemini ➔ Supabase ➔ React
   Note: Conceived and demoed in a 48hr hackathon.

2. KAIRO_AI (Sign Language Gesture Learning Platform)
   Command: run kairo-ai
   Stack: Flutter ➔ MediaPipe ➔ TF Lite ➔ Python
   Note: Research paper published at ACAI-2026 conference.

3. DAILY_NEST (Autism Support Platform)
   Command: run daily-nest
   Stack: Django ➔ CNN Anomaly Engine ➔ Python
   Note: Awarded Best Research Paper at CSRI Conference.`;

const skillsText = `[SYSTEM CONFIGURATION: TECHNICAL MATRIX]
----------------------------------------
FRONTEND   :: React.js, TypeScript, TailwindCSS, CSS3, HTML5
BACKEND    :: Node.js (Express), PHP, Python (Django, FastAPI), .NET
AI/AGENTS  :: Agentic pipelines, Gemini LLM integrations, Whisper transcription
DATABASES  :: Supabase, Firebase, MySQL, PostgreSQL
INFRASTRUCTURE :: GitHub Actions, Git, Jira, Docker, Vercel`;

const researchText = `[PUBLICATION LOGS]
------------------
1. "An AI-Powered All-in-One Life Aid for Autism Spectrum Disorder"
   Conference: Student Conference on Self-Reliant India (CSRI)
   Status: ACCEPTED (Best Research Paper Award 🏆)
   Focus: Stress pattern tracking & caregiver analytics dashboards.

2. "KairoAI: Indian Sign Language Learning Platform"
   Conference: National Conference on AI (ACAI-2026)
   Status: PRESENTED & PUBLISHED`;

const educationText = `[FIRMWARE SPEC: EDUCATION]
---------------------------
DEGREE: B.Sc. Information Technology (2023 - 2026)
INSTITUTION: Babu Madhav Institute of Information Technology (Surat)
METRIC: CGPA 9.46 / 10.0 (Semester Topper, Academic Excellence Award 2x)

SECONDARY EDUCATION (Class XII - GSEB)
INSTITUTION: Jeevan Bharti Kumar Bhavan, Surat (90.13%)`;

const commandList = {
  'help': 'Display list of available operational instructions.',
  'clear': 'Flush output buffers and clear screen history.',
  'neofetch': 'Fetch system specifications and host information.',
  'profile': 'cat profile.txt - Display engineer biography.',
  'projects': 'ls projects/ - List feature repository manifest.',
  'skills': 'cat skills.sys - Display technical matrix.',
  'research': 'cat research.log - Display publication logs.',
  'education': 'cat education.cfg - Display academic background.',
  'contact': 'Display communication endpoints.',
  'diagnostics': 'Execute cluster diagnostics & self-test.',
  'run [module]': 'Execute visual AI pipeline emulator. Modules: momentum-ai, kairo-ai, daily-nest'
};

function writeLine(text, styleClass = '') {
  const line = document.createElement('div');
  line.className = `terminal-line ${styleClass}`;
  line.textContent = text;
  terminalHistory.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function processCommand(rawInput) {
  const input = rawInput.trim();
  if (!input) return;

  writeLine(`guest@neel-sys:~$ ${input}`, 'log-accent');
  
  const tokens = input.toLowerCase().split(' ');
  const cmd = tokens[0];
  const arg = tokens[1];

  synth.playReturn();

  switch (cmd) {
    case 'help':
      writeLine('AVAILABLE SYSTEM UTILITIES:', 'log-success');
      Object.keys(commandList).forEach(key => {
        writeLine(`  ${key.padEnd(15)} :: ${commandList[key]}`);
      });
      break;

    case 'clear':
      terminalHistory.innerHTML = '';
      break;

    case 'neofetch':
      const asciiArt = `
      /\\_/\\  NEEL_SALOT@BM_IIT
     ( o.o ) OS     :: NeelOS v2.6.4 (Surat Host)
      > ^ <  SHELL  :: ash (AI Systems Shell)
             UPTIME :: 9.46 CGPA semTopper uptime
             CPU    :: Google Gemini Flash Node
             RAM    :: React/Node Core Integrations
             COMP   :: FullStack + Agentic Pipelines
      `;
      writeLine(asciiArt, 'log-success');
      break;

    case 'profile':
    case 'cat profile.txt':
      writeLine(profileText);
      break;

    case 'projects':
    case 'ls':
    case 'ls projects':
    case 'ls projects/':
      writeLine(projectsText);
      break;

    case 'skills':
    case 'cat skills.sys':
      writeLine(skillsText);
      break;

    case 'research':
    case 'cat research.log':
      writeLine(researchText);
      break;

    case 'education':
    case 'cat education.cfg':
      writeLine(educationText);
      break;

    case 'contact':
      writeLine('COMMUNICATION ENDPOINTS:');
      writeLine('  Email    :: neelsalot.work@gmail.com');
      writeLine('  GitHub   :: https://github.com/Neel-Salot');
      writeLine('  LinkedIn :: https://linkedin.com/in/neel-salot');
      writeLine('  Location :: Surat, Gujarat, India');
      break;

    case 'diagnostics':
      writeLine('INITIATING CLUSTER DIAGNOSTICS...', 'log-warning');
      setTimeout(() => {
        writeLine('● CORE_ROUTER  .................. ONLINE (14ms)', 'log-success');
        writeLine('● MOMENTUM_AI  .................. ONLINE (22ms)', 'log-success');
        writeLine('● KAIRO_AI     .................. ONLINE (30ms)', 'log-success');
        writeLine('● DAILY_NEST   .................. ONLINE (19ms)', 'log-success');
        writeLine('● FLEXI_GROW   .................. ONLINE (15ms)', 'log-success');
        writeLine('HEALTH COMPILATION: 100% (STABLE)', 'log-success');
        synth.playChime('success');
      }, 600);
      break;

    case 'run':
      if (!arg) {
        writeLine('Error: Command "run" requires a module argument (momentum-ai, kairo-ai, daily-nest).', 'log-error');
        synth.playChime('error');
        break;
      }
      
      if (arg.includes('momentum')) {
        writeLine('Redirecting task thread to Momentum AI Simulator...', 'log-success');
        triggerTab('momentum');
        runMomentumPipeline("Simulate terminal trigger command execution");
      } else if (arg.includes('kairo')) {
        writeLine('Activating KairoAI hand skeleton sensor grid...', 'log-success');
        triggerTab('kairo');
      } else if (arg.includes('nest') || arg.includes('daily')) {
        writeLine('Booting DailyNest Support Analytics...', 'log-success');
        triggerTab('dailynest');
        triggerDailyNestAnomaly();
      } else {
        writeLine(`Module "${arg}" not found. Options: momentum-ai, kairo-ai, daily-nest`, 'log-error');
        synth.playChime('error');
      }
      break;

    default:
      // cat commands fallback
      if (input === 'cat profile.txt') writeLine(profileText);
      else if (input === 'cat skills.sys') writeLine(skillsText);
      else if (input === 'cat research.log') writeLine(researchText);
      else if (input === 'cat education.cfg') writeLine(educationText);
      else {
        writeLine(`bash: command not found: "${input}". Type "help" for valid directives.`, 'log-error');
        synth.playChime('error');
      }
  }
}

// --- 3. UI Events Handling ---

// Time display updater
function updateClock() {
  const clock = document.getElementById('live-time');
  const now = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  clock.textContent = `TIME: ${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
setInterval(updateClock, 1000);
updateClock();

// Sound Toggle
const soundBtn = document.getElementById('sound-toggle');
const soundStatus = document.getElementById('sound-status');
soundBtn.addEventListener('click', () => {
  const enabled = synth.toggle();
  soundStatus.textContent = enabled ? 'ON' : 'OFF';
  soundBtn.classList.toggle('active', enabled);
  if (enabled) {
    synth.playChime('success');
  }
});

// CRT Toggle
const crtBtn = document.getElementById('crt-toggle');
const crtStatus = document.getElementById('crt-status');
const crtOverlay = document.getElementById('crt-overlay');
const flickerOverlay = document.getElementById('screen-flicker');

crtBtn.addEventListener('click', () => {
  const hasCrt = crtOverlay.classList.toggle('crt-scanlines');
  flickerOverlay.style.display = hasCrt ? 'block' : 'none';
  crtStatus.textContent = hasCrt ? 'ON' : 'OFF';
  crtBtn.classList.toggle('active', hasCrt);
  synth.playKey();
});

// Terminal input key listener
terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    processCommand(terminalInput.value);
    terminalInput.value = '';
  } else {
    synth.playKey();
  }
});

// Focus terminal on container click
container.addEventListener('click', () => {
  terminalInput.focus();
});

// Quick triggers from list sidebar
document.querySelectorAll('.cmd-trigger').forEach(btn => {
  btn.addEventListener('click', () => {
    const cmd = btn.getAttribute('data-cmd');
    processCommand(cmd);
  });
});

// Visual tabs switcher
const tabs = document.querySelectorAll('.vis-tab');
const modules = document.querySelectorAll('.vis-module');
const visStatus = document.getElementById('visualizer-status');

function triggerTab(nodeName) {
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-node') === nodeName);
  });
  modules.forEach(mod => {
    mod.classList.toggle('active', mod.id === `module-${nodeName}`);
  });
  visStatus.textContent = nodeName.toUpperCase() + '_ACTIVE';
  
  // Resize canvas redraw triggers
  if (nodeName === 'kairo') initKairoCanvas();
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const nodeName = tab.getAttribute('data-node');
    triggerTab(nodeName);
    synth.playKey();
  });
});

// Simulate live CPU loads
setInterval(() => {
  const cpuVal = Math.floor(Math.random() * 8) + 2; // 2% to 10%
  document.getElementById('sim-load').textContent = `CPU_LOAD: ${cpuVal}%`;
}, 2500);


// --- 4. Interactive Canvas Simulators ---

// --- MODULE A: Momentum AI Particle Pipeline ---
const momentumCanvas = document.getElementById('momentum-canvas');
const mCtx = momentumCanvas.getContext('2d');
let mParticles = [];
let mPipelineStep = 0;
let mLogs = [];
const momentumLog = document.getElementById('momentum-sim-log');

function mLog(text) {
  mLogs.unshift(`[${new Date().toLocaleTimeString()}] ${text}`);
  mLogs = mLogs.slice(0, 4); // Keep 4
  momentumLog.innerHTML = mLogs.map(l => `<span class="log-entry">${l}</span>`).join('');
}

// Node coordinates
const nodes = {
  whisper: { x: 40, y: 100, label: 'Whisper Node' },
  gemini: { x: 110, y: 50, label: 'Gemini Agent' },
  supabase: { x: 180, y: 100, label: 'Supabase DB' }
};

class Particle {
  constructor(startX, startY, endX, endY, onComplete) {
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.progress = 0;
    this.speed = 0.025;
    this.onComplete = onComplete;
  }
  update() {
    this.progress += this.speed;
    if (this.progress >= 1) {
      this.progress = 1;
      this.onComplete();
      return false; // delete
    }
    // Bezier flow
    const cx = (this.startX + this.endX) / 2;
    const cy = Math.min(this.startY, this.endY) - 20;
    // quadratic bezier
    const t = this.progress;
    this.x = (1 - t) * (1 - t) * this.startX + 2 * (1 - t) * t * cx + t * t * this.endX;
    this.y = (1 - t) * (1 - t) * this.startY + 2 * (1 - t) * t * cy + t * t * this.endY;
    return true;
  }
  draw() {
    mCtx.beginPath();
    mCtx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    mCtx.fillStyle = '#ff007f';
    mCtx.shadowColor = '#ff007f';
    mCtx.shadowBlur = 8;
    mCtx.fill();
    mCtx.shadowBlur = 0; // reset
  }
}

function runMomentumPipeline(inputText) {
  if (!inputText.trim()) return;
  
  mParticles = [];
  mPipelineStep = 1;
  mLog(`INPUT ROUTED: "${inputText.substring(0, 35)}..."`);
  
  // Start Whisper transcription particle
  setTimeout(() => {
    mLog(`WHISPER: Ingested audio packet. Transcribing...`);
    synth.playKey();
    mParticles.push(new Particle(nodes.whisper.x, nodes.whisper.y, nodes.gemini.x, nodes.gemini.y, () => {
      // Whisper to Gemini complete
      mPipelineStep = 2;
      mLog(`GEMINI: Received text transcript. Extracting JSON...`);
      synth.playKey();
      
      setTimeout(() => {
        mPipelineStep = 3;
        mLog(`EXTRACTION: Task, Action Items and Decisions successfully structured.`);
        
        mParticles.push(new Particle(nodes.gemini.x, nodes.gemini.y, nodes.supabase.x, nodes.supabase.y, () => {
          mPipelineStep = 4;
          mLog(`DATABASE: Injected structures into Supabase table.`);
          synth.playChime('success');
          
          setTimeout(() => {
            mPipelineStep = 0;
            mLog(`PIPELINE IDLE.`);
          }, 2000);
        }));
      }, 1200);
    }));
  }, 400);
}

document.getElementById('momentum-sim-btn').addEventListener('click', () => {
  const txt = document.getElementById('momentum-input-text').value;
  runMomentumPipeline(txt || "Inject mock meeting statement coordinates");
});

function drawMomentumCanvas() {
  mCtx.clearRect(0, 0, momentumCanvas.width, momentumCanvas.height);
  
  // Draw layout lines
  mCtx.beginPath();
  mCtx.moveTo(nodes.whisper.x, nodes.whisper.y);
  mCtx.quadraticCurveTo((nodes.whisper.x+nodes.gemini.x)/2, Math.min(nodes.whisper.y, nodes.gemini.y)-20, nodes.gemini.x, nodes.gemini.y);
  mCtx.quadraticCurveTo((nodes.gemini.x+nodes.supabase.x)/2, Math.min(nodes.gemini.y, nodes.supabase.y)-20, nodes.supabase.x, nodes.supabase.y);
  mCtx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
  mCtx.lineWidth = 1.5;
  mCtx.stroke();
  
  // Draw active node overlays
  const drawNode = (node, isActive, label) => {
    mCtx.beginPath();
    mCtx.arc(node.x, node.y, 14, 0, Math.PI * 2);
    mCtx.fillStyle = isActive ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.03)';
    mCtx.strokeStyle = isActive ? '#00f2fe' : '#4e5b6c';
    mCtx.lineWidth = isActive ? 2 : 1;
    mCtx.fill();
    mCtx.stroke();
    
    // label
    mCtx.fillStyle = isActive ? '#00f2fe' : '#8090a6';
    mCtx.font = '8px "Share Tech Mono"';
    mCtx.textAlign = 'center';
    mCtx.fillText(label, node.x, node.y + 26);
  };
  
  drawNode(nodes.whisper, mPipelineStep === 1, 'Whisper');
  drawNode(nodes.gemini, mPipelineStep === 2 || mPipelineStep === 3, 'Gemini');
  drawNode(nodes.supabase, mPipelineStep === 4, 'Supabase');
  
  // Update particles
  mParticles = mParticles.filter(p => {
    const keep = p.update();
    if (keep) p.draw();
    return keep;
  });
  
  requestAnimationFrame(drawMomentumCanvas);
}
drawMomentumCanvas();


// --- MODULE B: KairoAI Hand Gesture Simulator ---
const kairoCanvas = document.getElementById('kairo-canvas');
const kCtx = kairoCanvas.getContext('2d');
const kairoLog = document.getElementById('kairo-sim-log');
let mouseInKairo = false;
let kairoMouse = { x: 0, y: 0 };
let jointPoints = [];

function initKairoCanvas() {
  jointPoints = [];
  // Initialize skeletal nodes randomly
  for (let i = 0; i < 5; i++) {
    jointPoints.push({
      x: Math.random() * (kairoCanvas.width - 40) + 20,
      y: Math.random() * (kairoCanvas.height - 40) + 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5
    });
  }
}
initKairoCanvas();

// Translate gestures based on cursor quadrant
function getGestureWord(x, y) {
  const quadX = x > kairoCanvas.width / 2 ? 'RIGHT' : 'LEFT';
  const quadY = y > kairoCanvas.height / 2 ? 'BOTTOM' : 'TOP';
  
  if (quadX === 'LEFT' && quadY === 'TOP') return { sign: "A", word: "HELLO" };
  if (quadX === 'RIGHT' && quadY === 'TOP') return { sign: "B", word: "WELCOME" };
  if (quadX === 'LEFT' && quadY === 'BOTTOM') return { sign: "C", word: "SYSTEMS" };
  return { sign: "D", word: "BUILDER" };
}

kairoCanvas.addEventListener('mouseenter', () => { mouseInKairo = true; });
kairoCanvas.addEventListener('mouseleave', () => { 
  mouseInKairo = false; 
  kairoLog.innerHTML = `<span class="log-entry">Sensor grid ready. Hover grid coordinates to translate.</span>`;
});
kairoCanvas.addEventListener('mousemove', (e) => {
  const rect = kairoCanvas.getBoundingClientRect();
  kairoMouse.x = e.clientX - rect.left;
  kairoMouse.y = e.clientY - rect.top;
  
  const g = getGestureWord(kairoMouse.x, kairoMouse.y);
  kairoLog.innerHTML = `
    <span class="log-entry" style="color:#00ffc4">TRANSLATION  :: SIGN_${g.sign}</span>
    <span class="log-entry">WORD         :: ${g.word}</span>
    <span class="log-entry">SKELETAL_COORDS: X=${Math.floor(kairoMouse.x)} Y=${Math.floor(kairoMouse.y)}</span>
  `;
  synth.playKey();
});

function drawKairoCanvas() {
  kCtx.clearRect(0, 0, kairoCanvas.width, kairoCanvas.height);
  
  // Sensor grid lines background
  kCtx.beginPath();
  kCtx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
  kCtx.lineWidth = 1;
  for (let x = 20; x < kairoCanvas.width; x += 20) {
    kCtx.moveTo(x, 0); kCtx.lineTo(x, kairoCanvas.height);
  }
  for (let y = 20; y < kairoCanvas.height; y += 20) {
    kCtx.moveTo(0, y); kCtx.lineTo(kairoCanvas.width, y);
  }
  kCtx.stroke();

  // Draw skeletal joint nodes
  jointPoints.forEach((pt, idx) => {
    // physics update
    pt.x += pt.vx;
    pt.y += pt.vy;
    if (pt.x < 10 || pt.x > kairoCanvas.width - 10) pt.vx *= -1;
    if (pt.y < 10 || pt.y > kairoCanvas.height - 10) pt.vy *= -1;

    kCtx.beginPath();
    kCtx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
    kCtx.fillStyle = '#8090a6';
    kCtx.fill();
    
    // Draw lines connecting nodes to build a "skeleton map"
    if (idx > 0) {
      kCtx.beginPath();
      kCtx.moveTo(pt.x, pt.y);
      kCtx.lineTo(jointPoints[idx-1].x, jointPoints[idx-1].y);
      kCtx.strokeStyle = 'rgba(128, 144, 166, 0.3)';
      kCtx.stroke();
    }
  });

  // Track cursor skeleton mapping if inside sensor canvas
  if (mouseInKairo) {
    // Draw active cursor node
    kCtx.beginPath();
    kCtx.arc(kairoMouse.x, kairoMouse.y, 6, 0, Math.PI * 2);
    kCtx.fillStyle = '#00ffc4';
    kCtx.shadowColor = '#00ffc4';
    kCtx.shadowBlur = 6;
    kCtx.fill();
    kCtx.shadowBlur = 0; // reset
    
    // Connect skeleton bones to closest node
    jointPoints.forEach(pt => {
      kCtx.beginPath();
      kCtx.moveTo(kairoMouse.x, kairoMouse.y);
      kCtx.lineTo(pt.x, pt.y);
      kCtx.strokeStyle = 'rgba(0, 255, 196, 0.25)';
      kCtx.lineWidth = 1.5;
      kCtx.stroke();
    });
  }

  requestAnimationFrame(drawKairoCanvas);
}
drawKairoCanvas();


// --- MODULE C: DailyNest Sensory Anomaly Dashboard ---
const dailyCanvas = document.getElementById('daily-canvas');
const dCtx = dailyCanvas.getContext('2d');
const dailyLog = document.getElementById('daily-nest-sim-log');

let dStressHistory = Array(30).fill(25); // baseline stress data
let dAnomalyActive = false;
let dAnomalyTimer = 0;
let dLogs = [];

function dLog(text, style = '') {
  const color = style === 'alert' ? 'color:#ff3b30' : (style === 'success' ? 'color:#00ffc4' : '');
  dLogs.unshift(`<span class="log-entry" style="${color}">[${new Date().toLocaleTimeString()}] ${text}</span>`);
  dLogs = dLogs.slice(0, 3);
  dailyLog.innerHTML = dLogs.join('');
}

function triggerDailyNestAnomaly() {
  if (dAnomalyActive) return;
  dAnomalyActive = true;
  dAnomalyTimer = 50;
  
  dLog("ALERT: Behavior anomaly detected (Stress index spike)!", "alert");
  synth.playChime('error');
  
  setTimeout(() => {
    dLog("INTERVENTION: Deployed ambient sensory therapy script.");
  }, 1000);
  
  setTimeout(() => {
    dLog("MONITOR: Sensory indexes returning to nominal states.", "success");
    synth.playChime('success');
  }, 3500);
}

document.getElementById('dailynest-sim-btn').addEventListener('click', triggerDailyNestAnomaly);

function drawDailyCanvas() {
  dCtx.clearRect(0, 0, dailyCanvas.width, dailyCanvas.height);
  
  // Calculate next frame stress levels
  let currentStress = 25;
  if (dAnomalyActive) {
    if (dAnomalyTimer > 40) {
      currentStress = 85 + (Math.random() * 8 - 4); // Peak
    } else {
      // Decay back to 25
      const ratio = dAnomalyTimer / 40;
      currentStress = 25 + ratio * 60 + (Math.random() * 4 - 2);
    }
    
    dAnomalyTimer--;
    if (dAnomalyTimer <= 0) {
      dAnomalyActive = false;
    }
  } else {
    currentStress = 25 + (Math.random() * 4 - 2); // Idle fluctuation
  }
  
  dStressHistory.push(currentStress);
  dStressHistory.shift();
  
  // Draw Graph Grid
  dCtx.beginPath();
  dCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  dCtx.lineWidth = 1;
  for (let x = 0; x < dailyCanvas.width; x += 30) {
    dCtx.moveTo(x, 0); dCtx.lineTo(x, dailyCanvas.height);
  }
  for (let y = 0; y < dailyCanvas.height; y += 25) {
    dCtx.moveTo(0, y); dCtx.lineTo(dailyCanvas.width, y);
  }
  dCtx.stroke();
  
  // Plot stress chart line
  dCtx.beginPath();
  const stepWidth = dailyCanvas.width / (dStressHistory.length - 1);
  dStressHistory.forEach((val, idx) => {
    const x = idx * stepWidth;
    const y = dailyCanvas.height - (val / 100) * (dailyCanvas.height - 20) - 10;
    if (idx === 0) dCtx.moveTo(x, y);
    else dCtx.lineTo(x, y);
  });
  
  dCtx.strokeStyle = dAnomalyActive ? '#ff3b30' : '#00f2fe';
  dCtx.lineWidth = 2;
  dCtx.stroke();
  
  // Draw glowing end dot
  const lastVal = dStressHistory[dStressHistory.length - 1];
  const lastX = dailyCanvas.width;
  const lastY = dailyCanvas.height - (lastVal / 100) * (dailyCanvas.height - 20) - 10;
  
  dCtx.beginPath();
  dCtx.arc(lastX - 2, lastY, 4, 0, Math.PI * 2);
  dCtx.fillStyle = dAnomalyActive ? '#ff3b30' : '#00ffc4';
  dCtx.shadowColor = dAnomalyActive ? '#ff3b30' : '#00ffc4';
  dCtx.shadowBlur = 6;
  dCtx.fill();
  dCtx.shadowBlur = 0; // reset
  
  requestAnimationFrame(drawDailyCanvas);
}
drawDailyCanvas();
