import math
import re
import hashlib
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ==========================================
# 1. FLASK SETUP & CORS CONFIGURATION
# ==========================================
# We configure Flask to serve HTML, CSS, and JS from the current directory (No templates/static folders needed!)
app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

# Enable CORS (Cross-Origin Resource Sharing) so the browser frontend can securely send requests to localhost
CORS(app) 

# ==========================================
# 2. LOCAL DICTIONARY OF COMMON PASSWORDS
# ==========================================
# A quick-lookup set of extremely common passwords to intercept locally before making any network calls
COMMON_PASSWORDS = {"123456", "password", "123456789", "qwerty", "admin", "welcome", "letmein"}

# ==========================================
# 3. ENTROPY MATHEMATICS (L * log2(R))
# ==========================================
def get_entropy(pwd):
    """Calculates password entropy (bits of randomness/complexity)"""
    pool = 0
    
    # Check which character pools are present in the password
    if re.search(r'[a-z]', pwd): pool += 26       # Lowercase letters (a-z)
    if re.search(r'[A-Z]', pwd): pool += 26       # Uppercase letters (A-Z)
    if re.search(r'[0-9]', pwd): pool += 10       # Numbers (0-9)
    if re.search(r'[^A-Za-z0-9]', pwd): pool += 33 # Special symbols (!@#$%, etc.)
    
    # Entropy Formula: Length * log2(Character Pool Size)
    # If pool is 0 (empty password), entropy is 0
    return round(len(pwd) * math.log2(pool)) if pool > 0 else 0

# ==========================================
# 4. K-ANONYMITY BREACH CHECK (SECURE API CALL)
# ==========================================
def check_breach(pwd):
    """Anonymously checks if password was leaked in public breaches"""
    # Hash password using SHA-1
    sha1 = hashlib.sha1(pwd.encode()).hexdigest().upper()
    
    # Split the hash: first 5 characters (prefix) and the remaining part (suffix)
    prefix, suffix = sha1[:5], sha1[5:] 
    
    try:
        # Send ONLY the first 5 characters of the hash to the API (Zero-Knowledge Privacy!)
        # The external API never sees the full hash or the password.
        res = requests.get(f"https://api.pwnedpasswords.com/range/{prefix}", timeout=3)
        
        if res.status_code == 200:
            # Check if the remaining suffix matches any hashes returned by the API
            for line in res.text.splitlines():
                h, count = line.split(':')
                if h == suffix:
                    return True, int(count) # Match found! The password has been leaked.
    except Exception:
        pass # Fail silently and safely if the computer is offline
    return False, 0

# ==========================================
# 5. ROUTE: SERVE FRONTEND HTML
# ==========================================
@app.route('/')
def index():
    """Serves the index.html file directly from the root folder"""
    return send_from_directory('.', 'index.html')

# ==========================================
# 6. API ENDPOINT: PASSWORD STRENGTH CHECK
# ==========================================
@app.route('/api/check', methods=['POST'])
def check():
    """Analyzes password strength, checks local common list and online breaches"""
    pwd = (request.get_json() or {}).get('password', '')
    if not pwd:
        return jsonify({'error': 'Empty password'}), 400

    # A. Validate the Checklist Rules using Regular Expressions
    checks = {
        'length': len(pwd) >= 8,
        'upper': bool(re.search(r'[A-Z]', pwd)),
        'lower': bool(re.search(r'[a-z]', pwd)),
        'number': bool(re.search(r'[0-9]', pwd)),
        'special': bool(re.search(r'[^A-Za-z0-9]', pwd))
    }

    # B. Calculate Score (0 to 5) by summing up how many checklist items passed
    score = sum(checks.values())
    
    # C. Check Local Dictionary
    is_common = pwd.lower().strip() in COMMON_PASSWORDS
    if is_common:
        score = 1 # Force score to Weak (1) if it is a dictionary word

    # D. Generate Actionable Tips for the User
    tips = []
    if len(pwd) < 8: tips.append("Make it 8 or more characters long.")
    if not checks['upper']: tips.append("Add an uppercase letter (A-Z).")
    if not checks['lower']: tips.append("Add a lowercase letter (a-z).")
    if not checks['number']: tips.append("Add a number (0-9).")
    if not checks['special']: tips.append("Add a symbol (!@#$%).")
    if is_common: tips.append("This is a highly common password. Choose something unique.")

    # E. Check Online Leaks
    is_leaked, leak_count = check_breach(pwd)

    # Map scores to verbal ratings
    ratings = {0: 'Weak', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong', 5: 'Excellent'}
    
    # Return all analytics as a clean JSON payload
    return jsonify({
        'score': score,
        'strength': 'Very Weak (Common)' if is_common else ratings.get(score, 'Weak'),
        'entropy': get_entropy(pwd),
        'checks': checks,
        'suggestions': tips,
        'is_common': is_common,
        'is_breached': is_leaked,
        'breach_count': leak_count
    })

# ==========================================
# 7. API ENDPOINT: PASSPHRASE GENERATOR
# ==========================================
@app.route('/api/generate', methods=['GET'])
def generate():
    """Generates a secure, highly memorable passphrase"""
    import random
    
    # Random adjectives and nouns to combine
    adjs = ['Blue', 'Swift', 'Bright', 'Silent', 'Golden', 'Clever', 'Secure', 'Wild']
    nouns = ['River', 'Mountain', 'Falcon', 'Shield', 'Forest', 'Ocean', 'Castle', 'Haven']
    
    # Combine random Adjective + Noun + Double-digit Number + Symbol
    passphrase = f"{random.choice(adjs)}{random.choice(nouns)}{random.randint(10, 99)}!"
    return jsonify({'password': passphrase})

# ==========================================
# 8. START THE LOCAL SERVER
# ==========================================
if __name__ == '__main__':
    # Start the server locally on Port 5000 with debug mode enabled
    app.run(port=5000, debug=True)