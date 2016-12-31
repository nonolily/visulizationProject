 var array = new Array();
function ttt()
    {
        var test = $("#KProvince").val();
        test = $.trim(test);
        if (test.length>0)
        {
            var query = {};
            query.q = test;
            $.get('/query/gethint', query, function (name) {
                name = $.trim(name);              
                if (name.length>0)
                    {
                        array=name.split(',');
                        positionDiv();
                        document.getElementById("search_suggest").innerHTML="";
                        for(var i=0;i<array.length;i++)
                        {
                            if(array[i]!="")//项值不为空，组合DIV，每个DIV有onmouseover、onmouseout、onclick对应事件
                            {
                                document.getElementById("search_suggest").innerHTML+="<div id='item" + i + "' class='itemBg' onmouseover='beMouseOver(" + i +")' onmouseout='beMouseOut(" + i + ")' onclick='beClick(" + i + ")'>" + array[i] + "</div>";

                                //$("#search_suggest").html="<div id='item" + i + "' class='itemBg' onmouseover='beMouseOver(" + i +")' onmouseout='beMouseOut(" + i + ")' onclick='beClick(" + i + ")'>" + array[i] + "</div>";
                            }
                        }
                        //  最后一个DIV显示 关闭 效果 onclick方法
                        document.getElementById("search_suggest").innerHTML+="<div class='item_button' onclick='hiddenDiv();'><font color='#666666'>关闭</font></div>";
                        //$("#search_suggest").html="<div class='item_button' onclick='hiddenDiv();'><font color='#666666'>关闭</font></div>";
                         document.getElementById("search_suggest").style.display="inline";
                        //$("#search_suggest").css("display")="inline";
                    } // end of if (name.length>0)
                    else
                    {
                        document.getElementById("search_suggest").style.display="none";
                        //$("#search_suggest").css("display")="none";
                    }
            })
            // $.ajax({
            //     type: "get",
            //     url: "gethint",
            //     data: "Method_Name=test&q="+test,
            //     success:function(name){
            //     name = $.trim(name);              
            //     if (name.length>0)
            //         {
            //             array=name.split(',');
            //             positionDiv();
            //             document.getElementById("search_suggest").innerHTML="";
            //             for(var i=0;i<array.length;i++)
            //             {
            //                 if(array[i]!="")//项值不为空，组合DIV，每个DIV有onmouseover、onmouseout、onclick对应事件
            //                 {
            //                     document.getElementById("search_suggest").innerHTML+="<div id='item" + i + "' class='itemBg' onmouseover='beMouseOver(" + i +")' onmouseout='beMouseOut(" + i + ")' onclick='beClick(" + i + ")'>" + array[i] + "</div>";

            //                     //$("#search_suggest").html="<div id='item" + i + "' class='itemBg' onmouseover='beMouseOver(" + i +")' onmouseout='beMouseOut(" + i + ")' onclick='beClick(" + i + ")'>" + array[i] + "</div>";
            //                 }
            //             }
            //             //  最后一个DIV显示 关闭 效果 onclick方法
            //             document.getElementById("search_suggest").innerHTML+="<div class='item_button' onclick='hiddenDiv();'><font color='#666666'>关闭</font></div>";
            //             //$("#search_suggest").html="<div class='item_button' onclick='hiddenDiv();'><font color='#666666'>关闭</font></div>";
            //              document.getElementById("search_suggest").style.display="inline";
            //             //$("#search_suggest").css("display")="inline";
            //         } // end of if (name.length>0)
            //         else
            //         {
            //             document.getElementById("search_suggest").style.display="none";
            //             //$("#search_suggest").css("display")="none";
            //         }
            //     } // end of success
            // }); 
        } // end of if (test.length>0)
    }
        //定位DIV显示
function positionDiv()
        {
              var DivRef= document.getElementById("search_suggest");
              DivRef.style.position = "absolute";
              var t=document.getElementById("KProvince");
              DivRef.style.top= getAbsolutePos(t).y;//相对文本框的TOP高度，方法见下面
              DivRef.style.left= getAbsolutePos(t).x ;//相对文本框的LEFT宽度
              DivRef.style.height=array.length * 20;//DIV的高度等于每行20个象素乘行数（也就是数组的长度，体现全局数组的作用，不然要传入数组长度的参数）
        }
//实现最后一个DIV 关闭 onclick方法
function hiddenDiv()
        {
            document.getElementById("search_suggest").style.display="none";
            //$("#search_suggest").css("display")="none";
        }
//定位方法，不做解释
function getAbsolutePos(el)
        {
            var SL = 0, ST = 6;
            var is_div = /^div$/i.test(el.tagName);
            if (is_div && el.scrollLeft) SL = el.scrollLeft;
            if (is_div && el.scrollTop) ST = el.scrollTop;
            var r = { x: el.offsetLeft - SL, y: el.offsetTop - ST };
            if (el.offsetParent)
            {
                var tmp = this.getAbsolutePos(el.offsetParent);
                r.x += tmp.x;
                r.y += tmp.y;
            }
            return r;
        }
        //函数鼠标经过效果        
        function beMouseOverEFF(i)
        {
            if ((i>=0)&(i<=array.length-1))
            {
                document.getElementById("item" + i).className="item_high";
            }
        }

        //函数鼠标移开效果
        function beMouseOutEFF(i)
        {
            if ((i>=0)&(i<=array.length-1))
            {
                document.getElementById("item" + i).className="item_normal";
            }
        }

        //函数鼠标经过
        function beMouseOver(i)
        {
            document.getElementById("KProvince").focus();
            var zz=i;
            beMouseOutEFF(zz);
            beMouseOverEFF(zz);
        }

        //函数鼠标移开
        function beMouseOut(i)
        {
            beMouseOutEFF(i);
        }
        //函数单击
        function beClick(i)
        {
            document.getElementById("KProvince").value=array[i];
            document.getElementById("search_suggest").style.display="none";
            //$("#search_suggest").css("display")="none";
            document.getElementById("KProvince").focus();
        }
