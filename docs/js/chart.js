(function(){"use strict";const BAR_WIDTH_RATIO=.45;const BAR_CHART_PADDING_RATIO=BAR_WIDTH_RATIO*1.25;const Y_LINE_WIDTH=2;const F_LINE_WIDTH=1;const AXIS_WIDTH=1;const IMPLEMENTATIONS=["baseline","new"];const COLORS={baseline:{figure:"hsl(28,90%,61%)",text:"hsl(28,90%,49%)",expansions:{el:"hsl(28,90%,61%)",hb:"hsl(28,90%,31%)"}},new:{figure:"hsl(213,90%,61%)",text:"hsl(213,90%,49%)",expansions:{el:"hsl(213,90%,61%)",hb:"hsl(213,90%,31%)"}},factors:{up:{stroke:"hsl(117,80%,78%)",fill:"hsl(117,100%,93%)",text:"hsl(117,48%,41%)"},down:{stroke:"hsl(0,100%,92%)",fill:"hsl(0,100%,97%)",text:"hsl(0,73%,60%)"}},axis:"#282828",bg:"#fff"};const UNITS={k:1e3,M:1e3**2,x:1};const SCALES_OPTIONS={x:{time:false},y:{distr:1,range:(u,min,max)=>uPlot.rangeNum(0,max,u.scales.y.paddingTopRatio,true),paddingTopRatio:.02,unit:{label:"kB",fractionDigits:{axis:{max:2},legend:3}}},f:{range:[0,2],upDownKeys:["down","up"],unit:{label:"x",fractionDigits:{axis:1,legend:5}}}};const AXIS_OPTIONS={font:"12px Chart-Normal",labelFont:"13px Chart-Normal",grid:{stroke:COLORS.axis,width:AXIS_WIDTH},ticks:{stroke:COLORS.axis,width:AXIS_WIDTH,size:5},stroke:COLORS.axis,gap:3};const X_AXIS_OPTIONS={...AXIS_OPTIONS,label:"Hash Size",size:24,labelSize:14,splits:(u,axisIdx,scaleMin,scaleMax,foundIncr,foundSpace,forceMin)=>{scaleMin=Math.ceil(scaleMin);scaleMax=Math.floor(scaleMax);foundIncr=Math.ceil(foundIncr);const splits=[];for(let v=scaleMin;v<=scaleMax;v+=foundIncr)splits.push(v);return splits}};const Y_AXIS_OPTIONS={...AXIS_OPTIONS,label:"Memory Usage (kB)",size:33,labelSize:22,values:(u,splits,axisIdx,foundSpace,foundIncr)=>{return splits.map(v=>v&&unitize(u.scales.y.unit,"axis",v))}};const F_AXIS_SPLITS=[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2];const F_AXIS_VALUES=F_AXIS_SPLITS.map((v,i)=>i%2===0?unitize(SCALES_OPTIONS.f.unit,"axis",v):"");const F_AXIS_OPTIONS={...AXIS_OPTIONS,label:"Factor (New/Baseline)",size:33,labelSize:20,scale:"f",side:1,splits:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2],values:(u,splits,axisIdx,foundSpace,foundIncr)=>F_AXIS_VALUES};const F_SERIES_OPTIONS=["up","down"].map(key=>{return{label:`Factor (${key})`,scale:"f",width:F_LINE_WIDTH,alpha:1}});const X_SERIES_OPTIONS={label:"Hash Size"};const Y_SERIES_OPTIONS=IMPLEMENTATIONS.map(impl=>{return{stroke:COLORS[impl].figure,width:Y_LINE_WIDTH,points:{show:false},alpha:1}});const FACTOR_AREA_PLUGIN={opts:(u,options)=>{for(let i=1;i<=2;i++){const s=options.series[i];const colors=COLORS.factors[options.scales.f.upDownKeys[i-1]];s.points={show:false};s.paths=drawFactorArea;s.stroke=colors.stroke;s.fill=colors.fill}}};const AXES_WITHOUT_GRID_PLUGIN={opts:(u,options)=>{options.axes.forEach(axis=>axis.grid.show=false)},hooks:{drawAxes:drawAxes}};const CURSOR_PLUGIN={opts:(u,options)=>{options.cursor.show=true;options.cursor.x=false;options.cursor.y=true},hooks:{init:cursorInit,setCursor:cursorSetCursor}};const EXPANSION_POINTS_PLUGIN={opts:(u,options)=>{const points={show:drawExpansionPoints};options.series[3].points=options.series[4].points=points}};const BAR_CHART_PLUGIN={opts:(u,options)=>{const points={show:drawBarChartTexts};options.axes[0].values=(()=>u.data[options.series.length]);for(let i=1;i<options.series.length;++i){const s=options.series[i];s.width=0;s.fill=s.stroke;s.paths=drawBarChartBars;s.points=points}},hooks:{init:barChartInit}};const MEMORY_USAGE_CHART_OPTIONS={class:"line",width:550,height:270,cursor:{points:{show:false},drag:{x:true}},gutters:{y:12},legend:{show:false},scales:SCALES_OPTIONS,axes:[X_AXIS_OPTIONS,Y_AXIS_OPTIONS,F_AXIS_OPTIONS],series:[X_SERIES_OPTIONS,...F_SERIES_OPTIONS,...Y_SERIES_OPTIONS],plugins:[CURSOR_PLUGIN,AXES_WITHOUT_GRID_PLUGIN,FACTOR_AREA_PLUGIN,EXPANSION_POINTS_PLUGIN]};const PERFORMANCE_LINEAR_SCALE_LINE_CHART_OPTIONS=(()=>{const opts=uPlot.assign({},MEMORY_USAGE_CHART_OPTIONS);opts.scales.f.upDownKeys.reverse();opts.scales.y.unit.label="M i/s";opts.scales.y.unit.fractionDigits.legend=5;opts.axes[1].label="Performance (M i/s)";opts.plugins.pop();return opts})();const PERFORMANCE_LOG_SCALE_LINE_CHART_OPTIONS=(()=>{const opts=uPlot.assign({},PERFORMANCE_LINEAR_SCALE_LINE_CHART_OPTIONS);opts.scales.y.distr=3;opts.scales.y.range=null;return opts})();const BAR_CHART_OPTIONS={class:"bar",width:600,height:270,cursor:{show:false},select:{show:false},gutters:{x:0,y:12},legend:{show:false},scales:{x:{time:false,range:u=>[1-BAR_CHART_PADDING_RATIO,u.data[0].length+BAR_CHART_PADDING_RATIO]},y:uPlot.assign({},PERFORMANCE_LINEAR_SCALE_LINE_CHART_OPTIONS.scales.y,{paddingTopRatio:.1}),f:PERFORMANCE_LINEAR_SCALE_LINE_CHART_OPTIONS.scales.f},axes:[{...X_AXIS_OPTIONS,size:18,ticks:{show:false},gap:5},{...PERFORMANCE_LINEAR_SCALE_LINE_CHART_OPTIONS.axes[1],splits:(u,axisIdx,scaleMin,scaleMax,foundIncr,foundSpace,forceMin)=>{const splits=[];foundIncr=Math.max(foundIncr,1e5);for(let v=scaleMin;v<=scaleMax;v+=foundIncr)splits.push(v);return splits}}],series:[X_SERIES_OPTIONS,...Y_SERIES_OPTIONS],plugins:[BAR_CHART_PLUGIN,AXES_WITHOUT_GRID_PLUGIN]};const CHART_FUNCTIONS={"memory-usage":(mode,cb)=>{drawLineChart("memory-usage",null,mode,MEMORY_USAGE_CHART_OPTIONS,cb)},"performance-c-get":(mode,cb)=>{drawLineChart("performance","c-get",mode,PERFORMANCE_LINEAR_SCALE_LINE_CHART_OPTIONS,cb)},"performance-c-set":drawPeformanceCSetChart,"performance-c-each":(mode,cb)=>{drawLineChart("performance","c-each",mode,PERFORMANCE_LOG_SCALE_LINE_CHART_OPTIONS,cb)},"performance-c-set":drawPeformanceCSetChart,"performance-ruby-set":(mode,cb)=>{drawBarChart("ruby-set",mode,cb)},"performance-ruby-get":(mode,cb)=>{drawBarChart("ruby-get",mode,cb)},"performance-ruby-each":(mode,cb)=>{drawBarChart("ruby-each",mode,cb)},"performance-ruby-delete":(mode,cb)=>{drawBarChart("ruby-delete",mode,cb)},"performance-ruby-shift":(mode,cb)=>{drawBarChart("ruby-shift",mode,cb)},"performance-ruby-dup":(mode,cb)=>{drawBarChart("ruby-dup",mode,cb)}};const EXPANSIONS={baseline:{el:{1:true,5:true,10:true,17:true,26:true,37:true,51:true,68:true,89:true,115:true,147:true,186:true,233:true,290:true,359:true,442:true},hb:{17:true,25:true,49:true,97:true,193:true,385:true}},new:{el:{1:true,5:true,11:true,17:true,26:true,37:true,50:true,65:true,83:true,105:true,131:true,163:true,201:true,247:true,302:true,368:true,447:true},hb:{17:true,25:true,49:true,97:true,193:true,385:true}}};function joinWithoutNull(ary,separator){return ary.filter(el=>el!=null).join(separator)}function cds(num,{fractionDigits:fractionDigits={}}){let min,max;if(typeof fractionDigits==="number"){min=max=fractionDigits}else{({min:min,max:max}=fractionDigits)}return num.toLocaleString(undefined,{minimumFractionDigits:min,maximumFractionDigits:max})}function unitize(unit,type,v){const opts={fractionDigits:unit.fractionDigits[type]};return cds(v/UNITS[unit.label[0]],opts)}function factor(bl,nw){return bl===nw?1:nw/bl}function uPlotContainers(id){return document.querySelectorAll(`#${id} > .chart-item > .chart`)}function drawFactorArea(u,seriesIdx,minIdx,maxIdx){function valToPos(val,scale){return Math.round(u.valToPos(val,scale,true))}const{0:xs,[seriesIdx]:fs}=u.data;const f1=valToPos(1,"f");const stroke=new Path2D;stroke.moveTo(valToPos(xs[minIdx],"x"),f1);for(let idx=minIdx;idx<=maxIdx;idx++){stroke.lineTo(valToPos(xs[idx],"x"),valToPos(fs[idx],"f"))}stroke.lineTo(valToPos(xs[maxIdx],"x"),f1);const clip=new Path2D;const hzOffset=AXIS_WIDTH;clip.rect(u.bbox.left+AXIS_WIDTH,seriesIdx===1?u.bbox.top:f1,u.bbox.width-AXIS_WIDTH*3,u.bbox.height/2);return{stroke:stroke,fill:stroke,clip:clip}}function drawAxes(u){function drawGridLine(ctx,grid,x1,y1,x2,y2){ctx.strokeStyle=grid.stroke;ctx.lineWidth=grid.width*devicePixelRatio;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}const[b,xAxis,yAxis,fAxis]=[u.bbox,...u.axes];const xAxisY=xAxis._pos*devicePixelRatio;const yAxisX=b.left;const fAxisX=b.left+b.width;drawGridLine(u.ctx,xAxis.grid,yAxisX,xAxisY,fAxisX,xAxisY);drawGridLine(u.ctx,yAxis.grid,yAxisX,xAxisY,yAxisX,b.top);fAxis&&drawGridLine(u.ctx,fAxis.grid,fAxisX,xAxisY,fAxisX,b.top)}function drawExpansionPoints(u,seriesIdx,minIdx,maxIdx){function drawEl(impl,ctx,cx,cy,size,lineWidth,fill){ctx.beginPath();ctx.arc(cx,cy,(size-lineWidth)/2,0,Math.PI*2);if(fill){ctx.fillStyle=COLORS.bg;ctx.fill()}ctx.strokeStyle=COLORS[impl].expansions.el;ctx.stroke()}function drawHb(impl,ctx,cx,cy,size){ctx.beginPath();ctx.arc(cx,cy,size/2,0,Math.PI*2);ctx.fillStyle=COLORS[impl].expansions.hb;ctx.fill()}if(maxIdx-minIdx>200)return;const{width:width,scale:scale,alpha:alpha}=u.series[seriesIdx];const size=(3+width*2)*devicePixelRatio;const lineWidth=size*.2;const impl=IMPLEMENTATIONS[seriesIdx-3];const hashSizes=u.data[0];u.ctx.lineWidth=lineWidth;u.ctx.globalAlpha=alpha;for(let idx=minIdx;idx<=maxIdx;idx++){const el=EXPANSIONS[impl].el[hashSizes[idx]];const hb=EXPANSIONS[impl].hb[hashSizes[idx]];if(!el&&!hb)continue;const cx=Math.round(u.valToPos(u.data[0][idx],"x",true));const cy=Math.round(u.valToPos(u.data[seriesIdx][idx],scale,true));if(hb)drawHb(impl,u.ctx,cx,cy,size);if(el)drawEl(impl,u.ctx,cx,cy,size,lineWidth,!hb)}u.ctx.globalAlpha=1}function cursorInit(u,options,data){function initLine(u){const el=u.cursor.els.x=document.createElement("div");el.classList.add("u-cursor-x");u.root.querySelector(".u-over").appendChild(el)}function initLegend(u){const els=u.cursor.els.legend={expansions:{}};const legendEl=u.root.parentNode.parentNode.lastChild;const groupEl=legendEl.lastChild.firstChild;const valueEls=Array.from(groupEl.getElementsByClassName("legend-value"));valueEls.unshift(valueEls.pop());els.header=legendEl.firstChild;els.values=valueEls;for(let impl of IMPLEMENTATIONS){const css=`.${impl} > .legend-expansions > div`;const{0:el,1:hb}=groupEl.querySelectorAll(css);els.expansions[impl]={el:el,hb:hb}}}u.cursor.els={};initLine(u);initLegend(u)}function cursorSetCursor(u){function disableLine(u){u.cursor.els.x.classList.add("u-off")}function disableLegend(u){const els=u.cursor.els.legend;els.header.textContent=`${u.axes[0].label}: --`;els.values[0].classList.remove("up","down");for(let el of els.values)el.textContent="--";for(let nodes of Object.values(els.expansions)){for(let node of Object.values(nodes)){if(node!=null)node.classList.add("off")}}}function updateLine(u,idx){const el=u.cursor.els.x;const pos=Math.floor(u.valToPos(u.data[0][idx],"x"));el.style.transform="translateX("+pos+"px)";el.classList.remove("u-off")}function updateLegend(u,idx){const els=u.cursor.els.legend;els.header.textContent=`${u.axes[0].label}: ${u.data[0][idx]}`;els.values.forEach((node,i)=>{const unit=u.scales[u.series[i+2].scale].unit;node.textContent=unitize(unit,"legend",u.data[i+2][idx])});const fVal=u.data[2][idx];const fCl=els.values[0].classList;fCl.remove("up","down");if(fVal!==1)fCl.add(u.scales.f.upDownKeys[1<fVal?0:1]);for(let impl in els.expansions){for(let[key,node]of Object.entries(els.expansions[impl])){if(node==null)continue;const m=EXPANSIONS[impl][key][u.data[0][idx]]?"remove":"add";node.classList[m]("off")}}}const{idx:idx}=u.cursor;if(u.cursor.prevIdx===idx)return;if((u.cursor.prevIdx=idx)==null){disableLine(u,idx);disableLegend(u,idx)}else{updateLine(u,idx);updateLegend(u,idx)}}function barChartInit(u,options,data){u.barWidth=u.bbox.width/(BAR_CHART_PADDING_RATIO*2+data[0].length-1)*BAR_WIDTH_RATIO;u.barTextFontSize=13*devicePixelRatio;u.barTextFont=`${u.barTextFontSize}px Chart-Normal`}function drawBarChartThings(u,seriesIdx,minIdx,maxIdx,draw){const xs=u.data[0];const ys=u.data[seriesIdx];const offset=(seriesIdx-1)*u.barWidth;for(let i=minIdx;i<=maxIdx;++i){const x=Math.round(u.valToPos(xs[i],"x",true));const y=Math.round(u.valToPos(ys[i],"y",true));draw(i,x,y,offset)}}function drawBarChartBars(u,seriesIdx,minIdx,maxIdx){const y0=Math.round(u.valToPos(0,"y",true));const fill=new Path2D;drawBarChartThings(u,seriesIdx,minIdx,maxIdx,(i,x,y,offset)=>{fill.rect(x-u.barWidth+offset,y,u.barWidth,y0-y-AXIS_WIDTH)});return{fill:fill}}function drawBarChartTexts(u,seriesIdx,minIdx,maxIdx){u.ctx.textAlign="center";u.ctx.textBaseline="bottom";u.ctx.font=u.barTextFont;u.ctx.fillStyle=COLORS[IMPLEMENTATIONS[seriesIdx-1]].text;drawBarChartThings(u,seriesIdx,minIdx,maxIdx,(i,x,y,offset)=>{const v=unitize(u.scales.y.unit,"legend",u.data[seriesIdx][i]);u.ctx.fillText(v,x+offset-u.barWidth/2,y)});if(seriesIdx===2){drawBarChartThings(u,seriesIdx,minIdx,maxIdx,(i,x,y,offset)=>{const[bl,nw]=[u.data[1][i],u.data[2][i]];const scale=u.scales.f;const v=unitize(scale.unit,"legend",factor(bl,nw))+scale.unit.label;u.ctx.fillStyle=COLORS.factors[scale.upDownKeys[bl<nw?0:1]].text;u.ctx.fillText(v,x+offset-u.barWidth/2,y-u.barTextFontSize*1.05)})}}function lineChartData(data){const factors=new Array(data[0].length);const{1:bl,2:nw}=data;for(let i=0;i<factors.length;i++)factors[i]=factor(bl[i],nw[i]);data.splice(1,0,factors,factors);return data}function barChartData(data){data[data.length]=data[0];data[0]=data[0].map((v,i)=>i+1);return data}function plot(category,feature,options,data,cb){const id="chart-"+joinWithoutNull([category,feature],"-");for(let el of uPlotContainers(id)){if(el.firstChild!=null)continue;cb(new uPlot(options,data,el));break}}function drawChart(category,feature,mode,cb){const dataPath="/mruby-hash-benchmark/"+joinWithoutNull([category,feature,`${mode}.json`],"/");fetch(dataPath,{cache:"no-cache"}).then(res=>res.json()).then(data=>cb(data))}function drawLineChart(category,feature,mode,options,cb){drawChart(category,feature,mode,data=>{const opts=uPlot.assign({},options);opts.cursor.sync={key:joinWithoutNull([category,feature],"-")};plot(category,feature,opts,lineChartData(data),cb)})}function drawPeformanceCSetChart(mode,cb){drawChart("performance","c-set",mode,eachData=>{const xs=eachData[0];const totalData=[xs,new Array(xs.length),new Array(xs.length)];const sums=[0,0];for(let seriesIdx=1;seriesIdx<=2;seriesIdx++){for(let idx=0;idx<xs.length;idx++){const sum=sums[seriesIdx-1]+=1/eachData[seriesIdx][idx];totalData[seriesIdx][idx]=1/sum}}const eachOpts=uPlot.assign({},PERFORMANCE_LOG_SCALE_LINE_CHART_OPTIONS);eachOpts.cursor.sync={key:"performance-c-set"};eachOpts.plugins.push(EXPANSION_POINTS_PLUGIN);const totalOpts=uPlot.assign({},eachOpts);eachOpts.axes[1].label="Each "+eachOpts.axes[1].label;totalOpts.axes[1].label="Total "+totalOpts.axes[1].label;plot("performance","c-set",eachOpts,lineChartData(eachData),cb);plot("performance","c-set",totalOpts,lineChartData(totalData),cb)})}function drawBarChart(feature,mode,cb){drawChart("performance",feature,mode,data=>{plot("performance",feature,BAR_CHART_OPTIONS,barChartData(data),cb)})}function modesOnClick(evt){function syncAlpha(u,uPlotIdx,activeModeEl){if(activeModeEl==null)return;if(u.root.classList.contains("bar"))return;let redraw=false;for(let seriesIdx=1;seriesIdx<=4;seriesIdx++){const alpha=activeModeEl.uPlots[uPlotIdx].series[seriesIdx].alpha;if(u.series[seriesIdx].alpha===alpha)continue;u.series[seriesIdx].alpha=alpha;redraw=true}if(redraw)u.redraw()}const[modesEl,currentModeEl]=[this,evt.target];const activeModeEl=modesEl.getElementsByClassName("active")[0];if(activeModeEl!=null){activeModeEl.classList.remove("active");activeModeEl.uPlots.forEach(u=>u.root.parentNode.removeChild(u.root))}currentModeEl.classList.add("active");if(currentModeEl.uPlots==null){const key=modesEl.parentNode.id.replace(/^chart-/,"");const uPlots=currentModeEl.uPlots=[];CHART_FUNCTIONS[key](currentModeEl.dataset.mode,u=>{uPlots.push(u);syncAlpha(u,uPlots.length-1,activeModeEl)})}else{const chartEls=uPlotContainers(modesEl.parentNode.id);currentModeEl.uPlots.forEach((u,i)=>{chartEls[i].appendChild(u.root);syncAlpha(u,i,activeModeEl)})}}function legendItemsOnClick(evt){const itemsEl=this;const currentItemEl=evt.target.closest(".legend-item");const lineChartEl=itemsEl.closest(".line-chart");const i=Array.prototype.indexOf.call(itemsEl.childNodes,currentItemEl);const uPlots=lineChartEl.querySelector(".modes > .active").uPlots;for(let u of uPlots){const series=i<2?u.series.slice(i+3,i+4):u.series.slice(1,3);for(let s of series)s.alpha=s.alpha^1;u.redraw()}currentItemEl.classList.toggle("hidden")}window.addEventListener("DOMContentLoaded",evt=>{for(let el of document.getElementsByClassName("modes")){el.addEventListener("click",modesOnClick);el.firstChild.click()}const css=".line-chart .legend-items:first-child";for(let el of document.querySelectorAll(css)){el.addEventListener("click",legendItemsOnClick)}})})();
