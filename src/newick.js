var parseNewick = function(string, fields = ['name']) {
    let ancestors = [];
    let tree = {};
    let counter = 0;
    let tokens = string.split(/\s*(;|\(|\)|,|:)\s*/);
    for (let i=0; i<tokens.length; i++) {
      let token = tokens[i];
      let subtree = {};
      let x;
      switch (token) {
        case '(': // new children set
          tree.children = [subtree];
          ancestors.push(tree);
          tree = subtree;
          break;
        case ',': // another branch
          ancestors[ancestors.length-1].children.push(subtree);
          tree = subtree;
          break;
        case ')': // optional name next
          tree = ancestors.pop();
          break;
        case ':': // optional length next
          break;
        default:
          x = tokens[i-1];
          if (x == ')') {
              // optional support value
              tree.support = parseFloat(token);
          } else if (x == '(' || x == ',') {
              let tokenSplit = token.trim().split('.');
              fields.forEach((f, i) => {
                  if (tokenSplit[i]) tree[f] = tokenSplit[i];
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

export default parseNewick;
