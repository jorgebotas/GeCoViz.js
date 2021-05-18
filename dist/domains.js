"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _d = require("d3");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var protDomains = function protDomains(selector, domains, lenseq, width, height, palette) {
  var urlRoot = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : undefined;

  function scale(num, inSize, outSize) {
    return +num * outSize / inSize;
  }

  function draw_seqLine(g, width, height) {
    g.append("line").attr("stroke", "black").attr("stroke-width", 2).attr("x1", 0).attr("y1", height / 2).attr("x2", width).attr("y2", height / 2);
  }

  function draw_legend(selector, domains, palette) {
    var urlRoot = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
    var legend = (0, _d.select)(selector).append("div").attr("class", "dom-legend");
    var doms = new Set();
    domains.forEach(function (d) {
      if (d.id && d.id != "") {
        doms.add(d.id);
      }
    });
    doms = _toConsumableArray(doms);
    doms.forEach(function (d) {
      var l = legend.append("div").attr('class', 'd-inline px-2');
      l.append('svg').attr('width', 10).attr('height', 10).attr('class', 'mr-2').append('circle').attr("r", 5).attr("cx", 5).attr("cy", 5).attr("fill", palette(d));
      var t = l.append('div').attr('class', 'd-inline');

      if (urlRoot) {
        t.append('a').attr('href', urlRoot + d).attr('target', '_blank').attr('class', 'secondary-link').text(d);
      } else {
        t.text(d);
      }
    });
  }

  function draw_domains(g, domains, lenseq, width, height, palette) {
    g.selectAll('circle').data(domains.filter(function (d) {
      return d.shape == "circle";
    })).enter().append('circle').attr("r", 4).attr("cx", function (d) {
      return scale(+d.c, lenseq, width);
    }).attr("cy", height / 2).attr("fill", function (d) {
      return palette(d.id);
    });
    g.selectAll('rect').data(domains.filter(function (d) {
      return d.shape == "rect";
    })).enter().append('rect').attr("x", function (d) {
      return scale(+d.start, lenseq, width);
    }).attr("y", 0).attr("width", function (d) {
      return scale(+d.end - +d.start, lenseq, width);
    }).attr("height", height).attr("fill", function (d) {
      return palette(d.id);
    });
  }

  var g = (0, _d.select)(selector).append('svg:svg').attr("width", width).attr("height", height).append('svg:g').attr("transform", "translate(" + 5 + ", 0)");
  draw_seqLine(g, width, height);
  draw_domains(g, domains, lenseq, width, height, palette);
  draw_legend(selector, domains, palette, urlRoot);
};

var _default = protDomains;
exports["default"] = _default;