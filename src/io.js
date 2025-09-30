/**
 * IO - Modern lightweight DOM utility library
 * Version: 1.0.3
 * Author: Gigoland.com
 * License: MIT License
 * Repository: https://github.com/Gigoland/IO
 * Description: Lightweight utility for DOM manipulation, events, attributes, CSS, and HTML handling. Users are responsible for sanitizing HTML input using sanitizeXSS manually.
 */
class IO {
  // Initialize elements based on selector type
  constructor(selector, context = document) {
    if (typeof selector === 'string') {
      selector = selector.trim();
      if (selector === 'body') {
        if (!(context instanceof Document) || !context.body) {
          console.warn('IO: Invalid context or document.body not available');
          this.elements = [];
        } else {
          this.elements = [context.body];
        }
      } else if (/^#[^\s][\S]*$/.test(selector)) {
        const id = selector.slice(1);
        const element = context.getElementById && !(context instanceof DocumentFragment) ? context.getElementById(id) : context.querySelector(`#${CSS.escape(id)}`);
        if (element) {
          this.elements = [element];
        } else {
          this.elements = [];
        }
      } else {
        this.elements = Array.from(context.querySelectorAll(selector));
        if (this.elements.length === 0 && selector !== '') {
          console.warn(`IO: No elements found for selector "${selector}"`);
        }
      }
    } else if (selector instanceof Element) {
      this.elements = [selector];
    } else if (selector instanceof Document) {
      if (!selector.body) {
        console.warn('IO: document.body is not available');
        this.elements = [];
      } else {
        this.elements = [selector.body];
      }
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
      this.elements = Array.from(selector).filter(el => el instanceof Element);
    } else {
      this.elements = [];
      console.warn('IO: Invalid selector type');
    }
  }

  // Get native current element
  native() {
    return this.elements[0] ?? null;
  }

  // Get all native elements
  allNative() {
    return this.elements ?? [];
  }

  // Iterate over all elements with native or IO instance
  forEach(callback, natif = true) {
    this.elements.forEach((el, i) => {
      callback.call(el, natif ? el : new IO(el), i);
    });
    return this;
  }

  // Iterate over all elements with IO instance
  each(callback) {
    return this.forEach(callback, false);
  }

  /*** Visibility Methods ***/

  // Show all elements by resetting display or setting to block
  show(isEmpty = false) {
    return this.forEach(el => {
      el.style.display = isEmpty ? '' : (el.dataset.originalDisplay || 'block');
    });
  }

  // Hide all elements
  hide() {
    return this.forEach(el => {
      el.dataset.originalDisplay = getComputedStyle(el).display;
      el.style.display = 'none';
    });
  }

  // Toggle visibility of all elements
  toggleVisibility() {
    return this.forEach(el => {
      const currentDisplay = getComputedStyle(el).display;
      if (currentDisplay === 'none') {
        const originalDisplay = el.dataset.originalDisplay || 'block';
        el.style.display = originalDisplay;
      } else {
        el.dataset.originalDisplay = currentDisplay;
        el.style.display = 'none';
      }
    });
  }

  // Enable all elements
  enable() {
    return this.forEach(el => {
      if ('disabled' in el) {
        el.disabled = false;
      }
      el.style.pointerEvents = 'auto';
      el.classList.remove('disabled', 'opacity-25');
    });
  }

  // Disable all elements
  disable() {
    return this.forEach(el => {
      if ('disabled' in el) {
        el.disabled = true;
      }
      el.style.pointerEvents = 'none';
      el.classList.add('disabled', 'opacity-25');
    });
  }

  /*** Class Methods ***/

  // Add class to all elements
  addClass(...classes) {
    if (!classes.length || classes.some(cls => !cls || typeof cls !== 'string' || !cls.trim())) {
      console.warn('addClass: Invalid class name(s)');
      return this;
    }
    const classList = classes.flatMap(cls => cls.trim().split(/\s+/));
    return this.forEach(el => {
      el.classList.add(...classList);
    });
  }

  // Remove class from all elements
  removeClass(...classes) {
    if (!classes.length || classes.some(cls => !cls || typeof cls !== 'string' || !cls.trim())) {
      console.warn('removeClass: Invalid class name(s)');
      return this;
    }
    const classList = classes.flatMap(cls => cls.trim().split(/\s+/));
    return this.forEach(el => {
      el.classList.remove(...classList);
    });
  }

  // Toggle class on all elements
  toggleClass(...classes) {
    if (!classes.length || classes.some(cls => !cls || typeof cls !== 'string' || !cls.trim())) {
      console.warn('toggleClass: Invalid class name(s)');
      return this;
    }
    const classList = classes.flatMap(cls => cls.trim().split(/\s+/));
    return this.forEach(el => {
      classList.forEach(className => {
        el.classList.toggle(className);
      });
    });
  }

  // Check if first element has class
  hasClass(...classes) {
    if (!classes.length || classes.some(cls => !cls || typeof cls !== 'string' || !cls.trim())) {
      console.warn('hasClass: Invalid class name(s)');
      return false;
    }
    if (this.elements[0]) {
      return classes.every(cls => this.elements[0].classList.contains(cls.trim()));
    }
    return false;
  }

  // Remove class from elements found by selector within current elements
  removeClassBy(target, ...classes) {
    if (!target || !classes.length || typeof target !== 'string' || classes.some(cls => !cls || typeof cls !== 'string' || !cls.trim())) {
      console.warn('removeClassBy: Invalid target or class name(s)');
      return this;
    }
    const classList = classes.flatMap(cls => cls.trim().split(/\s+/));
    return this.forEach(el => {
      el.querySelectorAll(target).forEach(child => {
        child.classList.remove(...classList);
      });
    });
  }

  /*** HTML & Text Methods ***/

  // Get or set innerHTML of elements (user must sanitize input manually using sanitizeXSS)
  html(val) {
    if (val === undefined) {
      if (this.elements[0]) {
        return this.elements[0].innerHTML;
      }
      return null;
    }
    if (typeof val !== 'string' && typeof val !== 'number') {
      console.warn('html: Invalid value, expected string or number');
      return this;
    }
    return this.forEach(el => {
      el.innerHTML = String(val);
    });
  }

  // Get or set textContent of elements
  text(val) {
    if (val === undefined) {
      if (this.elements[0]) {
        return this.elements[0].textContent;
      }
      return null;
    }
    if (typeof val !== 'string' && typeof val !== 'number') {
      console.warn('text: Invalid value, expected string or number');
      return this;
    }
    return this.forEach(el => {
      el.textContent = val;
    });
  }

  // Add value to innerHTML (numeric or string concatenation; user must sanitize input manually using sanitizeXSS)
  htmlAdd(val) {
    if (val === undefined) {
      if (this.elements[0]) {
        return this.elements[0].innerHTML;
      }
      return null;
    }
    if (typeof val !== 'string' && typeof val !== 'number') {
      console.warn('htmlAdd: Invalid value, expected string or number');
      return this;
    }
    return this.forEach(el => {
      const currentText = el.textContent.trim();
      if (typeof val === 'number' && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE && /^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(currentText)) {
        el.innerHTML = (parseFloat(currentText) + val).toString();
      } else {
        el.innerHTML += String(val);
      }
    });
  }

  // Subtract value from innerHTML (numeric or string replacement)
  htmlSub(val) {
    if (val === undefined) {
      if (this.elements[0]) {
        return this.elements[0].innerHTML;
      }
      return null;
    }
    if (typeof val !== 'string' && typeof val !== 'number') {
      console.warn('htmlSub: Invalid value, expected string or number');
      return this;
    }
    return this.forEach(el => {
      const currentText = el.textContent.trim();
      if (typeof val === 'number' && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE && /^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(currentText)) {
        el.innerHTML = (parseFloat(currentText) - val).toString();
      } else {
        el.innerHTML = el.innerHTML.replace(new RegExp(this.escapeRegExp(String(val)), 'g'), '');
      }
    });
  }

  // Append HTML to elements (user must sanitize input manually using sanitizeXSS)
  htmlAppend(val) {
    return this.forEach(el => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('beforeend', val.trim());
      } else if (val instanceof HTMLElement) {
        el.appendChild(val);
      } else if (val instanceof IO) {
        val.elements.forEach(child => el.appendChild(child));
      } else {
        console.warn('htmlAppend: Invalid value', val);
      }
    });
  }

  // Prepend HTML to elements (user must sanitize input manually using sanitizeXSS)
  htmlPrepend(val) {
    return this.forEach(el => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('afterbegin', val.trim());
      } else if (val instanceof HTMLElement) {
        el.insertBefore(val, el.firstChild);
      } else if (val instanceof IO) {
        val.elements.forEach(child => el.insertBefore(child, el.firstChild));
      } else {
        console.warn('htmlPrepend: Invalid value', val);
      }
    });
  }

  // Insert HTML before all elements (user must sanitize input manually using sanitizeXSS)
  htmlBefore(val) {
    return this.forEach(el => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('beforebegin', val.trim());
      } else if (val instanceof HTMLElement) {
        el.parentNode.insertBefore(val, el);
      } else if (val instanceof IO) {
        val.elements.forEach(child => el.parentNode.insertBefore(child, el));
      } else {
        console.warn('htmlBefore: Invalid value', val);
      }
    });
  }

  // Insert HTML after all elements (user must sanitize input manually using sanitizeXSS)
  htmlAfter(val) {
    return this.forEach(el => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('afterend', val.trim());
      } else if (val instanceof HTMLElement) {
        el.parentNode.insertBefore(val, el.nextSibling);
      } else if (val instanceof IO) {
        Array.from(val.elements).reverse().forEach(child => el.parentNode.insertBefore(child, el.nextSibling));
      } else {
        console.warn('htmlAfter: Invalid value', val);
      }
    });
  }

  // Replace all elements with HTML (user must sanitize input manually using sanitizeXSS)
  htmlReplace(val) {
    return this.forEach(el => {
      if (typeof val === 'string') {
        const parent = el.parentNode;
        parent.insertAdjacentHTML('beforebegin', val.trim());
        el.remove();
      } else if (val instanceof HTMLElement) {
        el.parentNode.replaceChild(val, el);
      } else if (val instanceof IO) {
        const parent = el.parentNode;
        val.elements.forEach(child => parent.insertBefore(child, el));
        parent.removeChild(el);
      } else {
        console.warn('htmlReplace: Invalid value', val);
      }
    });
  }

  /*** DOM Manipulation Methods ***/

  // Remove all elements
  remove() {
    return this.forEach(el => {
      el.remove();
    });
  }

  /*** Attribute & Value Methods ***/

  // Get or set attribute
  attr(name, value) {
    if (!name || typeof name !== 'string') {
      console.warn('attr: Invalid attribute name');
      if (value === undefined) {
        return null;
      }
      return this;
    }
    if (value === undefined) {
      if (this.elements[0]) {
        return this.elements[0].getAttribute(name);
      }
      return null;
    }
    return this.forEach(el => {
      el.setAttribute(name, value);
    });
  }

  // Remove attribute from elements
  removeAttr(name) {
    if (!name || typeof name !== 'string') {
      console.warn('removeAttr: Invalid attribute name');
      return this;
    }
    return this.forEach(el => {
      el.removeAttribute(name);
    });
  }

  // Get or set aria attribute
  aria(param, val) {
    if (!param || typeof param !== 'string') {
      console.warn('aria: Invalid aria attribute');
      if (val === undefined) {
        return null;
      }
      return this;
    }
    if (val === undefined) {
      if (this.elements[0]) {
        return this.elements[0].getAttribute(`aria-${param}`);
      }
      return null;
    }
    return this.forEach(el => {
      el.setAttribute(`aria-${param}`, val);
    });
  }

  // Get or set data attribute
  data(name, value) {
    if (!name || typeof name !== 'string') {
      console.warn('data: Invalid data attribute name');
      if (value === undefined) {
        return null;
      }
      return this;
    }
    if (value === undefined) {
      if (this.elements[0]) {
        return this.elements[0].dataset[name];
      }
      return null;
    }
    return this.forEach(el => {
      el.dataset[name] = value;
    });
  }

  // Add value to data attribute (numeric or string concatenation)
  dataAdd(param, val) {
    if (!param || typeof param !== 'string' || val === undefined) {
      console.warn('dataAdd: Invalid parameter or value');
      return this;
    }
    return this.forEach(el => {
      const current = el.dataset[param] || '';
      if (typeof val === 'number' && !isNaN(parseFloat(current)) && Number.isFinite(parseFloat(current))) {
        el.dataset[param] = (parseFloat(current) + val).toString();
      } else {
        el.dataset[param] = current + val;
      }
    });
  }

  // Subtract value from data attribute (numeric or string replacement)
  dataSub(param, val) {
    if (!param || typeof param !== 'string' || val === undefined) {
      console.warn('dataSub: Invalid parameter or value');
      return this;
    }
    return this.forEach(el => {
      const current = el.dataset[param] || '';
      if (typeof val === 'number' && !isNaN(parseFloat(current)) && Number.isFinite(parseFloat(current))) {
        el.dataset[param] = (parseFloat(current) - val).toString();
      } else {
        el.dataset[param] = current.replace(new RegExp(this.escapeRegExp(String(val)), 'g'), '');
      }
    });
  }

  // Get all data attributes of first element
  dataAll() {
    if (this.elements[0]) {
      return Object.entries(this.elements[0].dataset);
    }
    return [];
  }

  // Get or set value of elements
  val(value) {
    if (value === undefined) {
      if (this.elements[0] && (this.elements[0] instanceof HTMLInputElement || this.elements[0] instanceof HTMLSelectElement || this.elements[0] instanceof HTMLTextAreaElement)) {
        return this.elements[0].value;
      }
      return null;
    }
    return this.forEach(el => {
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        el.value = value != null ? String(value) : '';
      }
    });
  }

  /*** CSS Methods ***/

  // Get or set CSS styles
  css(prop, value) {
    if (typeof prop === 'string' && value === undefined) {
      if (this.elements[0]) {
        return getComputedStyle(this.elements[0])[prop];
      }
      return null;
    }
    if (typeof prop !== 'string' && typeof prop !== 'object') {
      console.warn('css: Invalid property');
      return this;
    }
    return this.forEach(el => {
      if (typeof prop === 'object') {
        for (let key in prop) {
          if (key.startsWith('--')) {
            el.style.setProperty(key, prop[key]);
          } else {
            const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            if (camelKey in el.style) {
              el.style[camelKey] = prop[key];
            } else {
              console.warn(`css: Invalid style property "${key}"`);
            }
          }
        }
      } else {
        if (prop.startsWith('--')) {
          el.style.setProperty(prop, value);
        } else {
          const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          if (camelProp in el.style) {
            el.style[camelProp] = value;
          } else {
            console.warn(`css: Invalid style property "${prop}"`);
          }
        }
      }
    });
  }

  /*** Event Methods ***/

  // Add event listener to all elements
  on(event, handler) {
    if (!event || !handler || typeof event !== 'string' || typeof handler !== 'function') {
      console.warn('on: Invalid event or handler');
      return this;
    }
    return this.forEach(el => {
      el.addEventListener(event, handler);
    });
  }

  // Remove event listener from all elements
  off(event, handler) {
    if (!event || !handler || typeof event !== 'string' || typeof handler !== 'function') {
      console.warn('off: Invalid event or handler');
      return this;
    }
    return this.forEach(el => {
      el.removeEventListener(event, handler);
    });
  }

  // Trigger click or add click handler
  click(handler) {
    if (!handler) {
      return this.forEach(el => {
        el.click();
      });
    }
    if (typeof handler !== 'function') {
      console.warn('click: Invalid handler');
      return this;
    }
    return this.forEach(el => {
      el.addEventListener('click', handler);
    });
  }

  // Delegate event to matching selector
  delegate(event, selector, handler) {
    if (!event || !selector || !handler || typeof event !== 'string' || typeof selector !== 'string' || typeof handler !== 'function') {
      console.warn('delegate: Invalid event, selector, or handler');
      return this;
    }
    return this.forEach(el => {
      el.addEventListener(event, e => {
        const target = e.target.closest(selector);
        if (target && el.contains(target)) {
          handler.call(target, e);
        }
      });
    });
  }

  // Trigger a custom or native event on all elements
  trigger(eventType, options = { bubbles: true, cancelable: true }) {
    if (!eventType || typeof eventType !== 'string') {
      console.warn('trigger: Invalid event type');
      return this;
    }
    return this.forEach(el => {
      const event = new Event(eventType, options);
      el.dispatchEvent(event);
    });
  }

  /*** Search Methods ***/

  // Find first element by selector within elements
  findBy(target) {
    if (!target || typeof target !== 'string') {
      console.warn('findBy: Invalid selector');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(target))).slice(0, 1));
  }

  // Find all elements by selector within elements
  findAllBy(target) {
    if (!target || typeof target !== 'string') {
      console.warn('findAllBy: Invalid selector');
      return new IO([]);
    }
    const found = [];
    for (const el of this.elements) {
      found.push(...el.querySelectorAll(target));
    }
    return new IO(found);
  }

  // Find first element by ID within document
  findById(id) {
    if (!id || typeof id !== 'string') {
      console.warn('findById: Invalid ID');
      return new IO([]);
    }
    const safeId = CSS.escape(id);
    return new IO(this.elements.flatMap(el => {
      const found = el.querySelector(`#${safeId}`);
      return found ? [found] : [];
    }).slice(0, 1));
  }

  // Find first element by class within elements
  findByClass(className) {
    if (!className || typeof className !== 'string') {
      console.warn('findByClass: Invalid class name');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`.${className}`))).slice(0, 1));
  }

  // Find all elements by class within elements
  findAllByClass(className) {
    if (!className || typeof className !== 'string') {
      console.warn('findAllByClass: Invalid class name');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`.${className}`))));
  }

  // Find first element by name attribute within elements
  findByName(name) {
    if (!name || typeof name !== 'string') {
      console.warn('findByName: Invalid name');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`[name="${name}"]`))).slice(0, 1));
  }

  // Find all elements by name attribute within elements
  findAllByName(name) {
    if (!name || typeof name !== 'string') {
      console.warn('findAllByName: Invalid name');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`[name="${name}"]`))));
  }

  // Find first element by type attribute within elements
  findByType(type) {
    if (!type || typeof type !== 'string') {
      console.warn('findByType: Invalid type');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`[type="${type}"]`))).slice(0, 1));
  }

  // Find all elements by type attribute within elements
  findAllByType(type) {
    if (!type || typeof type !== 'string') {
      console.warn('findAllByType: Invalid type');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`[type="${type}"]`))));
  }

  // Find first element by attribute within elements
  findByAttr(attr, val) {
    if (!attr || typeof attr !== 'string') {
      console.warn('findByAttr: Invalid attribute');
      return new IO([]);
    }
    const selector = val !== undefined ? `[${attr}="${val}"]` : `[${attr}]`;
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(selector))).slice(0, 1));
  }

  // Find all elements by attribute within elements
  findAllByAttr(attr, val) {
    if (!attr || typeof attr !== 'string') {
      console.warn('findAllByAttr: Invalid attribute');
      return new IO([]);
    }
    const selector = val !== undefined ? `[${attr}="${val}"]` : `[${attr}]`;
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(selector))));
  }

  // Find closest parent by ID
  findParentById(id) {
    if (!id || typeof id !== 'string') {
      console.warn('findParentById: Invalid ID');
      return new IO([]);
    }
    const safeId = CSS.escape(id);
    return new IO(this.elements.map(el => el.closest(`#${safeId}`)).filter(Boolean));
  }

  // Find closest parent by class
  findParentByClass(className) {
    if (!className || typeof className !== 'string') {
      console.warn('findParentByClass: Invalid class name');
      return new IO([]);
    }
    return new IO(this.elements.map(el => el.closest(`.${className}`)).filter(Boolean));
  }

  /*** Utility Methods ***/

  // Check if value is empty based on strict list
  isEmptyValue(strictZero = true) {
    const value = this.val();
    return (typeof value === 'undefined' || ['false', 'null', false, null, ''].includes(value) || (strictZero && value === 0));
  }

  // Check if value is not empty
  isNotEmptyValue(strictZero = true) {
    return !this.isEmptyValue(strictZero);
  }

  // Check if data attribute is empty based on strict list
  isEmptyData(param, strictZero = true) {
    if (!param || typeof param !== 'string') {
      console.warn('isEmptyData: Invalid parameter');
      return true;
    }
    const data = this.data(param);
    return (typeof data === 'undefined' || ['false', 'null', false, null, ''].includes(data) || (strictZero && data === 0));
  }

  // Check if data attribute is not empty
  isNotEmptyData(param, strictZero = true) {
    return !this.isEmptyData(param, strictZero);
  }

  // Check if any elements exist
  exists() {
    return this.elements.length > 0;
  }

  // Return first element as IO instance
  first() {
    return new IO(this.elements[0] ?? []);
  }

  // Return last element as IO instance
  last() {
    return new IO(this.elements[this.elements.length - 1] ?? []);
  }

  // Return element at index as IO instance
  eq(index) {
    return new IO(this.elements[index] ?? []);
  }

  // Get number of elements
  count() {
    return this.elements.length;
  }

  // Get raw DOM element at index
  get(index) {
    return this.elements[index] ?? null;
  }

  // Sanitize HTML string to prevent XSS, allowing safe HTML
  sanitizeXSS(str, options = {
    allowedTags: ['b', 'i', 'u', 'strong', 'em', 'p', 'div', 'span', 'a', 'br'],
    allowedAttributes: ['href', 'class', 'id']
  }) {
    if (typeof str !== 'string') {
      console.warn('sanitizeXSS: Invalid input, expected string');
      return '';
    }
    const { allowedTags, allowedAttributes } = options;
    const temp = document.createElement('div');
    temp.innerHTML = str;
    const fragment = document.createDocumentFragment();
    fragment.append(...temp.childNodes);
    const sanitizeNode = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (!allowedTags.includes(tagName)) {
          node.replaceWith(...Array.from(node.childNodes).map(sanitizeNode));
        } else {
          Array.from(node.attributes).forEach(attr => {
            const attrName = attr.name.toLowerCase();
            if (!allowedAttributes.includes(attrName) || (attrName === 'href' && /^(javascript|data):/i.test(attr.value)) || attrName.startsWith('on') || attrName === 'style') {
              node.removeAttribute(attr.name);
            }
          });
          Array.from(node.childNodes).forEach(sanitizeNode);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/(javascript|data):/gi, '');
      }
      return node;
    };
    Array.from(fragment.childNodes).forEach(sanitizeNode);
    return temp.innerHTML;
  }

  // Escape string for use in RegExp
  escapeRegExp(str) {
    return str.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Shortcut function to create IO instance
 */
const $io = (selector, context) => new IO(selector, context);
