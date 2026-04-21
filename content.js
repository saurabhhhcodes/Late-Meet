// Content Script — Google Meet Integration
// Injected into Google Meet pages to detect meetings, monitor participants,
// and display private late-joiner briefs locally

(function() {
  'use strict';

  const COPILOT_PREFIX = '[MeetingCopilot]';
  let meetingDetected = false;
  let participantPollInterval = null;
  let previousParticipants = [];
  let meetingId = null;
  let briefOverlayVisible = false;
  const pageLoadTime = Date.now();

  // ——— Meeting Detection ———
  function extractMeetingId() {
    const url = window.location.href;
    const match = url.match(/meet\.google\.com\/([a-z\-]+)/);
    return match ? match[1] : null;
  }

  function detectMeeting() {
    if (meetingDetected) return;

    const url = window.location.href;
    // Match both xxx-xxxx-xxx and other meet URL patterns
    const isMeetUrl = /meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/.test(url);

    if (!isMeetUrl) return;

    // Strategy 1: Check for definitive in-call indicators
    const inCallIndicators = [
      'button[aria-label*="Leave call"]',
      'button[aria-label*="End call"]',
      // The presence of the "People" or "Chat" sidebar icons which only show in-call
      'button[aria-label*="Show everyone"]',
      'button[aria-label*="Chat with everyone"]',
      // Activity indicator
      '[jsname="A9S6S"]',
      // The specific "Leave call" icon button (red background style often used)
      'button[jscontroller][jsname][aria-label*="call"]'
    ];

    const hasInCallElement = inCallIndicators.some(sel => {
      try { 
        const el = document.querySelector(sel);
        // Ensure the element is actually visible/functional
        return el && (el.offsetWidth > 0 || el.offsetHeight > 0);
      } catch { return false; }
    });

    // Strategy 2: If we are on a meeting URL and see 'Leave call' button, it's a lock.
    // Lobby only has 'Join now' or 'Ask to join'.
    const hasLeaveBtn = !!document.querySelector('button[aria-label*="Leave call"]');

    if (hasLeaveBtn || hasInCallElement) {
      meetingDetected = true;
      meetingId = extractMeetingId();
      
      console.log(`${COPILOT_PREFIX} Meeting detected: ${meetingId}`);
      
      chrome.runtime.sendMessage({
        type: 'MEETING_STARTED',
        meetingId: meetingId,
        url: window.location.href
      });

      injectFloatingButton();
      startParticipantMonitoring();
    }
  }

  // ——— Participant Monitoring ———
  function getParticipantNames() {
    const names = new Set();
    
    // Select all potential name elements in the grid and sidebar
    const participantItems = document.querySelectorAll(
      '[data-participant-id] [data-self-name],' +
      '.zWGUib,' +
      '.cS7aqe.NkoGfe,' +
      '.P9pU9b'
    );
    
    participantItems.forEach(el => {
      let name = el.textContent?.trim() || el.getAttribute('data-self-name');
      if (name && name.length > 0) {
        if (name === 'You') name = 'You (Host)';
        names.add(name);
      }
    });
    
    const videoTiles = document.querySelectorAll('.KV1GEc, .dwSJ2e, [data-self-name]');
    videoTiles.forEach(tile => {
      const nameEl = tile.querySelector('.XEazBc, .zs7s8d, .ZjFb7c, .Y36S6d');
      let name = nameEl ? nameEl.textContent?.trim() : tile.getAttribute('data-self-name');
      
      if (name) {
        if (name === 'You') name = 'You (Host)';
        names.add(name);
      }
    });
    
    // Always ensure at least 'You (Host)' if we are in a meeting
    if (names.size === 0 && meetingDetected) {
      names.add('You (Host)');
    }
    
    return Array.from(names);
  }

  function startParticipantMonitoring() {
    participantPollInterval = setInterval(() => {
      const currentParticipants = getParticipantNames();
      
      if (currentParticipants.length > 0) {
        const hasChanged = currentParticipants.length !== previousParticipants.length ||
          currentParticipants.some(p => !previousParticipants.includes(p));
        
        if (hasChanged) {
          chrome.runtime.sendMessage({
            type: 'PARTICIPANTS_UPDATED',
            participants: currentParticipants
          });
          
          previousParticipants = [...currentParticipants];
        }
      }
    }, 5000);
  }

  // ——— Private Brief Overlay ———
  function showBriefOverlay(briefContent, targetName) {
    if (briefOverlayVisible) return;
    briefOverlayVisible = true;
    
    const overlay = document.createElement('div');
    overlay.id = 'mc-brief-overlay';
    const card = document.createElement('div');
    card.className = 'mc-brief-card';
    
    // Header
    const header = document.createElement('div');
    header.className = 'mc-brief-header';
    header.innerHTML = `
      <div class="mc-brief-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
      </div>
      <div class="mc-brief-title">AI Meeting Copilot</div>
      <button class="mc-brief-close" id="mc-close-brief">✕</button>
    `;
    card.appendChild(header);

    // Content
    const greeting = document.createElement('div');
    greeting.className = 'mc-brief-greeting';
    greeting.textContent = briefContent.greeting || `Hey ${targetName} 👋`;
    card.appendChild(greeting);

    const text = document.createElement('div');
    text.className = 'mc-brief-text';
    text.textContent = briefContent.briefing || "Here's what you missed:";
    card.appendChild(text);

    // Topics Section
    const topicsSection = document.createElement('div');
    topicsSection.className = 'mc-brief-section';
    topicsSection.innerHTML = '<div class="mc-brief-label"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon" style="margin-right:6px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Topics Discussed</div>';
    
    const topicsList = document.createElement('ul');
    topicsList.className = 'mc-brief-list';
    (briefContent.topicsSummary || []).forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      topicsList.appendChild(li);
    });
    topicsSection.appendChild(topicsList);
    card.appendChild(topicsSection);

    // Key Decisions
    if ((briefContent.keyDecisions || []).length > 0) {
      const decisionSection = document.createElement('div');
      decisionSection.className = 'mc-brief-section';
      decisionSection.innerHTML = '<div class="mc-brief-label"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon" style="margin-right:6px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Key Decisions</div>';
      
      const decisionList = document.createElement('ul');
      decisionList.className = 'mc-brief-list';
      briefContent.keyDecisions.forEach(d => {
        const li = document.createElement('li');
        li.textContent = d;
        decisionList.appendChild(li);
      });
      decisionSection.appendChild(decisionList);
      card.appendChild(decisionSection);
    }

    // Current Discussion
    const currentSection = document.createElement('div');
    currentSection.className = 'mc-brief-section';
    currentSection.innerHTML = '<div class="mc-brief-label"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon" style="margin-right:6px"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg> Current Discussion</div>';
    
    const currentText = document.createElement('div');
    currentText.className = 'mc-brief-current';
    currentText.textContent = briefContent.currentDiscussion || 'N/A';
    currentSection.appendChild(currentText);
    card.appendChild(currentSection);

    // Action Items
    if ((briefContent.actionItemsForThem || []).length > 0) {
      const actionSection = document.createElement('div');
      actionSection.className = 'mc-brief-section';
      actionSection.innerHTML = '<div class="mc-brief-label"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon" style="margin-right:6px"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg> Action Items</div>';
      
      const actionList = document.createElement('ul');
      actionList.className = 'mc-brief-list';
      briefContent.actionItemsForThem.forEach(a => {
        const li = document.createElement('li');
        li.textContent = a;
        actionList.appendChild(li);
      });
      actionSection.appendChild(actionList);
      card.appendChild(actionSection);
    }

    const footer = document.createElement('div');
    footer.className = 'mc-brief-footer';
    footer.textContent = 'Only you can see this notification';
    card.appendChild(footer);

    overlay.appendChild(card);
    
    document.body.appendChild(overlay);
    
    requestAnimationFrame(() => {
      overlay.classList.add('mc-visible');
    });
    
    document.getElementById('mc-close-brief').addEventListener('click', () => {
      overlay.classList.remove('mc-visible');
      setTimeout(() => overlay.remove(), 300);
      briefOverlayVisible = false;
    });
    
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.classList.remove('mc-visible');
        setTimeout(() => overlay.remove(), 300);
        briefOverlayVisible = false;
      }
    }, 30000);
  }

  // ——— Floating Dashboard Button ———
  function injectFloatingButton() {
    if (document.getElementById('mc-float-btn')) return;
    
    const btn = document.createElement('div');
    btn.id = 'mc-float-btn';
    const inner = document.createElement('div');
    inner.className = 'mc-float-btn-inner';
    
    const pulse = document.createElement('div');
    pulse.className = 'mc-float-pulse';
    inner.appendChild(pulse);
    
    const icon = document.createElement('div');
    icon.className = 'mc-float-icon';
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>';
    inner.appendChild(icon);
    
    btn.appendChild(inner);
    
    const label = document.createElement('div');
    label.className = 'mc-float-label';
    label.textContent = 'AI Copilot';
    btn.appendChild(label);
    
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    });
    
    document.body.appendChild(btn);
    
    requestAnimationFrame(() => {
      btn.classList.add('mc-visible');
    });
  }

  // ——— Meeting End Detection ———
  function detectMeetingEnd() {
    if (!meetingDetected) return;

    // Define in-call buttons strictly
    const leaveCallBtn = document.querySelector('button[aria-label*="Leave call"]');
    const endCallBtn = document.querySelector('button[aria-label*="End call"]');
    
    // Look for termination indicators (Rejoin button or "You left" text)
    const indicators = Array.from(document.querySelectorAll('button, span, h1, div'));
    const hasRejoin = indicators.some(el => el.textContent.trim() === 'Rejoin' || el.textContent.includes('Return to home'));
    const hasLeftText = indicators.some(el => el.textContent.includes('You left') || el.textContent.includes('meeting has ended'));
    
    const meetingEnded = (!leaveCallBtn && !endCallBtn) && (hasRejoin || hasLeftText);

    if (meetingEnded) {
      meetingDetected = false;
      console.log(`${COPILOT_PREFIX} Meeting ended`);
      
      chrome.runtime.sendMessage({ type: 'MEETING_ENDED' });
      
      if (participantPollInterval) {
        clearInterval(participantPollInterval);
        participantPollInterval = null;
      }
      
      const btn = document.getElementById('mc-float-btn');
      if (btn) btn.remove();
    }
  }

  // ——— Listen for messages from background ———
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_BRIEF') {
      showBriefOverlay(message.briefContent, message.targetName);
      sendResponse({ success: true });
    }
    return true;
  });

  // ——— Initialize ———
  function init() {
    console.log(`${COPILOT_PREFIX} Content script loaded on Google Meet`);
    
    detectMeeting();
    
    const meetingCheckInterval = setInterval(() => {
      if (!meetingDetected) {
        detectMeeting();
      } else {
        detectMeetingEnd();
      }
    }, 3000);
    
    const observer = new MutationObserver(() => {
      if (!meetingDetected) {
        detectMeeting();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
