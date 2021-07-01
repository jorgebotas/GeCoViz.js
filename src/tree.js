import {
    cluster,
    hierarchy,
    max,
    scaleLinear,
    select,
} from 'd3';
import { cleanString } from './helpers';
import {
    PopperClick,
    TreePopper,
} from './popper';

var Tree = function(selector,
    root,
    leafText,
    fields = ['name'],
    callbacks = {
        enterEach : () => undefined,
        enterMouseOver : () => undefined,
        enterMouseLeave : () => undefined,
        enterClick : () => undefined,
        exitEach : () => undefined,
    },
    options = {
        width: 700,
        height: 800,
        show: true,
    }){
    var margin = {
        top : 5,
        right : 5,
        bottom : 25,
        left : 10
    }
    var graph = function() { return this };
    leafText = leafText || fields[0];
    var treeRootHierarchy = hierarchy(root)
            .sort(node => node.children ? node.children.length : -1);
    var w = (+options.width || 700) - margin.left - margin.right;
    var h = treeRootHierarchy.leaves().length * 20;
    var width;
    var height;
    var tree = cluster()
            .size([h, w])
            .separation(() => 1);
    var treeRoot = tree(treeRootHierarchy)
    var visContainer = select(selector)
        .style('width', w)
    var visDiv = visContainer
        .append('div')
        .attr('class', 'phylogram innerContainer')
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

    var diagonal = rightAngleDiagonal();
    var duration = 600;
    var delay = {
      enter : duration * 2,
      update : duration,
      exit: duration,
    }

    // Initialize root's initial position
    treeRoot.x0 = h / 2;
    treeRoot.y0 = 0;

    //treeRoot.children.forEach(toggleAll);
    update(treeRoot);
    // Enable pop-up interactivity
    PopperClick(selector + ' .phylogram');

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

    function getShowName(d) {
        return d.data[leafText] || '';
    }

    function scaleBranchLength(nodes) {
        // Visit all nodes and adjust y pos
        var visitPreOrder = function(root, callback) {
          callback(root)
          if (root.children) {
            for (var i = root.children.length - 1; i >= 0; i--) {
              visitPreOrder(root.children[i], callback)
            }
          }
        }
        visitPreOrder(nodes[0], node => {
          node.rootDist = (node.parent ? node.parent.rootDist : 0)
                + (node.data.length || 0);
        })
        //var rootDepths = nodes.map(function(n) { return n.depth; });
        var nodeLengths = nodes.map(n => n.data.length);
        var yscale = scaleLinear()
            .domain([0, max(nodeLengths)])
            .range([0, 25]);
        visitPreOrder(nodes[0], function(node) {
          node.y = 25 * (node.depth);
            if (node.data.length != undefined) {
              node.dotted = 25 - yscale(node.data.length);
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
            .attr('font-size', '11px')
            .attr('fill', color.darkGray)
            .text(ticks[1] + units);
    }

    function updateWidth() {
        width = max(treeRoot.leaves()
            .map(l => l.y + getShowName(l).length*6 + 6));
        visSVG
        .attr('target-width', width + 30)
        .transition()
        .duration(duration)
        .delay(delay.update)
        .attr('width', width + 20)
        .attr('height', height + 20)
        if(options.show != false)
            visContainer
            .transition()
            .duration(duration)
            .delay(delay.update)
            .style('width', width + 30 + 'px')
    }

    function updateHeight() {
        height = treeRoot.leaves().length* 18; // 20 pixels per line
        visSVG
            .attr('target-height', height + 30)
        tree.size([height, w])
    }

    function updateLeafText() {
        updateWidth();
        let leaves = vis.selectAll('g.node.leaf')
        leaves.select('text')
            .transition()
            .duration(duration)
            .style('opacity', 0)
            .transition()
            .duration(duration)
            .style('opacity', 1)
            .text(getShowName)
    }

    function update(source) {
        // compute the new height
        updateHeight();
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
            .text(n => (+n.data.support).toFixed(2));
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
                    ? length.toExponential(0)
                    : length.toFixed(2)
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
            .text(getShowName)
        // Associate each leaf to pop-up
        // Display fields data
        if (fields) {
            nodeLeafEnter
                .on('click', (_, n) => {
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
                   TreePopper(selector + ' .phylogram',
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
        let dottedLink = vis.selectAll('line.dotted-link')
            .data(treeRoot.links(nodes), d =>  d.target.data.id);
        let linkEnter = link
            .enter();
        let dottedLinkEnter = dottedLink
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
        dottedLinkEnter
            .insert('svg:line', 'g')
            .attr('class', 'dotted-link')
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
        dottedLink
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('x1', n => n.target.y - n.target.dotted)
            .attr('y1', n => n.target.x)
            .attr('x2', n => n.target.y)
            .attr('y2', n => n.target.x)

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
        dottedLink
            .exit()
            .remove();
        // Store node's old position for transition
        nodes.forEach(n => {n.x0 = n.x; n.y0 = n.y;});
        updateWidth();
    }

    graph.leafText = function(field) {
        if (!field) return leafText;
        leafText = field;
        updateLeafText();
        return graph;
    }

    return graph;
}

export default Tree;
