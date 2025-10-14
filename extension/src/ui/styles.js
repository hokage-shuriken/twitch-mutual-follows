// Styles for Shadow DOM components
// Exported as JS string to be injected into Shadow DOM

const WIDGET_STYLES = `
  :host {
    display: block;
    font-family: "Roobert", "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #efeff1;
  }

  .mutual-follows-widget {
    background-color: #18181b;
    border: 1px solid #2e2e33;
    border-radius: 6px;
    padding: 12px;
    margin-top: 10px;
    transition: background-color 0.2s ease;
  }

  .mutual-follows-widget:hover {
    background-color: #1f1f23;
  }

  .widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .widget-title {
    font-size: 13px;
    font-weight: 600;
    color: #efeff1;
    margin: 0;
  }

  .partial-badge {
    font-size: 11px;
    color: #bf94ff;
    background-color: rgba(191, 148, 255, 0.15);
    padding: 2px 6px;
    border-radius: 3px;
  }

  .avatars-container {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid #18181b;
    transition: transform 0.2s ease;
  }

  .avatar:hover {
    transform: scale(1.1);
    border-color: #9147ff;
  }

  .more-count {
    font-size: 14px;
    font-weight: 600;
    color: #bf94ff;
    margin-left: 4px;
  }

  .loading-state {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .skeleton {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(90deg, #2e2e33 25%, #3a3a3d 50%, #2e2e33 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .empty-state, .error-state {
    text-align: center;
    padding: 8px;
    font-size: 13px;
    color: #adadb8;
  }

  .error-state {
    color: #f56565;
  }

  .retry-btn {
    margin-top: 8px;
    padding: 6px 12px;
    background-color: #9147ff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .retry-btn:hover {
    background-color: #772ce8;
  }

  .retry-btn:active {
    transform: scale(0.98);
  }
`;

const MODAL_STYLES = `
  .twitch-mutual-follows-modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background-color: rgba(0, 0, 0, 0.8) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 10000 !important;
    font-family: "Roobert", "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
    animation: fadeIn 0.2s ease !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-content {
    background-color: #18181b;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid #2e2e33;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    font-size: 16px;
    font-weight: 600;
    color: #efeff1;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #adadb8;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .close-btn:hover {
    background-color: #2e2e33;
    color: #efeff1;
  }

  .modal-body {
    padding: 16px 20px;
    overflow-y: auto;
    flex: 1;
  }

  .channel-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .channel-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background-color: #1f1f23;
    border-radius: 6px;
    transition: background-color 0.2s ease;
  }

  .channel-item:hover {
    background-color: #26262c;
  }

  .channel-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .channel-info {
    flex: 1;
    min-width: 0;
  }

  .channel-name {
    font-size: 14px;
    font-weight: 600;
    color: #efeff1;
    text-decoration: none;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .channel-name:hover {
    color: #9147ff;
    text-decoration: underline;
  }

  .channel-login {
    font-size: 12px;
    color: #adadb8;
  }

  .modal-footer {
    padding: 12px 20px;
    border-top: 1px solid #2e2e33;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .modal-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .modal-btn-secondary {
    background-color: #2e2e33;
    color: #efeff1;
  }

  .modal-btn-secondary:hover {
    background-color: #3a3a3d;
  }

  .modal-btn-primary {
    background-color: #9147ff;
    color: white;
  }

  .modal-btn-primary:hover {
    background-color: #772ce8;
  }

  .modal-btn:active {
    transform: scale(0.98);
  }

  .empty-message {
    text-align: center;
    padding: 40px 20px;
    color: #adadb8;
    font-size: 14px;
  }
`;

// Export styles
if (typeof window !== 'undefined') {
  window.TWITCH_MUTUAL_FOLLOWS_STYLES = {
    widget: WIDGET_STYLES,
    modal: MODAL_STYLES
  };
}

