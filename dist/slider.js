"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _nouislider = _interopRequireDefault(require("nouislider"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

//import 'nouislider/distribute/nouislider.css';
var createSlider = function createSlider(container, className) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
    start: 0,
    step: 1,
    min: 0,
    max: 10
  };
  var slider = container.append('div').attr('class', 'form-range ' + className);

  _nouislider["default"].create(slider.node(), {
    start: options.start,
    connect: [true, false],
    step: options.step,
    range: {
      min: options.min,
      max: options.max
    }
  });

  return slider;
};

var _default = createSlider;
exports["default"] = _default;