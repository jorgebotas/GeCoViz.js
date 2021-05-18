"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _d = require("d3");

var _colors = _interopRequireDefault(require("./colors269"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Palette = /*#__PURE__*/function () {
  function Palette() {
    _classCallCheck(this, Palette);

    var colors = ["#abfdcb", "#c9b2fd", "#fcaf81", "#a9dff7", "#254F93", "#FF5C8D", "#838383", "#5F33FF", "#c7e3aa", "#D81E5B", "#47DAFF", "#c4ab77", "#A1A314", "#fff600", "#53257E", "#1e90ff", "#B6549A", "#7cd407", "#948ad6", "#7ba0d5", "#fcc6f8", "#fec24c", "#A40E4C", "#dd5a95", "#12982d", "#27bda9", "#F0736A", "#9354e7", "#cbd5e3", "#93605D", "#FFE770", "#6C9D7F", "#2c23e4", "#ff6200", "#406362"];
    this.colors = _colors["default"];
    this.domain;
    this.palette;
    return this;
  }

  _createClass(Palette, [{
    key: "buildPalette",
    value: function buildPalette(domain) {
      this.domain = domain;
      this.palette = (0, _d.scaleOrdinal)().domain(this.domain).range(this.colors);
    }
  }, {
    key: "shuffle",
    value: function shuffle() {
      this.colors = (0, _helpers.shuffle)(_toConsumableArray(this.colors));
      this.buildPalette(this.domain);
    }
  }, {
    key: "get",
    value: function get(query) {
      return this.palette(query);
    }
  }]);

  return Palette;
}();

var _default = Palette;
exports["default"] = _default;