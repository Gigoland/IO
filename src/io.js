/**
 * IO - Modern lightweight DOM utility library
 * Version: 1.0.0
 * Author: Gigoland.com
 * License: MIT License
 * Repository: https://github.com/Gigoland/IO
 * Description: Lightweight utility for DOM manipulation, events, attributes, CSS, and safe HTML handling.
 */
class IO {
  // Initialize elements based on selector type
  constructor(selector, context = document) {
    if (typeof selector === 'string') {
      if (selector === 'body') {
        if (!document.body) {
          console.warn('IO: document.body is not available, ensure DOM is loaded');
          this.elements = [];
        } else {
          this.elements = [document.body]; // Optimize for 'body' selector
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
      if (!document.body) {
        console.warn('IO: document.body is not available, ensure DOM is loaded');
        this.elements = [];
      } else {
        this.elements = [selector.body]; // Use body for Document to avoid method errors
      }
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
      this.elements = Array.from(selector).filter(el => el instanceof Element);
    } else {
      this.elements = [];
      console.warn('IO: Invalid selector type');
    }
  }

  // Iterate over all elements
  each(callback, natif = true) {
    this.elements.forEach((el, i) => callback.call(el, natif ? el : new IO(el), i));
    return this;
  }

  /*** Visibility Methods ***/

  // Show all elements by resetting display or setting to block
  show(isEmpty = false) {
    return this.each(el => {
      el.style.display = isEmpty ? '' : 'block';
    });
  }

  // Hide all elements
  hide() {
    return this.each(el => (el.style.display = 'none'));
  }

  // Toggle visibility of all elements
  toggle(display = 'block') {
    return this.each(el => (el.style.display = el.style.display === 'none' ? display : 'none'));
  }

  // Enable all elements
  enable() {
    return this.each(el => {
      el.disabled = false;
      el.style.pointerEvents = 'auto';
      el.classList.remove('disabled', 'opacity-25');
    });
  }

  // Disable all elements
  disable() {
    return this.each(el => {
      el.disabled = true;
      el.style.pointerEvents = 'none';
      el.classList.add('disabled', 'opacity-25');
    });
  }

  /*** Class Methods ***/

  // Add class to all elements
  addClass(cls) {
    if (!cls || typeof cls !== 'string') {
      console.warn('addClass: Invalid class name');
      return this;
    }
    return this.each(el => el.classList.add(cls));
  }

  // Remove class from all elements
  removeClass(cls) {
    if (!cls || typeof cls !== 'string') {
      console.warn('removeClass: Invalid class name');
      return this;
    }
    return this.each(el => el.classList.remove(cls));
  }

  // Toggle class on all elements
  toggleClass(cls) {
    if (!cls || typeof cls !== 'string') {
      console.warn('toggleClass: Invalid class name');
      return this;
    }
    return this.each(el => el.classList.toggle(cls));
  }

  // Check if first element has class
  hasClass(cls) {
    if (!cls || typeof cls !== 'string') {
      console.warn('hasClass: Invalid class name');
      return false;
    }
    return this.elements[0]?.classList.contains(cls) ?? false;
  }

  // Check if first element doesn't have class
  hasNotClass(cls) {
    return !this.hasClass(cls);
  }

  // Remove class from elements found by selector within current elements
  removeClassBy(target, className) {
    if (!target || !className || typeof target !== 'string' || typeof className !== 'string') {
      console.warn('removeClassBy: Invalid target or className');
      return this;
    }
    return this.each(el => {
      el.querySelectorAll(target).forEach(child => {
        child.classList.remove(className);
      });
    });
  }

  /*** HTML & Text Methods ***/

  // Get or set innerHTML of elements (use sanitizeXSS manually for safety)
  html(val) {
    if (val === undefined) {
      return this.elements[0]?.innerHTML ?? null;
    }
    if (typeof val !== 'string' && typeof val !== 'number') {
      console.warn('html: Invalid value, expected string or number');
      return this;
    }
    return this.each(el => (el.innerHTML = val));
  }

  // Get or set textContent of elements
  text(val) {
    if (val === undefined) {
      return this.elements[0]?.textContent ?? null;
    }
    if (typeof val !== 'string' && typeof val !== 'number') {
      console.warn('text: Invalid value, expected string or number');
      return this;
    }
    return this.each(el => (el.textContent = val));
  }

  // Add value to innerHTML (numeric or string concatenation)
  htmlAdd(val) {
    if (val === undefined || (typeof val !== 'string' && typeof val !== 'number')) {
      console.warn('htmlAdd: Invalid value, expected string or number');
      return this;
    }
    return this.each(el => {
      if (typeof val === 'number' && /^-?\d+(?:\.\d+)?$/.test(el.innerHTML.trim())) {
        el.innerHTML = parseFloat(el.innerHTML.trim()) + val;
      } else {
        el.innerHTML += val;
      }
    });
  }

  // Subtract value from innerHTML (numeric or string replacement)
  htmlSub(val) {
    if (val === undefined || (typeof val !== 'string' && typeof val !== 'number')) {
      console.warn('htmlSub: Invalid value, expected string or number');
      return this;
    }
    return this.each(el => {
      if (typeof val === 'number' && /^-?\d+(?:\.\d+)?$/.test(el.innerHTML.trim())) {
        el.innerHTML = parseFloat(el.innerHTML.trim()) - val;
      } else {
        el.innerHTML = el.innerHTML.replace(new RegExp(this.escapeRegExp(val), 'g'), '');
      }
    });
  }

  // Append HTML to elements (use sanitizeXSS manually for safety)
  htmlAppend(val) {
    if (!val || typeof val !== 'string') {
      console.warn('htmlAppend: Invalid HTML string');
      return this;
    }
    return this.each(el => el.insertAdjacentHTML('beforeend', val));
  }

  // Prepend HTML to elements (use sanitizeXSS manually for safety)
  htmlPrepend(val) {
    if (!val || typeof val !== 'string') {
      console.warn('htmlPrepend: Invalid HTML string');
      return this;
    }
    return this.each(el => el.insertAdjacentHTML('afterbegin', val));
  }

  // Insert HTML before all elements (use sanitizeXSS manually for safety)
  htmlBefore(val) {
    if (!val || typeof val !== 'string') {
      console.warn('htmlBefore: Invalid HTML string');
      return this;
    }
    return this.each(el => el.insertAdjacentHTML('beforebegin', val));
  }

  // Insert HTML after all elements (use sanitizeXSS manually for safety)
  htmlAfter(val) {
    if (!val || typeof val !== 'string') {
      console.warn('htmlAfter: Invalid HTML string');
      return this;
    }
    return this.each(el => el.insertAdjacentHTML('afterend', val));
  }

  // Replace all elements with HTML (use sanitizeXSS manually for safety)
  htmlReplace(val) {
    if (!val || typeof val !== 'string') {
      console.warn('htmlReplace: Invalid HTML string');
      return this;
    }
    return this.each(el => (el.outerHTML = val));
  }

  /*** DOM Manipulation Methods ***/

  // Append HTML to elements (use sanitizeXSS manually for safety)
  append(val) {
    if (!val || typeof val !== 'string') {
      console.warn('append: Invalid HTML string');
      return this;
    }
    return this.each(el => el.insertAdjacentHTML('beforeend', val));
  }

  // Prepend HTML to elements (use sanitizeXSS manually for safety)
  prepend(val) {
    if (!val || typeof val !== 'string') {
      console.warn('prepend: Invalid HTML string');
      return this;
    }
    return this.each(el => el.insertAdjacentHTML('afterbegin', val));
  }

  // Remove all elements
  remove() {
    return this.each(el => el.remove());
  }

  /*** Attribute & Value Methods ***/

  // Get or set attribute
  attr(name, value) {
    if (!name || typeof name !== 'string') {
      console.warn('attr: Invalid attribute name');
      return value === undefined ? null : this;
    }
    if (value === undefined) {
      return this.elements[0]?.getAttribute(name) ?? null;
    }
    return this.each(el => el.setAttribute(name, value));
  }

  // Remove attribute from elements
  removeAttr(name) {
    if (!name || typeof name !== 'string') {
      console.warn('removeAttr: Invalid attribute name');
      return this;
    }
    return this.each(el => el.removeAttribute(name));
  }

  // Get or set aria attribute
  aria(param, val) {
    if (!param || typeof param !== 'string') {
      console.warn('aria: Invalid aria attribute');
      return val === undefined ? null : this;
    }
    if (val === undefined) {
      return this.elements[0]?.getAttribute(`aria-${param}`) ?? null;
    }
    return this.each(el => el.setAttribute(`aria-${param}`, val));
  }

  // Get or set data attribute
  data(name, value) {
    if (!name || typeof name !== 'string') {
      console.warn('data: Invalid data attribute name');
      return value === undefined ? null : this;
    }
    if (value === undefined) {
      return this.elements[0]?.dataset[name] ?? undefined;
    }
    return this.each(el => (el.dataset[name] = value));
  }

  // Add value to data attribute (numeric or string concatenation)
  dataAdd(param, val) {
    if (!param || typeof param !== 'string' || val === undefined) {
      console.warn('dataAdd: Invalid parameter or value');
      return this;
    }
    return this.each(el => {
      const current = el.dataset[param] || '';
      if (typeof val === 'number' && /^-?\d+(?:\.\d+)?$/.test(current.trim())) {
        el.dataset[param] = parseFloat(current.trim()) + val;
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
    return this.each(el => {
      const current = el.dataset[param] || '';
      if (typeof val === 'number' && /^-?\d+(?:\.\d+)?$/.test(current.trim())) {
        el.dataset[param] = parseFloat(current.trim()) - val;
      } else {
        el.dataset[param] = current.replace(new RegExp(this.escapeRegExp(val), 'g'), '');
      }
    });
  }

  // Get all data attributes of first element
  dataAll() {
    return this.elements[0] ? Object.entries(this.elements[0].dataset) : [];
  }

  // Get or set value of elements
  val(value) {
    if (value === undefined) {
      return this.elements[0]?.value ?? null;
    }
    return this.each(el => (el.value = value));
  }

  /*** CSS Methods ***/

  // Get or set CSS styles
  css(prop, value) {
    if (typeof prop === 'string' && value === undefined) {
      return this.elements[0] ? getComputedStyle(this.elements[0])[prop] : null;
    }
    if (typeof prop !== 'string' && typeof prop !== 'object') {
      console.warn('css: Invalid property');
      return this;
    }
    return this.each(el => {
      if (typeof prop === 'object') {
        for (let key in prop) {
          el.style[key] = prop[key];
        }
      } else {
        el.style[prop] = value;
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
    return this.each(el => el.addEventListener(event, handler));
  }

  // Remove event listener from all elements
  off(event, handler) {
    if (!event || !handler || typeof event !== 'string' || typeof handler !== 'function') {
      console.warn('off: Invalid event or handler');
      return this;
    }
    return this.each(el => el.removeEventListener(event, handler));
  }

  // Trigger click or add click handler
  click(handler) {
    if (!handler) {
      return this.each(el => el.click());
    }
    if (typeof handler !== 'function') {
      console.warn('click: Invalid handler');
      return this;
    }
    return this.each(el => el.addEventListener('click', handler));
  }

  // Delegate event to matching selector
  delegate(event, selector, handler) {
    if (!event || !selector || !handler || typeof event !== 'string' || typeof selector !== 'string' || typeof handler !== 'function') {
      console.warn('delegate: Invalid event, selector, or handler');
      return this;
    }
    return this.each(el => {
      el.addEventListener(event, e => {
        if (e.target.matches(selector)) {
          handler.call(e.target, e);
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
    return this.each(el => {
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
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(target))));
  }

  // Find first element by ID within document
  findById(id) {
    if (!id || typeof id !== 'string') {
      console.warn('findById: Invalid ID');
      return new IO([]);
    }
    // Use document.getElementById for efficiency, regardless of context
    const found = document.getElementById(id);
    return new IO(found ? [found] : []);
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
    const found = this.elements.map(el => el.closest(`#${id}`)).filter(el => el);
    return new IO(found);
  }

  // Find closest parent by class
  findParentByClass(className) {
    if (!className || typeof className !== 'string') {
      console.warn('findParentByClass: Invalid class name');
      return new IO([]);
    }
    const found = this.elements.map(el => el.closest(`.${className}`)).filter(el => el);
    return new IO(found);
  }

  /*** Utility Methods ***/

  // Check if value, text, or HTML is empty
  isEmptyValue() {
    const val = this.val() ?? this.text() ?? this.html();
    return val === null || val === undefined || val.toString().trim() === '';
  }

  // Check if value is not empty
  isNotEmptyValue() {
    return !this.isEmptyValue();
  }

  // Check if data attribute is empty
  isEmptyData(param) {
    if (!param || typeof param !== 'string') {
      console.warn('isEmptyData: Invalid parameter');
      return true;
    }
    const data = this.data(param);
    return data === null || data === undefined || ['', 'false', 'null', '0'].includes(data.toString().trim());
  }

  // Check if data attribute is not empty
  isNotEmptyData(param) {
    return !this.isEmptyData(param);
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
  sanitizeXSS(str, options = { allowedTags: ['b', 'i', 'u', 'strong', 'em', 'p', 'div', 'span', 'a', 'br'], allowedAttributes: ['href', 'class', 'id'] }) {
    if (typeof str !== 'string') {
      console.warn('sanitizeXSS: Invalid input, expected string');
      return '';
    }
    const { allowedTags, allowedAttributes } = options;
    const temp = document.createElement('div');
    temp.innerHTML = str;
    const sanitizeNode = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (!allowedTags.includes(node.tagName.toLowerCase())) {
          node.replaceWith(...Array.from(node.childNodes).map(sanitizeNode));
        } else {
          Array.from(node.attributes).forEach(attr => {
            if (!allowedAttributes.includes(attr.name)) {
              node.removeAttribute(attr.name);
            }
          });
          Array.from(node.childNodes).forEach(sanitizeNode);
        }
      }
      return node;
    };
    Array.from(temp.childNodes).forEach(sanitizeNode);
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
