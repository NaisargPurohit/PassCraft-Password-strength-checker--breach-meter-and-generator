# PassCraft

PassCraft is a password strength checker, zero-knowledge password vault, and browser extension built with Node.js, Express, React, and MongoDB.

## Features

- **Password Analysis**: Calculates password entropy and strength checks across uppercase, lowercase, numbers, and symbols.
- **Breach Checks**: Queries the HaveIBeenPwned API using 5-character SHA-1 prefix ranges to check for compromised passwords without sending raw passwords.
- **Password Vault**: Client-side PBKDF2 key derivation and AES-256-GCM encryption using Web Crypto. Plaintext data is never sent to the server.
- **Health Dashboard**: Scores your password vault from 0 to 100 based on weak, reused, or breached credentials.
- **Role Access & Audit Logs**: Supports Admin, Manager, and Employee roles with activity logging and CSV export.
- **Browser Extension (Manifest V3)**: Injects autofill icons on login forms and checks target domains against saved URLs.

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
| **Breach Checking** | SHA-1 prefix range search | Pwned Passwords API |
| **Authentication** | JWT + bcrypt | `jsonwebtoken`, `bcryptjs` |

## License

[MIT](LICENSE)