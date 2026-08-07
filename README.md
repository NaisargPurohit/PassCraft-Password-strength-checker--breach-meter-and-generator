# 🛡️ PassCraft — Zero-Knowledge Password Manager & Enterprise Security Suite

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://react.dev/)
[![Security](https://img.shields.io/badge/Security-Zero--Knowledge-green.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
[![Manifest V3](https://img.shields.io/badge/Chrome--Extension-Manifest%20V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**PassCraft** is a modern, enterprise-grade password management ecosystem and threat intelligence suite. Built on a **MERN Stack** (MongoDB, Express, React, Node.js) with Tailwind CSS, PassCraft delivers end-to-end client-side zero-knowledge encryption, real-time breach detection, password health scoring, B2B enterprise role-based access control (RBAC), and a Manifest V3 companion Chrome Browser Extension.

---

## 🌟 Key Features

### 1. 🔍 Real-Time Password Strength Checker & Breach Meter
- **Mathematical Entropy Computation**: Calculates randomness bits using pool size equations ($L \times \log_2(\text{pool})$).
- **Zero-Knowledge K-Anonymity Breach Check**: Computes SHA-1 hash of input passwords and sends **only the 5-character prefix** to the [Pwned Passwords API](https://haveibeenpwned.com/API/v3#PwnedPasswords) to detect public leaks without exposing hashes or plaintext passwords.
- **Dynamic 5-Segment Meter**: Visual color transitions, time-to-crack estimation, and dynamic rule checklist (`8+ Chars`, `Uppercase`, `Lowercase`, `Numbers`, `Symbols`).
- **Passphrase Generator**: Constructs memorable passphrases combining adjectives, nouns, double-digit numbers, and symbols.

### 2. 🔐 Zero-Knowledge Client-Side Encryption Vault
- **Browser-Based Cryptography**: All vault payloads are encrypted and decrypted **exclusively in the browser** using the Web Crypto API (`window.crypto.subtle`).
- **Key Derivation (PBKDF2)**: Derives 256-bit AES-GCM keys from master passwords using 100,000 iterations and SHA-256.
- **Symmetric Encryption (AES-256-GCM)**: Uses 12-byte random initialization vectors (nonces) per item.
- **Zero Server Knowledge**: The Express backend and MongoDB store only Base64 ciphertext and IV nonces. Unencrypted passwords or master keys never touch the network.

### 3. 📊 Password Health Dashboard & Security Score
- **Vault Security Score (0–100)**: Calculates an overall health index using weighted penalty deductions.
- **Circular SVG Progress Ring**: Animated progress gauge with dynamic color states (Green $\ge 80$, Yellow 50–79, Red $<50$).
- **Health Categorization**: Automatically groups vault items into:
  - 🚨 **Compromised**: Leaked in public database breaches.
  - 🔄 **Reused**: Duplicate passwords reused across multiple services.
  - ⚠️ **Weak**: Entropy $< 50$ bits or length $< 8$ characters.
  - 🛡️ **Healthy**: Secure, unique, high-entropy credentials.

### 4. 🤖 Automated Threat Intelligence Scheduler
- **Background `node-cron` Scheduler**: Periodically scans registered user email addresses against public leak indicators.
- **Breach Alert Banner**: Flags breached user accounts and provides real-time threat intelligence updates via authenticated REST API endpoints (`/api/auth/threat-intel`).

### 5. 🏢 B2B Enterprise Features, RBAC & Audit Logging
- **Role-Based Access Control (RBAC)**: Enforces permissions for `Admin`, `Manager`, and `Employee` roles.
- **Asymmetric Team Sharing (RSA-OAEP)**: Generates 2048-bit RSA-OAEP key pairs via Web Crypto API. Admins can share encrypted items with employees using recipient RSA public keys without revealing master keys.
- **Security Audit Logs**: Records detailed logs for `VIEW`, `COPY`, `AUTOFILL`, `CREATE`, `UPDATE`, `DELETE`, and `SHARE` events.
- **Audit Export**: Supports one-click CSV export (`PassCraft_Audit_Logs.csv`) for compliance auditing.

### 6. 🧩 Companion Google Chrome Browser Extension (Manifest V3)
- **DOM Scanner & Icon Injection**: Automatically detects `<input type="password">`, `<input type="email">`, and `<input type="text">` login fields and injects a `🛡️ PassCraft` trigger icon.
- **Floating Credential Selector**: Opens an inline modal overlay listing decrypted vault entries.
- **Anti-Phishing Guard**: Compares active tab domain (`window.location.hostname`) against the saved URL host. Displays a prominent **`🚨 PHISHING WARNING`** banner if domains mismatch.
- **Synthetic Event Autofill**: Dispatches native `input` and `change` DOM events to ensure single-page app (React/Vue/Angular) form state synchronization.

---

## 📐 Project Architecture

```
PassCraft/
├── server/                    # Node.js & Express API Backend
│   ├── config/
│   │   └── db.js             # Mongoose connection & offline in-memory fallback
│   ├── jobs/
│   │   └── cron.js           # Automated threat intelligence node-cron job
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication middleware
│   │   └── rbac.js           # Role-Based Access Control (Admin/Manager/Employee)
│   ├── models/
│   │   ├── User.js           # User schema (email, passwordHash, salt, role, breaches)
│   │   ├── VaultItem.js      # Encrypted vault entry schema (encryptedData, iv)
│   │   ├── Organization.js   # Enterprise organization schema
│   │   ├── SharedCollection.js # Shared team collection schema
│   │   └── AuditLog.js       # Security audit log schema
│   ├── routes/
│   │   ├── api.js            # Strength check & passphrase generator API
│   │   ├── auth.js           # Authentication & threat intel routes
│   │   ├── vault.js          # Vault CRUD endpoints
│   │   └── admin.js          # Admin role management & audit log routes
│   └── server.js             # Express application entry point
├── client/                    # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── PasswordChecker.jsx  # Strength analyzer component
│   │   │   ├── StrengthMeter.jsx    # 5-segment meter & metrics
│   │   │   ├── SecurityChecklist.jsx# Live rule checklist
│   │   │   ├── PassphraseGenerator.jsx # Generator component
│   │   │   ├── Vault.jsx            # Zero-Knowledge password vault UI
│   │   │   ├── Dashboard.jsx        # Health dashboard & circular score ring
│   │   │   ├── AdminDashboard.jsx   # Enterprise portal & CSV export
│   │   │   └── AuthModal.jsx        # Login & Registration dialog
│   │   ├── utils/
│   │   │   ├── crypto.js            # Web Crypto API (PBKDF2 + AES-256-GCM)
│   │   │   ├── vaultHealth.js       # Security scoring & categorization engine
│   │   │   └── rsaSharing.js        # RSA-OAEP asymmetric key sharing
│   │   ├── App.jsx                  # Main tabbed application
│   │   └── index.css
│   └── vite.config.js
└── extension/                 # Manifest V3 Google Chrome Extension
    ├── manifest.json         # Manifest V3 permissions & resources
    ├── background.js        # Service worker managing API requests
    ├── content.js           # DOM scanner, icon injection & autofill script
    ├── iframe.html          # Credential picker modal overlay
    ├── iframe.js            # Anti-phishing domain comparison logic
    ├── popup.html           # Extension toolbar popup UI
    └── popup.js             # Popup authentication controller
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) (v9+)
- *(Optional)* [MongoDB](https://www.mongodb.com/) running on port `27017` (If MongoDB is offline, PassCraft automatically uses a seamless in-memory fallback store).

### 1. Installation

Clone the repository and install dependencies for both `server` and `client`:

```bash
# Clone the repository
git clone https://github.com/NaisargPurohit/PassCraft-Password-strength-checker--breach-meter-and-generator.git
cd PassCraft-Password-strength-checker--breach-meter-and-generator

# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Running the Application

Start the Express backend and React Vite frontend in separate terminal windows:

**Terminal 1 (Backend API)**:
```bash
cd server
npm start
# Server runs at http://localhost:5000
```

**Terminal 2 (Frontend Client)**:
```bash
cd client
npm run dev
# React App runs at http://localhost:5173
```

Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧩 Installing the Chrome Extension (Manifest V3)

1. Open Google Chrome and go to `chrome://extensions`.
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** and select the extension directory:
   `PassCraft-Password-strength-checker--breach-meter-and-generator/extension`
4. Click the **🛡️ PassCraft** extension icon in your Chrome toolbar to log in and unlock your vault.
5. Visit any website with login inputs to test `🛡️` icon injection, zero-knowledge autofill, and anti-phishing warnings!

---

## 🔒 Security Specifications

| Feature | Specification | Standard / Library |
| :--- | :--- | :--- |
| **Symmetric Encryption** | AES-GCM 256-bit (12-byte random IV) | Web Crypto API (`window.crypto.subtle`) |
| **Key Derivation** | PBKDF2 (100,000 iterations, SHA-256) | Web Crypto API |
| **Asymmetric Key Sharing** | RSA-OAEP 2048-bit (SHA-256) | Web Crypto API |
| **Breach Checking** | K-Anonymity (5-char SHA-1 prefix) | Pwned Passwords API |
| **Backend Authentication** | JSON Web Tokens (JWT) + bcrypt | `jsonwebtoken`, `bcryptjs` |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **[Naisarg Purohit](https://github.com/NaisargPurohit)**.