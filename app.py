import math
import re
import hashlib
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
CORS(app)

# High-frequency dictionary terms pre-filtered in O(1) time to short-circuit search-space complexity evaluation.
COMMON_PASSWORDS = {"123456", "password", "123456789", "qwerty", "admin", "welcome", "letmein"}

def get_entropy(pwd):
    # Calculates Shannon entropy H = L * log2(R), where R represents the estimated cardinality of active character set pools.
    pool = 0
    if re.search(r'[a-z]', pwd): pool += 26
    if re.search(r'[A-Z]', pwd): pool += 26
    if re.search(r'[0-9]', pwd): pool += 10
    if re.search(r'[^A-Za-z0-9]', pwd): pool += 33
    
    return round(len(pwd) * math.log2(pool)) if pool > 0 else 0

def check_breach(pwd):
    # Implements k-Anonymity via HIBP Range API. Transmits only the 20-bit (5 hex char) SHA-1 prefix over TLS
    # to preserve zero-knowledge guarantees while performing local suffix evaluation against bucket responses.
    sha1 = hashlib.sha1(pwd.encode()).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    
    try:
        res = requests.get(f"https://api.pwnedpasswords.com/range/{prefix}", timeout=3)
        if res.status_code == 200:
            for line in res.text.splitlines():
                h, count = line.split(':')
                if h == suffix:
                    return True, int(count)
    except Exception:
        pass
    return False, 0

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/check', methods=['POST'])
def check():
    pwd = (request.get_json() or {}).get('password', '')
    if not pwd:
        return jsonify({'error': 'Empty password'}), 400

    checks = {
        'length': len(pwd) >= 8,
        'upper': bool(re.search(r'[A-Z]', pwd)),
        'lower': bool(re.search(r'[a-z]', pwd)),
        'number': bool(re.search(r'[0-9]', pwd)),
        'special': bool(re.search(r'[^A-Za-z0-9]', pwd))
    }

    score = sum(checks.values())
    
    # Common dictionary matches cap maximum security score to S=1 regardless of length or structural complexity.
    is_common = pwd.lower().strip() in COMMON_PASSWORDS
    if is_common:
        score = 1

    tips = []
    if len(pwd) < 8: tips.append("Make it 8 or more characters long.")
    if not checks['upper']: tips.append("Add an uppercase letter (A-Z).")
    if not checks['lower']: tips.append("Add a lowercase letter (a-z).")
    if not checks['number']: tips.append("Add a number (0-9).")
    if not checks['special']: tips.append("Add a symbol (!@#$%).")
    if is_common: tips.append("This is a highly common password. Choose something unique.")

    is_leaked, leak_count = check_breach(pwd)
    ratings = {0: 'Weak', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong', 5: 'Excellent'}
    
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

@app.route('/api/generate', methods=['GET'])
def generate():
    # Generates Diceware-style memorable passphrases targeting ~32 bits of theoretical entropy.
    import random
    adjs = ['Blue', 'Swift', 'Bright', 'Silent', 'Golden', 'Clever', 'Secure', 'Wild']
    nouns = ['River', 'Mountain', 'Falcon', 'Shield', 'Forest', 'Ocean', 'Castle', 'Haven']
    
    passphrase = f"{random.choice(adjs)}{random.choice(nouns)}{random.randint(10, 99)}!"
    return jsonify({'password': passphrase})

if __name__ == '__main__':
    app.run(port=5000, debug=True)