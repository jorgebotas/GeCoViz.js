"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _d2 = require("d3");

var _helpers = require("./helpers");

var _slider = _interopRequireDefault(require("./slider"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CustomBar = /*#__PURE__*/function () {
  function CustomBar(selector, data) {
    _classCallCheck(this, CustomBar);

    this.selector = selector;
    this.container;
    this.data = data;
    this.dataKeys;
    this.hiddenKeys = ['anchor', 'pos', 'start', 'end', 'size', 'strand', 'vStart', 'vEnd', 'vSize'];
    this.computeDataKeys();
    this.dataSimpleFields;
    this.dataComplexFields;
    this.computeFields();
    this.levelSelect;
  }

  _createClass(CustomBar, [{
    key: "computeDataKeys",
    value: function computeDataKeys() {
      var _this = this;

      var dataKeys = this.data.reduce(function (maxKeys, d) {
        return maxKeys.length < Object.keys(d).length ? Object.keys(d) : maxKeys;
      }, []);
      this.dataKeys = dataKeys.filter(function (k) {
        return !_this.hiddenKeys.includes(k);
      });
    }
  }, {
    key: "computeFields",
    value: function computeFields() {
      // Extract complex and simple data fields
      var dataComplexFields = {};
      this.data.forEach(function (d) {
        Object.entries(d).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              k = _ref2[0],
              v = _ref2[1];

          if ((0, _helpers.nonEmptyArray)(v)) {
            v.forEach(function (v) {
              if (dataComplexFields[k]) {
                if (v.level && !dataComplexFields[k].includes(v.level)) {
                  dataComplexFields[k].push(v.level);
                }
              } else {
                dataComplexFields[k] = v.level ? [v.level] : [];
              }
            });
          }
        });
      });
      this.dataComplexFields = dataComplexFields;
      this.dataSimpleFields = this.dataKeys.filter(function (d) {
        return !Object.keys(dataComplexFields).includes(d);
      });
    }
  }, {
    key: "getLevels",
    value: function getLevels(notation) {
      return this.dataComplexFields[notation];
    }
  }, {
    key: "drawBar",
    value: function drawBar() {
      var vis = (0, _d2.select)(this.selector);
      this.container = vis.append('div').attr('class', 'customBar col-md-10 mx-auto my-0 py-0');
      var checkButtonContainer = this.container.append('div');
      checkButtonContainer = checkButtonContainer.append('div').attr('class', 'd-flex').style('margin-top', '12%');
      var checkButtons = [{
        label: 'Tree',
        "class": 'toggleTree',
        checked: true
      }, {
        label: 'Legend',
        "class": 'toggleLegend',
        checked: true
      }, {
        label: 'Scale',
        "class": 'scaleDist',
        checked: false
      }];
      checkButtons.forEach(function (cbutton) {
        (0, _helpers.addCheckButton)(checkButtonContainer, cbutton.label, cbutton["class"], cbutton.checked);
      });
      var nSideSlider = this.container.append('div');
      var nSideSliderLabel = (0, _helpers.addLabel)(nSideSlider, 'Genes up/downstream');
      nSideSlider = nSideSlider.append('div').style('width', '200px').style('margin-top', '1.5rem');
      (0, _slider["default"])(nSideSlider, 'nSideSlider', {
        start: 4,
        step: 1,
        min: 0,
        max: 10
      });
      nSideSlider = this.container.select('.nSideSlider').node().noUiSlider;
      nSideSlider.on('update', function () {
        nSideSliderLabel.html('Genes up/downstream: ' + Math.round(nSideSlider.get()));
      });
      var showNameSelect = this.container.append('div');
      (0, _helpers.addLabel)(showNameSelect, 'Show on gene'); //.style('text-align', 'center');

      showNameSelect = (0, _helpers.addCustomSelect)(showNameSelect, 'showName', 'showName');
      showNameSelect.setChoices([{
        value: '',
        label: 'Gene text',
        selected: true,
        disabled: true
      }].concat(_toConsumableArray(this.dataSimpleFields.map(function (f) {
        return {
          value: f,
          label: (0, _helpers.capitalize)(f)
        };
      }))));
      var notationSelect = this.container.append('div');
      (0, _helpers.addLabel)(notationSelect, 'Color genes by'); //.style('text-align', 'center');

      notationSelect = (0, _helpers.addCustomSelect)(notationSelect, 'notation', 'notation');
      notationSelect.setChoices([{
        value: '',
        label: 'Color',
        selected: true,
        disabled: true
      }].concat(_toConsumableArray(this.dataKeys.map(function (k) {
        return {
          value: k,
          label: (0, _helpers.capitalize)(k)
        };
      }))));
      var levelSelect = this.container.append('div');
      (0, _helpers.addLabel)(levelSelect, 'Anotation level'); //.style('text-align', 'center');

      this.levelSelect = (0, _helpers.addCustomSelect)(levelSelect, 'notationLevel', 'notationLevel');
      this.levelSelect.setChoices([{
        value: '',
        label: 'Select level',
        selected: true,
        disabled: true
      }]);
      this.updateLevels('');
      var shuffleColors = this.container.append('div');
      shuffleColors.append('button').attr('class', 'shuffleColors btn btn-secondary btn-sm').style('margin-top', '33px').html('Shuffle colors');
      var downloadPng = this.container.append('div');
      downloadPng.append('button').attr('class', 'downloadPng btn btn-secondary btn-sm').style('margin-top', '33px').html('Download graph');
    }
  }, {
    key: "updateLevels",
    value: function updateLevels(notation) {
      var levels = this.dataComplexFields[notation] || [];
      this.levelSelect.clearChoices();
      this.levelSelect.setChoices(levels.map(function (l, idx) {
        if (idx == 0) {
          return {
            value: l,
            label: (0, _helpers.capitalize)(l),
            selected: true
          };
        }

        return {
          value: l,
          label: (0, _helpers.capitalize)(l)
        };
      }));
      var levelSelect = this.container.select('select.notationLevel');
      if ((0, _helpers.nonEmptyArray)(levels)) levelSelect.attr('disabled', null);else levelSelect.attr('disabled', '');
    }
  }]);

  return CustomBar;
}();

var _default = CustomBar;
exports["default"] = _default;