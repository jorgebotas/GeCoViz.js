var parseNewick = function(string, fields = ['name']) {

    function setAttributes(token, tree) {
      const tokenSplit = token.trim().split('.');
      tokenSplit.forEach((t, i) => {
          const tSplit = t.split("__");
          if (tSplit.length > 1) {
              tree.lineage = tree.lineage || {};
              const [ rank, t ] = tSplit;
              tree.lineage[rank] = t;
          } else if (fields[i])
              tree[fields[i]] = t
          else
              tree[i] = t;
      });
    }

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
              setAttributes(token, tree)
              tree.id = counter;
              ++counter;
          } else if (x == ':') {
              if (token[token.length - 1] === "]") 
                  setAttributes(token.slice(0, -1).split("=")[1], tree);
              else {
                  if (token.includes("[&&NHX"))
                      token = token.split("[")[0];
                  tree.length = parseFloat(token);
              }
          }
      }
    }
    return tree;
}

export default parseNewick;
