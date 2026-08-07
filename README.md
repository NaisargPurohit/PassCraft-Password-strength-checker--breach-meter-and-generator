# PassCraft

PassCraft is a password strength checker, zero-knowledge password vault, and browser extension built with Node.js, Express, React, and MongoDB.

## Features

- **Password Analysis**: Estimates Shannon entropy (`H = L * log2(pool)`) across lowercase, uppercase, digit, and symbol character sets.
- **K-Anonymity Breach Checks**: Queries the HaveIBeenPwned API using 5-character SHA-1 prefix ranges to check for compromised passwords without exposing raw passwords or full hashes.
- **Zero-Knowledge Vault**: Client-side PBKDF2 key derivation (100,000 iterations, SHA-256) and AES-256-GCM encryption using the Web Crypto API. Plaintext data is never transmitted to the server.
- **Health Dashboard**: Calculates a vault security score from 0 to 100 based on detected weak, duplicate, or compromised passwords.
- **Role-Based Access Control & Audit Logs**: Supports Admin, Manager, and Employee roles with activity logging and CSV log export.
- **Browser Extension (Manifest V3)**: Scans input fields on web pages, injects autofill triggers, and checks target domains against saved URLs to alert users to potential phishing sites.

## Project Structure

```
.
├── server/           # Express API, MongoDB models, auth & admin routes
├── client/           # React, Vite, and Tailwind CSS frontend
└── extension/        # Manifest V3 Chrome extension
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- MongoDB (Optional: if unconnected, the server falls back to an in-memory data store)

### Setup & Execution

1. Clone the repository:
   ```bash
   git clone https://github.com/NaisargPurohit/PassCraft-Password-strength-checker--breach-meter-and-generator.git
   cd PassCraft-Password-strength-checker--breach-meter-and-generator
   ```

2. Install backend dependencies and start the API server:
   ```bash
   cd server
   npm install
   npm start
   ```

3. Install frontend dependencies and start the development server:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

4. Load the Chrome Extension:
   - Open `chrome://extensions` in Google Chrome.
   - Enable **Developer mode**.
   - Click **Load unpacked** and select the `extension/` directory.

## Security Overview

| Mechanism | Implementation | Standard / API |
| :--- | :--- | :--- |
| **Symmetric Encryption** | AES-256-GCM (12-byte random IV) | Web Crypto API |
| **Key Derivation** | PBKDF2 (100,000 iterations, SHA-256) | Web Crypto API |
| **Key Sharing** | RSA-OAEP 2048-bit (SHA-256) | Web Crypto API |
| **Breach Checking** | K-Anonymity (5-char SHA-1 prefix) | Pwned Passwords API |
| **Authentication** | JWT + bcrypt | `jsonwebtoken`, `bcryptjs` |

## License

[MIT](LICENSE)