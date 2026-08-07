document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('items-container');
  const closeModalBtn = document.getElementById('close-modal');
  const phishingBanner = document.getElementById('phishing-banner');
  const phishingDesc = document.getElementById('phishing-desc');

  let currentDomain = '';
  let vaultItems = [];

  closeModalBtn.addEventListener('click', () => {
    window.parent.postMessage({ type: 'PASSCRAFT_CLOSE_IFRAME' }, '*');
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PASSCRAFT_INIT_DATA') {
      currentDomain = (event.data.currentDomain || '').replace(/^www\./, '').toLowerCase();
      vaultItems = event.data.items || [];
      renderItems();
    }
  });

  function renderItems() {
    container.innerHTML = '';

    if (!vaultItems || vaultItems.length === 0) {
      container.innerHTML = '<div class="empty-msg">No credentials saved in vault.</div>';
      return;
    }

    vaultItems.forEach((item) => {
      let savedDomain = '';
      try {
        if (item.url) {
          const formattedUrl = item.url.startsWith('http') ? item.url : `https://${item.url}`;
          savedDomain = new URL(formattedUrl).hostname.replace(/^www\./, '').toLowerCase();
        }
      } catch (e) {}

      const isDomainMatch = savedDomain && (currentDomain.endsWith(savedDomain) || savedDomain.endsWith(currentDomain));

      const card = document.createElement('div');
      card.className = 'item-card';

      card.innerHTML = `
        <div class="item-title">${escapeHtml(item.title || item.url || 'Account')}</div>
        <div class="item-user">${escapeHtml(item.username || 'No username')}</div>
        <span class="badge ${isDomainMatch ? 'badge-match' : 'badge-mismatch'}">
          ${isDomainMatch ? '✅ Domain Match' : `⚠️ Unmatched Domain (${savedDomain || 'No URL'})`}
        </span>
      `;

      card.addEventListener('click', () => {
        if (!isDomainMatch && savedDomain) {
          phishingDesc.innerHTML = `
            You are attempting to autofill on <strong>${escapeHtml(currentDomain)}</strong>, but this credential belongs to <strong>${escapeHtml(savedDomain)}</strong>.
            <br><br>
            <button id="override-btn" class="btn-override-alert">Fill Anyway (Unsafe)</button>
            <button id="cancel-btn" class="btn-cancel-alert">Cancel</button>
          `;
          phishingBanner.classList.remove('hidden');

          document.getElementById('override-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            sendAutofill(item);
          });
          document.getElementById('cancel-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            phishingBanner.classList.add('hidden');
          });
        } else {
          sendAutofill(item);
        }
      });

      container.appendChild(card);
    });
  }

  function sendAutofill(item) {
    window.parent.postMessage(
      {
        type: 'PASSCRAFT_AUTOFILL',
        username: item.username || '',
        password: item.password || '',
      },
      '*'
    );
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
