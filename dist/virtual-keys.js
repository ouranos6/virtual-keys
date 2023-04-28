import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

function humanSeconds(seconds) {
  return [
    [Math.floor(seconds / 31536000), 'year'],
    [Math.floor((seconds % 31536000) / 86400), 'day'],
    [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hour'],
    [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minute'],
    [(((seconds % 31536000) % 86400) % 3600) % 60, 'second'],
  ].map(([value, label]) => {
    return value > 0 ? `${value} ${label}${value !== 1 ? 's' : ''} ` : '';
  }).join(' ');
}

class VirtualKeysPanel extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      narrow: { type: Boolean },
      route: { type: Object },
      panel: { type: Object },
      users: { type: Array },
      tokens: { type: Array },
      alert: { type: String },
    };
  }

  constructor() {
    super();
    this.users = [];
    this.tokens = [];
    this.alert = '';

    // form inputs
    this.name = '';
    this.user = '';
    this.expire = 0;
  }

  fetchUsers() {
    this.hass.callWS({ type: 'virtual_keys/list_users' }).then(users => {
      this.users = [];
      this.tokens = [];
      users.filter(user => !user.system_generated && user.is_active).forEach(user => {
        this.users.push({
          id: user.id,
          name: user.name,
        });
        user.tokens.filter(token => token.type === 'long_lived_access_token' && token.expiration !== 315360000)
          .forEach(token => {
            this.tokens.push({
              id: token.id,
              name: token.name,
              user: user.name,
              jwt_token: token.jwt_token,
              expiration: token.expiration,
              remaining: token.remaining,
            });
          });
      });
    });
  }

  update(changedProperties) {
    if (changedProperties.has('hass') && this.hass) {
      this.fetchUsers();
    }
    super.update(changedProperties);
  }

  userChanged(e) {
    this.user = e.detail.value;
  }

  nameChanged(e) {
    this.name = e.target.value;
  }

  expireChanged(e) {
    this.expire = e.target.value;
  }

  addClick() {
    this.hass.callWS({
      type: 'virtual_keys/create_token',
      name: this.name,
      user_id: this.user,
      minutes: parseInt(this.expire, 10),
    }).then(() => {
      this.fetchUsers();
    }).catch(err => {
      this.showAlert(err.message);
    });
  }

  deleteButton() {
    return html`<svg preserveAspectRatio="xMidYMid meet" focusable="false" role="img" aria-hidden="true" viewBox="0 0 24 24">
        <g><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"></path></g>
      </svg>`;
  }
  
  qrButton() {
    return html`<svg fill="#000000" width="24px" height="24px" viewBox="0 0 24 24" id="qr-code" data-name="Flat Line" xmlns="http://www.w3.org/2000/svg" class="icon flat-line"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path id="secondary" d="M9,10H4A1,1,0,0,1,3,9V4A1,1,0,0,1,4,3H9a1,1,0,0,1,1,1V9A1,1,0,0,1,9,10ZM21,9V4a1,1,0,0,0-1-1H15a1,1,0,0,0-1,1V9a1,1,0,0,0,1,1h5A1,1,0,0,0,21,9ZM10,20V15a1,1,0,0,0-1-1H4a1,1,0,0,0-1,1v5a1,1,0,0,0,1,1H9A1,1,0,0,0,10,20Z" style="fill: #2ca9bc; stroke-width: 2;"></path><path id="primary" d="M21,14v5a2,2,0,0,1-2,2H14" style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path><path id="primary-2" data-name="primary" d="M17,17H14V14h3ZM10,9V4A1,1,0,0,0,9,3H4A1,1,0,0,0,3,4V9a1,1,0,0,0,1,1H9A1,1,0,0,0,10,9Zm10,1H15a1,1,0,0,1-1-1V4a1,1,0,0,1,1-1h5a1,1,0,0,1,1,1V9A1,1,0,0,1,20,10ZM9,21H4a1,1,0,0,1-1-1V15a1,1,0,0,1,1-1H9a1,1,0,0,1,1,1v5A1,1,0,0,1,9,21Z" style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path></g></svg>`;
  }

  showAlert(text) {
    this.alert = text;
    setTimeout(() => {
      this.alert = '';
    }, 2000);
  }

  deleteClick(e, token) {
    e.stopPropagation();

    this.hass.callWS({
      type: 'virtual_keys/delete_token',
      token_id: token.id,
    }).then(() => {
      this.fetchUsers();
    }).catch(err => {
      this.showAlert(err.message);
    });
  }
  
  qrClick(e, token) {
    e.stopPropagation();
    const baseUrl = this.hass.hassUrl() + 'local/community/virtual-keys/login.html?token=' + token.jwt_token;
    const tokenQrUrl = this.hass.hassUrl() + 'local/community/virtual-keys/qr.html?qr=' + baseUrl + '&r=' + token.user;

    window.open(tokenQrUrl, "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=100,left=200,width=560,height=680");
  }

  listItemClick(e, token) {
    const tokenLoginUrl = this.hass.hassUrl() + 'local/community/virtual-keys/login.html?token=' + token.jwt_token;
    navigator.clipboard.writeText(tokenLoginUrl);
    this.showAlert('Copied to clipboard ' + token.name);
  }

  render() {
    return html`
      <ha-app-layout>
        <app-header slot="header" fixed>
          <app-toolbar>
            <div main-title>${this.panel.title}</div>
          </app-toolbar>
        </app-header>

        <div class="flex content">
          <div class="filters">
            <paper-input label="Key name" value="" @value-changed=${this.nameChanged} .error-message=${'aa'}></paper-input>

            <ha-combo-box
              .items=${this.users}
              .itemLabelPath=${'name'}
              .itemValuePath=${'id'}
              .value="1"
              .label=${'User'}
              @value-changed=${this.userChanged}
            >
            </ha-combo-box>

            <paper-input label="Expire (minutes)" type="number" value="60" @value-changed=${this.expireChanged}></paper-input>

            <mwc-button raised label="Add" @click=${this.addClick}></mwc-button>
          </div>

          <ha-card>
            <mwc-list>
              ${this.tokens.map(token => html`
                <mwc-list-item hasMeta twoline @click=${e => this.listItemClick(e, token)}>
                  <span> ${token.name} Link ->  </span><a href=${this.hass.hassUrl() + 'local/community/virtual-keys/login.html?token=' + token.jwt_token}>Link</a>
                  <span slot="secondary">${token.user}, Expire: ${humanSeconds(token.remaining)}</span>
                  <mwc-icon slot="meta" @click=${e => this.qrClick(e, token)}>${this.qrButton()}</mwc-icon>
                  <mwc-icon slot="meta" @click=${e => this.deleteClick(e, token)}>${this.deleteButton()}</mwc-icon>
                </mwc-list-item>
              `)}
            </mwc-list>
          </ha-card>
        </div>

      ${this.alert.length ? html`<ha-alert>${this.alert}</ha-alert>` : ''}

      </ha-app-layout>
    `;
  }

  static get styles() {
    return css`
      :host {
      }
      app-header {
        background-color: var(--primary-color);
        color: var(--text-primary-color);
        font-weight: 400;
      }
      app-toolbar {
        height: var(--header-height);
      }
      app-toolbar [main-title] {
        margin-left: 20px
      }
      ha-combo-box {
        padding: 8px 0;
        width: auto;
      }
      mwc-button {
        padding: 16px 0;
      }
      .content {
        padding: 0 16px 16px;
      }
      .flex {
        flex: 1 1 1e-9px;
      }
      .filters {
        align-items: flex-end;
        display: flex;
        flex-wrap: wrap;
        padding: 8px 16px 0px;
      }
      .filters > * {
        margin-right: 8px;
      }
    `;
  }
}

customElements.define('virtual-keys-panel', VirtualKeysPanel);
