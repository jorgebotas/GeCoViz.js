var parseNewick = function(string, fields = ['name']) {
    var ancestors = [];
    var tree = {};
    var counter = 0;
    var tokens = string.split(/\s*(;|\(|\)|,|:)\s*/);
    for (var i=0; i<tokens.length; i++) {
      var token = tokens[i];
      switch (token) {
        case '(': // new children set
          var subtree = {};
          tree.children = [subtree];
          ancestors.push(tree);
          tree = subtree;
          break;
        case ',': // another branch
          var subtree = {};
          ancestors[ancestors.length-1].children.push(subtree);
          tree = subtree;
          break;
        case ')': // optional name next
          tree = ancestors.pop();
          break;
        case ':': // optional length next
          break;
        default:
          var x = tokens[i-1];
              if (x == ')') {
                // optional support value
                  tree.support = parseFloat(token);
              }
          else if (x == '(' || x == ',') {
            tokenSplit = token.trim().split('.');
            tokenSplit.forEach(t => {
                tSplit = t.split(':');
                console.log(tSplit)
                console.log(t)
                if (tSplit.length > 1) tree[tSplit[0]] = tSplit[1];
            })
            fields.forEach((f, i) => {
                tree[f] = tokenSplit[i];
            })
            tree.id = counter;
            ++counter;
          } else if (x == ':') {
            tree.length = parseFloat(token);
          }
      }
    }
    return tree;
}
