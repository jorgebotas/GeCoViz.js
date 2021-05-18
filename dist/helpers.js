"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shuffle = exports.triggerEvent = exports.nonEmptyArray = exports.counter = exports.cleanString = exports.capitalize = exports.addLabel = exports.addCustomSelect = exports.addCheckButton = exports.addCheckbox = void 0;

var _choices = _interopRequireDefault(require("choices.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var cleanString = function cleanString(s) {
  var clean = String(s);
  var dirt = " \t.,;:_/\\'@<>?()[]{}#%!*|".split("");
  dirt.forEach(function (d) {
    clean = clean.replaceAll(d, "");
  });
  return String(clean);
};

exports.cleanString = cleanString;

var shuffle = function shuffle(a) {
  var j, x, i;

  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }

  return a;
};

exports.shuffle = shuffle;

var capitalize = function capitalize(string) {
  return string.trim().replace(/^\w/, function (c) {
    return c.toUpperCase();
  });
};

exports.capitalize = capitalize;

var addCheckbox = function addCheckbox(g, label, className) {
  var switchToggle = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var containerClass = "form-check";
  containerClass += switchToggle ? " form-switch ml-4 py-1" : " m-1 ml-2";
  var container = g.append("label").attr("class", containerClass);
  container.append("input").attr("class", "mt-0 form-check-input rounded-pill " + className).attr("type", "checkbox").attr("checked", "").attr("style", "margin-top:0 !important;");
  container.append("span").attr("class", "form-check-label").html(label);
  return container;
};

exports.addCheckbox = addCheckbox;

var addCheckButton = function addCheckButton(g, label) {
  var className = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var checked = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  var container = g.append('label').attr('class', 'form-selectgroup-item m-1');
  var input = container.append('input').attr('type', 'checkbox').attr('class', 'form-selectgroup-input ' + className);
  if (checked) input.attr('checked', '');
  container.append('span').attr('class', 'form-selectgroup-label').html(label);
  return input;
};

exports.addCheckButton = addCheckButton;

var addCustomSelect = function addCustomSelect(g, className, name) {
  var placeholder = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "hi";
  var select = g.append('select').attr('class', 'form-select form-control ' + className).attr('name', name);
  var choices = activateSelect(select.node(), placeholder);
  return choices;
};

exports.addCustomSelect = addCustomSelect;

var activateSelect = function activateSelect(select, placeholder) {
  var choices = new _choices["default"](select, {
    classNames: {
      containerInner: select.className,
      input: 'form-control',
      inputCloned: 'form-control-sm',
      listDropdown: 'dropdown-menu',
      itemChoice: 'dropdown-item',
      activeState: 'show',
      selectedState: 'active',
      placeholder: 'choices__placeholder'
    },
    shouldSort: false,
    searchEnabled: false,
    placeholder: true,
    placeholderValue: placeholder
  });
  return choices;
};

var addLabel = function addLabel(g, html) {
  var label = g.append('label').attr('class', 'form-label ml-2').style('font-size', '1em').style('font-weight', 'bold').html(html);
  return label;
};

exports.addLabel = addLabel;

var nonEmptyArray = function nonEmptyArray(a) {
  return Array.isArray(a) && a.length > 0;
};

exports.nonEmptyArray = nonEmptyArray;

var triggerEvent = function triggerEvent(el, type) {
  // IE9+ and other modern browsers
  if ('createEvent' in document) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, false, true);
    el.dispatchEvent(e);
  } else {
    // IE8
    var _e = document.createEventObject();

    _e.eventType = type;
    el.fireEvent('on' + _e.eventType, _e);
  }
};

exports.triggerEvent = triggerEvent;

var counter = function counter(arr, attr) {
  //let initial = new Map(map.map(d => [d.id, 0]));
  var fn = function fn(counter, d) {
    var a = d[attr];
    counter[a] = counter[a] ? counter[a] + 1 : 1;
    return counter;
  };

  return arr.reduce(fn, {});
};

exports.counter = counter;