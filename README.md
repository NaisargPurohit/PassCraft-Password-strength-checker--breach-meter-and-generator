<h1 align="center">PassCraft: Password Strength Analyzer 🛡️</h1>

<p align="center">
  <i>A modern, real-time password security assessment tool built with Flask and Python.</i>
</p>

---

## 📖 Overview

PassCraft is a user-friendly web application designed to help users evaluate and improve their password security. It combines a responsive frontend with a robust backend to provide real-time entropy calculation, a strict security checklist, and active breach detection using zero-knowledge privacy. 

## ✨ Key Features

* **Real-Time Analysis:** Get instant visual feedback on password strength via a 5-segment meter as you type.
* **Advanced Entropy Calculation:** Computes Shannon entropy (bits of randomness) to accurately quantify password complexity and estimate crack time.
* **K-Anonymity Breach Detection:** Securely checks if a password exists in known data breaches using the Pwned Passwords API. *Privacy first: Only the first 5 characters of the SHA-1 hash are sent to the external API.*
* **Interactive Security Checklist:** Validates passwords against core criteria: length (8+), uppercase, lowercase, numbers, and symbols.
* **Actionable Recommendations:** Generates dynamic, specific suggestions to improve weak passwords.
* **Passphrase Generator:** Instantly creates secure, highly memorable passwords using an Adjective-Noun-Number-Symbol format (e.g., `SwiftFalcon89!`).

## 💻 Tech Stack

**Frontend:**
* HTML5 & CSS3 (Grid/Flexbox Layouts)
* Vanilla JavaScript (ES6+) with async Fetch API & debounce optimization
* Typography: *Plus Jakarta Sans* (UI) & *JetBrains Mono* (Password input)

**Backend:**
* Python 3.7+
* Flask (Web Framework & REST API endpoints)
* Flask-CORS (Cross-Origin Resource Sharing)
* Requests, Hashlib, Re, Math modules

## 🚀 Getting Started (Local Installation)

To run PassCraft on your local machine, follow these steps:

### Prerequisites
Make sure you have Python 3.7+ installed on your system.

### 1. Clone & Install Dependencies
Open your terminal inside the project folder and install the required Python libraries:

```bash
pip install Flask Flask-Cors requests