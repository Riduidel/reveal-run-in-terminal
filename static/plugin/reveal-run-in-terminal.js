(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],3:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":1,"./encode":2}],4:[function(require,module,exports){
module.exports = class {
  static highlight(code) {
    this._instance = this._instance || new this();
    return this._instance.highlight(code);
  }

  constructor() {
    this.worker = new Worker('/plugin/reveal-run-in-terminal-hljs-worker.js');
    this.pending = {};
    this.worker.onmessage = (event) => {
      this.pending[event.data.callbackId].resolve(event.data.code.value);
      delete this.pending[event.data.callbackId];
    };
  }

  highlight(code) {
    let callbackId = (Date.now() + Math.random()).toString(16);
    return new Promise((resolve, reject) => {
      this.pending[callbackId] = {resolve, reject};
      this.worker.postMessage({callbackId, code});
    });
  }
}

},{}],5:[function(require,module,exports){
const Slide = require('./slide');

window.RunInTerminal = class {
  static init(options) {
    let runInTerminal = new this(options);
    runInTerminal.load();

    Reveal.addEventListener('fragmentshown', function(event) {
      if (!event.fragment.dataset.terminalFragment) return;
      let slide = runInTerminal.forSection(event.fragment.parentElement);

      if (event.fragment.dataset.terminalFragment === 'showCommand') {
        slide.renderCommand();
        slide.scrollToBottom();
      } else if (event.fragment.dataset.terminalFragment === 'execute') {
        slide.executeCommand();
      }
    });

    Reveal.addEventListener('fragmenthidden', function(event) {
      if (!event.fragment.dataset.terminalFragment) return;
      let slide = runInTerminal.forSection(event.fragment.parentElement);

      if (event.fragment.dataset.terminalFragment === 'showCommand') {
        slide.renderPrompt();
      } else if (event.fragment.dataset.terminalFragment === 'execute') {
        slide.renderCommand();
      }
    });

    Reveal.addEventListener('slidechanged', function(event) {
      let slide = runInTerminal.forSection(event.currentSlide);
      if (slide && slide.clearOnShow) slide.renderPrompt();
      runInTerminal.reload({except: [slide]});
    });

    return runInTerminal;
  }

  constructor(options) { this.options = options || {}; }

  load() {
    let sections = document.querySelectorAll('section[data-run-in-terminal]');
    this.slides = [].map.call(sections, section => {
      return new Slide(section, this.options);
    });
  }

  reload(options = {except: []}) {
    this.slides
      .filter(s => options.except.indexOf(s) !== -1)
      .forEach(s => s.load());
  }

  forSection(section) {
    return this.slides.filter((s) => s.section === section)[0];
  }
};

},{"./slide":7}],6:[function(require,module,exports){
const querystring = require('querystring');

module.exports = (params, fn) => {
  let qs = querystring.stringify(params);
  return new Promise((resolve, reject) => {
    let source = new EventSource(`/reveal-run-in-terminal?${qs}`);
    source.addEventListener('message', e => fn(JSON.parse(e.data)));
    source.addEventListener('done', () => resolve(source.close()));
    source.addEventListener('error', e => {
      if (e.data) {
        let messages = JSON.parse(e.data).messages;
        messages.forEach(err => console.error(err));
        reject(new Error(`${messages.join(', ')}`));
      } else {
        reject(e);
      }

      source.close();
    });
  });
};

},{"querystring":3}],7:[function(require,module,exports){
const runCommand = require('./run-command');
const Highligher = require('./highligher');

module.exports = class {
  constructor(section, options) {
    this.options = options;
    this.section = section;

    this.hide();
    this.addElement('container');

    this.addElement('title', {tagName: 'span', parent: this.container});
    this.title.innerText = this.src;

    ['code', 'term'].forEach(name => this.addElement(name, {
      tagName: 'pre',
      classes: ['hljs'],
      parent: this.container
    }));

    ['showCommand', 'execute'].forEach(name => this.addElement(name, {
      classes: ['fragment'],
      dataset: {terminalFragment: name}
    }));

    this.load();
  }

  load() {
    this.hide();
    return fetch(this.src)
      .then(response => response.text())
//      .then(code => Highligher.highlight(code))
      .then(html => html.replace(/\n/g, '<span class="line"></span>\n'))
      .then(html => this.code.innerHTML = html)
      .then(() => this.container.scrollTop = 0)
      .then(() => this.show());
  }

  addElement(name, options) {
    options = options || {};

    this[name] = document.createElement(options.tagName || 'div');
    (options.classes || []).concat([name]).forEach(clazz => {
      this[name].classList.add(clazz)
    });
    Object.assign(this[name].dataset, options.dataset || {});

    (options.parent || this.section).appendChild(this[name]);
    return this[name];
  }

  scrollToBottom() {
    let interval = setInterval(() => {
      let top = this.container.scrollTop;
      this.container.scrollTop += 2;
      if (top === this.container.scrollTop) {
        clearInterval(interval);
      }
    }, 1);
  }

  hide() { this.section.style.display = 'none'; }

  show() { this.section.style.display = 'block'; }

  renderPrompt() { this.term.innerText = `> █`; }

  renderCommand() { this.term.innerText = `> ${this.command}█`; }

  executeCommand() {
    this.term.innerText = `> ${this.command}\n`;
    runCommand(this.params, output => {
      this.term.innerText = `${this.term.innerText.trim()}\n${output}`;
      this.scrollToBottom();
    }).then(() => {
      this.term.innerText = `${this.term.innerText.trim().replace(/█/g, '')}\n> █`;
      this.scrollToBottom();
    }).catch(err => this.term.innerText = err.message);
  }

  property(prop) { return this.section.dataset[prop]; }

  get clearOnShow() {
    return !this.showCommand.classList.contains('visible');
  }

  get command() {
    let command = `${this.bin} ${this.src}`
    if (this.args) command = `${command} ${this.args}`;
    return command;
  }

  get params() {
    let params = {bin: this.bin, src: this.src};
    if (this.args) params.args = this.args;
    return params;
  }

  get bin() {
    return this.property('runInTerminalBin') || this.options.defaultBin;
  }

  get src() { return this.property('runInTerminal'); }

  get args() { return this.property('runInTerminalArgs'); }
};

},{"./highligher":4,"./run-command":6}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2RlY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9pbmRleC5qcyIsInNyYy9oaWdobGlnaGVyLmpzIiwic3JjL3JldmVhbC1ydW4taW4tdGVybWluYWwuanMiLCJzcmMvcnVuLWNvbW1hbmQuanMiLCJzcmMvc2xpZGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBJZiBvYmouaGFzT3duUHJvcGVydHkgaGFzIGJlZW4gb3ZlcnJpZGRlbiwgdGhlbiBjYWxsaW5nXG4vLyBvYmouaGFzT3duUHJvcGVydHkocHJvcCkgd2lsbCBicmVhay5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2pveWVudC9ub2RlL2lzc3Vlcy8xNzA3XG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHFzLCBzZXAsIGVxLCBvcHRpb25zKSB7XG4gIHNlcCA9IHNlcCB8fCAnJic7XG4gIGVxID0gZXEgfHwgJz0nO1xuICB2YXIgb2JqID0ge307XG5cbiAgaWYgKHR5cGVvZiBxcyAhPT0gJ3N0cmluZycgfHwgcXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHZhciByZWdleHAgPSAvXFwrL2c7XG4gIHFzID0gcXMuc3BsaXQoc2VwKTtcblxuICB2YXIgbWF4S2V5cyA9IDEwMDA7XG4gIGlmIChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zLm1heEtleXMgPT09ICdudW1iZXInKSB7XG4gICAgbWF4S2V5cyA9IG9wdGlvbnMubWF4S2V5cztcbiAgfVxuXG4gIHZhciBsZW4gPSBxcy5sZW5ndGg7XG4gIC8vIG1heEtleXMgPD0gMCBtZWFucyB0aGF0IHdlIHNob3VsZCBub3QgbGltaXQga2V5cyBjb3VudFxuICBpZiAobWF4S2V5cyA+IDAgJiYgbGVuID4gbWF4S2V5cykge1xuICAgIGxlbiA9IG1heEtleXM7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdmFyIHggPSBxc1tpXS5yZXBsYWNlKHJlZ2V4cCwgJyUyMCcpLFxuICAgICAgICBpZHggPSB4LmluZGV4T2YoZXEpLFxuICAgICAgICBrc3RyLCB2c3RyLCBrLCB2O1xuXG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBrc3RyID0geC5zdWJzdHIoMCwgaWR4KTtcbiAgICAgIHZzdHIgPSB4LnN1YnN0cihpZHggKyAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAga3N0ciA9IHg7XG4gICAgICB2c3RyID0gJyc7XG4gICAgfVxuXG4gICAgayA9IGRlY29kZVVSSUNvbXBvbmVudChrc3RyKTtcbiAgICB2ID0gZGVjb2RlVVJJQ29tcG9uZW50KHZzdHIpO1xuXG4gICAgaWYgKCFoYXNPd25Qcm9wZXJ0eShvYmosIGspKSB7XG4gICAgICBvYmpba10gPSB2O1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShvYmpba10pKSB7XG4gICAgICBvYmpba10ucHVzaCh2KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqW2tdID0gW29ialtrXSwgdl07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoeHMpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHN0cmluZ2lmeVByaW1pdGl2ZSA9IGZ1bmN0aW9uKHYpIHtcbiAgc3dpdGNoICh0eXBlb2Ygdikge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gdjtcblxuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgcmV0dXJuIHYgPyAndHJ1ZScgOiAnZmFsc2UnO1xuXG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgIHJldHVybiBpc0Zpbml0ZSh2KSA/IHYgOiAnJztcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJyc7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCBzZXAsIGVxLCBuYW1lKSB7XG4gIHNlcCA9IHNlcCB8fCAnJic7XG4gIGVxID0gZXEgfHwgJz0nO1xuICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgb2JqID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG1hcChvYmplY3RLZXlzKG9iaiksIGZ1bmN0aW9uKGspIHtcbiAgICAgIHZhciBrcyA9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUoaykpICsgZXE7XG4gICAgICBpZiAoaXNBcnJheShvYmpba10pKSB7XG4gICAgICAgIHJldHVybiBtYXAob2JqW2tdLCBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZSh2KSk7XG4gICAgICAgIH0pLmpvaW4oc2VwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrcyArIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUob2JqW2tdKSk7XG4gICAgICB9XG4gICAgfSkuam9pbihzZXApO1xuXG4gIH1cblxuICBpZiAoIW5hbWUpIHJldHVybiAnJztcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUobmFtZSkpICsgZXEgK1xuICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmopKTtcbn07XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoeHMpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG5mdW5jdGlvbiBtYXAgKHhzLCBmKSB7XG4gIGlmICh4cy5tYXApIHJldHVybiB4cy5tYXAoZik7XG4gIHZhciByZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgIHJlcy5wdXNoKGYoeHNbaV0sIGkpKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHJlcy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuZGVjb2RlID0gZXhwb3J0cy5wYXJzZSA9IHJlcXVpcmUoJy4vZGVjb2RlJyk7XG5leHBvcnRzLmVuY29kZSA9IGV4cG9ydHMuc3RyaW5naWZ5ID0gcmVxdWlyZSgnLi9lbmNvZGUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3Mge1xuICBzdGF0aWMgaGlnaGxpZ2h0KGNvZGUpIHtcbiAgICB0aGlzLl9pbnN0YW5jZSA9IHRoaXMuX2luc3RhbmNlIHx8IG5ldyB0aGlzKCk7XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlLmhpZ2hsaWdodChjb2RlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMud29ya2VyID0gbmV3IFdvcmtlcignL3BsdWdpbi9yZXZlYWwtcnVuLWluLXRlcm1pbmFsLWhsanMtd29ya2VyLmpzJyk7XG4gICAgdGhpcy5wZW5kaW5nID0ge307XG4gICAgdGhpcy53b3JrZXIub25tZXNzYWdlID0gKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnBlbmRpbmdbZXZlbnQuZGF0YS5jYWxsYmFja0lkXS5yZXNvbHZlKGV2ZW50LmRhdGEuY29kZS52YWx1ZSk7XG4gICAgICBkZWxldGUgdGhpcy5wZW5kaW5nW2V2ZW50LmRhdGEuY2FsbGJhY2tJZF07XG4gICAgfTtcbiAgfVxuXG4gIGhpZ2hsaWdodChjb2RlKSB7XG4gICAgbGV0IGNhbGxiYWNrSWQgPSAoRGF0ZS5ub3coKSArIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5wZW5kaW5nW2NhbGxiYWNrSWRdID0ge3Jlc29sdmUsIHJlamVjdH07XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZSh7Y2FsbGJhY2tJZCwgY29kZX0pO1xuICAgIH0pO1xuICB9XG59XG4iLCJjb25zdCBTbGlkZSA9IHJlcXVpcmUoJy4vc2xpZGUnKTtcblxud2luZG93LlJ1bkluVGVybWluYWwgPSBjbGFzcyB7XG4gIHN0YXRpYyBpbml0KG9wdGlvbnMpIHtcbiAgICBsZXQgcnVuSW5UZXJtaW5hbCA9IG5ldyB0aGlzKG9wdGlvbnMpO1xuICAgIHJ1bkluVGVybWluYWwubG9hZCgpO1xuXG4gICAgUmV2ZWFsLmFkZEV2ZW50TGlzdGVuZXIoJ2ZyYWdtZW50c2hvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKCFldmVudC5mcmFnbWVudC5kYXRhc2V0LnRlcm1pbmFsRnJhZ21lbnQpIHJldHVybjtcbiAgICAgIGxldCBzbGlkZSA9IHJ1bkluVGVybWluYWwuZm9yU2VjdGlvbihldmVudC5mcmFnbWVudC5wYXJlbnRFbGVtZW50KTtcblxuICAgICAgaWYgKGV2ZW50LmZyYWdtZW50LmRhdGFzZXQudGVybWluYWxGcmFnbWVudCA9PT0gJ3Nob3dDb21tYW5kJykge1xuICAgICAgICBzbGlkZS5yZW5kZXJDb21tYW5kKCk7XG4gICAgICAgIHNsaWRlLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9IGVsc2UgaWYgKGV2ZW50LmZyYWdtZW50LmRhdGFzZXQudGVybWluYWxGcmFnbWVudCA9PT0gJ2V4ZWN1dGUnKSB7XG4gICAgICAgIHNsaWRlLmV4ZWN1dGVDb21tYW5kKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBSZXZlYWwuYWRkRXZlbnRMaXN0ZW5lcignZnJhZ21lbnRoaWRkZW4nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKCFldmVudC5mcmFnbWVudC5kYXRhc2V0LnRlcm1pbmFsRnJhZ21lbnQpIHJldHVybjtcbiAgICAgIGxldCBzbGlkZSA9IHJ1bkluVGVybWluYWwuZm9yU2VjdGlvbihldmVudC5mcmFnbWVudC5wYXJlbnRFbGVtZW50KTtcblxuICAgICAgaWYgKGV2ZW50LmZyYWdtZW50LmRhdGFzZXQudGVybWluYWxGcmFnbWVudCA9PT0gJ3Nob3dDb21tYW5kJykge1xuICAgICAgICBzbGlkZS5yZW5kZXJQcm9tcHQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZnJhZ21lbnQuZGF0YXNldC50ZXJtaW5hbEZyYWdtZW50ID09PSAnZXhlY3V0ZScpIHtcbiAgICAgICAgc2xpZGUucmVuZGVyQ29tbWFuZCgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgUmV2ZWFsLmFkZEV2ZW50TGlzdGVuZXIoJ3NsaWRlY2hhbmdlZCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBsZXQgc2xpZGUgPSBydW5JblRlcm1pbmFsLmZvclNlY3Rpb24oZXZlbnQuY3VycmVudFNsaWRlKTtcbiAgICAgIGlmIChzbGlkZSAmJiBzbGlkZS5jbGVhck9uU2hvdykgc2xpZGUucmVuZGVyUHJvbXB0KCk7XG4gICAgICBydW5JblRlcm1pbmFsLnJlbG9hZCh7ZXhjZXB0OiBbc2xpZGVdfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcnVuSW5UZXJtaW5hbDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHsgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTsgfVxuXG4gIGxvYWQoKSB7XG4gICAgbGV0IHNlY3Rpb25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnc2VjdGlvbltkYXRhLXJ1bi1pbi10ZXJtaW5hbF0nKTtcbiAgICB0aGlzLnNsaWRlcyA9IFtdLm1hcC5jYWxsKHNlY3Rpb25zLCBzZWN0aW9uID0+IHtcbiAgICAgIHJldHVybiBuZXcgU2xpZGUoc2VjdGlvbiwgdGhpcy5vcHRpb25zKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbG9hZChvcHRpb25zID0ge2V4Y2VwdDogW119KSB7XG4gICAgdGhpcy5zbGlkZXNcbiAgICAgIC5maWx0ZXIocyA9PiBvcHRpb25zLmV4Y2VwdC5pbmRleE9mKHMpICE9PSAtMSlcbiAgICAgIC5mb3JFYWNoKHMgPT4gcy5sb2FkKCkpO1xuICB9XG5cbiAgZm9yU2VjdGlvbihzZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuc2xpZGVzLmZpbHRlcigocykgPT4gcy5zZWN0aW9uID09PSBzZWN0aW9uKVswXTtcbiAgfVxufTtcbiIsImNvbnN0IHF1ZXJ5c3RyaW5nID0gcmVxdWlyZSgncXVlcnlzdHJpbmcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSAocGFyYW1zLCBmbikgPT4ge1xuICBsZXQgcXMgPSBxdWVyeXN0cmluZy5zdHJpbmdpZnkocGFyYW1zKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgc291cmNlID0gbmV3IEV2ZW50U291cmNlKGAvcmV2ZWFsLXJ1bi1pbi10ZXJtaW5hbD8ke3FzfWApO1xuICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZSA9PiBmbihKU09OLnBhcnNlKGUuZGF0YSkpKTtcbiAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcignZG9uZScsICgpID0+IHJlc29sdmUoc291cmNlLmNsb3NlKCkpKTtcbiAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlID0+IHtcbiAgICAgIGlmIChlLmRhdGEpIHtcbiAgICAgICAgbGV0IG1lc3NhZ2VzID0gSlNPTi5wYXJzZShlLmRhdGEpLm1lc3NhZ2VzO1xuICAgICAgICBtZXNzYWdlcy5mb3JFYWNoKGVyciA9PiBjb25zb2xlLmVycm9yKGVycikpO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGAke21lc3NhZ2VzLmpvaW4oJywgJyl9YCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfVxuXG4gICAgICBzb3VyY2UuY2xvc2UoKTtcbiAgICB9KTtcbiAgfSk7XG59O1xuIiwiY29uc3QgcnVuQ29tbWFuZCA9IHJlcXVpcmUoJy4vcnVuLWNvbW1hbmQnKTtcbmNvbnN0IEhpZ2hsaWdoZXIgPSByZXF1aXJlKCcuL2hpZ2hsaWdoZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKHNlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuc2VjdGlvbiA9IHNlY3Rpb247XG5cbiAgICB0aGlzLmhpZGUoKTtcbiAgICB0aGlzLmFkZEVsZW1lbnQoJ2NvbnRhaW5lcicpO1xuXG4gICAgdGhpcy5hZGRFbGVtZW50KCd0aXRsZScsIHt0YWdOYW1lOiAnc3BhbicsIHBhcmVudDogdGhpcy5jb250YWluZXJ9KTtcbiAgICB0aGlzLnRpdGxlLmlubmVyVGV4dCA9IHRoaXMuc3JjO1xuXG4gICAgWydjb2RlJywgJ3Rlcm0nXS5mb3JFYWNoKG5hbWUgPT4gdGhpcy5hZGRFbGVtZW50KG5hbWUsIHtcbiAgICAgIHRhZ05hbWU6ICdwcmUnLFxuICAgICAgY2xhc3NlczogWydobGpzJ10sXG4gICAgICBwYXJlbnQ6IHRoaXMuY29udGFpbmVyXG4gICAgfSkpO1xuXG4gICAgWydzaG93Q29tbWFuZCcsICdleGVjdXRlJ10uZm9yRWFjaChuYW1lID0+IHRoaXMuYWRkRWxlbWVudChuYW1lLCB7XG4gICAgICBjbGFzc2VzOiBbJ2ZyYWdtZW50J10sXG4gICAgICBkYXRhc2V0OiB7dGVybWluYWxGcmFnbWVudDogbmFtZX1cbiAgICB9KSk7XG5cbiAgICB0aGlzLmxvYWQoKTtcbiAgfVxuXG4gIGxvYWQoKSB7XG4gICAgdGhpcy5oaWRlKCk7XG4gICAgcmV0dXJuIGZldGNoKHRoaXMuc3JjKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UudGV4dCgpKVxuLy8gICAgICAudGhlbihjb2RlID0+IEhpZ2hsaWdoZXIuaGlnaGxpZ2h0KGNvZGUpKVxuICAgICAgLnRoZW4oaHRtbCA9PiBodG1sLnJlcGxhY2UoL1xcbi9nLCAnPHNwYW4gY2xhc3M9XCJsaW5lXCI+PC9zcGFuPlxcbicpKVxuICAgICAgLnRoZW4oaHRtbCA9PiB0aGlzLmNvZGUuaW5uZXJIVE1MID0gaHRtbClcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCA9IDApXG4gICAgICAudGhlbigoKSA9PiB0aGlzLnNob3coKSk7XG4gIH1cblxuICBhZGRFbGVtZW50KG5hbWUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHRoaXNbbmFtZV0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG9wdGlvbnMudGFnTmFtZSB8fCAnZGl2Jyk7XG4gICAgKG9wdGlvbnMuY2xhc3NlcyB8fCBbXSkuY29uY2F0KFtuYW1lXSkuZm9yRWFjaChjbGF6eiA9PiB7XG4gICAgICB0aGlzW25hbWVdLmNsYXNzTGlzdC5hZGQoY2xhenopXG4gICAgfSk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzW25hbWVdLmRhdGFzZXQsIG9wdGlvbnMuZGF0YXNldCB8fCB7fSk7XG5cbiAgICAob3B0aW9ucy5wYXJlbnQgfHwgdGhpcy5zZWN0aW9uKS5hcHBlbmRDaGlsZCh0aGlzW25hbWVdKTtcbiAgICByZXR1cm4gdGhpc1tuYW1lXTtcbiAgfVxuXG4gIHNjcm9sbFRvQm90dG9tKCkge1xuICAgIGxldCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGxldCB0b3AgPSB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3A7XG4gICAgICB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgKz0gMjtcbiAgICAgIGlmICh0b3AgPT09IHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCkge1xuICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgIH1cbiAgICB9LCAxKTtcbiAgfVxuXG4gIGhpZGUoKSB7IHRoaXMuc2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9XG5cbiAgc2hvdygpIHsgdGhpcy5zZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG5cbiAgcmVuZGVyUHJvbXB0KCkgeyB0aGlzLnRlcm0uaW5uZXJUZXh0ID0gYD4g4paIYDsgfVxuXG4gIHJlbmRlckNvbW1hbmQoKSB7IHRoaXMudGVybS5pbm5lclRleHQgPSBgPiAke3RoaXMuY29tbWFuZH3ilohgOyB9XG5cbiAgZXhlY3V0ZUNvbW1hbmQoKSB7XG4gICAgdGhpcy50ZXJtLmlubmVyVGV4dCA9IGA+ICR7dGhpcy5jb21tYW5kfVxcbmA7XG4gICAgcnVuQ29tbWFuZCh0aGlzLnBhcmFtcywgb3V0cHV0ID0+IHtcbiAgICAgIHRoaXMudGVybS5pbm5lclRleHQgPSBgJHt0aGlzLnRlcm0uaW5uZXJUZXh0LnRyaW0oKX1cXG4ke291dHB1dH1gO1xuICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy50ZXJtLmlubmVyVGV4dCA9IGAke3RoaXMudGVybS5pbm5lclRleHQudHJpbSgpLnJlcGxhY2UoL+KWiC9nLCAnJyl9XFxuPiDilohgO1xuICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH0pLmNhdGNoKGVyciA9PiB0aGlzLnRlcm0uaW5uZXJUZXh0ID0gZXJyLm1lc3NhZ2UpO1xuICB9XG5cbiAgcHJvcGVydHkocHJvcCkgeyByZXR1cm4gdGhpcy5zZWN0aW9uLmRhdGFzZXRbcHJvcF07IH1cblxuICBnZXQgY2xlYXJPblNob3coKSB7XG4gICAgcmV0dXJuICF0aGlzLnNob3dDb21tYW5kLmNsYXNzTGlzdC5jb250YWlucygndmlzaWJsZScpO1xuICB9XG5cbiAgZ2V0IGNvbW1hbmQoKSB7XG4gICAgbGV0IGNvbW1hbmQgPSBgJHt0aGlzLmJpbn0gJHt0aGlzLnNyY31gXG4gICAgaWYgKHRoaXMuYXJncykgY29tbWFuZCA9IGAke2NvbW1hbmR9ICR7dGhpcy5hcmdzfWA7XG4gICAgcmV0dXJuIGNvbW1hbmQ7XG4gIH1cblxuICBnZXQgcGFyYW1zKCkge1xuICAgIGxldCBwYXJhbXMgPSB7YmluOiB0aGlzLmJpbiwgc3JjOiB0aGlzLnNyY307XG4gICAgaWYgKHRoaXMuYXJncykgcGFyYW1zLmFyZ3MgPSB0aGlzLmFyZ3M7XG4gICAgcmV0dXJuIHBhcmFtcztcbiAgfVxuXG4gIGdldCBiaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcGVydHkoJ3J1bkluVGVybWluYWxCaW4nKSB8fCB0aGlzLm9wdGlvbnMuZGVmYXVsdEJpbjtcbiAgfVxuXG4gIGdldCBzcmMoKSB7IHJldHVybiB0aGlzLnByb3BlcnR5KCdydW5JblRlcm1pbmFsJyk7IH1cblxuICBnZXQgYXJncygpIHsgcmV0dXJuIHRoaXMucHJvcGVydHkoJ3J1bkluVGVybWluYWxBcmdzJyk7IH1cbn07XG4iXX0=
