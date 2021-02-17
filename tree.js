var buildTree = function(selector,
                    root,
                    fields = ['name'],
                    enterCallback,
                    exitCallback,
                    options = {width : 700,
                        height : 800}){
    var margin = {
        top : 5,
        right : 5,
        bottom : 25,
        left : 10
    }
    var treeRootHierarchy = d3.hierarchy(root)
            .sort(node => node.children ? node.children.length : -1);
    var w = +options.width - margin.left - margin.right;
    var h = treeRootHierarchy.leaves().length * 20;
    var tree = d3.cluster()
            .size([h, w])
            .separation(() => 1);
    var treeRoot = tree(treeRootHierarchy)
    var visContainer = d3.select(selector)
        .append('div')
        .attr('class', 'p-1')
        .attr('width', w)
    var vis = visContainer
        .append('div')
        .attr('class', 'phylogram')
    var visSVG = vis
        .append('svg:svg')
        .attr('width', w + margin.left + margin.right)
        .attr('height', h + margin.top + margin.bottom)
    vis = visSVG
        .append('svg:g')
            .attr('transform',
                'translate('
                + margin.left
                + ','
                + margin.top
                + ')');
    var color = {
        noData: 'var(--nodata)',
        highlight : 'var(--highlight)',
        black : 'var(--black)',
        darkGray : 'var(--dark-gray)',
        sand : 'var(--sand)',
        darkPurple : 'var(--dark-purple)',
        purple : 'var(--purple)',
        darkRed : 'var(--dark-red)'
    }
    var leafColor = {
        stroke : color.darkPurple,
        full : color.purple,
        empty : color.sand,
    }
    function rightAngleDiagonal() {
        function projection(d) {
            return [d.y, d.x];
        }
        function path(pathData){
          return 'M'
                + pathData[0]
                + ' '
                + pathData[1]
                + ' '
                + pathData[2];
        }
        function diagonal(diagonalPath){
            var source = diagonalPath.source;
            var target = diagonalPath.target;
            var pathData = [source,
                            {x:target.x, y:source.y},
                            target];
            pathData = pathData.map(projection);
            return path(pathData);
        }
        return diagonal;
    }

    function styleNodes(node) {
        // Support and distance values in inner nodes
        var nodeInnerEnter = node
        nodeInnerEnter
            .append('text')
            .attr('dx', -3)
            .attr('dy', -3)
            .attr('text-anchor', 'end')
            .attr('font-size', '0.8em')
            .attr('fill', 'var(--dark-red)')
            .style('fill-opacity', 1e-6)
            .text(n => (+n.data.support).toFixed(1));
        nodeInnerEnter
            .append('text')
            .attr('dx', -3)
            .attr('dy', +11)
            .attr('text-anchor', 'end')
            .attr('font-size', '0.8em')
            .attr('fill', '#aaa')
            .style('fill-opacity', 1e-6)
            .text(n => {
                let length = (+n.data.length)
                let rounded = length < 0.01
                    ? length.toExponential(1)
                    : length.toFixed(3)
                return rounded ? rounded : n.data.length
            });
        nodeInnerEnter.merge(node)
            .selectAll('text')
            .style('fill-opacity', 1)
            .transition()
            .duration(1000)
        // Inner nodes have classes that represent all children
        // Hovering over clade will highlight descendants
        function childrenName(node) {
            let names = []
            if (!node.children && node.data.name) {
                names.push(cleanString(node.data.name));
            } else {
                node.children.forEach(c => {
                    names = names.concat(childrenName(c));
                })
            }
            return names;
        }
        nodeInnerEnter
            .attr('class', n => 'leaf' + childrenName(n).join(' leaf'))
        var nodeLeafEnter = vis.selectAll('g.leaf.node');
        nodeLeafEnter
            .attr('id', n => 'leaf'
            + cleanString(n.data.name))
            .append('text')
            .attr('dx', 13)
            .attr('dy', 5)
            .attr('text-anchor', 'start')
            .text(n => n.data.showName ? n.data.showName : n.data.name)
        // Associate each leaf to pop-up
        // Display fields data
        if (fields) {
            nodeLeafEnter
                .each(n => {
                    let popperContent = '';
                    fields.forEach(f => {
                        popperContent += f != 'showName'
                            ? '<p>' + f + ': ' + n.data[f] + '</p>'
                            : ''
                    })
                    popperContent = n.data.showName
                        ? '<p>' + n.data.showName + '</p>' + popperContent
                        : popperContent
                    addPopper(selector + ' .phylogram',
                        cleanString(n.data.name),
                        popperContent,
                        'col-d-2')
                })
        }
    }

    var diagonal = rightAngleDiagonal();
    var transitionDuration = 750;

    // Initialize root's initial position
    treeRoot.x0 = h / 2;
    treeRoot.y0 = 0;

    //treeRoot.children.forEach(toggleAll);
    update(treeRoot);
    // Toggle node function
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
            openAll(d)
        } else if (d.children) {
            closeAll(d)
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

    function scaleBranchLength(nodes) {
        // Visit all nodes and adjust y pos
        var visitPreOrder = function(root, callback) {
          callback(root)
          if (root.children) {
            for (var i = root.children.length - 1; i >= 0; i--){
              visitPreOrder(root.children[i], callback)
            };
          }
        }
        visitPreOrder(nodes[0], node => {
          node.rootDist = (node.parent ? node.parent.rootDist : 0)
                + (node.data.length || 0);
        })
        //var rootDepths = nodes.map(function(n) { return n.depth; });
        var nodeLengths = nodes.map(n => n.data.length);
        var yscale = d3.scaleLinear()
            .domain([0, d3.max(nodeLengths)])
            .range([0, 33]);
        visitPreOrder(nodes[0], function(node) {
          node.y = 33 * (node.depth);
            if (node.data.length != undefined) {
              node.dotted = 33 - yscale(node.data.length);
            } else {
                node.dotted = 0;
            }
        })
        return yscale
    }

    function update(source) {
        // compute the new height
        var newHeight = treeRoot.leaves().length* 20; // 20 pixels per line
        visSVG
        .attr('target-height', newHeight + 50)
        tree.size([newHeight, w])
        treeRoot = tree(treeRootHierarchy);
        var nodes = treeRoot.descendants();
        // Scale branches by length
        scaleBranchLength(nodes)

        // ENTERING NODES
        var node = vis.selectAll('g.node')
            .data(nodes, n => n.data.id);
        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter()
                .append('svg:g')
                .attr('class', n =>
                    !n.parent ? 'root node' :
                     n.children || n._children
                        ? 'inner node'
                        : 'leaf node')
                .attr('transform',
                      'translate('
                        + source.y0
                        + ','
                        + source.x0
                        + ')')
                .on('click', (event, d) => {
                    if (event.altKey) { toggleAll(d) }
                    else { toggle(d) }
                    update(d);
                });
        nodeEnter.append('svg:circle')
            .attr('r', 1e-6)
            .style('fill', d => {
                return d.data._children ? leafColor.full : leafColor.empty
            });
        // Style inner nodes
        var nodeInnerEnter = nodeEnter.filter('.inner');
        nodeInnerEnter
            .append('text')
            .attr('dx', -3)
            .attr('dy', -3)
            .attr('text-anchor', 'end')
            .attr('font-size', '0.8em')
            .attr('fill', 'var(--dark-red)')
            .style('fill-opacity', 1e-6)
            .text(n => (+n.data.support).toFixed(1));
        nodeInnerEnter
            .append('text')
            .attr('dx', -3)
            .attr('dy', +11)
            .attr('text-anchor', 'end')
            .attr('font-size', '0.8em')
            .attr('fill', '#aaa')
            .style('fill-opacity', 1e-6)
            .text(n => {
                let length = (+n.data.length)
                let rounded = length < 0.01
                    ? length.toExponential(1)
                    : length.toFixed(3)
                return rounded ? rounded : n.data.length
            });
        // Inner nodes have classes that represent all children
        // Hovering over clade will highlight descendants
        //nodeInnerEnter
            //.attr('class', n => 'leaf'
                //+ n.leaves().map(l => cleanString(l.data.name))
                    //.join(' leaf'))
        var nodeLeafEnter = nodeEnter.filter('.leaf')
        nodeLeafEnter
            .attr('id', n => 'leaf'
                + cleanString(n.data.name))
        nodeLeafEnter
            .each(l => enterCallback(l))
        nodeLeafEnter
            .append('text')
            .attr('dx', 10)
            .attr('dy', 3)
            .attr('text-anchor', 'start')
            .style('fill-opacity', 1e-6)
            .text(n => n.data.showName ? n.data.showName : n.data.name)
        // Associate each leaf to pop-up
        // Display fields data
        if (fields) {
            nodeLeafEnter
                .each(n => {
                    let popperContent = '';
                    fields.forEach(f => {
                        popperContent += f != 'showName'
                            ? '<p>' + f + ': ' + n.data[f] + '</p>'
                            : ''
                    })
                    popperContent = n.data.showName
                        ? '<p>' + n.data.showName + '</p>' + popperContent
                        : popperContent
                    addPopper(selector + ' .phylogram',
                        cleanString(n.data.name),
                        popperContent,
                        'col-md-2 col-sm-4')
                })
        }


        // UPDATING NODES
        // Transition nodes to their new position.
        var nodeUpdate = nodeEnter
            .merge(node)
            .transition()
            .duration(transitionDuration)
            .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');
        nodeUpdate.select('circle')
            .attr('r', 4)
            .attr('stroke-width', '1.5px')
            .attr('stroke', leafColor.stroke)
            .style('fill', d => d._children ? leafColor.full : leafColor.empty);
        nodeUpdate.selectAll('text')
            .style('fill-opacity', 1);

        // EXITING NODES
        var nodeExit = node.exit()
            .transition()
            .duration(transitionDuration)
            .attr('transform',
                  'translate('
                    + source.y
                    + ','
                    + source.x
                    + ')')
            .remove();
        nodeExit
            .select('circle')
            .attr('r', 1e-6);
        nodeExit
            .selectAll('text')
            .style('fill-opacity', 1e-6)
        nodeExit
            .filter('.leaf')
            .each(l => exitCallback(l))

        // LINKS
        var link = vis.selectAll('path.link')
            .data(treeRoot.links(nodes), d =>  d.target.data.id);
        let linkEnter = link
            .enter();
        linkEnter
            .insert('svg:path', 'g')
            .attr('class', 'link')
            .attr('d', () => {
                let oldPos = {x : source.x0,
                              y : source.y0}
                return diagonal({source : oldPos,
                                 target : oldPos})
            })
            .transition()
            .duration(transitionDuration)
            .attr('d', diagonal)
        linkEnter
            .insert('svg:line', 'g')
            .attr('x1', n => n.target.y - n.target.dotted)
            .attr('y1', n => n.target.x)
            .attr('x2', n => n.target.y)
            .attr('y2', n => n.target.x)
            .attr("stroke", "var(--sand)")
            .attr("stroke-width", "2px")
            .attr("stroke-dasharray", "3,3");

        // Transition links to new position
        link
            .transition()
            .duration(transitionDuration)
            .attr('d', diagonal)
        // Transition exiting nodes to parent's new position
        link
            .exit()
            .transition()
            .duration(transitionDuration)
            .attr('d', () => {
                let newPos = {x : source.x,
                              y : source.y}
                return diagonal({source : newPos,
                                 target : newPos})
            })
            .remove();
        // Store node's old position for transition
        nodes.forEach(n => {n.x0 = n.x; n.y0 = n.y;});
        let newWidth = d3.max(treeRoot.leaves().map(l => l.y)) + 200;
        visSVG
        .transition()
        .duration(500)
        .attr('width', newWidth)
        .attr('height', newHeight + 50)
        visContainer
        .transition()
        .duration(500)
        .style('width', newWidth + 10 + 'px')
    }
    // Enable pop-up interactivity
    PopperClick(selector + ' .phylogram');

}
