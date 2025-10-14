// Card Widget Component - displays mutual follows in user card

class MutualFollowsWidget {
  constructor() {
    this.container = null;
    this.shadowRoot = null;
    this.state = 'idle'; // idle, loading, success, empty, error
    this.data = null;
    this.onClickCallback = null;
  }

  create(targetLogin) {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'twitch-mutual-follows-container';
    this.container.dataset.targetLogin = targetLogin;

    // Attach Shadow DOM for style isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = window.TWITCH_MUTUAL_FOLLOWS_STYLES.widget;
    this.shadowRoot.appendChild(styleEl);

    // Create widget structure
    const widget = document.createElement('div');
    widget.className = 'mutual-follows-widget';
    widget.innerHTML = `
      <div class="widget-header">
        <h4 class="widget-title">Общие фолловы</h4>
      </div>
      <div class="widget-content"></div>
    `;
    this.shadowRoot.appendChild(widget);

    return this.container;
  }

  setLoading() {
    this.state = 'loading';
    this.render();
  }

  setSuccess(data) {
    this.state = 'success';
    this.data = data;
    this.render();
  }

  setEmpty() {
    this.state = 'empty';
    this.render();
  }

  setError(message) {
    this.state = 'error';
    this.errorMessage = message || 'Ошибка загрузки';
    this.render();
  }

  onClick(callback) {
    this.onClickCallback = callback;
  }

  render() {
    if (!this.shadowRoot) return;

    const content = this.shadowRoot.querySelector('.widget-content');
    const header = this.shadowRoot.querySelector('.widget-header');

    if (this.state === 'loading') {
      content.innerHTML = `
        <div class="loading-state">
          <div class="skeleton"></div>
          <div class="skeleton"></div>
          <div class="skeleton"></div>
          <div class="skeleton"></div>
        </div>
      `;
      return;
    }

    if (this.state === 'empty') {
      content.innerHTML = `
        <div class="empty-state">Нет общих подписок</div>
      `;
      return;
    }

    if (this.state === 'error') {
      content.innerHTML = `
        <div class="error-state">
          ${this.errorMessage}
          <br>
          <button class="retry-btn">Повторить</button>
        </div>
      `;

      const retryBtn = content.querySelector('.retry-btn');
      if (retryBtn && this.onClickCallback) {
        retryBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onClickCallback) {
            this.onClickCallback('retry');
          }
        });
      }
      return;
    }

    if (this.state === 'success' && this.data) {
      const { top4, total } = this.data;

      if (total === 0) {
        this.setEmpty();
        return;
      }

      // Render avatars
      const avatarsHTML = top4.map(channel => `
        <img 
          src="${channel.profileImageURL || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-50x50.png'}" 
          alt="${channel.displayName}"
          class="avatar"
          title="${channel.displayName}"
        >
      `).join('');

      const moreCount = total > 6 ? `<span class="more-count">+${total - 6}</span>` : '';

      content.innerHTML = `
        <div class="avatars-container">
          ${avatarsHTML}
          ${moreCount}
        </div>
      `;

      // Make clickable to open modal
      const avatarsContainer = content.querySelector('.avatars-container');
      if (avatarsContainer && this.onClickCallback) {
        avatarsContainer.style.cursor = 'pointer';
        avatarsContainer.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onClickCallback) {
            this.onClickCallback('show-modal', this.data);
          }
        });
      }
    }
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.shadowRoot = null;
    this.data = null;
    this.onClickCallback = null;
  }
}

// Export to window for use in content script
if (typeof window !== 'undefined') {
  window.MutualFollowsWidget = MutualFollowsWidget;
}

