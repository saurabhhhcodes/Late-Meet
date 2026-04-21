<div align="center">
  <img src="icons/icon128.png" alt="AI Meeting Copilot Logo" width="120" />

  # AI Meeting Copilot

  **Privacy-first, real-time meeting intelligence without the intrusive bots.**  
  *Never ask "what did I miss?" again.*

  [![Version](https://img.shields.io/badge/Version-1.0.0-black?style=for-the-badge&logo=googlechrome)](https://github.com/shouri123/Late-Meet)
  [![License](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)](LICENSE)
  [![Platform](https://img.shields.io/badge/Platform-Google_Meet-black?style=for-the-badge&logo=googlemeet)](https://meet.google.com)
</div>

<br />

## 🌟 The Problem
Joining a meeting late or losing focus for a moment leaves participants disconnected and scrambling for context. Existing AI note-takers add an obnoxious "Bot has joined" participant to your call, invade your team's privacy by storing transcripts on remote servers, and often generate massive, unreadable blocks of text instead of punchy, actionable insights.

## 💡 Our Solution
**AI Meeting Copilot** lives entirely natively within your browser. Without adding any disruptive bots to the call, it securely captures audio directly from the Chrome tab, leverages **OpenAI Whisper & GPT models** to process the conversation, and provides a stunning, high-performance side-panel dashboard.

We designed this with a **local-first philosophy**: all meeting data is processed locally using `chrome.storage.local` during the session, and you only need an OpenAI API key. No external databases. No user tracking.

---

## 🚀 Key Features

* **Invisible & Native:** Uses modern Chrome `tabCapture` and Offscreen APIs to intercept audio securely without adding bots to the participant list.
* **Contextual Transcription:** Leverages Whisper's prompt-injection to maintain continuity and accuracy across conversation chunks.
* **Late-Joiner Briefings:** Instantly catches up late participants with targeted, private overlays summarizing missed context via hardened UI automation.
* **Proactive Intelligence:** Automatically detects meetings and initializes host-first (1+N) participant tracking for accurate reporting.
* **Bring Your Own Key (BYOK):** Full control over your data. Supply your own OpenAI API key for transcription and summarization tasks.
* **Premium Interface:** A visually striking deep-monochrome UI with glassmorphism effects, smooth animations, and zero clutter. 

---

## 🏗️ Architecture & How It Works

The extension is built natively on Manifest V3 using vanilla JavaScript to minimize bloat and maximize execution speed. 

1. **`background.js` (The Conductor):** Acts as the central state manager. It proactively detects Meet tabs to initialize sessions and routes context-aware transcription prompts to Whisper for high-fidelity output.
2. **`offscreen.html` & `offscreen.js` (The Audio Engine):** Runs a hidden offscreen document for `chrome.tabCapture`. It processes audio in chunks, ensuring zero data loss and satisfying Whisper's format requirements.
3. **`content.js` (The UI Injector):** Injects floating buttons and briefing overlays. It features a hardened chat automation engine (`execCommand` based) to reliably deliver welcome messages to late joiners.
4. **AI Intelligence Layer:** Uses Whisper for transcription and dynamic GPT models (like `gpt-4o-mini`) for processing text into structured insights, including Decisions, Action Items, and Strategic Sentiment.
5. **Local Storage:** Securely stores session data in `chrome.storage.local`. After each meeting, you decide to Save or Discard—nothing leaves your browser without your consent.

---

## ⚙️ Installation & Setup (Developer Mode)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shouri123/Late-Meet.git
   cd Late-Meet
   ```
2. **Load into Chrome:**
   - Open Google Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** in the top right corner.
   - Click **Load unpacked** and select the root directory of this extension.
3. **Configure the Copilot:**
   - Click the extension icon in the toolbar.
   - Enter your **OpenAI API Key** (required for transcription and intelligence).
   - *Tip:* You can also configure your preferred LLM (e.g., `gpt-4o-mini` or `gpt-4o`) directly in the extension options.
4. **Join a Meeting:**
   - Join any active Google Meet.
   - Click the floating **Start Copilot** button.
   - Open the full Side Panel dashboard to view live intelligence!

---

## 🛠 Technology Stack

* **Extension Architecture:** Manifest V3 compliant, Offscreen Documents, Service Workers.
* **Design System:** Custom Vanilla CSS, high-contrast monochrome aesthetic, SVG-native iconography.
* **Storage:** `chrome.storage.local` (Local-first, NO BAAS dependencies).
* **AI Pipeline:** OpenAI Whisper (Transcription via `verbose_json`) and dynamic GPT models (Intelligence/Summarization).

---

## 🗺 Roadmap

### Phase 1: Core Foundation ✅
- Native Google Meet integration without bot participants.
- Real-time offline audio capture via Chrome Offscreen APIs.
- Premium monochrome UI extension & side panel.
- BYOK integration for processing.

### Phase 2: Local & Privacy Overhaul ✅
- Strip Supabase/backend dependencies.
- Local-first session management and storage.
- VAD (Voice Activity Detection) implementation to reduce API cost.
- Intelligent rolling LLM context prompting.

### Phase 3: Platform Expansion 🔄 *(Planned)*
- **Offline/Native Support:** Transition to an NPM package / Terminal CLI to support desktop apps like Zoom and Microsoft Teams.
- **Smart Tracking:** Enhanced detection for action item assignee routing based on voice mapping.
- **On-the-fly Translation:** Bridging language gaps during international calls.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues). 

When contributing:
1. Emphasize vanilla, zero-dependency Javascript workflows where possible.
2. Adhere strictly to the monochromatic UI design system.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br />
  <i>Built for high-performance teams who value focus.</i>
</div>
