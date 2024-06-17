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
let stopAdd = false;
let map1 = new Map()

function addApi() {
  
  if(stopAdd == false){
    // Address of the current window
    let address = window.location.search
  
    // Returns a URLSearchParams object instance
    let parameterList = new URLSearchParams(address)
  
    // Created a map which holds key value pairs
    
  
    // Storing every key value pair in the map
    parameterList.forEach((value, key) => {
        map1.set(key, value)
    })
    stopAdd = true;
    return map1;
  } else {
    let map1 = new Map()
    return map1;
  }
  
  
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
    this.userId = '';
    addApi();
    
    // form inputs
    this.name = '';
    this.user = '';
    this.expire = 60;
    this.stopAddClick = false;
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
      if (this.stopAddClick == false) {
        this.addClick();
        console.log("ok");
      }
      
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

  toggleSideBar() {
    this.dispatchEvent(new Event('hass-toggle-menu', { bubbles: true, composed: true}));
  }
  addClick() {
    this.stopAddClick = true;
    if (map1.size != 0) {
      this.hass.callWS({
        type: 'virtual_keys/create_token',
        name: map1.get("n"),
        user_id: map1.get("u"),
        minutes: parseInt(map1.get("m"), 10),
      }).then(() => {
        this.fetchUsers();
      }).catch(err => {
        this.showAlert(err.message);
      });

    } else {
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
    const baseUrl = this.hass.hassUrl() + 'local/community/virtual-keys/login.html?token=' + token.jwt_token;
    const tokenQrUrl = this.hass.hassUrl() + 'local/community/virtual-keys/qr.html?qr=' + baseUrl + '&r=' + token.user;
    console.log(tokenQrUrl);

    window.open(tokenQrUrl, "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=100,left=200,width=560,height=680");
  }

  deleteButton() {
    return html`<svg preserveAspectRatio="xMidYMid meet" focusable="false" role="img" aria-hidden="true" viewBox="0 0 24 24">
        <g><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"></path></g>
      </svg>`;
  }
  qrButton() {
    return html`<svg fill="#000000" width="24px" height="24px" viewBox="0 0 24 24" id="qr-code" data-name="Flat Line" xmlns="http://www.w3.org/2000/svg" class="icon flat-line"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path id="secondary" d="M9,10H4A1,1,0,0,1,3,9V4A1,1,0,0,1,4,3H9a1,1,0,0,1,1,1V9A1,1,0,0,1,9,10ZM21,9V4a1,1,0,0,0-1-1H15a1,1,0,0,0-1,1V9a1,1,0,0,0,1,1h5A1,1,0,0,0,21,9ZM10,20V15a1,1,0,0,0-1-1H4a1,1,0,0,0-1,1v5a1,1,0,0,0,1,1H9A1,1,0,0,0,10,20Z" style="fill: #BDBD10; stroke-width: 2;"></path><path id="primary" d="M21,14v5a2,2,0,0,1-2,2H14" style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path><path id="primary-2" data-name="primary" d="M17,17H14V14h3ZM10,9V4A1,1,0,0,0,9,3H4A1,1,0,0,0,3,4V9a1,1,0,0,0,1,1H9A1,1,0,0,0,10,9Zm10,1H15a1,1,0,0,1-1-1V4a1,1,0,0,1,1-1h5a1,1,0,0,1,1,1V9A1,1,0,0,1,20,10ZM9,21H4a1,1,0,0,1-1-1V15a1,1,0,0,1,1-1H9a1,1,0,0,1,1,1v5A1,1,0,0,1,9,21Z" style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path></g></svg>`;
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
    console.log(tokenQrUrl);

    window.open(tokenQrUrl, "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=100,left=200,width=560,height=680");
  }

  getLoginUrl(token) {
    return this.hass.hassUrl() + 'local/community/virtual-keys/login.html?token=' + token.jwt_token;
  }

  listItemClick(e, token) {
    navigator.clipboard.writeText(this.getLoginUrl(token));
    this.showAlert('Copied to clipboard ' + token.name);
  }

  render() {
    return html`
      <div>
        <header class="mdc-top-app-bar mdc-top-app-bar--fixed">
          <div class="mdc-top-app-bar__row">
            <section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start" id="navigation">
              <div>
                <mwc-icon-button title="Sidebar Toggle" @click=${this.toggleSideBar}>
                  <svg preserveAspectRatio="xMidYMid meet" focusable="false" role="img" aria-hidden="true" viewBox="0 0 24 24">
                    <g><path class="primary-path" d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"></path></g>
                  </svg>
                </mwc-icon-button>
              </div>

              <span class="mdc-top-app-bar__title">
                ${this.panel.title}
              </span>
            </section>
            <section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-end" id="actions" role="toolbar">
              <slot name="actionItems"></slot>
            </section>
          </div>
        </header>

        <div class="mdc-top-app-bar--fixed-adjust flex content">
          <div class="filters">
            <ha-textfield label="Key name" value="" @input="${this.nameChanged}"></ha-textfield>

            <ha-combo-box
              .items=${this.users}
              .itemLabelPath=${'name'}
              .itemValuePath=${'id'}
              .value="1"
              .label=${'User'}
              @value-changed=${this.userChanged}
            >
            </ha-combo-box>

            <ha-textfield label="Expire (minutes)" type="number" value="${this.expire}"" @input="${this.expireChanged}"></ha-textfield>

            <mwc-button raised label="Add Key" @click=${this.addClick}></mwc-button>
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

      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
      }
      .mdc-top-app-bar {
        --mdc-typography-headline6-font-weight: 400;
        color: var(--app-header-text-color,var(--mdc-theme-on-primary,#fff));
        background-color: var(--app-header-background-color,var(--mdc-theme-primary));
        width: var(--mdc-top-app-bar-width,100%);
        display: flex;
        position: fixed;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
        width: 100%;
        z-index: 4;
      }
      .mdc-top-app-bar--fixed {
        transition: box-shadow 0.2s linear 0s;
      }
      .mdc-top-app-bar--fixed-adjust {
        padding-top: var(--header-height);
      }
      .mdc-top-app-bar__row {
        height: var(--header-height);
        border-bottom: var(--app-header-border-bottom);
        display: flex;
        position: relative;
        box-sizing: border-box;
        width: 100%;
        height: 64px;
      }
      .mdc-top-app-bar__section--align-start {
        justify-content: flex-start;
        order: -1;
      }
      .mdc-top-app-bar__section {
        display: inline-flex;
        flex: 1 1 auto;
        align-items: center;
        min-width: 0px;
        padding: 8px 12px;
        z-index: 1;
      }
      .mdc-top-app-bar__title {
        -webkit-font-smoothing: antialiased;
        font-family: var(--mdc-typography-headline6-font-family,var(--mdc-typography-font-family,Roboto,sans-serif));
        font-size: var(--mdc-typography-headline6-font-size,1.25rem);
        line-height: var(--mdc-typography-headline6-line-height,2rem);
        font-weight: var(--mdc-typography-headline6-font-weight,500);
        letter-spacing: var(--mdc-typography-headline6-letter-spacing,.0125em);
        text-decoration: var(--mdc-typography-headline6-text-decoration,inherit);
        text-transform: var(--mdc-typography-headline6-text-transform,inherit);
        padding-left: 20px;
        padding-right: 0px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        z-index: 1;
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
        padding: 50px 16px 0px;
      }
      .filters > * {
        margin-right: 8px;
      }
      @media (min-width: 870px) {
        mwc-icon-button {
          display: none;
        }
      }	   
    `;
  }
}

customElements.define('virtual-keys-panel', VirtualKeysPanel);
