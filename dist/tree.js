"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _d = require("d3");

var _helpers = require("./helpers");

var _popper = require("./popper");

var buildTree = function buildTree(selector, root) {
  var fields = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ['name'];
  var callbacks = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
    enterEach: function enterEach() {
      return undefined;
    },
    enterMouseOver: function enterMouseOver() {
      return undefined;
    },
    enterMouseLeave: function enterMouseLeave() {
      return undefined;
    },
    enterClick: function enterClick() {
      return undefined;
    },
    exitEach: function exitEach() {
      return undefined;
    }
  };
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {
    width: 700,
    height: 800
  };
  var margin = {
    top: 5,
    right: 5,
    bottom: 25,
    left: 10
  };
  var treeRootHierarchy = (0, _d.hierarchy)(root).sort(function (node) {
    return node.children ? node.children.length : -1;
  });
  var w = +options.width - margin.left - margin.right;
  var h = treeRootHierarchy.leaves().length * 20;
  var tree = (0, _d.cluster)().size([h, w]).separation(function () {
    return 1;
  });
  var treeRoot = tree(treeRootHierarchy);
  var visContainer = (0, _d.select)(selector).attr('width', w);
  var visDiv = visContainer.append('div').attr('class', 'phylogram');
  var visSVG = visDiv.append('svg:svg').attr('width', w + margin.left + margin.right).attr('height', h + margin.top + margin.bottom);
  var vis = visSVG.append('svg:g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var color = {
    noData: 'var(--nodata)',
    highlight: 'var(--highlight)',
    black: 'var(--black)',
    gray: '#aaa',
    darkGray: 'var(--dark-gray)',
    sand: 'var(--sand)',
    darkPurple: 'var(--dark-purple)',
    purple: 'var(--purple)',
    darkRed: 'var(--dark-red)'
  };
  var leafColor = {
    stroke: color.purple,
    full: color.purple,
    empty: color.sand,
    text: color.darkGray
  };

  function rightAngleDiagonal() {
    function projection(d) {
      return [d.y, d.x];
    }

    function path(pathData) {
      return 'M' + pathData[0] + ' ' + pathData[1] + ' ' + pathData[2];
    }

    function diagonal(diagonalPath) {
      var source = diagonalPath.source;
      var target = diagonalPath.target;
      var pathData = [source, {
        x: target.x,
        y: source.y
      }, target];
      pathData = pathData.map(projection);
      return path(pathData);
    }

    return diagonal;
  }

  var diagonal = rightAngleDiagonal();
  var duration = 1000;
  var delay = {
    enter: duration * 1.5,
    update: 0,
    exit: 0
  }; // Initialize root's initial position

  treeRoot.x0 = h / 2;
  treeRoot.y0 = 0; //treeRoot.children.forEach(toggleAll);

  update(treeRoot); // Toggle node function

  function toggle(node) {
    if (node.children) {
      node._children = node.children;
      node.children = null;
    } else {
      node.children = node._children;
      node._children = null;
    }
  }

  function toggleAll(d) {
    if (d._children) {
      openAll(d);
    } else if (d.children) {
      closeAll(d);
    }
  }

  function closeAll(d) {
    if (d._children) {
      d._children.forEach(closeAll);
    } else if (d.children) {
      d.children.forEach(closeAll);
      toggle(d);
    }
  }

  function openAll(d) {
    if (d._children) {
      d._children.forEach(openAll);

      toggle(d);
    } else if (d.children) {
      d.children.forEach(openAll);
    }
  }

  function getShowName(d) {
    return d.data.showName ? d.data.showName : d.data.name ? d.data.name : '';
  }

  function scaleBranchLength(nodes) {
    // Visit all nodes and adjust y pos
    var visitPreOrder = function visitPreOrder(root, callback) {
      callback(root);

      if (root.children) {
        for (var i = root.children.length - 1; i >= 0; i--) {
          visitPreOrder(root.children[i], callback);
        }
      }
    };

    visitPreOrder(nodes[0], function (node) {
      node.rootDist = (node.parent ? node.parent.rootDist : 0) + (node.data.length || 0);
    }); //var rootDepths = nodes.map(function(n) { return n.depth; });

    var nodeLengths = nodes.map(function (n) {
      return n.data.length;
    });
    var yscale = (0, _d.scaleLinear)().domain([0, (0, _d.max)(nodeLengths)]).range([0, 33]);
    visitPreOrder(nodes[0], function (node) {
      node.y = 33 * node.depth;

      if (node.data.length != undefined) {
        node.dotted = 33 - yscale(node.data.length);
      } else {
        node.dotted = 0;
      }
    });
    return yscale;
  }

  function highlightLeaves(d) {
    var highlight = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    if (d.children) d.children.forEach(function (c) {
      return highlightLeaves(c, highlight);
    });else if (!d._children) {
      var leaf = visSVG.select("#leaf".concat((0, _helpers.cleanString)(d.data.name)));
      leaf.select('text').style('fill', highlight ? color.highlight : leafColor.text);
      highlight ? callbacks.enterMouseOver(undefined, d) : callbacks.enterMouseLeave(undefined, d);
    }
  }

  function drawScale(vis, scale, x, y) {
    var units = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';
    var ticks = scale.ticks(2);
    ticks = [0, ticks[1] - ticks[0] || ticks[0]];
    var sticks = [scale(ticks[0]), scale(ticks[1])];
    vis.append('svg:line').attr('y1', y).attr('y2', y).attr('x1', x + sticks[0]).attr('x2', x + sticks[1]).attr("stroke", color.darkGray).attr("stroke-width", "1.5px");
    vis.append('svg:line').attr('y1', y + 5).attr('y2', y - 5).attr('x1', x + sticks[0]).attr('x2', x + sticks[0]).attr("stroke", color.darkGray).attr("stroke-width", "1.5px");
    vis.append('svg:line').attr('y1', y + 5).attr('y2', y - 5).attr('x1', x + sticks[1]).attr('x2', x + sticks[1]).attr("stroke", color.darkGray).attr("stroke-width", "1.5px");
    vis.append("svg:text").attr("class", "rule").attr("x", x + sticks[0] + (sticks[1] - sticks[0]) / 2).attr("y", y).attr("dy", -7).attr("text-anchor", "middle").attr('font-size', '0.9em').attr('fill', color.darkGray).text(ticks[1] + units);
  }

  function update(source) {
    // compute the new height
    var newHeight = treeRoot.leaves().length * 20; // 20 pixels per line

    visSVG.attr('target-height', newHeight + 50);
    tree.size([newHeight, w]);
    treeRoot = tree(treeRootHierarchy);
    var nodes = treeRoot.descendants(); // Scale branches by length

    var scale = scaleBranchLength(nodes); // Draw yscale legend

    if (!visDiv.select('.scale').node()) {
      var scaleG = visDiv.append('svg').attr('class', 'scale').append('g');
      drawScale(scaleG, scale, 0, 0);
    } // ENTERING NODES


    var node = vis.selectAll('g.node').data(nodes, function (n) {
      return n.data.id;
    }); // Enter any new nodes at the parent's previous position.

    var nodeEnter = node.enter().append('svg:g').attr('class', function (n) {
      return !n.parent ? 'root node' : n.children || n._children ? 'inner node' : 'leaf node';
    }).attr('transform', 'translate(' + source.y0 + ',' + source.x0 + ')').on('click', function (event, d) {
      if (event.altKey) toggleAll(d);else toggle(d);
      update(d);
    });
    nodeEnter.append('svg:circle').attr('r', 1e-6).style('fill', function (d) {
      return d.data._children ? leafColor.full : leafColor.empty;
    }); // Style inner nodes

    var nodeInnerEnter = nodeEnter.filter('.inner');
    nodeInnerEnter.append('text').attr('dx', -3).attr('dy', -3).attr('text-anchor', 'end').attr('font-size', '0.8em').attr('fill', color.darkRed).style('fill-opacity', 1e-6).text(function (n) {
      return (+n.data.support).toFixed(1);
    });
    nodeInnerEnter.append('text').attr('dx', -3).attr('dy', +11).attr('text-anchor', 'end').attr('font-size', '0.8em').attr('fill', color.gray).style('fill-opacity', 1e-6).text(function (n) {
      var length = +n.data.length;
      var rounded = length < 0.01 ? length.toExponential(1) : length.toFixed(3);
      return rounded ? rounded : n.data.length;
    }); // Hovering over clade will highlight descendants

    nodeInnerEnter.on('mouseover', function (_, d) {
      return highlightLeaves(d, true);
    }).on('mouseleave', function (_, d) {
      return highlightLeaves(d, false);
    });
    var nodeLeafEnter = nodeEnter.filter('.leaf');
    nodeLeafEnter.attr('id', function (n) {
      return 'leaf' + (0, _helpers.cleanString)(n.data.name);
    });
    nodeLeafEnter.on('mouseover', function (e, l) {
      return callbacks.enterMouseOver(e, l);
    }).on('mouseleave', function (e, l) {
      return callbacks.enterMouseLeave(e, l);
    }).on('click', function (e, l) {
      return callbacks.enterClick(e, l);
    }).each(function (l) {
      return callbacks.enterEach(l);
    });
    nodeLeafEnter.append('text').attr('dx', 10).attr('dy', 3).attr('text-anchor', 'start').style('fill-opacity', 1e-6).text(getShowName); // Associate each leaf to pop-up
    // Display fields data

    if (fields) {
      nodeLeafEnter.each(function (n) {
        var popperContent = '';
        fields.forEach(function (f) {
          popperContent += f == 'showName' ? '' : n.data[f] ? '<p>' + f + ': ' + n.data[f] + '</p>' : '';
        });
        popperContent = n.data.showName ? '<p>' + n.data.showName + '</p>' + popperContent : popperContent;
        (0, _popper.addPopper)(selector + ' .phylogram', (0, _helpers.cleanString)(n.data.name), popperContent, 'col-md-2 col-sm-4');
      });
    } // UPDATING NODES
    // Transition nodes to their new position.


    var nodeUpdate = nodeEnter.merge(node).transition().duration(duration).delay(delay.update).attr('transform', function (d) {
      return 'translate(' + d.y + ',' + d.x + ')';
    });
    nodeUpdate.select('circle').attr('r', 4).attr('stroke-width', '1.5px').attr('stroke', leafColor.stroke).style('fill', function (d) {
      return d._children ? leafColor.full : leafColor.empty;
    });
    nodeUpdate.selectAll('text').style('fill-opacity', 1); // EXITING NODES

    var nodeExit = node.exit().transition().duration(duration).delay(delay.exit).attr('transform', 'translate(' + source.y + ',' + source.x + ')').remove();
    nodeExit.select('circle').attr('r', 1e-6);
    nodeExit.selectAll('text').style('fill-opacity', 1e-6);
    nodeExit.filter('.leaf').each(function (l) {
      return callbacks.exitEach(l);
    }); // LINKS

    var link = vis.selectAll('path.link').data(treeRoot.links(nodes), function (d) {
      return d.target.data.id;
    });
    var linkEnter = link.enter();
    linkEnter.insert('svg:path', 'g').attr('class', 'link').attr('d', function () {
      var oldPos = {
        x: source.x0,
        y: source.y0
      };
      return diagonal({
        source: oldPos,
        target: oldPos
      });
    }).transition().duration(duration).delay(delay.update).attr('d', diagonal);
    linkEnter.insert('svg:line', 'g').attr('x1', function (n) {
      return n.target.y - n.target.dotted;
    }).attr('y1', function (n) {
      return n.target.x;
    }).attr('x2', function (n) {
      return n.target.y;
    }).attr('y2', function (n) {
      return n.target.x;
    }).attr("stroke", color.sand).attr("stroke-width", "2px").attr("stroke-dasharray", "3,3"); // Transition links to new position

    link.transition().duration(duration).delay(delay.update).attr('d', diagonal); // Transition exiting nodes to parent's new position

    link.exit().transition().duration(duration).delay(delay.exit).attr('d', function () {
      var newPos = {
        x: source.x,
        y: source.y
      };
      return diagonal({
        source: newPos,
        target: newPos
      });
    }).remove(); // Store node's old position for transition

    nodes.forEach(function (n) {
      n.x0 = n.x;
      n.y0 = n.y;
    });
    var newWidth = (0, _d.max)(treeRoot.leaves().map(function (l) {
      return l.y + getShowName(l).length * 6;
    }));
    visSVG.attr('target-width', newWidth + 30).transition().duration(duration).delay(delay.update).attr('width', newWidth + 20).attr('height', newHeight + 50);
    visContainer.transition().duration(duration).delay(delay.update).style('width', newWidth + 30 + 'px');
  } // Enable pop-up interactivity


  (0, _popper.PopperClick)(selector + ' .phylogram');
};

var _default = buildTree;
exports["default"] = _default;