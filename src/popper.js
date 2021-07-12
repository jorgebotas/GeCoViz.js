import { scaleOrdinal, select, selectAll } from 'd3';
import { saveAs } from 'file-saver';
import $ from 'jquery';
import { createPopper } from '@popperjs/core';
import colors269 from './colors269';
import protDomains from './domains';
import {
    capitalize,
    cleanString,
    nonEmptyArray,
} from './helpers';

var PopperCreate = function(selector, d, URLs) {
    function get_PopperHTML(d) {
        let arrayData = []
        let showFields = [
            'gene name',
            'gene',
            'description',
            'anchor',
            'pos',
            'start',
            'end',
            'size',
            'strand'
        ]
        let hideFields = [
            'vStart',
            'vEnd',
            'vSize',
            'geneWidth',
        ]
        Object.entries(d).forEach(([key, field]) => {
            let fieldData = "";
            if (nonEmptyArray(field)) {
                fieldData = '<ul class="popper-ul">\
                    <li class="popper-ul-title">'
                    + key.toUpperCase()
                    + '</li>';
                field.forEach(f => {
                    fieldData += '<li>';
                    fieldData += !URLs[key]
                    ? `<em>${f.id}</em>`
                    : '<a href="'
                        + URLs[key].b
                        + String(f.id)
                        + URLs[key].a
                        + '" target="_blank" style="outline:none;">'
                        + String(f.id)+'</a>';
                let levelData = !f.level
                            ? ''
                            : f.leveDesc
                            ? ' (level: '
                                + f.level
                                + ', description: '
                                + d.levelDesc
                                + ')'
                            : ' (level: '
                                + f.level
                                + ')';
                    fieldData += levelData
                    fieldData += '<br>' + (f.description || '') + '</li>';
                })
                fieldData += '</ul>';
            } else {
                if (typeof field != 'object'
                && !showFields.includes(key)
                && !hideFields.includes(key)) showFields.push(key)
            }
            if (fieldData) arrayData.push(fieldData)
        })
        let popperHTML = ''; //<strong>Gene information</strong>
        if (d.seqID) popperHTML += `<button class="btn btn-sm btn-primary"\
                                   id="downloadSeq${cleanString(d.gene)}"\
                                   style="position: absolute;right: 15px;top: 15px;">\
                                Sequence</button>`;
        popperHTML += '<div class="p-2">';
        showFields.forEach(f => {
            if (d[f]) popperHTML += `${capitalize(f)}: ${d[f]}<br>`;
        })
        popperHTML += '</div>';
        if (nonEmptyArray(d.pfam)) {
             let dom_id = 'dom' + cleanString(d.anchor + d.pos);
             popperHTML += '<div class="py-2" id=' + dom_id + '></div>'
        }
        if (arrayData.length > 0) popperHTML +=
            '<div class="popper-uls">'
                + arrayData.reduce((t, d) => t + d)
                +'</div>';
        return popperHTML
    }

    let geneID = cleanString(d.anchor + d.pos);
    let oldPopper = select(selector + ' .popper#popr' + geneID)
    if (oldPopper.nodes().length > 0) oldPopper.remove();
    let popper = select(selector)
               .append('div')
               .attr('class', 'popper col-lg-4 col-md-8 col-sm-10')
               .attr('id', 'popr' + geneID)
               .attr('role', 'tooltip');
    let popperHTML = get_PopperHTML(d);
    // popper content
    popper.append('div')
             .attr('class', 'popper-content')
             .html(popperHTML);
    if (nonEmptyArray(d.pfam)) {
        let doms = new Set();
        d.pfam.forEach(dom => {
            dom.doms.forEach(d => {
                if (d.class && d.class != "")
                    doms.add(d.class)
                })
        })
        let colors = colors269;
        doms = [...doms];
        // Always render helix with same color
        if (doms.includes('helix'))
            doms = ['helix', ...doms.filter(d => d != 'helix')];
        else
            colors = colors.slice(1);
        let palette = scaleOrdinal()
                        .domain(doms)
                        .range(colors);
        protDomains(selector + ' #dom' + cleanString(d.anchor + d.pos),
                         d.pfam,
                         d.length || Math.abs((+d.end) - (+d.start)) || 1000,
                         250,
                         7,
                         palette,
                         URLs.pfam.b)
    }
    // Popper arrow
    popper.append('div')
        .attr('class', 'popper-arrow')
        .attr('data-popper-arrow', '');
    popper  = popper.node();
    let ref = document
        .querySelector(selector + ' g.gene#gene' + geneID);
    createPopper(ref, popper, {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [-4, 4],
          },
        },
        {
          name: 'flip',
          options: {
              fallbackPlacements: ['top'],
          }
        }
      ],
    });
    popper.setAttribute('data-show', '');
    if (d.seqID) {
        let seqButton = select(`${selector} #downloadSeq${cleanString(d.gene)}`);
        seqButton.on('click', () => {
            fetch(`api/seq/${d.seqID}/`)
                .then(response => response.blob())
                .then(blob => saveAs(blob, `${d.seqID}_seq.fasta`))
        })
    }
}

var TreePopper = function(selector,
                    id,
                    popperHTML,
                    popperClass) {
    let popper = select(selector)
                .append('div')
                .attr('class', 'popper ' + popperClass)
                .attr('id', 'popr' + id)
                .attr('role', 'tooltip')
    // popper content
    popper.append('div')
        .attr('class', 'popper-content card-body h6 pt-2')
        .html(popperHTML);
    // popper arrow
    popper.append('div')
        .attr('class', 'popper-arrow')
        .attr('data-popper-arrow', '');
    popper = popper.node();
    let ref = document.querySelector(selector + ' g#leaf' + id);
    createPopper(ref, popper, {
          placement: 'right',
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 10],
              },
            },
            {
              name: 'flip',
              options: {
                  fallbackPlacements: ['left'],
              }
            }
          ],
        });
    popper.setAttribute('data-show', '');
}

var PopperClick = function(selector) {
    $(document).click(e => {
        // Helper function
        function lookForParent(element, targetClass) {
            let el = element;
            let name = el.nodeName;
            while (name && name != 'HTML') {
                if ($(el).hasClass(targetClass)) {
                    return el;
                }
                el = el.parentElement;
                name = el.nodeName;
            }
            return undefined;
        }

        let targetID;
        const targetClasses = ['gene', 'leaf', 'popper', 'customBar-item'];
        targetClasses.forEach(c => {
            try { targetID = lookForParent(e.target, c).id } catch {}
        })
        targetID = !targetID ? e.target.id : targetID;
        targetID = targetID.trim();
        const prefix = targetID.slice(0,4);
        const suffix = targetID.slice(4);
        const popper = document.querySelector(`${selector} .popper#popr${suffix}`);
        let poppers = selectAll(`${selector} .popper`);
        if (!(['gene','leaf','popr', 'cbit'].includes(prefix)) || popper == null)
            poppers.remove();
        poppers = poppers.nodes();
        if(popper != null && poppers.length > 1)
            poppers.forEach(p => { if(p != popper) p.remove() })
    });
}

export {
    PopperCreate,
    PopperClick,
    TreePopper,
}
