"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopperClick = exports.PopperCreate = exports.addPopper = void 0;

var _d2 = require("d3");

var _jquery = _interopRequireDefault(require("jquery"));

var _core = require("@popperjs/core");

var _colors = require("./colors269");

var _domains = _interopRequireDefault(require("./domains"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var PopperCreate = function PopperCreate(selector, d, URLs) {
  function get_PopperHTML(d) {
    var arrayData = [];
    var showFields = ['gene name', 'gene', 'description', 'anchor', 'pos', 'start', 'end', 'size', 'strand'];
    var hideFields = ['vStart', 'vEnd', 'vSize', 'geneWidth'];
    Object.entries(d).forEach(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          field = _ref2[1];

      var fieldData = "";

      if ((0, _helpers.nonEmptyArray)(field)) {
        fieldData = '<ul class="popper-ul">\
                    <li class="popper-ul-title">' + key.toUpperCase() + '</li>';
        field.forEach(function (f) {
          fieldData += '<li>';
          fieldData += !URLs[key] ? "<em>".concat(f.id, "</em>") : '<a href="' + URLs[key].b + String(f.id) + URLs[key].a + '" target="_blank" style="outline:none;">' + String(f.id) + '</a>';
          var levelData = !f.level ? '' : f.leveDesc ? ' (level: ' + f.level + ', description: ' + d.levelDesc + ')' : ' (level: ' + f.level + ')';
          fieldData += levelData;
          fieldData += '<br>' + (f.description || '') + '</li>';
        });
        fieldData += '</ul>';
      } else {
        if (_typeof(field) != 'object' && !showFields.includes(key) && !hideFields.includes(key)) showFields.push(key);
      }

      if (fieldData) arrayData.push(fieldData);
    });
    var popperHTML = ''; //<strong>Gene information</strong>

    popperHTML += '<div class="p-2">';
    showFields.forEach(function (f) {
      if (d[f]) popperHTML += "".concat((0, _helpers.capitalize)(f), ": ").concat(d[f], "<br>");
    });
    popperHTML += '</div>';

    if ((0, _helpers.nonEmptyArray)(d.pfam)) {
      var dom_id = 'dom' + (0, _helpers.cleanString)(d.anchor + d.pos);
      popperHTML += '<div class="py-2" id=' + dom_id + '></div>';
    }

    if (arrayData.length > 0) popperHTML += '<div class="popper-uls">' + arrayData.reduce(function (t, d) {
      return t + d;
    }) + '</div>';
    return popperHTML;
  }

  var geneID = (0, _helpers.cleanString)(d.anchor + d.pos);
  var oldPopper = (0, _d2.select)(selector + ' .popper#popr' + geneID);
  if (oldPopper.nodes().length > 0) oldPopper.remove();
  var popperD3 = (0, _d2.select)(selector).append('div').attr('class', 'popper col-lg-4 col-md-8 col-sm-10').attr('id', 'popr' + geneID);
  var popperHTML = get_PopperHTML(d); // popper content

  popperD3.append('div').attr('class', 'popper-content').html(popperHTML);

  if ((0, _helpers.nonEmptyArray)(d.pfam)) {
    var doms = new Set();
    d.pfam.forEach(function (d) {
      if (d["class"] && d["class"] != '') {
        doms.add(d["class"]);
      }
    });
    var colors = _colors.colors269;
    var palette = (0, _d2.scaleOrdinal)().domain(doms).range(colors);
    (0, _domains["default"])(selector + ' #dom' + (0, _helpers.cleanString)(d.anchor + d.pos), d.pfam, d.length || Math.abs(+d.end - +d.start) || 1000, 250, 7, palette, URLs.pfam.b);
  } // Popper arrow


  popperD3.append('div').attr('class', 'popper-arrow');
  var popper = document.querySelector(selector + ' .popper#popr' + geneID);

  function show() {
    var poppers = document.querySelectorAll(selector + ' .popper');
    poppers.forEach(function (p) {
      p.removeAttribute('data-show');
    });
    var popper = document.querySelector(selector + ' .popper#popr' + geneID);
    var ref = document.querySelector(selector + ' g.gene#gene' + geneID);
    popper.setAttribute('data-show', '');
    (0, _core.createPopper)(ref, popper, {
      modifiers: [{
        name: 'offset',
        options: {
          offset: [-4, 5]
        }
      }, {
        name: 'flip',
        options: {
          fallbackPlacements: ['top']
        }
      }]
    });
  }

  popper.addEventListener('click', show);
  return show;
};

exports.PopperCreate = PopperCreate;

var addPopper = function addPopper(selector, id, popperHTML, popperClass) {
  var popperD3 = (0, _d2.select)(selector).append('div').attr('class', 'popper ' + popperClass).attr('id', 'popr' + id); // popper content

  popperD3.append('div').attr('class', 'popper-content card-body h6 pt-2').html(popperHTML); // popper arrow

  popperD3.append('div').attr('class', 'popper-arrow');
  var popper = document.querySelector(selector + ' .popper#popr' + id);
  var ref = document.querySelector(selector + ' g#leaf' + id);

  function create() {
    // Popper Instance
    (0, _core.createPopper)(ref, popper, {
      placement: 'right',
      modifiers: [{
        name: 'offset',
        options: {
          offset: [0, 10]
        }
      }, {
        name: 'flip',
        options: {
          fallbackPlacements: ['left']
        }
      }]
    });
  }

  function show() {
    hide();
    popper.setAttribute('data-show', '');
    create();
  }

  function hide() {
    var poppers = document.querySelectorAll(selector + ' .popper');
    poppers.forEach(function (popper) {
      popper.removeAttribute('data-show');
    });
  }

  var showEvents = ['click'];
  showEvents.forEach(function (event) {
    popper.addEventListener(event, show);
    ref.addEventListener(event, show);
  });
};

exports.addPopper = addPopper;

var PopperClick = function PopperClick(selector) {
  (0, _jquery["default"])(document).click(function (e) {
    // Helper function
    function lookForParent(element, targetClass) {
      var el = element;
      var name = el.nodeName;

      while (name && name != 'HTML') {
        if ((0, _jquery["default"])(el).hasClass(targetClass)) {
          return el;
        }

        el = el.parentElement;
        name = el.nodeName;
      }

      return undefined;
    }

    var poppers = document.querySelectorAll(selector + ' .popper');
    poppers.forEach(function (popper) {
      popper.removeAttribute('data-show');
    });

    if (!e.altKey) {
      var targetID;
      ['gene', 'leaf', 'popper'].forEach(function (c) {
        try {
          targetID = lookForParent(e.target, c).id;
        } catch (_unused) {}
      });
      targetID = !targetID ? e.target.id : targetID;
      targetID = targetID.trim();

      if (['gene', 'leaf', 'popr'].indexOf(targetID.slice(0, 4)) > -1) {
        targetID = targetID.slice(4);
        var popper = document.querySelector(selector + ' .popper#popr' + targetID); //let popperDims = popper.getBoundingClientRect();
        //let refbound = document.querySelector(selector + ' g.gene#gene'+targetID)
        //.getBoundingClientRect();
        //if (refbound.right+popperDims.width/2 > window.innerWidth){
        //select(selector + ' .popper#popr'+targetID)
        //.select(selector + ' .popper-arrow')
        //.style('right', window.innerWidth-refbound.right+'px');
        //} else if(refbound.left < popperDims.width/2) {
        //select(selector + ' .popper#popr'+targetID)
        //.select(selector + ' .popper-arrow')
        //.style('left', refbound.left+'px')
        //.style('right', '');
        //}

        try {
          popper.setAttribute('data-show', '');
        } catch (_unused2) {}
      }
    }
  });
};

exports.PopperClick = PopperClick;