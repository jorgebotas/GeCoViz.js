"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var parseNewick = function parseNewick(string) {
  var fields = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ['name'];
  var ancestors = [];
  var tree = {};
  var counter = 0;
  var tokens = string.split(/\s*(;|\(|\)|,|:)\s*/);

  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var subtree = {};
    var x = void 0;

    switch (token) {
      case '(':
        // new children set
        tree.children = [subtree];
        ancestors.push(tree);
        tree = subtree;
        break;

      case ',':
        // another branch
        ancestors[ancestors.length - 1].children.push(subtree);
        tree = subtree;
        break;

      case ')':
        // optional name next
        tree = ancestors.pop();
        break;

      case ':':
        // optional length next
        break;

      default:
        x = tokens[i - 1];

        if (x == ')') {
          // optional support value
          tree.support = parseFloat(token);
        } else if (x == '(' || x == ',') {
          (function () {
            var tokenSplit = token.trim().split('.');
            fields.forEach(function (f, i) {
              if (tokenSplit[i]) tree[f] = tokenSplit[i];
            });
            tree.id = counter;
            ++counter;
          })();
        } else if (x == ':') {
          tree.length = parseFloat(token);
        }

    }
  }

  return tree;
};

var _default = parseNewick;
exports["default"] = _default;