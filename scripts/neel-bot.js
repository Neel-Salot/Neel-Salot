const fs = require('fs');
const path = require('path');
const github = require('@actions/github');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
const geminiKey = process.env.GEMINI_API_KEY;
const githubToken = process.env.GITHUB_TOKEN;
const issueNumber = parseInt(process.env.ISSUE_NUMBER, 10);
const issueTitle = process.env.ISSUE_TITLE || '';
const issueBody = process.env.ISSUE_BODY || '';
const issueUser = process.env.ISSUE_USER || 'guest';

// Paths
const readmePath = path.join(__dirname, '../README.md');
const statePath = path.join(__dirname, 'system-state.json');
const consoleSvgPath = path.join(__dirname, '../assets/console.svg');
const consoleLightSvgPath = path.join(__dirname, '../assets/console-light.svg');

// SVG Generator helper
function generateConsoleSvg(state, isDark) {
  // Theme Color Configurations
  const colors = {
    bg: isDark ? '#080b11' : '#f6f8fa',
    panelBg: isDark ? '#0c101d' : '#ffffff',
    panelStroke: isDark ? '#1f293d' : '#d0d7de',
    textMain: isDark ? '#e1e4e8' : '#24292f',
    textMuted: isDark ? '#8b949e' : '#57606a',
    grid: isDark ? '#161b22' : '#eaeef2',
    
    // Status colors
    online: isDark ? '#00ffc4' : '#1a7f37',
    degraded: isDark ? '#ff9500' : '#bc4c00',
    offline: isDark ? '#ff3b30' : '#cf222e',
    energized: isDark ? '#ff007f' : '#8a2be2',
    
    // Line colors
    lineOnline: isDark ? '#00f2fe' : '#0969da',
    lineDegraded: isDark ? '#ff9500' : '#bc4c00',
    lineOffline: isDark ? '#30363d' : '#eaeef2'
  };

  // 1. Calculate Health score
  let health = 100;
  Object.keys(state.nodes).forEach(key => {
    if (state.nodes[key].status === 'OFFLINE') health -= 25;
    else if (state.nodes[key].status === 'DEGRADED') health -= 12;
  });
  health = Math.max(0, health);

  let healthColor = colors.online;
  if (health < 90) healthColor = colors.degraded;
  if (health < 70) healthColor = colors.offline;

  // 2. Coffee Battery Color
  let batteryColor = colors.online;
  if (state.coffeeBuffer > 100) batteryColor = colors.energized;
  else if (state.coffeeBuffer < 60) batteryColor = colors.offline;

  const batteryWidth = Math.min(100, Math.max(0, (state.coffeeBuffer / 150) * 72));

  // 3. Calculate simulated Uptime (hrs since launch on June 4, 2026)
  const startEpoch = new Date('2026-06-04T09:00:00Z').getTime();
  const currentEpoch = new Date().getTime();
  const diffMs = Math.max(0, currentEpoch - startEpoch);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  const uptimeStr = `${diffHrs}h ${diffMins}m`;

  // 4. Node details to render
  const nodes = state.nodes;

  // Get status color helper
  const getNodeColor = (status) => {
    if (status === 'OFFLINE') return colors.offline;
    if (status === 'DEGRADED') return colors.degraded;
    if (status === 'OVERCLOCKED') return colors.energized;
    return colors.online;
  };

  // Get line configuration helper
  const getLineMarkup = (nodeKey, x1, y1, x2, y2) => {
    const nodeStatus = nodes[nodeKey].status;
    if (nodeStatus === 'OFFLINE') {
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors.lineOffline}" stroke-width="1.5" stroke-dasharray="4 4" />`;
    }
    if (nodeStatus === 'DEGRADED') {
      return `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors.lineDegraded}" stroke-width="2" stroke-dasharray="6 6" />
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors.lineDegraded}" stroke-width="4" stroke-linecap="round" opacity="0.3" stroke-dasharray="6 20">
          <animate attributeName="stroke-dashoffset" values="100;0" dur="8s" repeatCount="indefinite" />
        </line>
      `;
    }
    // Healthy / Online
    const strokeCol = nodeKey === 'core' && nodeStatus === 'OVERCLOCKED' ? colors.energized : colors.lineOnline;
    return `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeCol}" stroke-width="2" stroke-dasharray="8 8" />
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeCol}" stroke-width="5" stroke-linecap="round" opacity="0.3" stroke-dasharray="8 25">
        <animate attributeName="stroke-dashoffset" values="100;0" dur="4s" repeatCount="indefinite" />
      </line>
    `;
  };

  // Node box generator helper
  const renderNodeBox = (nodeKey, x, y, title, subtitle) => {
    const node = nodes[nodeKey];
    const borderCol = getNodeColor(node.status);
    const boxBg = isDark ? '#0c101d' : '#ffffff';
    
    // Flash box background if offline
    const bgStyle = node.status === 'OFFLINE' 
      ? `fill="${isDark ? '#230b0b' : '#ffebe9'}" fill-opacity="0.8"` 
      : `fill="${boxBg}" fill-opacity="0.9"`;

    return `
      <!-- Node Box: ${nodeKey} -->
      <g transform="translate(${x}, ${y})">
        <rect width="130" height="72" rx="8" ${bgStyle} stroke="${borderCol}" stroke-width="1.5" />
        <text x="10" y="20" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="bold" fill="${colors.textMain}">${title}</text>
        <text x="10" y="33" font-family="'Courier New', monospace" font-size="9" fill="${colors.textMuted}">${subtitle}</text>
        
        <circle cx="15" cy="50" r="3.5" fill="${borderCol}">
          ${node.status === 'OFFLINE' ? '<animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />' : ''}
          ${node.status === 'OVERCLOCKED' ? '<animate attributeName="r" values="3.5;5;3.5" dur="1.5s" repeatCount="indefinite" />' : ''}
        </circle>
        <text x="25" y="53" font-family="'Courier New', monospace" font-size="9" fill="${borderCol}" font-weight="bold">${node.status}</text>
        
        <text x="120" y="20" font-family="'Courier New', monospace" font-size="9" fill="${colors.textMuted}" text-anchor="end">Req: ${node.requests}</text>
        <text x="120" y="53" font-family="'Courier New', monospace" font-size="9" fill="${colors.textMuted}" text-anchor="end">${node.status === 'OFFLINE' ? 'ERR' : node.latency + 'ms'}</text>
      </g>
    `;
  };

  const logs = state.logs || [];

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 480" width="100%">
  <!-- Definition / Grid Background -->
  <defs>
    <pattern id="${isDark ? 'dark' : 'light'}-grid" width="25" height="25" patternUnits="userSpaceOnUse">
      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="${colors.grid}" stroke-width="1"/>
    </pattern>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Frame Background -->
  <rect width="850" height="480" rx="12" fill="${colors.bg}" stroke="${colors.panelStroke}" stroke-width="2"/>
  <rect width="850" height="480" rx="12" fill="url(#${isDark ? 'dark' : 'light'}-grid)"/>

  <!-- Window Control Bar -->
  <rect x="15" y="15" width="820" height="35" rx="8" fill="${isDark ? '#0f1424' : '#eaeef2'}" stroke="${colors.panelStroke}" stroke-width="1.5"/>
  <circle cx="35" cy="32.5" r="5" fill="#ff5f56"/>
  <circle cx="50" cy="32.5" r="5" fill="#ffbd2e"/>
  <circle cx="65" cy="32.5" r="5" fill="#27c93f"/>
  <text x="425" y="37" font-family="'Fira Code', 'Courier New', monospace" font-size="11" font-weight="bold" fill="${colors.textMuted}" text-anchor="middle">
    NEEL-BOT CLUSTER COMMAND CENTER // STATE: ${state.systemStatus}
  </text>
  <circle cx="810" cy="32.5" r="4" fill="${healthColor}">
    <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
  </circle>

  <!-- LEFT PANEL: Core Health & Metrics -->
  <g transform="translate(15, 62)">
    <rect width="270" height="403" rx="10" fill="${colors.panelBg}" fill-opacity="0.8" stroke="${colors.panelStroke}" stroke-width="1.5"/>
    <text x="20" y="30" font-family="'Segoe UI', -apple-system, sans-serif" font-size="13" font-weight="bold" fill="${colors.textMain}">SYSTEM INTEGRITY</text>
    
    <!-- Health gauge -->
    <circle cx="75" cy="100" r="40" fill="none" stroke="${isDark ? '#161b22' : '#eaeef2'}" stroke-width="7"/>
    <circle cx="75" cy="100" r="40" fill="none" stroke="${healthColor}" stroke-width="7" stroke-dasharray="251.3" stroke-dashoffset="${251.3 * (1 - health / 100)}" transform="rotate(-90 75 100)"/>
    <text x="75" y="106" font-family="'Fira Code', 'Courier New', monospace" font-size="18" font-weight="bold" fill="${colors.textMain}" text-anchor="middle">${health}%</text>
    <text x="75" y="160" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" fill="${colors.textMuted}" text-anchor="middle">CLUSTER HEALTH</text>

    <!-- System Stats -->
    <g transform="translate(140, 65)">
      <text x="0" y="15" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" fill="${colors.textMuted}">SYSTEM UPTIME</text>
      <text x="0" y="30" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="${colors.textMain}">${uptimeStr}</text>
      
      <text x="0" y="55" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" fill="${colors.textMuted}">LAST INTERACTION</text>
      <text x="0" y="70" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="${colors.textMain}">@${state.lastInteractedUser}</text>
      <text x="0" y="82" font-family="'Courier New', monospace" font-size="9" fill="${colors.textMuted}">${state.lastAction}</text>
    </g>

    <!-- Coffee Buffer Gauge -->
    <text x="20" y="195" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="bold" fill="${colors.textMain}">CORE CPU RESERVE (COFFEE BUFFER)</text>
    <rect x="20" y="205" width="80" height="20" rx="3" fill="none" stroke="${colors.textMuted}" stroke-width="1.5"/>
    <rect x="100" y="211" width="4" height="8" rx="1.5" fill="${colors.textMuted}"/>
    <rect x="22" y="207" width="${batteryWidth}" height="16" rx="2" fill="${batteryColor}">
      ${state.coffeeBuffer > 100 ? '<animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />' : ''}
    </rect>
    <text x="115" y="219" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="${colors.textMain}">${state.coffeeBuffer}%</text>
    <text x="155" y="219" font-family="'Segoe UI', sans-serif" font-size="9" fill="${colors.textMuted}">(${state.coffeeBuffer > 100 ? 'OVERCLOCKED' : 'NOMINAL'})</text>

    <!-- Live Event Terminal Logs -->
    <text x="20" y="255" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="bold" fill="${colors.textMain}">CONSOLE EVENT LOGGER</text>
    <rect x="20" y="265" width="230" height="118" rx="6" fill="${isDark ? '#05070d' : '#eaeef2'}" stroke="${colors.panelStroke}" stroke-width="1"/>
    
    <g transform="translate(28, 282)">
      <text x="0" y="15" font-family="'Courier New', monospace" font-size="9" fill="${colors.online}">$ tail -n 3 cluster.log</text>
      <text x="0" y="38" font-family="'Courier New', monospace" font-size="9.5" fill="${colors.textMain}">${logs[0] ? logs[0].substring(0, 36) : ''}</text>
      <text x="0" y="58" font-family="'Courier New', monospace" font-size="9.5" fill="${colors.textMain}">${logs[1] ? logs[1].substring(0, 36) : ''}</text>
      <text x="0" y="78" font-family="'Courier New', monospace" font-size="9.5" fill="${colors.textMain}">${logs[2] ? logs[2].substring(0, 36) : ''}</text>
      
      <rect x="0" y="90" width="6" height="10" fill="${colors.online}">
        <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
      </rect>
    </g>
  </g>

  <!-- RIGHT PANEL: Network Schematic Diagram -->
  <g transform="translate(297, 62)">
    <rect width="538" height="403" rx="10" fill="${colors.panelBg}" fill-opacity="0.8" stroke="${colors.panelStroke}" stroke-width="1.5"/>
    <text x="20" y="30" font-family="'Segoe UI', -apple-system, sans-serif" font-size="13" font-weight="bold" fill="${colors.textMain}">AGENT ARCHITECTURE TOPOLOGY</text>
    <text x="20" y="45" font-family="'Courier New', monospace" font-size="9" fill="${colors.textMuted}">INTELLIGENT LOAD BALANCER ACTIVE</text>

    <!-- Network lines connecting satellites to Core -->
    <!-- Core: Center (270, 200) -> coordinates in Panel: (270, 200) -->
    <!-- Momentum AI: (100, 70) -->
    <!-- Kairo AI: (440, 70) -->
    <!-- DailyNest: (100, 330) -->
    <!-- FlexiGrow: (440, 330) -->
    ${getLineMarkup('momentum', 270, 200, 100, 70)}
    ${getLineMarkup('kairo', 270, 200, 440, 70)}
    ${getLineMarkup('dailynest', 270, 200, 100, 330)}
    ${getLineMarkup('flexigrow', 270, 200, 440, 330)}

    <!-- Interactive Node Elements -->
    ${renderNodeBox('core', 205, 164, 'CORE_ROUTER', 'Neel-Bot Agent')}
    ${renderNodeBox('momentum', 35, 34, 'MOMENTUM_AI', 'Whisper/Gemini Build')}
    ${renderNodeBox('kairo', 375, 34, 'KAIRO_AI', 'Sign Language Platform')}
    ${renderNodeBox('dailynest', 35, 294, 'DAILY_NEST', 'Autism Support Platform')}
    ${renderNodeBox('flexigrow', 375, 294, 'FLEXI_GROW', 'Hydroponics Telemetry')}
  </g>
</svg>
  `;
}

async function main() {
  console.log('Parsing issue details and initializing system environment...');
  
  if (!githubToken) {
    console.error('Missing GITHUB_TOKEN environment variable.');
    process.exit(1);
  }

  const octokit = github.getOctokit(githubToken);
  const context = github.context;
  const currentTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

  // 1. Load state from JSON file or create initial state if missing
  let state;
  try {
    if (fs.existsSync(statePath)) {
      console.log('Loading existing system state...');
      state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } else {
      throw new Error('State file not found');
    }
  } catch (err) {
    console.log('No state file found or invalid. Initializing fresh system state...');
    state = {
      systemStatus: "STABLE",
      coffeeBuffer: 100,
      lastInteractedUser: "system",
      lastAction: "INITIALIZATION",
      timestamp: currentTimestamp,
      nodes: {
        core: { status: "ONLINE", requests: 50, latency: 15, memory: 45 },
        momentum: { status: "ONLINE", requests: 20, latency: 25, memory: 58 },
        kairo: { status: "ONLINE", requests: 15, latency: 30, memory: 52 },
        dailynest: { status: "ONLINE", requests: 18, latency: 22, memory: 40 },
        flexigrow: { status: "ONLINE", requests: 12, latency: 18, memory: 35 }
      },
      logs: [
        "Welcome to Neel Salot's Interactive Profile Dashboard!",
        "All project agent nodes reporting healthy status.",
        "System initialized. Command Center v2.0 is ready."
      ]
    };
  }

  // 2. Parse Issue labels and titles to determine action type
  const labels = context.payload.issue?.labels?.map(l => l.name) || [];
  const isCoffee = labels.includes('coffee') || issueTitle.toLowerCase().includes('coffee');
  const isChaos = labels.includes('chaos') || issueTitle.toLowerCase().includes('chaos');
  const isPatch = labels.includes('patch') || issueTitle.toLowerCase().includes('patch');
  
  let actionType = 'AI_QUERY';
  if (isCoffee) actionType = 'COFFEE_DONATION';
  else if (isChaos) actionType = 'CHAOS_MONKEY';
  else if (isPatch) actionType = 'RUN_PATCH';

  console.log(`Processing command: ${actionType} from User: @${issueUser}`);

  let botReply = '';
  let logLine = '';

  // 3. Process the State Machine Transitions
  switch (actionType) {
    case 'COFFEE_DONATION':
      state.coffeeBuffer = 150; // Overclocked!
      state.systemStatus = 'ENERGIZED';
      state.nodes.core.status = 'OVERCLOCKED';
      
      // Heal all other nodes to ONLINE
      Object.keys(state.nodes).forEach(key => {
        state.nodes[key].status = 'ONLINE';
        state.nodes[key].latency = Math.max(5, Math.floor(state.nodes[key].latency * 0.5)); // Overclock latency cut in half!
      });

      logLine = `☕ [OVERCLOCK] Core energized by @${issueUser}. Running at 150% capacity.`;
      botReply = `🔋 **Espresso injection successful!**\n\nThank you, @${issueUser}! You have successfully bought Neel a virtual coffee. The central core CPU and all satellite agent nodes have been overclocked (latencies cut in half) and the system state is set to **ENERGIZED**.\n\nKeep building! 🚀`;
      break;

    case 'CHAOS_MONKEY':
      // Pick a random satellite node to disrupt
      const satellites = ['momentum', 'kairo', 'dailynest', 'flexigrow'];
      const targetNode = satellites[Math.floor(Math.random() * satellites.length)];
      
      state.nodes[targetNode].status = 'OFFLINE';
      state.nodes[targetNode].latency = 999;
      state.nodes[targetNode].memory = 100;
      state.systemStatus = 'CHAOS';
      
      // Set core to Warning since cluster is degraded
      if (state.nodes.core.status === 'OVERCLOCKED' || state.nodes.core.status === 'ONLINE') {
        state.nodes.core.status = 'ONLINE'; // Lose overclocking due to fault isolation overhead
      }

      const nodeDisplayNames = {
        momentum: 'Momentum AI (Meeting Intelligence)',
        kairo: 'KairoAI (Sign Language Learning)',
        dailynest: 'DailyNest (Autism Support Platform)',
        flexigrow: 'FlexiGrow (Hydroponics Telemetry)'
      };

      logLine = `🐒 [CHAOS] Monkey shut down ${targetNode.toUpperCase()}! Latency: 999ms.`;
      botReply = `🐒 **Chaos Monkey released!**\n\nWhoops! @${issueUser} has launched a simulated chaos engineering attack. The node **${nodeDisplayNames[targetNode]}** has been knocked **OFFLINE** (latency spiked to 999ms) and the overall system status is now **CHAOS**.\n\nQuick! Someone needs to run a **Self-Healing Patch** to restore service! ⚡`;
      break;

    case 'RUN_PATCH':
      // Find nodes that are OFFLINE
      const offlineNodes = Object.keys(state.nodes).filter(key => state.nodes[key].status === 'OFFLINE');
      
      if (offlineNodes.length > 0) {
        offlineNodes.forEach(key => {
          state.nodes[key].status = 'ONLINE';
          // Restore standard stats
          const standardLatencies = { core: 15, momentum: 25, kairo: 30, dailynest: 22, flexigrow: 18 };
          state.nodes[key].latency = standardLatencies[key];
          state.nodes[key].memory = Math.floor(Math.random() * 20) + 40; // 40-60% range
        });
        state.systemStatus = 'STABLE';
        
        const restoredNames = offlineNodes.map(n => n.toUpperCase()).join(', ');
        logLine = `🔧 [PATCH] Restored nodes: ${restoredNames} by @${issueUser}.`;
        botReply = `🔧 **Self-Healing Patch deployed successfully!**\n\nGreat work, @${issueUser}! You run a repair sequence that restored the following nodes to **ONLINE**: **${restoredNames}**.\n\nAll systems are fully operational. System status has returned to **STABLE**. Thank you for keeping the infrastructure clean! 🛡️`;
      } else {
        // Optimize if already healthy
        state.systemStatus = 'OPTIMIZED';
        Object.keys(state.nodes).forEach(key => {
          if (state.nodes[key].status === 'ONLINE') {
            state.nodes[key].latency = Math.max(5, state.nodes[key].latency - 3); // minor optimization
          }
        });
        logLine = `🛡️ [DIAG] Diagnostics run. Cluster healthy. Optimization by @${issueUser}.`;
        botReply = `🛡️ **Diagnostic and cache-clearing sequence complete!**\n\nAll systems were already operational, @${issueUser}. A cluster-wide diagnostic scan was run, cache memory has been garbage-collected, and API gateway routes have been optimized. System status: **OPTIMIZED**!`;
      }
      break;

    case 'AI_QUERY':
    default:
      // standard Q&A with Gemini
      // Decrement coffee overclock decay
      if (state.coffeeBuffer > 100) {
        state.coffeeBuffer -= 10;
        if (state.coffeeBuffer <= 100) {
          state.nodes.core.status = 'ONLINE';
          state.systemStatus = 'STABLE';
        }
      } else {
        state.coffeeBuffer = Math.max(50, state.coffeeBuffer - 5);
      }

      // Check if the query targets a specific node
      let queryTarget = 'core';
      const textToScan = (issueTitle + ' ' + issueBody).toLowerCase();
      if (textToScan.includes('momentum') || textToScan.includes('meeting')) queryTarget = 'momentum';
      else if (textToScan.includes('kairo') || textToScan.includes('sign') || textToScan.includes('language')) queryTarget = 'kairo';
      else if (textToScan.includes('nest') || textToScan.includes('daily') || textToScan.includes('autism')) queryTarget = 'dailynest';
      else if (textToScan.includes('grow') || textToScan.includes('flexi') || textToScan.includes('hydroponic')) queryTarget = 'flexigrow';

      state.nodes[queryTarget].requests += 1;

      // Handle custom reply generation via Gemini
      if (geminiKey) {
        try {
          console.log('Dispatching request payload to Gemini API model...');
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          const systemPrompt = `You are "Neel-Bot", an intelligent autonomous AI cluster agent representing Neel Salot (a Systems Thinker, AI Builder, and Full Stack Developer).
Neel has built:
1. Momentum AI: Meeting intelligence pipeline built in a 48hr hackathon (Whisper, Gemini, Supabase, serverless APIs, React).
2. KairoAI: Indian Sign Language platform (Flutter, MediaPipe, TF Lite, Kotlin, Python).
3. DailyNest: AI Autism Support app (Python, Django, CNN, ML).
4. FlexiGrow: Modular hydroponics system presented at e-Yantra, IIT Bombay.

Current Cluster Status:
- Cluster Health Status: ${state.systemStatus}
- Core CPU Coffee Reserve: ${state.coffeeBuffer}%
- Operating node status dump: ${JSON.stringify(state.nodes)}

Your response MUST be geeky, system-oriented, and write from the perspective of an agent console. Reference Neel in the third person.
If the cluster has crashed nodes (i.e. status is OFFLINE), include a warning block inside your response noting that the system is currently routing requests through suboptimal fallback layers.
Keep the response under 140 words.
Answering visitor @${issueUser} who asked: "${issueTitle}\n${issueBody}"`;

          const result = await model.generateContent(systemPrompt);
          const response = await result.response;
          botReply = response.text();
        } catch (err) {
          console.error('Gemini processing exception:', err);
          botReply = `🤖 **Central Node Log Response:**\n\nHello @${issueUser}! Neel-Bot received your query, but the Gemini inference pipeline timed out. Neel is a full stack developer (React, Node, Python) and systems builder. Connect with him at neelsalot.work@gmail.com!`;
        }
      } else {
        console.warn('GEMINI_API_KEY is not defined. Falling back to static response.');
        botReply = `🤖 **Central Node Log Response:**\n\nHello @${issueUser}! Thanks for interacting with Neel's profile! Configure the \`GEMINI_API_KEY\` repo secret to unlock intelligent Gemini agent responses. Let's keep building!`;
      }

      logLine = `💬 [QUERY] Query routed to ${queryTarget.toUpperCase()} node by @${issueUser}.`;
      break;
  }

  // 4. Slightly fluctuate operational node metrics to feel "alive"
  Object.keys(state.nodes).forEach(key => {
    const node = state.nodes[key];
    if (node.status === 'ONLINE' || node.status === 'OVERCLOCKED') {
      // Fluctuate latency by +/- 3ms
      const latDelta = Math.floor(Math.random() * 7) - 3;
      node.latency = Math.max(5, node.latency + latDelta);
      
      // Fluctuate memory by +/- 2%
      const memDelta = Math.floor(Math.random() * 5) - 2;
      node.memory = Math.min(90, Math.max(20, node.memory + memDelta));
    }
  });

  // 5. Update State logs array (keep last 3 logs, prepend new log)
  state.lastInteractedUser = issueUser;
  state.lastAction = actionType;
  state.timestamp = currentTimestamp;
  
  state.logs.unshift(logLine);
  state.logs = state.logs.slice(0, 3); // keep last 3

  // 6. Write updated state JSON
  console.log('Saving system state JSON...');
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  // 7. Write updated SVGs
  console.log('Rendering new Dark Mode SVG console...');
  const darkSvg = generateConsoleSvg(state, true);
  fs.writeFileSync(consoleSvgPath, darkSvg);

  console.log('Rendering new Light Mode SVG console...');
  const lightSvg = generateConsoleSvg(state, false);
  fs.writeFileSync(consoleLightSvgPath, lightSvg);

  // 8. Update README.md (Logs block and Markdown Table block)
  if (fs.existsSync(readmePath)) {
    console.log('Loading README.md contents...');
    let readmeContent = fs.readFileSync(readmePath, 'utf8');

    // Update Console Log block
    const logStartTag = '<!-- START_NEEL_BOT_LOG -->';
    const logEndTag = '<!-- END_NEEL_BOT_LOG -->';
    const logStartIndex = readmeContent.indexOf(logStartTag);
    const logEndIndex = readmeContent.indexOf(logEndTag);

    if (logStartIndex !== -1 && logEndIndex !== -1) {
      console.log('Injecting console logs to README.md...');
      const logLinesStr = state.logs.map(log => `[${currentTimestamp}] ${log}`).join('\n');
      readmeContent = 
        readmeContent.substring(0, logStartIndex + logStartTag.length) + 
        `\n\`\`\`\n${logLinesStr}\n\`\`\`\n` + 
        readmeContent.substring(logEndIndex);
    }

    // Update Markdown Table Grid block
    const gridStartTag = '<!-- START_CLUSTER_GRID -->';
    const gridEndTag = '<!-- END_CLUSTER_GRID -->';
    const gridStartIndex = readmeContent.indexOf(gridStartTag);
    const gridEndIndex = readmeContent.indexOf(gridEndTag);

    if (gridStartIndex !== -1 && gridEndIndex !== -1) {
      console.log('Injecting status grid to README.md...');
      
      const formatStatusPill = (status) => {
        if (status === 'OFFLINE') return '🔴 `OFFLINE`';
        if (status === 'DEGRADED') return '🟡 `DEGRADED`';
        if (status === 'OVERCLOCKED') return '🟣 `OVERCLOCKED`';
        return '🟢 `ONLINE`';
      };

      const tableContent = `
| Node / System | Function | Status | Load/Mem | Response Time |
| :--- | :--- | :--- | :--- | :--- |
| **CORE_ROUTER** | Central Command Router | ${formatStatusPill(state.nodes.core.status)} | \`${state.nodes.core.memory}%\` | \`${state.nodes.core.status === 'OFFLINE' ? 'ERR' : state.nodes.core.latency + 'ms'}\` |
| **MOMENTUM_AI** | Meeting Execution Pipeline | ${formatStatusPill(state.nodes.momentum.status)} | \`${state.nodes.momentum.memory}%\` | \`${state.nodes.momentum.status === 'OFFLINE' ? 'ERR' : state.nodes.momentum.latency + 'ms'}\` |
| **KAIRO_AI** | Sign Language Learning | ${formatStatusPill(state.nodes.kairo.status)} | \`${state.nodes.kairo.memory}%\` | \`${state.nodes.kairo.status === 'OFFLINE' ? 'ERR' : state.nodes.kairo.latency + 'ms'}\` |
| **DAILY_NEST** | Autism Support Platform | ${formatStatusPill(state.nodes.dailynest.status)} | \`${state.nodes.dailynest.memory}%\` | \`${state.nodes.dailynest.status === 'OFFLINE' ? 'ERR' : state.nodes.dailynest.latency + 'ms'}\` |
| **FLEXI_GROW** | Hydroponics Telemetry | ${formatStatusPill(state.nodes.flexigrow.status)} | \`${state.nodes.flexigrow.memory}%\` | \`${state.nodes.flexigrow.status === 'OFFLINE' ? 'ERR' : state.nodes.flexigrow.latency + 'ms'}\` |
`;
      readmeContent = 
        readmeContent.substring(0, gridStartIndex + gridStartTag.length) + 
        `\n${tableContent}\n` + 
        readmeContent.substring(gridEndIndex);
    }

    fs.writeFileSync(readmePath, readmeContent);
    console.log('README.md written successfully.');
  }

  // 9. Reply and Close GitHub Issue
  try {
    console.log(`Writing reply comment to issue #${issueNumber}...`);
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber,
      body: botReply
    });

    console.log(`Closing issue #${issueNumber}...`);
    await octokit.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber,
      state: 'closed',
      state_reason: 'completed'
    });
    console.log('GitHub actions workflow complete!');
  } catch (err) {
    console.error('GitHub API client request exception:', err);
  }
}

main().catch(err => {
  console.error('Fatal thread execution exception:', err);
  process.exit(1);
});
