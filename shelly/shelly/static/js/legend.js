(function() {
    'use strict';
    /* jshint camelcase: false */

    // ---Plotly global modules
    /* global Plotly:false */

    // ---external global dependencies
    /* global d3:false */

    var legend = Plotly.Legend = {};
    // -----------------------------------------------------
    // styling functions for traces in legends.
    // same functions for styling traces in the style box
    // -----------------------------------------------------

    legend.attributes = {
        bgcolor: {
            type: 'color',
            dflt: '#fff'
        },
        bordercolor: {
            type: 'color',
            dflt: '#444'
        },
        borderwidth: {
            type: 'number',
            min: 0,
            dflt: 0
        },
        font:{type: 'font'},
        traceorder: {
            type: 'enumerated',
            values: ['normal', 'reversed']
        },
        x: {
            type: 'number',
            dflt: 1.02
        },
        xanchor: {
            type: 'enumerated',
            values: ['auto', 'left', 'center', 'right'],
            dflt: 'auto'
        },
        y: {
            type: 'number',
            dflt: 1
        },
        yanchor: {
            type: 'enumerated',
            values: ['auto', 'top', 'middle', 'bottom'],
            dflt: 'auto'
        }
    };

    legend.supplyDefaults = function(layoutIn, layoutOut, fullData){
        var containerIn = layoutIn.legend || {},
            containerOut = layoutOut.legend = {};

        var visibleTraces = 0,
            defaultOrder = 'normal';
        fullData.forEach(function(trace) {
            if(trace.visible &&
                    // eventually this will just exclude 2D and 3D surfaces,
                    // but for now polar and 3d scatter are excluded too
                    Plotly.Plots.isCartesian(trace.type) &&
                    !Plotly.Plots.isHeatmap(trace.type)) {
                visibleTraces++;
            }

            if((Plotly.plots.isBar(trace.type) && layoutOut.barmode==='stack') ||
                    ['tonextx','tonexty'].indexOf(trace.fill)!==-1) {
                defaultOrder = 'reversed';
            }
        });

        function coerce(attr, dflt) {
            return Plotly.Lib.coerce(containerIn, containerOut,
                legend.attributes, attr, dflt);
        }

        var showLegend = Plotly.Lib.coerce(layoutIn, layoutOut,
            Plotly.Plots.layoutAttributes, 'showlegend', visibleTraces > 1);

        if(showLegend) {
            coerce('bgcolor');
            coerce('bordercolor');
            coerce('borderwidth');
            coerce('font', layoutOut.font);
            coerce('traceorder', defaultOrder);
            coerce('x');
            coerce('xanchor');
            coerce('y');
            coerce('yanchor');
        }
    };

    legend.lines = function(d){
        var t = d[0].t,
            isScatter = ['scatter',undefined].indexOf(d[0].t.type)!==-1,
            showFill = isScatter &&
                (t.fill && t.fill!=='none' && $.isNumeric(t.cdcurve)),
            showLine = isScatter &&
                (t.mode && t.mode.indexOf('lines')!==-1);

        var fill = d3.select(this).select('.legendfill').selectAll('path')
            .data(showFill ? [d] : []);
        fill.enter().append('path').classed('js-fill',true);
        fill.exit().remove();
        fill.attr({'data-curve':t.cdcurve, 'd':'M5,0h30v6h-30z'})
            .call(Plotly.Drawing.fillGroupStyle);

        var line = d3.select(this).select('.legendlines').selectAll('path')
            .data(showLine ? [d] : []);
        line.enter().append('path').classed('js-line',true)
            .attr('d','M5,0h30');
        line.exit().remove();
        line.call(Plotly.Drawing.lineGroupStyle);
    };

    legend.points = function(d){
        var t = d[0].t,
            isScatter = ['scatter',undefined].indexOf(t.type)!==-1 && t.mode,
            showMarkers = isScatter && t.mode.indexOf('markers')!==-1,
            showText = isScatter && t.mode.indexOf('text')!==-1;

        // constrain text, markers, etc so they'll fit on the legend
        var dEdit = {tx:'Aa', mo:1};
        if(d[0].ms) { dEdit.ms = 10; } // bubble charts:
        if(d[0].mlw>5) { dEdit.mlw = 5; }
        var dMod = [$.extend({},d[0], dEdit)],
            tMod = $.extend({}, t, {
                ts: 10,
                ms: Math.max(Math.min(t.ms, 16), 2),
                msr: 1,
                msm: 'diameter',
                lw: Math.min(t.lw, 10)
            });

        var ptgroup = d3.select(this).select('g.legendpoints');

        var pts = ptgroup.selectAll('path.scatterpts')
            .data(showMarkers ? dMod : []);
        pts.enter().append('path').classed('scatterpts',true)
            .attr('transform','translate(20,0)');
        pts.exit().remove();
        pts.call(Plotly.Drawing.pointStyle,tMod);

        var txt = ptgroup.selectAll('g.pointtext')
            .data(showText ? dMod : []);
        txt.enter()
            .append('g').classed('pointtext',true)
                .append('text').attr('transform','translate(20,0)');
        txt.exit().remove();
        txt.selectAll('text').call(Plotly.Drawing.textPointStyle,tMod);

    };

    legend.bars = function(d){
        var t = d[0].t,
            barpath = d3.select(this).select('g.legendpoints')
                .selectAll('path.legendbar')
                .data(Plotly.Plots.isBar(t.type) ? [d] : []);
        barpath.enter().append('path').classed('legendbar',true)
            .attr('d','M6,6H-6V-6H6Z')
            .attr('transform','translate(20,0)');
        barpath.exit().remove();
        barpath.each(function(d){
            var w = (d.mlw+1 || t.mlw+1 || (d.t ? d.t.mlw : 0)+1) - 1,
                p = d3.select(this);
            p.style('stroke-width',w+'px')
                .call(Plotly.Drawing.fillColor,
                    d.mc || t.mc || (d.t ? d.t.mc : ''));
            if(w) {
                p.call(Plotly.Drawing.strokeColor,
                    d.mlc || t.mlc || (d.t ? d.t.mlc : ''));
            }
        });
    };

    legend.boxes = function(d){
        var t = d[0].t,
            pts = d3.select(this).select('g.legendpoints')
                .selectAll('path.legendbox')
                .data(t.type==='box' ? [d] : []);
        pts.enter().append('path').classed('legendbox',true)
            // if we want the median bar, prepend M6,0H-6
            .attr('d','M6,6H-6V-6H6Z')
            .attr('transform','translate(20,0)');
        pts.exit().remove();
        pts.each(function(d){
            var w = (d.lw+1 || t.lw+1 || (d.t ? d.t.lw : 0)+1) - 1,
                p = d3.select(this);
            p.style('stroke-width',w+'px')
                .call(Plotly.Drawing.fillColor,
                    d.fc || t.fc || (d.t ? d.t.fc : ''));
            if(w) {
                p.call(Plotly.Drawing.strokeColor,
                    d.lc || t.lc || (d.t ? d.t.lc : ''));
            }
        });
    };

    legend.style = function(s) {
        s.each(function(d){
            var fill = d3.select(this)
                .selectAll('g.legendfill')
                    .data([d]);
            fill.enter().append('g')
                .classed('legendfill',true);

            var line = d3.select(this)
                .selectAll('g.legendlines')
                    .data([d]);
            line.enter().append('g')
                .classed('legendlines',true);

            var symbol = d3.select(this)
                .selectAll('g.legendsymbols')
                    .data([d]);
            symbol.enter().append('g')
                .classed('legendsymbols',true);
            symbol.style('opacity', d[0].t.op);

            symbol.selectAll('g.legendpoints')
                .data([d])
              .enter().append('g')
                .classed('legendpoints',true);
        })
        .each(legend.bars)
        .each(legend.boxes)
        .each(legend.lines)
        .each(legend.points);
    };

    legend.texts = function(context, td, d, i, traces){
        var gf = td.layout.font,
            lf = td.layout.legend.font;
        var curve = d[0].t.curve;
        var name = d[0].t.name;
        var text = d3.select(context).selectAll('text.legendtext')
            .data([0]);
        text.enter().append('text');
        text.attr({
                'class': 'legendtext text-'+curve,
                x: 40,
                y: 0,
            })
            .style({
                'text-anchor': 'start',
                'font-family': lf.family || gf.family || 'Arial',
                'font-size': (lf.size || gf.size || 12)+'px',
                fill: Plotly.Drawing.rgb(lf.color || gf.color || '#444'),
                opacity: Plotly.Drawing.opacity(lf.color || gf.color || '#444')
            })
            .text(name)
            .attr({'data-unformatted': name});

        function textLayout(s){
            Plotly.util.convertToTspans(s, function(){
                if(td.firstRender){
                    legend.repositionLegend(td, traces);
                }
            });
            s.selectAll('tspan.line').attr({x: s.attr('x')});
        }

        if(td.mainsite){
            text.call(Plotly.util.makeEditable)
                .call(textLayout)
                .on('edit', function(text){
                    this.attr({'data-unformatted': text});
                    this.text(text)
                        .call(textLayout);
                    if(this.text() === ''){
                        text = ' \u0020\u0020 ';
                    }
                    var tn = Number(this.attr('class').split('-')[1]),
                        property =
                            Plotly.Lib.nestedProperty(td.data[tn],'name');
                    property.name = text;
                    d[0].t.name = text;
                    Plotly.restyle(td, property.astr, text, tn);
                });
        }
        else{
            text.call(textLayout);
        }
    };

    // -----------------------------------------------------
    // legend drawing
    // -----------------------------------------------------

    legend.draw = function(td,showlegend) {
        var gl=td.layout;

        if(!gl._infolayer || !td.calcdata) { return; }
        if(!gl.legend) { gl.legend={}; }
        var gll = gl.legend;

        var ldata = td.calcdata
            .filter(function(cd) {
                var t = cd[0].t;
                return t.visible!==false &&
                    t.showlegend!==false &&
                    !Plotly.Plots.isHeatmap(t.type);
            })
            .map(function(cd) { return [cd[0]]; });

        if(gll.traceorder==='reversed') { ldata.reverse(); }

        if(showlegend===false || !ldata.length) {
            gl._infolayer.selectAll('.legend').remove();
            Plotly.Plots.autoMargin(td,'legend');
            return;
        }

        gl.showlegend = true;

        if(typeof td.firstRender === 'undefined') td.firstRender = true;
        else if(td.firstRender) td.firstRender = false;

        var legendsvg = gl._infolayer.selectAll('svg.legend')
            .data([0]);
        legendsvg.enter(0).append('svg')
            .attr('class','legend');

        var bordercolor = gll.bordercolor || '#444',
            borderwidth = $.isNumeric(gll.borderwidth) ? gll.borderwidth : 1,
            bgcolor = gll.bgcolor || gl.paper_bgcolor || '#fff';
        if(['left','right','center'].indexOf(gll.xanchor)===-1) {
            gll.xanchor = 'auto';
        }
        if(['top','bottom','middle'].indexOf(gll.yanchor)===-1) {
            gll.yanchor = 'auto';
        }

        var bgRect = legendsvg.selectAll('rect.bg')
            .data([0]);
        bgRect.enter(0).append('rect')
            .attr('class','bg');
        bgRect.style({
            stroke: Plotly.Drawing.rgb(bordercolor),
            'stroke-opacity': Plotly.Drawing.opacity(bordercolor),
            fill: Plotly.Drawing.rgb(bgcolor),
            opacity: Plotly.Drawing.opacity(bgcolor),
            'stroke-width': borderwidth+'px'
        });

        var traces = legendsvg.selectAll('g.traces')
            .data(ldata);
        traces.enter().append('g').attr('class','traces');
        traces.exit().remove();
        traces.call(legend.style)
            .each(function(d, i){ legend.texts(this, td, d, i, traces); });

        legend.repositionLegend(td, traces);

        // user dragging the legend
        // if x/yanchor is 'auto':
        // aligns left/right/center on resize or new text if drag pos
        // is in left 1/3, middle 1/3, right 1/3
        // choose left/center/right align via:
        //  xl=(left-ml)/plotwidth,
        //  xc=(center-ml/plotwidth),
        //  xr=(right-ml)/plotwidth
        //  if(xl<2/3-xc) gll.x=xl;
        //  else if(xr>4/3-xc) gll.x=xr;
        //  else gll.x=xc;
        // similar logic for top/middle/bottom
        if(td.mainsite) {
            legendsvg.node().onmousedown = function(e) {
                // deal with other UI elements, and allow them
                // to cancel dragging
                if(Plotly.Fx.dragClear(td)) { return true; }

                var el3=d3.select(this),
                    x0=Number(el3.attr('x')),
                    y0=Number(el3.attr('y')),
                    xf = null,
                    yf = null;
                td.dragged = false;
                Plotly.Fx.setCursor(el3);

                window.onmousemove = function(e2) {
                    var dx = e2.clientX-e.clientX,
                        dy = e2.clientY-e.clientY,
                        gs = gl._size,
                        lw = Number(el3.attr('width')),
                        lh = Number(el3.attr('height')),
                        MINDRAG = Plotly.Fx.MINDRAG;
                    if(Math.abs(dx)<MINDRAG) { dx=0; }
                    if(Math.abs(dy)<MINDRAG) { dy=0; }
                    if(dx||dy) { td.dragged = true; }
                    el3.call(Plotly.Drawing.setPosition, x0+dx, y0+dy);

                    xf = Plotly.Fx.dragAlign(x0+dx, lw, gs.l, gs.l+gs.w,
                        gll.xanchor);
                    yf = Plotly.Fx.dragAlign(y0+dy+lh, -lh, gs.t+gs.h, gs.t,
                        gll.yanchor);

                    var csr = Plotly.Fx.dragCursors(xf, yf,
                        gll.xanchor, gll.yanchor);
                    Plotly.Fx.setCursor(el3, csr);
                    return Plotly.Lib.pauseEvent(e2);
                };
                window.onmouseup = function(e2) {
                    window.onmousemove = null;
                    window.onmouseup = null;
                    Plotly.Fx.setCursor(el3);
                    if(td.dragged && xf!==null && yf!==null) {
                        Plotly.relayout(td,{'legend.x':xf,'legend.y':yf});
                    }
                    return Plotly.Lib.pauseEvent(e2);
                };
                return Plotly.Lib.pauseEvent(e);
            };
        }
    };

    legend.repositionLegend = function(td, traces){
        var gl = td.layout,
            gs = gl._size,
            gll = gl.legend,
            borderwidth = $.isNumeric(gll.borderwidth) ? gll.borderwidth : 1,

            // add the legend elements, keeping track of the
            // legend size (in px) as we go
            legendwidth=0,
            legendheight=0;

        traces.each(function(d){
            var g = d3.select(this),
                text = g.select('.legendtext'),
                tspans = g.selectAll('.legendtext>tspan'),
                tHeight = (gll.font.size || gl.font.size || 12)*1.3,
                tLines = tspans[0].length||1,
                tWidth = text.node() && Plotly.Drawing.bBox(text.node()).width,
                mathjaxGroup = g.select('g[class*=math-group]'),
                textY, tHeightFull;

            if(d[0].t.showinlegend===false) {
                g.remove();
                return;
            }

            if(mathjaxGroup.node()) {
                var mathjaxBB = Plotly.Drawing.bBox(mathjaxGroup.node());
                tHeight = mathjaxBB.height;
                tWidth = mathjaxBB.width;
                mathjaxGroup.attr('transform','translate(0,'+(tHeight/4)+')');
            }
            else {
                // approximation to height offset to center the font
                // to avoid getBoundingClientRect
                textY = tHeight * (0.3 + (1-tLines)/2);
                text.attr('y',textY);
                tspans.attr('y',textY);
            }

            tHeightFull = Math.max(tHeight*tLines, 16)+3;
            g.attr('transform','translate('+borderwidth+',' +
                (5+borderwidth+legendheight+tHeightFull/2)+')');
            legendheight += tHeightFull;
            legendwidth = Math.max(legendwidth, tWidth||0);
        });
        legendwidth += 45+borderwidth*2;
        legendheight += 10+borderwidth*2;

        // now position the legend. for both x,y the positions are recorded as
        // fractions of the plot area (left, bottom = 0,0). Outside the plot
        // area is allowed but position will be clipped to the page.
        // values <1/3 align the low side at that fraction, 1/3-2/3 align the
        // center at that fraction, >2/3 align the right at that fraction

        // defaults... also check for old style off-edge positioning
        // (+/-100) and convert it to the new format
        // TODO: do this in layout import instead
        if(gll.x>3 || !$.isNumeric(gll.x)) {
            gll.x = 1.02;
            gll.xanchor = 'left';
        }
        else if(gll.x<-2) {
            gll.x = -0.02;
            gll.xanchor = 'right';
        }

        if(!$.isNumeric(gll.y)) {
            gll.y = 1;
            gll.yanchor = 'top';
        }
        else if(gll.y>3) {
            gll.y = 1.02;
            gll.yanchor = 'bottom';
        }
        else if(gll.y<-2) {
            gll.y = -0.02;
            gll.yanchor = 'top';
        }

        var lx = gs.l+gs.w*gll.x,
            ly = gs.t+gs.h*(1-gll.y);

        var xanchor = 'left';
        if(gll.xanchor==='right' || (gll.xanchor==='auto' && gll.x>=2/3)) {
            lx -= legendwidth;
            xanchor = 'right';
        }
        else if(gll.xanchor==='center' || (gll.xanchor==='auto' && gll.x>1/3)) {
            lx -= legendwidth/2;
            xanchor = 'center';
        }

        var yanchor = 'top';
        if(gll.yanchor==='bottom' || (gll.yanchor==='auto' && gll.y<=1/3)) {
            ly -= legendheight;
            yanchor = 'bottom';
        }
        else if(gll.yanchor==='middle' || (gll.yanchor==='auto' && gll.y<2/3)) {
            ly -= legendheight/2;
            yanchor = 'middle';
        }

        // make sure we're only getting full pixels
        legendwidth = Math.ceil(legendwidth);
        legendheight = Math.ceil(legendheight);
        lx = Math.round(lx);
        ly = Math.round(ly);

        gl._infolayer.selectAll('svg.legend')
            .call(Plotly.Drawing.setRect, lx, ly, legendwidth, legendheight);
        gl._infolayer.selectAll('svg.legend .bg')
            .call(Plotly.Drawing.setRect, borderwidth/2, borderwidth/2,
                legendwidth-borderwidth, legendheight-borderwidth);

        // lastly check if the margin auto-expand has changed
        Plotly.Plots.autoMargin(td,'legend',{
            x: gll.x,
            y: gll.y,
            l: legendwidth*({right:1, center:0.5}[xanchor]||0),
            r: legendwidth*({left:1, center:0.5}[xanchor]||0),
            b: legendheight*({top:1, middle:0.5}[yanchor]||0),
            t: legendheight*({bottom:1, middle:0.5}[yanchor]||0)
        });
    };

}()); // end Legend object definition
