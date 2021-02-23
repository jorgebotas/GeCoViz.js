var buildTree = function(selector,
    root,
    fields = ['name'],
    callbacks = {
        enterEach : (_) => undefined,
        enterMouseOver : (_e,_) => undefined,
        enterMouseLeave : (_e,_) => undefined,
        enterClick : (_e,_) => undefined,
        exitEach : (_) => undefined,
    },
    options = {
        width : 700,
        height : 800
    }){

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
        .attr('width', w)
    var visDiv = visContainer
        .append('div')
        .attr('class', 'phylogram')
    var visSVG = visDiv
        .append('svg:svg')
        .attr('width', w + margin.left + margin.right)
        .attr('height', h + margin.top + margin.bottom)
    var vis = visSVG
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
        gray : '#aaa',
        darkGray : 'var(--dark-gray)',
        sand : 'var(--sand)',
        darkPurple : 'var(--dark-purple)',
        purple : 'var(--purple)',
        darkRed : 'var(--dark-red)',
    }
    var leafColor = {
        stroke : color.purple,
        full : color.purple,
        empty : color.sand,
        text : color.darkGray,
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
            .attr('fill', leafColor.text)
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
            .duration(duration)
            .delay(delay.update)
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
    var duration = 1000;
    var delay = {
      enter : duration*1.5,
      update : 0,
      exit: 0,
    }

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

    function highlightLeaves(d, highlight=true) {
        if (d.children) d.children.forEach(c => highlightLeaves(c, highlight))
        else if (!d._children) {
            let leaf = visSVG
                .select(`#leaf${cleanString(d.data.name)}`);
            leaf.select('text')
                .style('fill', highlight ? color.highlight : leafColor.text);
            highlight
                ? callbacks.enterMouseOver(undefined, d)
                : callbacks.enterMouseLeave(undefined, d);
        }
    }

    function drawScale(vis, scale, x, y, units='') {
        let ticks = scale.ticks(2);
        ticks = [0, ticks[1] - ticks[0] || ticks[0]];
        let sticks = [scale(ticks[0]), scale(ticks[1])];
        vis.append('svg:line')
            .attr('y1', y)
            .attr('y2', y)
            .attr('x1', x + sticks[0])
            .attr('x2', x + sticks[1])
            .attr("stroke", color.darkGray)
            .attr("stroke-width", "1.5px");
        vis.append('svg:line')
            .attr('y1', y + 5)
            .attr('y2', y - 5)
            .attr('x1', x +  sticks[0])
            .attr('x2', x + sticks[0])
            .attr("stroke", color.darkGray)
            .attr("stroke-width", "1.5px");
        vis.append('svg:line')
            .attr('y1', y + 5)
            .attr('y2', y - 5)
            .attr('x1', x + sticks[1])
            .attr('x2', x + sticks[1])
            .attr("stroke", color.darkGray)
            .attr("stroke-width", "1.5px");
        vis.append("svg:text")
            .attr("class", "rule")
            .attr("x", x + sticks[0]+(sticks[1]-sticks[0])/2)
            .attr("y", y)
            .attr("dy", -7)
            .attr("text-anchor", "middle")
            .attr('font-size', '0.9em')
            .attr('fill', color.darkGray)
            .text(ticks[1] + units);
    }

    function update(source) {
        // compute the new height
        let newHeight = treeRoot.leaves().length* 20; // 20 pixels per line
        visSVG
        .attr('target-height', newHeight + 50)
        tree.size([newHeight, w])
        treeRoot = tree(treeRootHierarchy);
        let nodes = treeRoot.descendants();
        // Scale branches by length
        let scale = scaleBranchLength(nodes)
        // Draw yscale legend
        if (!visDiv.select('.scale').node()) {
            let scaleG = visDiv
                .append('svg')
                .attr('class', 'scale')
                .append('g');
            drawScale(scaleG, scale, 0, 0);
        }

        // ENTERING NODES
        let node = vis.selectAll('g.node')
            .data(nodes, n => n.data.id);
        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter()
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
                    if (event.altKey) toggleAll(d)
                    else toggle(d)
                    update(d);
                })
        nodeEnter.append('svg:circle')
            .attr('r', 1e-6)
            .style('fill', d => {
                return d.data._children ? leafColor.full : leafColor.empty
            });
        // Style inner nodes
        let nodeInnerEnter = nodeEnter.filter('.inner');
        nodeInnerEnter
            .append('text')
            .attr('dx', -3)
            .attr('dy', -3)
            .attr('text-anchor', 'end')
            .attr('font-size', '0.8em')
            .attr('fill', color.darkRed)
            .style('fill-opacity', 1e-6)
            .text(n => (+n.data.support).toFixed(1));
        nodeInnerEnter
            .append('text')
            .attr('dx', -3)
            .attr('dy', +11)
            .attr('text-anchor', 'end')
            .attr('font-size', '0.8em')
            .attr('fill', color.gray)
            .style('fill-opacity', 1e-6)
            .text(n => {
                let length = (+n.data.length)
                let rounded = length < 0.01
                    ? length.toExponential(1)
                    : length.toFixed(3)
                return rounded ? rounded : n.data.length
            });
        // Hovering over clade will highlight descendants
        nodeInnerEnter
            .on('mouseover', (_, d) => highlightLeaves(d, true))
            .on('mouseleave', (_, d) => highlightLeaves(d, false));
        let nodeLeafEnter = nodeEnter.filter('.leaf')
        nodeLeafEnter
            .attr('id', n => 'leaf'
                + cleanString(n.data.name))
        nodeLeafEnter
            .on('mouseover', (e, l) => callbacks.enterMouseOver(e, l))
            .on('mouseleave', (e, l) => callbacks.enterMouseLeave(e, l))
            .on('click', (e, l) => callbacks.enterClick(e, l))
            .each(l => callbacks.enterEach(l))
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
                        popperContent += f == 'showName'
                            ? ''
                            : n.data[f]
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
        let nodeUpdate = nodeEnter
            .merge(node)
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');
        nodeUpdate.select('circle')
            .attr('r', 4)
            .attr('stroke-width', '1.5px')
            .attr('stroke', leafColor.stroke)
            .style('fill', d => d._children ? leafColor.full : leafColor.empty);
        nodeUpdate.selectAll('text')
            .style('fill-opacity', 1);

        // EXITING NODES
        let nodeExit = node.exit()
            .transition()
            .duration(duration)
            .delay(delay.exit)
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
            .each(l => callbacks.exitEach(l))

        // LINKS
        let link = vis.selectAll('path.link')
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
            .duration(duration)
            .delay(delay.update)
            .attr('d', diagonal)
        linkEnter
            .insert('svg:line', 'g')
            .attr('x1', n => n.target.y - n.target.dotted)
            .attr('y1', n => n.target.x)
            .attr('x2', n => n.target.y)
            .attr('y2', n => n.target.x)
            .attr("stroke", color.sand)
            .attr("stroke-width", "2px")
            .attr("stroke-dasharray", "3,3");

        // Transition links to new position
        link
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('d', diagonal)
        // Transition exiting nodes to parent's new position
        link
            .exit()
            .transition()
            .duration(duration)
            .delay(delay.exit)
            .attr('d', () => {
                let newPos = {x : source.x,
                              y : source.y}
                return diagonal({source : newPos,
                                 target : newPos})
            })
            .remove();
        // Store node's old position for transition
        nodes.forEach(n => {n.x0 = n.x; n.y0 = n.y;});
        let newWidth = d3.max(treeRoot
            .leaves()
            .map(l => {
                console.log(l.data.name)
                console.log(l.data.name.length*6)
                return l.y + (l.data.name ? l.data.name.length*6 : 0)
            }));
        visSVG
        .attr('target-width', newWidth)
        .transition()
        .duration(duration)
        .delay(delay.update)
        .attr('width', newWidth)
        .attr('height', newHeight + 50)
        visContainer
        .transition()
        .duration(duration)
        .delay(delay.update)
        .style('width', newWidth + 10 + 'px')
    }
    // Enable pop-up interactivity
    PopperClick(selector + ' .phylogram');

}
