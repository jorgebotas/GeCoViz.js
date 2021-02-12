import { select,
         max,
         layout,
         scale } from 'd3';

import { TreeNode } from './interfaces';
import { clean_string } from './helpers';
import { apopper } from './popper';


function rightAngleDiagonal () {
    function projection(d : {x:number, y:number}) {
        return [d.y, d.x];
    }

    function path(pathData:any){
      return "M" + pathData[0] + ' ' + pathData[1] + " " + pathData[2];
    }

    function diagonal(diagonalPath:any){
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


function styleNodes(selector : string,
                    vis : d3.Selection<HTMLElement>,
                    nodes : TreeNode[],
                    fields? : string[]){
    // Leaf nodes
    vis.selectAll('g.leaf.node')
      .append("svg:circle")
        .attr("r", 4)
        .attr('fill', 'var(--purple)')
        .attr('stroke',  'var(--dark-purple)')
        .attr('stroke-width', '1.5px');

    // Root node
    vis.selectAll('g.root.node')
      .append('svg:circle')
        .attr("r", 4)
        .attr('fill', '#ffa100')
        .attr('stroke', '#e67e00')
        .attr('stroke-width', '1.5px');
    
    // Inner nodes
    vis.selectAll('g.inner.node')
        .append("svg:text")
          .attr("dx", -3)
          .attr("dy", -3)
          .attr("text-anchor", 'end')
          .attr('font-size', '0.8em')
          .attr('fill', 'var(--dark-red)')
          .text((d : TreeNode) => (+d.support).toFixed(1) );

      vis.selectAll('g.inner.node')
        .append("svg:text")
          .attr("dx", -3)
          .attr("dy", +11)
          .attr("text-anchor", 'end')
          .attr('font-size', '0.8em')
          .attr('fill', '#aaa')
          .text(function(d : TreeNode) {
              let rounded : string;
              if ((+d.length) < 0.001) {
                  rounded = (+d.length).toExponential(1);
              } else {
                  rounded = (+d.length).toFixed(3);
              }
              if (rounded) {
                return rounded;
              } else { 
                  return d.length;
              }
          });


        function get_children_name(node : TreeNode) {
            let names = [];
            if (!node.children && node.name) {
                names.push(clean_string(node.name));
            } else {
                node.children.forEach(c => {
                    names = names.concat(get_children_name(c));
                })
            }
            return names;
        }

    vis.selectAll('g.inner.node')
        .append("svg:circle")
        .attr("r", 3)
        .attr('fill', 'var(--dark-gray)') // 27bda9
        .attr('stroke',  'var(--dark-gray)')
        .attr('stroke-width', '1.5px');
    vis.selectAll('g.inner.node')
            .select("circle")
            .attr("class", function(d : TreeNode) {
                let children = get_children_name(d)
                children[0] = "g" + children[0]
            return children.join(" g")
        });

        let i_name : number;
        if (fields) {
              i_name = fields.indexOf('gene');
              i_name = i_name < 0 ? fields.indexOf('name') : i_name;

        } else {
            i_name = 0;
        }
      vis.selectAll('g.leaf.node')
        .attr("id", function(d : TreeNode) { 
            let name = d.name.split(".")[i_name];
            if (!name) { name = d.name.split(".")[0] }
            return "g" + clean_string(name); 
        });
      vis.selectAll('g.leaf.node')
        .append("svg:text")
        .attr("id", function(d : TreeNode) { 
            let name = d.name.split(".")[i_name];
            if (!name) { name = d.name.split(".")[0] }
            return "idxt" + clean_string(name); 
        })
        .attr("dx", 13)
        .attr("dy", 5)
        .attr("text-anchor", "start")
        .attr('font-family', 'san-serif') //Helvetica Neue, Helvetica, sans-serif
        .attr('font-size', '0.9em')
        .attr('fill', 'var(--dark-gray)')
        .text(function(d : TreeNode) {
            if (fields) {
                    let name_split = d.name.split(".");
                    let name = name_split[fields.indexOf("name")];
                    return name;
            } else { return d.name }
        });

      if (fields){
          nodes.forEach((d : TreeNode) => {
            if (!d.children) {
                let name_split = d.name.split(".");
                let i_name = fields.indexOf("name");
                let content = "";
                name_split.forEach((n,i) => {
                    if (i == i_name) {
                        content += "<p>" +  n + "</p>";
                    }  else {
                        content += "<p>" + fields[i] + ": " + n + "</p>";
                    }
                })
                let gene = name_split[fields.indexOf("gene")]
                if (!gene) { gene = name_split[i_name]}
                apopper(selector, 
                    "idxt" + clean_string(gene),
                    content, 
                    "col-md-2");
            }
          })
      } 
}


function scaleBranchLengths(nodes : TreeNode[]) {
    // Visit all nodes and adjust y pos width distance metric
    var visitPreOrder = function(root:TreeNode, callback:any) {
      callback(root)
      if (root.children) {
        for (var i = root.children.length - 1; i >= 0; i--){
          visitPreOrder(root.children[i], callback)
        };
      }
    }
    visitPreOrder(nodes[0], function(node:TreeNode) {
      node.rootDist = (node.parent ? node.parent.rootDist : 0) + (node.length || 0)
    })
    //var rootDepths = nodes.map(function(n) { return n.depth; });
    var nodeLengths = nodes.map(function(n:TreeNode) { return n.length; });
    var yscale = scale.linear()
        .domain([0, max(nodeLengths)])
        .range([0, 33]);
    visitPreOrder(nodes[0], function(node:TreeNode) {
      node.y = 33 * (node.depth + 1);
        if (node.length != undefined) {
          node.dotted = 33 - yscale(node.length);
        } else {
            node.dotted = 0;
        }
    })
    return yscale
}


export function draw_scale(vis : d3.Selection<HTMLElement>,
                     scale : scale.linear,
                     x : number,
                     y : number,
                     units = ""){
    var ticks = scale.ticks(2);
    ticks = [0, ticks[1] - ticks[0] || ticks[0]];
    var sticks = [scale(ticks[0]), scale(ticks[1])];
    vis.append('svg:line')
        .attr('y1', y)
        .attr('y2', y)
        .attr('x1', x + sticks[0])
        .attr('x2', x + sticks[1])
        .attr("stroke", 'var(--dark-gray)')
        .attr("stroke-width", "1.5px");
    vis.append('svg:line')
        .attr('y1', y + 5)
        .attr('y2', y - 5)
        .attr('x1', x +  sticks[0])
        .attr('x2', x + sticks[0])
        .attr("stroke", 'var(--dark-gray)')
        .attr("stroke-width", "1.5px");
    vis.append('svg:line')
        .attr('y1', y + 5)
        .attr('y2', y - 5)
        .attr('x1', x + sticks[1])
        .attr('x2', x + sticks[1])
        .attr("stroke", 'var(--dark-gray)')
        .attr("stroke-width", "1.5px");
    vis.append("svg:text")
        .attr("class", "rule")
        .attr("x", x + sticks[0]+(sticks[1]-sticks[0])/2)
        .attr("y", y)
        .attr("dy", -7)
        .attr("text-anchor", "middle")
        .attr('font-size', '0.9em')
        .attr('fill', 'var(--dark-gray)')
        .text(ticks[1] + units);
}

export function buildPhylogram(selector : string, 
                        nodes : any,
                        options : {
                            width : number,
                            height : number,
                            name_fields? : string[],
                        }) {
    var w = +options.width;
    var h = +options.height;

    var tree = layout.cluster()
                  .size([h,w])
                  .sort(function(node : TreeNode) {
                      return node.children ? node.children.length : -1; 
                  })
                  .children(function(node : TreeNode) {
                    return node.branchset
                  })
                  .separation(()=> 1);
    var diagonal = rightAngleDiagonal();
    var vis = select(selector).append("svg:svg")
                .attr("id", "phylogram")
                .attr("width", w + 500)
                .attr("height", h + 60)
               .append("svg:g")
                .attr("transform", "translate(20, 20)");
    nodes = tree(nodes);

    // Scale branch length
    var yscale = scaleBranchLengths(nodes);
    // Draw yscale legend
    var scale_svg = select(selector)
                 .append("svg")
                 .attr("class", "scale")
                 .append("g");
    draw_scale(scale_svg, yscale, 0, 0);

    // Link nodes
    vis.selectAll("path.link")
        .data(tree.links(nodes))
      .enter().append("svg:path")
        .attr("class", "link")
        .attr("d", diagonal)
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", "2px");

    Object.values(tree.links(nodes)).forEach((n : TreeNode) => {
        vis.append("svg:line")
            .attr("class", "link")
            .attr('x1', n.target.y - n.target.dotted)
            .attr('y1', n.target.x)
            .attr('x2', n.target.y)
            .attr('y2', n.target.x)
            .attr("stroke", "var(--sand)")
            .attr("stroke-width", "2px")
            .attr("stroke-dasharray", "3,3");
      })

    // Create nodes
    vis.selectAll("g.node")
        .data(nodes)
        .enter().append("svg:g")
        .attr("class", function(n : TreeNode) {
          if (n.children) {
            if (n.depth == 0) {
              return "root node"
            } else {
              return "inner node"
            }
          } else {
            return "leaf node"
          }
        })
        .attr("transform", function(d : TreeNode) {
            return "translate(" + d.y + "," + d.x + ")";
        })
    styleNodes(selector, vis, nodes,  options.name_fields);

    var largest_abcissa = 0
    nodes.forEach((n : TreeNode) => {
      largest_abcissa = Math.max(largest_abcissa, n.y)
    })
    select(selector + " svg#phylogram")
                .attr("width", largest_abcissa + 150);
    return {tree: tree, vis: vis}
}
