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
        enterMouseEnter : () => undefined,
        enterMouseLeave : () => undefined,
        enterClick : () => undefined,
        enterCollapsed: () => undefined,
        exitCollapsed: () => undefined,
        exitEach : () => undefined,
    },
    options = {
        width: 700,
        branchLength: true,
        branchSupport: true,
        leafHeight: 18,
        shrinkWidth: false,
        show: true,
        outline: false,
        }
    ){
    var margin = {
        top : 5,
        right : 5,
        bottom : 25,
        left : 10
    }
    var graph = function() {
        return this
    };
    leafText = leafText || fields[0];
    function buildHierarchy(root) {
        return hierarchy(root)
            .sort(node => node.children ? node.children.length : -1)
    }
    var treeRootHierarchy = buildHierarchy(root);
    var width = (+options.width || 700) - margin.left - margin.right;
    var height = treeRootHierarchy.leaves().length * (options.outline ? 
        4 : options.leafHeight || 18);
    var tree = cluster()
            .size([height, width])
            .separation(() => 1);
    var treeRoot = tree(treeRootHierarchy);
    var visContainer = select(selector)
        .style('width', width)
    var visDiv = visContainer
        .append('div')
        .attr('class', 'phylogram innerContainer')
    var visSVG = visDiv
        .append('svg:svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
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
    treeRoot.x0 = height / 2;
    treeRoot.y0 = 0;

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

    function collapseNode(event, n) {
        if (n.children || n._children) {
            if (event.altKey) toggleAll(n);
            else toggle(n);
            graph.update(n);
        }
    }

    function getNodeClass(n) {
        return !n.parent ? 
            'root node' :
            (n.children || n._children) ? 
            'inner node' + (n._children ? ' collapsed' : '') : 
            'leaf node';
    }

    function getNodeId(n) {
        if (n._children)
            return `leaf${cleanString(n._children[0].data.name)}`
        const id = n.data.name ? n.data.name : `-inner${n.data.id}`;
        return "node" + cleanString(id)
    }

    function getNodeText(d) {
        return d.data[leafText] 
            || (d.data.lineage ? d.data.lineage[leafText] : "")
            || "";
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
        const branchLength = (options.outline || options.shrinkWidth) ? 10 : 25;
        const nodeLengths = nodes.map(n => n.data.length);
        const yscale = scaleLinear()
            .domain([0, max(nodeLengths)])
            .range([0, branchLength]);
        visitPreOrder(nodes[0], function(node) {
          node.y = branchLength * (node.depth);
            if (node.data.length != undefined) {
              node.dotted = branchLength - yscale(node.data.length);
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
                ? callbacks.enterMouseEnter(undefined, d)
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

    function updateScale(scale, removeOnly=false) {
        let scaleG = visDiv.select('.scale');
        if (scaleG.node()) {
            scaleG = scaleG.select("g");
            scaleG.selectAll("*").remove();
        } else if (!removeOnly)
            scaleG = visDiv
                .append('svg')
                .attr('class', 'scale')
                .append('g');
        if (!removeOnly)
            drawScale(scaleG, scale, 0, 0);
    }

    function updateWidth() {
        width = max(treeRoot.leaves()
            .map(l => l.y + getNodeText(l).length*6 + 6));
        visSVG
        .attr('target-width', width + 30)
        .transition()
        .duration(duration)
        .delay(delay.update)
        .attr('width', width + 20)
        .attr('height', height + 20)
        if (options.show != false)
            visContainer
            .transition()
            .duration(duration)
            .delay(delay.update)
            .style('width', width + 30 + 'px')
    }

    function updateHeight() {
        // 18 pixels per line
        height = treeRoot.leaves().length * (options.outline ? 
            4 : options.leafHeight || 18); 
        visSVG
            .attr('target-height', height + 30)
        tree.size([height, width])
    }

    function updateBranchText(text) {
        // text may be either "support" or "length"
        let show;
        if (text === "support")
            show = options.branchSupport;
        else if (text === "length")
            show = options.branchLength;
        else
            return
        const innerNodes = vis.selectAll("g.inner.node");
        innerNodes.select(`text.${text}`)
            .transition()
            .duration(duration)
            .style('fill-opacity', 
                (!options.outline && !options.shrinkWidth && show) ? 1 : 1e-6)
            .style('display', 
                (!options.outline && !options.shrinkWidth && show) ?
                "block" : "none");
    }

    function updateLeafText() {
        updateWidth();
        // Both leaves and collapsed inner nodes
        const externalNodes = vis.selectAll("g.leaf.node, g.collapsed.node");
        externalNodes.select('text')
            .transition()
            .duration(duration)
            .style('fill-opacity', 1e-6)
            .transition()
            .duration(duration)
            .style('fill-opacity', 1)
            .text(getNodeText)
    }

    graph.update = function (source=treeRoot, firstTime=false) {
        // compute the new height
        updateHeight();
        treeRoot = tree(treeRootHierarchy);
        const nodes = treeRoot.descendants();
        // Scale branches by length
        const scale = scaleBranchLength(nodes)
        // Draw yscale legend
        if (firstTime)
            updateScale(scale, options.shrinkWidth || options.outline);

        // ENTERING NODES
        const node = vis.selectAll('g.node')
            .data(nodes, n => n.data.id);
        // Enter any new nodes at the parent's previous position.
        const nodeEnter = node.enter()
                .append('svg:g')
                .attr('class', getNodeClass)
                .attr('id', getNodeId)
                .attr('transform',
                      'translate('
                        + source.y0
                        + ','
                        + source.x0
                        + ')')
                .on('click', (event, n) => {
                    if (event.altKey)
                        graph.remove(n);
                    else {
                        callbacks.enterClick(event, n);
                        if (event.altKey) 
                            collapseNode(event, n);
                    }
                })
        nodeEnter.append('svg:circle')
            .attr('r', 1e-6)
            .style('fill', d => {
                return d.data._children ? leafColor.full : leafColor.empty
            });
        nodeEnter
            .append('text')
            .attr('class', 'name')
            .attr('dx', 10)
            .attr('dy', 3)
            .attr('text-anchor', 'start')
            .style("fill-opacity", 1e-6)
            .style("display", "none")
            .text(getNodeText);

        // Associate each node to pop-up
        // Display fields data
        nodeEnter
            .on('click', (event, n) => {
                callbacks.enterClick(event, n);
                if (event.altKey)
                    graph.remove(n);
                else {
                    if (event.shiftKey) 
                        collapseNode(event, n);
                    else {
                        const popperCallback = (popper) => {
                            let popperHTML = '';
                            if (fields)
                                fields.forEach(f => {
                                    popperHTML += f === 'showName'
                                        ? ''
                                        : n.data[f]
                                        ? '<p>' + f + ': ' + n.data[f] + '</p>'
                                        : ''
                                })
                            if (n.data.lineage)
                                Object.entries(n.data.lineage).forEach(([ rank, t ]) => {
                                    popperHTML += `<p>${rank}: ${t}</p>`;
                                })
                            const text = getNodeText(n);
                            popperHTML = text 
                                ? '<p>' + text + '</p>' + popperHTML 
                                : popperHTML;

                            const popperContent = popper.select(".popper-content");
                            if (popperHTML.length)
                                popperContent.html(popperHTML);
                            else
                                popper.style("width", "220px").style("height", "85px");
                            popperContent.append("button")
                                .attr("class", "btn btn-sm btn-primary collapseNode")
                                .style("position", "absolute")
                                .style("right", "15px")
                                .style("top", "15px")
                                .text(() => n._children ? "Expand node" : n.children ? "Collapse node" : "Toggle context")
                                .on("click", () => {
                                    if (n.children || n._children)
                                        collapseNode({ altKey: false }, n);
                                    else
                                        callbacks.enterClick({ shiftKey: true }, n);
                                    visDiv.selectAll(".popper").remove();
                                })
                            popperContent.append("button")
                                .attr("class", "btn btn-sm btn-danger collapseNode")
                                .style("position", "absolute")
                                .style("right", "15px")
                                .style("top", "45px")
                                .html("<i class='fas fa-exclamation-circle mr-1'></i>Permantently remove node")
                                .on("click", () => {
                                    graph.remove(n);
                                })
                        }
                        TreePopper(selector + ' .phylogram',
                            cleanString(n.data.name ? n.data.name : `-inner${n.data.id}`),
                            popperCallback,
                            'col-md-2 col-sm-4')
                    }
                }
            })
        // Style inner nodes
        const nodeInnerEnter = nodeEnter.filter('.inner');
        nodeInnerEnter
            .append('text')
            .attr('class', 'support')
            .attr('dx', -3)
            .attr('dy', -3)
            .attr('text-anchor', 'end')
            .attr('font-size', '0.8em')
            .attr('fill', color.darkRed)
            .style('fill-opacity', 1e-6)
            .text(n => (+n.data.support).toFixed(2));
        nodeInnerEnter
            .append('text')
            .attr('class', 'length')
            .attr('dx', -3)
            .attr('dy', +11)
            .attr('text-anchor', 'end')
            .attr('font-size', '0.8em')
            .attr('fill', color.gray)
            .style('fill-opacity', 1e-6)
            .text(n => {
                const length = (+n.data.length)
                const rounded = length < 0.01
                    ? length.toExponential(0)
                    : length.toFixed(2)
                return rounded ? rounded : n.data.length
            });


        // Hovering over clade will highlight descendants
        nodeInnerEnter
            .on('mouseenter', (_, d) => highlightLeaves(d, true))
            .on('mouseleave', (_, d) => highlightLeaves(d, false));

        const nodeLeafEnter = nodeEnter.filter('.leaf');
        nodeLeafEnter
            .on('mouseenter', (e, l) => callbacks.enterMouseEnter(e, l))
            .on('mouseleave', (e, l) => callbacks.enterMouseLeave(e, l))
            .each(l => callbacks.enterEach(l))


        // COLLAPSED NODES
        const collapsedNodes = vis.selectAll("g.collapsed.node")
            .data(nodes.filter(n => n._children && !n.children), n => n.id);
        collapsedNodes.enter()
            .each(callbacks.enterCollapsed);
        collapsedNodes.exit()
            .each(callbacks.exitCollapsed);

        // UPDATING NODES
        // Transition nodes to their new position.
        const nodeUpdate = nodeEnter
            .merge(node)
            .attr("class", getNodeClass)
            .attr('id', getNodeId)
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');
        nodeUpdate.select('circle')
            .attr('r', options.outline ? 1.5 : 4)
            .attr('stroke-width', '1.5px')
            .attr('stroke', leafColor.stroke)
            .style('fill', d => d._children ? leafColor.full : leafColor.empty);
        nodeUpdate.select('text.name')
            .style("display", n => 
                (options.outline || n.children) ? "none" : "block")
            .style("fill-opacity", n => 
                (options.outline || n.children) ? 1e-6 : 1);

        const nodeInnerUpdate = nodeUpdate.filter('.inner');
        nodeInnerUpdate.select('circle')
            .attr('r', d => 
                (options.outline || (options.shrinkWidth && !d._children)) ?
                 1.5 : 4);
        nodeInnerUpdate.select('text.length')
            .style("display", 
                (options.outline || options.shrinkWidth || !options.branchLength)
                ? "none" : "block")
            .style('fill-opacity', 
                (options.outline || options.shrinkWidth || !options.branchLength)
                ? 1e-6 : 1);
        nodeInnerUpdate.select('text.support')
            .style("display", 
                (options.outline || options.shrinkWidth || !options.branchSupport)
                ? "none" : "block")
            .style('fill-opacity', 
                (options.outline || options.shrinkWidth || !options.branchSupport)
                ? 1e-6 : 1);

        // EXITING NODES
        const nodeExit = node.exit()
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
        const link = vis.selectAll('path.link')
            .data(treeRoot.links(nodes), d =>  d.target.data.id);
        const dottedLink = vis.selectAll('line.dotted-link')
            .data(treeRoot.links(nodes), d =>  d.target.data.id);
        const linkEnter = link
            .enter();
        const dottedLinkEnter = dottedLink
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
            .attr("stroke-dasharray", "2")
            .style("display", 
                (options.outline || options.shrinkWidth) ? "none" : "block");
    
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
            .style("display", 
                (options.outline || options.shrinkWidth) ? "none" : "block");

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

        return graph;
    }

    graph.remove = function(node){
        const hierarchyNode = treeRootHierarchy
            .find(d => d.data.id === node.data.id);
        function removeChild(d) {
            if (!d.parent)
                return
            d.parent.children = d.parent.children
                .filter(c => c != d);
            if (!d.parent.children.length)
                removeChild(d.parent);
        }
        removeChild(hierarchyNode);
        graph.update(node, true);
    }

    graph.branchLength = function (show=true) {
        if (show) options.branchLength = true;
        else options.branchLength = false;
        updateBranchText("length");
    }

    graph.branchSupport = function (show=true) {
        if (show) options.branchSupport = true;
        else options.branchSupport = false;
        updateBranchText("support");
    }

    graph.shrinkWidth = function (shrink=true) {
        if (shrink) options.shrinkWidth = true;
        else options.shrinkWidth = false;
        graph.update(treeRoot, true);
    }

    graph.outline = function (outline=true) {
        if (outline) options.outline = true;
        else options.outline = false;
        graph.update(treeRoot, true);
        //visSVG.node().scrollIntoView({ behaviour: "smooth" });
        return graph;
    }

    graph.options = function (opt) {
        if (!opt) return options;
        for (let key in opt)
            options[key] = opt[key];
        return graph;
    }

    graph.leafText = function (field) {
        if (!field) return leafText;
        leafText = field;
        updateLeafText();
        return graph;
    }

    graph.update(treeRoot, true);
    // Enable pop-up interactivity
    PopperClick(selector + ' .phylogram');

    return graph;
}

export default Tree;
