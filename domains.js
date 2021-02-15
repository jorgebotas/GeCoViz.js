var draw_protDomains = function(selector,
                    domains,
                    lenseq,
                    width,
                    height,
                    palette,
                    urlRoot=undefined) {
    function scale(num,
                   inSize,
                   outSize) {
        return +num * outSize / inSize;
    }
    function draw_seqLine(g,
                          width,
                          height) {
        g.append("line")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("x1", 0)
            .attr("y1", height / 2)
            .attr("x2", width)
            .attr("y2", height / 2);
    }
    function draw_legend(selector,
                         domains ,
                         palette,
                         urlRoot=undefined) {
        var legend = d3.select(selector)
         .append("div")
         .attr("class", "dom-legend");
        var doms = new Set();
        domains.forEach(d => {
            if (d.id && d.id != "") {
                doms.add(d.id)
            }
        })
        doms = [...doms]
        doms.forEach(d => {
            let l = legend.append("div")
                     .attr('class', 'd-inline px-2');
            l.append('svg')
             .attr('width', 10)
             .attr('height', 10)
             .attr('class', 'mr-2')
             .append('circle')
             .attr("r", 5)
             .attr("cx", 5)
             .attr("cy", 5)
             .attr("fill", palette(d));
            let t = l.append('div')
                     .attr('class', 'd-inline');
            if (urlRoot) {
                t.append('a')
                  .attr('href', urlRoot + d)
                  .attr('target', '_blank')
                  .attr('class', 'secondary-link')
                  .text(d);
            } else {
                t.text(d);
            }
        })
    }
    function draw_domains(g,
                          domains,
                          lenseq,
                          width,
                          height,
                          palette) {
        console.log(lenseq)
        g.selectAll('circle')
            .data(domains.filter(d => d.shape == "circle"))
            .enter().append('circle')
            .attr("r", 4)
            .attr("cx", d => scale(+d.c, lenseq, width))
            .attr("cy", height/2)
            .attr("fill", d => palette(d.id));
        g.selectAll('rect')
            .data(domains.filter(d => d.shape == "rect"))
            .enter().append('rect')
            .attr("x", d => scale(+d.start, lenseq, width))
            .attr("y", 0)
            .attr("width", d =>  scale(+d.end - +d.start, lenseq, width))
            .attr("height", height)
            .attr("fill", d => palette(d.id));
    }
    var g = d3.select(selector)
              .append('svg:svg')
              .attr("width", width)
              .attr("height", height)
              .append('svg:g')
                .attr("transform", "translate(" + 5 + ", 0)");
    draw_seqLine(g, width, height);
    draw_domains(g, domains, lenseq, width, height, palette);
    draw_legend(selector, domains, palette, urlRoot);
}
