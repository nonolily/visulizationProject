/**
 * 各区之间的流动性
 * @param data
 */
function regionChord(data){
    d3.select(".below_chord ").selectAll('svg').remove();

   var regionName = ["jinNiu", "jinJiang", "qingYang", "wuHou", "chengHua"];
    var flowMatrix = data;//A地有a11来源A，a12来源B，a13来源C…… 每行是以一个地点为统计，列是来源   [i, j]： i：出发点      j：目标点
    var chord_layout = d3.layout.chord()
        .padding(0.03)
        .sortSubgroups(d3.descending)
        .matrix(flowMatrix);//转换数据
            var width = $('.below_chord').get(0).offsetWidth
            , height = $('.below_chord').get(0).offsetHeight
    // var width  = 250;
    // var height = 250;
    var innerRadius = width/2 * 0.6;
    var outerRadius = innerRadius * 1.1;

    var color20 = ['rgba(120, 165, 117, 1)', 
                          'rgba(229,129,173, 1)',
                          'rgba(254, 162, 122, 1)', 
                          'rgba(141, 111, 170, 1)', 
                          'rgba(117, 140, 182, 1)'  ];

    // var color20 = ['rgba(87, 156, 58, 1)',
    //     'rgba(253, 153, 25, 1)',
    //     'rgba(114, 14, 255, 1)',
    //     'rgba(58, 140, 255, 1)',
    //     'rgba(254, 64, 129, 1)'];

    var svg = d3.select(".below_chord").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

    var outer_arc =  d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    var g_outer = svg.append("g");

    g_outer.selectAll("path")
        .data(chord_layout.groups)
        .enter()
        .append("path")
        .style("fill", function(d) { return color20[d.index]; })
        .style("stroke", function(d) { return color20[d.index]; })
        .attr("d", outer_arc );

    g_outer.selectAll("text")
        .data(chord_layout.groups)
        .enter()
        .append("text")
        .each( function(d,i) {
            d.angle = (d.startAngle + d.endAngle) / 2;
            d.name = regionName[i];
        })
        .attr("dy",".35em")
        .attr("transform", function(d){
            return "rotate(" + ( d.angle * 180 / Math.PI ) + ")" +
                "translate(0,"+ -1.0*(outerRadius+10) +")" +
                ( ( d.angle > Math.PI*3/4 && d.angle < Math.PI*5/4 ) ? "rotate(180)" : "");
        })
        .attr('class', 'arch')
        .attr('id', function(d){
            return d.name;
        });
        
    var inner_chord = d3.svg.chord()
        .radius(innerRadius);

    svg.append("g")
        .attr("class", "chord")
        .selectAll("path")
        .data(chord_layout.chords)
        .enter()
        .append("path")
        .attr("d", inner_chord )
        .style("fill", function(d) { return color20[d.source.index]; })
        .style("opacity", 0.5)
        .on("mouseover",function(d,i){
            d3.select(this)
                .style("fill","yellow");
        })
        .on("mouseout",function(d,i) {
            d3.select(this)
                .transition()
                .duration(1000)
                .style("fill",color20[d.source.index]);
        });
}
function getRegionData(query){
    $.get('/query/districtData', query, function (response) {
        var matrix = response.flowMatrix.weekend;
        for(var i=0;i<5;i++){
            for(var j=0;j<5;j++){
                if(matrix[i][j]==null){
                    matrix[i][j]=0;
                }
            }
        }
        regionChord(matrix);
    });
}