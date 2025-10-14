// Modal Component - displays full list of mutual follows

class MutualFollowsModal {
  constructor() {
    this.overlay = null;
    this.data = null;
    this.onRefreshCallback = null;
    this.onCloseCallback = null;
  }

  show(data, targetLogin) {
    this.data = data;
    this.targetLogin = targetLogin;

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'twitch-mutual-follows-modal-overlay';

    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = window.TWITCH_MUTUAL_FOLLOWS_STYLES.modal;
    this.overlay.appendChild(styleEl);

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal-content';
    
    const { allItems, total, isPartial } = data;
    const partialText = isPartial ? ' (показана часть)' : '';

    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Общие с @${targetLogin} (${total}${partialText})</h3>
        <button class="close-btn" aria-label="Закрыть">×</button>
      </div>
      <div class="modal-body">
        ${this.renderChannelList(allItems)}
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-secondary" data-action="refresh">Обновить</button>
        <button class="modal-btn modal-btn-primary" data-action="close">Закрыть</button>
      </div>
    `;

    this.overlay.appendChild(modal);

    // Add event listeners
    this.attachEventListeners();

    // Add to page
    document.body.appendChild(this.overlay);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  renderChannelList(channels) {
    if (!channels || channels.length === 0) {
      return '<div class="empty-message">Нет общих подписок</div>';
    }

    const items = channels.map(channel => {
      const avatarUrl = channel.profileImageURL || 
        'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-50x50.png';
      
      return `
        <div class="channel-item">
          <img src="${avatarUrl}" alt="${channel.displayName}" class="channel-avatar">
          <div class="channel-info">
            <a href="https://www.twitch.tv/${channel.login}" 
               target="_blank" 
               class="channel-name"
               title="${channel.displayName}">
              ${channel.displayName}
            </a>
            <div class="channel-login">@${channel.login}</div>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="channel-list">${items}</div>`;
  }

  attachEventListeners() {
    if (!this.overlay) return;

    // Close button
    const closeBtn = this.overlay.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Action buttons
    const refreshBtn = this.overlay.querySelector('[data-action="refresh"]');
    const closeActionBtn = this.overlay.querySelector('[data-action="close"]');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (this.onRefreshCallback) {
          this.onRefreshCallback(this.targetLogin);
        }
        this.close();
      });
    }

    if (closeActionBtn) {
      closeActionBtn.addEventListener('click', () => this.close());
    }

    // Close on overlay click (not on modal content)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Close on Escape key
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  onRefresh(callback) {
    this.onRefreshCallback = callback;
  }

  onClose(callback) {
    this.onCloseCallback = callback;
  }

  close() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    // Restore body scroll
    document.body.style.overflow = '';

    // Remove escape handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    if (this.onCloseCallback) {
      this.onCloseCallback();
    }

    this.overlay = null;
    this.data = null;
  }
}

// Export to window for use in content script
if (typeof window !== 'undefined') {
  window.MutualFollowsModal = MutualFollowsModal;
}

