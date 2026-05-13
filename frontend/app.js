/* ══════════════════════════════════════════════
   NEXUS — Multi Agent Research System
   Interactive Frontend Application
   ══════════════════════════════════════════════ */

(() => {
  "use strict";

  // ── DOM References ──────────────────────────
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");
  const cursorGlow = document.getElementById("cursorGlow");
  const rippleContainer = document.getElementById("rippleContainer");
  const inputSection = document.getElementById("inputSection");
  const topicInput = document.getElementById("topicInput");
  const submitBtn = document.getElementById("submitBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const fileInput = document.getElementById("fileInput");
  const uploadStatus = document.getElementById("uploadStatus");

  const pipelineSection = document.getElementById("pipelineSection");
  const pipelineTimer = document.getElementById("pipelineTimer");
  
  const sourcesContainer = document.getElementById("sourcesContainer");
  const sourcesGrid = document.getElementById("sourcesGrid");

  const reportSection = document.getElementById("reportSection");
  const reportTopic = document.getElementById("reportTopic");
  const reportContent = document.getElementById("reportContent");
  const feedbackSection = document.getElementById("feedbackSection");
  const feedbackScore = document.getElementById("feedbackScore");
  const feedbackContent = document.getElementById("feedbackContent");
  const errorSection = document.getElementById("errorSection");
  const errorMessage = document.getElementById("errorMessage");
  const retryBtn = document.getElementById("retryBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const headerStatus = document.getElementById("headerStatus");
  const reportContainer = document.getElementById("reportContainer");

  let mouse = { x: -200, y: -200 };
  let cursorTarget = { x: -200, y: -200 };
  let cursorPos = { x: -200, y: -200 };
  let timerInterval = null;
  let startTime = null;
  let rawReportMarkdown = "";
  let currentTopic = "";
  
  let currentTaskId = null;
  let eventSource = null;
  let uploadedContext = "";
  let isStreaming = false;

  // ══════════════════════════════════════════════
  // CONSTELLATION MESH SYSTEM (noodlemagazine style)
  // ══════════════════════════════════════════════

  const particles = [];
  const PARTICLE_COUNT = 250;
  const MAX_PARTICLES = 500;
  const CONNECTION_DIST = 120;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Theme-matched color palette for particles
  const MESH_COLORS = [
    [0, 212, 255],    // cyan
    [100, 200, 255],  // light blue
    [139, 92, 246],   // purple
    [160, 140, 255],  // periwinkle
    [180, 220, 255],  // ice
    [200, 200, 230],  // soft silver
  ];

  class Particle {
    constructor(x, y, burst) {
      if (burst) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.003 + 0.001;
        this.radius = Math.random() * 2 + 1;
      } else {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        // Higher base velocity so ALL particles visibly drift
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.4 + 0.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = 0;
        this.radius = Math.random() * 1.8 + 0.5;
      }
      // Pick a theme color
      const c = MESH_COLORS[Math.floor(Math.random() * MESH_COLORS.length)];
      this.r = c[0]; this.g = c[1]; this.b = c[2];
      this.alpha = Math.random() * 0.5 + 0.3;
    }

    update() {
      // Mouse gravity well
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 200 && dist > 0) {
        const force = (200 - dist) / 200 * 0.015;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }

      // Speed limit
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 2.5) {
        this.vx = (this.vx / speed) * 2.5;
        this.vy = (this.vy / speed) * 2.5;
      }

      this.vx *= 0.999;
      this.vy *= 0.999;

      this.x += this.vx;
      this.y += this.vy;

      if (this.decay > 0) {
        this.life -= this.decay;
      }

      // Wrap (permanent particles only)
      if (this.decay === 0) {
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }
    }

    draw() {
      const a = this.alpha * this.life;
      if (a <= 0.01) return;

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${a})`;
      ctx.fill();
    }

    isDead() {
      return this.life <= 0;
    }
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].life <= 0.01) continue;
      for (let j = i + 1; j < particles.length; j++) {
        if (particles[j].life <= 0.01) continue;
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          const a = (1 - dist / CONNECTION_DIST) * 0.15 * particles[i].life * particles[j].life;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${a})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  // Draw extra connections to mouse position
  function drawMouseConnections() {
    if (mouse.x < 0) return;
    for (let i = 0; i < particles.length; i++) {
      const dx = particles[i].x - mouse.x;
      const dy = particles[i].y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const a = (1 - dist / 150) * 0.25 * particles[i].life;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(particles[i].x, particles[i].y);
        ctx.strokeStyle = `rgba(0, 212, 255, ${a})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  function spawnBurst(x, y) {
    const count = Math.floor(Math.random() * 7) + 12;
    for (let i = 0; i < count; i++) {
      if (particles.length < MAX_PARTICLES) {
        particles.push(new Particle(x, y, true));
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Remove dead particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      if (particles[i].isDead()) {
        particles.splice(i, 1);
      }
    }

    drawConnections();
    drawMouseConnections();

    // Draw particles on top of lines
    for (let i = 0; i < particles.length; i++) {
      particles[i].draw();
    }

    requestAnimationFrame(animateParticles);
  }

  // ══════════════════════════════════════════════
  // CURSOR EFFECTS
  // ══════════════════════════════════════════════

  function updateCursor() {
    cursorPos.x += (cursorTarget.x - cursorPos.x) * 0.15;
    cursorPos.y += (cursorTarget.y - cursorPos.y) * 0.15;

    cursorGlow.style.left = cursorPos.x + "px";
    cursorGlow.style.top = cursorPos.y + "px";

    requestAnimationFrame(updateCursor);
  }

  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    cursorTarget.x = e.clientX;
    cursorTarget.y = e.clientY;
  });

  // Hover effect for interactive elements
  document.addEventListener("mouseover", (e) => {
    const t = e.target;
    if (t.matches("button, input, a, .step-card, .retry-btn")) {
      cursorGlow.classList.add("hovering");
    }
  });

  document.addEventListener("mouseout", (e) => {
    const t = e.target;
    if (t.matches("button, input, a, .step-card, .retry-btn")) {
      cursorGlow.classList.remove("hovering");
    }
  });

  // Click spawns new particles
  document.addEventListener("click", (e) => {
    if (!e.target.closest("button, input, a, .glass-panel")) {
      spawnBurst(e.clientX, e.clientY);
    }
  });

  function createRipple(x, y) {
    const ripple = document.createElement("div");
    ripple.className = "ripple";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripple.style.width = "0px";
    ripple.style.height = "0px";
    rippleContainer.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  }

  // ══════════════════════════════════════════════
  // MARKDOWN RENDERER (lightweight)
  // ══════════════════════════════════════════════

  function renderMarkdown(md) {
    let html = md
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
      // Headings
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr>')
      // Blockquote
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Unordered list
      .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
      // Ordered list
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');

    // Paragraphs: wrap remaining lines
    html = html.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return line;
      return `<p>${line}</p>`;
    }).join('\n');

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  // ══════════════════════════════════════════════
  // PIPELINE TIMER
  // ══════════════════════════════════════════════

  function startTimer() {
    startTime = Date.now();
    pipelineTimer.textContent = "00:00";
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      pipelineTimer.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  // ══════════════════════════════════════════════
  // STEP CARDS
  // ══════════════════════════════════════════════

  const checkSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
  const spinnerSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>';

  function setStepState(stepNum, state, description) {
    const card = document.querySelector(`.step-card[data-step="${stepNum}"]`);
    if (!card) return;

    card.classList.remove("running", "done");
    card.classList.add(state);

    const icon = card.querySelector(".step-status-icon");
    if (state === "running") {
      icon.innerHTML = spinnerSVG;
    } else if (state === "done") {
      icon.innerHTML = checkSVG;
    }

    if (description) {
      card.querySelector(".step-desc").textContent = description;
    }
  }

  function resetSteps() {
    document.querySelectorAll(".step-card").forEach(card => {
      card.classList.remove("running", "done");
      const icon = card.querySelector(".step-status-icon");
      icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
    });
  }

  // ══════════════════════════════════════════════
  // WEBSOCKET + PIPELINE
  // ══════════════════════════════════════════════

  function showSection(section) {
    section.classList.remove("hidden");
    section.classList.add("fade-in");
  }

  function hideAllResults() {
    [pipelineSection, reportSection, feedbackSection, errorSection, sourcesContainer].forEach(s => {
      s.classList.add("hidden");
      s.classList.remove("fade-in");
    });
    reportContent.innerHTML = "";
    feedbackContent.innerHTML = "";
    feedbackScore.innerHTML = "";
    sourcesGrid.innerHTML = "";
    resetSteps();
  }

  // ── Network Utility ────────────────────────
  const API_BASE = location.hostname === "localhost" ? `http://localhost:${location.port}/api` : "/api";

  async function cancelResearch() {
    if (!currentTaskId) return;
    try {
      await fetch(`${API_BASE}/cancel/${currentTaskId}`, { method: "POST" });
    } catch(e) {}
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    stopTimer();
    finishPipeline();
    headerStatus.className = "header-status";
    headerStatus.querySelector("span").textContent = "Cancelled";
  }

  function clearUpload() {
    uploadedContext = "";
    fileInput.value = "";
    uploadStatus.classList.add("hidden");
    uploadStatus.textContent = "";
  }

  async function handleUpload(file) {
    if (!file) return;
    uploadStatus.textContent = "Uploading...";
    uploadStatus.classList.remove("hidden");
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        uploadedContext = data.extracted_text;
        uploadStatus.innerHTML = `📎 ${file.name} attached. <span class="remove-attachment" id="removeAttachment">✕ Remove</span>`;
        document.getElementById("removeAttachment").addEventListener("click", clearUpload);
      } else {
        uploadStatus.textContent = `Upload failed: ${data.detail}`;
      }
    } catch(e) {
      uploadStatus.textContent = "Upload failed.";
    }
  }

  async function startResearch(topic) {
    hideAllResults();
    showSection(pipelineSection);
    startTimer();

    submitBtn.disabled = true;
    submitBtn.classList.add("hidden");
    cancelBtn.classList.remove("hidden");
    uploadBtn.classList.add("hidden");
    fileInput.disabled = true;
    
    headerStatus.className = "header-status running";
    headerStatus.querySelector("span").textContent = "Researching";
    
    rawReportMarkdown = "";
    currentTopic = topic;

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, context: uploadedContext })
      });
      
      const data = await res.json();
      currentTaskId = data.task_id;
      
      // Connect to SSE
      eventSource = new EventSource(`${API_BASE}/stream/${currentTaskId}`);
      
      eventSource.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleStreamEvent(msg);
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        stopTimer();
        finishPipeline();
        showSection(errorSection);
        errorMessage.textContent = "Connection lost. Please try again.";
      };
      
    } catch (e) {
      stopTimer();
      finishPipeline();
      showSection(errorSection);
      errorMessage.textContent = "Server error. Could not start research.";
    }
  }

  function handleStreamEvent(msg) {
    switch (msg.type) {
      case "workflow":
        // For simplicity, we just mark step 1 running if it's searching, step 2 if scraping, etc.
        if (msg.stage.toLowerCase().includes("plan") || msg.stage.toLowerCase().includes("search")) {
          setStepState(1, "running", msg.stage);
        } else if (msg.stage.toLowerCase().includes("scrap") || msg.stage.toLowerCase().includes("parallel")) {
          setStepState(1, "done");
          setStepState(2, "running", msg.stage);
        } else if (msg.stage.toLowerCase().includes("synthesiz")) {
          setStepState(2, "done");
          setStepState(3, "running", msg.stage);
          showSection(reportSection);
          reportTopic.textContent = currentTopic;
        } else if (msg.stage.toLowerCase().includes("critiq")) {
          setStepState(3, "done");
          setStepState(4, "running", msg.stage);
        } else if (msg.stage.toLowerCase().includes("finaliz")) {
          setStepState(4, "done");
        }
        break;

      case "token":
        if (reportSection.classList.contains("hidden")) {
            showSection(reportSection);
            reportTopic.textContent = currentTopic;
        }
        rawReportMarkdown += msg.content;
        reportContent.innerHTML = renderMarkdown(rawReportMarkdown);
        // Scroll to bottom of report smoothly
        const reportScroll = document.documentElement.scrollTop + reportContainer.getBoundingClientRect().bottom;
        if (reportScroll > window.scrollY + window.innerHeight - 100) {
            window.scrollBy({ top: 50, behavior: 'auto' });
        }
        break;
        
      case "sources":
        showSection(sourcesContainer);
        sourcesGrid.innerHTML = msg.data.map(src => `
          <div class="source-card">
            <a href="${src.url}" target="_blank" class="source-title">${src.title || 'Source'}</a>
            <div class="source-url">${src.url}</div>
            <div class="source-snippet">${src.snippet}</div>
          </div>
        `).join("");
        break;

      case "feedback":
        showSection(feedbackSection);
        renderFeedback(msg.data);
        break;

      case "error":
        stopTimer();
        finishPipeline();
        showSection(errorSection);
        errorMessage.textContent = msg.message;
        break;

      case "complete":
        stopTimer();
        finishPipeline();
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        break;
    }
  }

  // (typing effect removed, using true token streaming directly in handleStreamEvent)

  // ── Render feedback with score extraction ──
  function renderFeedback(text) {
    // Extract score
    const scoreMatch = text.match(/Score:\s*(\d+)\s*\/\s*(\d+)/i);
    if (scoreMatch) {
      const score = scoreMatch[1];
      const total = scoreMatch[2];
      feedbackScore.innerHTML = `
        <div class="score-number">${score}</div>
        <div class="score-label">out of ${total}</div>
      `;
    } else {
      feedbackScore.innerHTML = `
        <div class="score-number">—</div>
        <div class="score-label">score</div>
      `;
    }

    // Render remaining feedback
    const feedbackHTML = text
      .replace(/Score:\s*\d+\s*\/\s*\d+/i, '')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
      .replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>')
      .split('\n')
      .filter(l => l.trim())
      .map(l => {
        if (l.trim().startsWith('<')) return l;
        if (l.match(/^(Strengths|Areas to Improve|Verdict):/i)) {
          return `<strong>${l.trim()}</strong>`;
        }
        return `<p>${l}</p>`;
      })
      .join('\n');

    feedbackContent.innerHTML = feedbackHTML;

    setTimeout(() => {
      feedbackSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  // ── Finish pipeline (reset UI state) ────────
  function finishPipeline() {
    submitBtn.disabled = false;
    submitBtn.classList.remove("hidden");
    cancelBtn.classList.add("hidden");
    uploadBtn.classList.remove("hidden");
    fileInput.disabled = false;
    
    headerStatus.className = "header-status";
    headerStatus.querySelector("span").textContent = "Complete";
    setTimeout(() => {
      if (headerStatus.querySelector("span").textContent === "Complete") {
          headerStatus.querySelector("span").textContent = "Ready";
      }
    }, 5000);
  }

  // ── Download report as markdown ─────────────
  function downloadReport() {
    if (!rawReportMarkdown) return;
    const blob = new Blob([rawReportMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = currentTopic.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_").substring(0, 50);
    a.download = `${safeName || "research_report"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ══════════════════════════════════════════════
  // EVENT LISTENERS
  // ══════════════════════════════════════════════

  uploadBtn.addEventListener("click", () => fileInput.click());
  
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleUpload(e.target.files[0]);
    }
  });

  cancelBtn.addEventListener("click", cancelResearch);

  submitBtn.addEventListener("click", () => {
    const topic = topicInput.value.trim();
    if (topic) startResearch(topic);
  });

  topicInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const topic = topicInput.value.trim();
      if (topic) startResearch(topic);
    }
  });

  downloadBtn.addEventListener("click", downloadReport);

  retryBtn.addEventListener("click", () => {
    errorSection.classList.add("hidden");
    topicInput.focus();
  });

  // ══════════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════════

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  initParticles();
  animateParticles();
  updateCursor();

  // Focus input
  topicInput.focus();

})();
