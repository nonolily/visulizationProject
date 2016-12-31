/**
 * Created by admin on 2016/10/7.
 */

$(function(){
    getAllLabels('getLabels');

    getPlaceList();
});

function getPlaceList(){
    var roadQingyang = ['Shun Cheng Street','Qingjiang East Road','Jinhe Road','Renmin West Road','First Section of West NO.1 Circling Road','East Jinli Road','West Jinli Road','Middle Jinli Road'];
    var roadJinniu = ['North Station West Second Road','Jiulidi Road North','Jiefang Road(section 1)','Simaqiao Street'];
    var roadWuhou = ['Linjiang Road','First Section of West NO.1 Circling Road','Wuhou Avenue','Kehua Road','Forth Section of South NO.1 Circling Road',
        'Third Section of South NO.1 Circling Road','Jinyang Road','Longteng Road','New South Road'];
    var roadJinjiang = ['Middle Binjiang Road','Dacisi Road'];

    var districts = [roadQingyang,roadJinniu,roadWuhou,roadJinjiang];
  //  var str = '';
    for(var i=0;i<4;i++){
        var str = '';
        for(var j=0;j<districts[i].length;j++){
            var roadName = districts[i][j];
            str += '<li><input  value="' + roadName + '" type="checkbox" name="check" id="checkBox' + i + '-' + j+ '"/><label for="checkBox' + i + '-' +j + '">' +
                    roadName + '</label></li>';
        }
        $('#roadList').find('ul').eq(i).html(str);
    }
    $('#roadList').find('div').on('click',function(){
        var obj = $(this);
        if(obj.attr('flag') == 0){
            obj.next().css('display','block');
            obj.attr('flag',1);
        }
        else{
            obj.next().css('display','none');
            obj.attr('flag',0);
        }
    });
    //for(var i=0;i<placeList.length;i++){
    //    str += '<li><input  value=' + placeList[i] + ' type="checkbox" name="check" id="checkBox' + i + '"/><label for="checkBox' + i + '">' +
    //         placeList[i] + '</label></li>';
    //}
    //$('.place_list_box').find('ul').html(str);
}
function showManyCars(){
    $('#carLabelList').css({
        'display':'none'
    });//车牌号列表消失
    $('#car_date').css({
        'display':'block'
    });//显示日期列表
    $("#sidebar_loader")[0].style.display="";//显示loading图片
    var query = {};
    query.label = value;
    $.get('/query/getSpeed', query, function (response) {
        carData = response['data'];
        carDate = response['date'];
        var maxSpeed = response['maxSpeed'];
        $("#sidebar_loader")[0].style.display="none";
        var checkBox = $("#car_date")[0];
        var checkString = "";

        for (var i = 0; i < carDate.length; i++){
            checkString += "<input type='checkbox' onclick=showCarGIS(this.value) id='dateCheck" + i +
                "' value='"+carDate[i]+"'><label for='dateCheck'" + i + ">"+carDate[i]+"</label></br>"; // 显示选中的出租车轨迹示复选框
        }
        checkString += "<input type='checkbox' name='dateCheck' id='dateCheckAll' onclick=showCarGIS(this.value) value='all'>" +
            '<label for="dateCheckAll"> all</label>' + "</br>";
        checkBox.innerHTML = checkString;
        initSpeed(carDate,carData, maxSpeed);
        // init(carDate,carData);
        $('#car_date').find('label').on('click',function(){//checkbox加样式后的点击处理
            var thisInput = $(this).prev();
            if(thisInput.attr('checked') == 'checked'){
                console.log(1);
                thisInput.attr('checked',false);
            }
            else{
                thisInput.attr('checked',true);
            }
            var value = thisInput.val();
            console.log(value);
            showCarGIS(value);
        });
    });
}

function getAllLabels(obj){
    var query = {};
    query.q = 'A';
    var choose = $(obj).html();

    if(choose == 'count'){
        type = 'labelsSortedByCount';
    }
    else if(choose == 'speed') {
        type = 'labelsSortedBySpeed';
    }
    else{
        type = 'complexLab_label';
    }
    query.collectionName = type;
    $.get('/query/getLabels', query, function (name) {
        name = $.trim(name);
        if (name.length>0)
        {
            var array=name.split(',');
            var str = '' ;
            var len = parseInt(array.length/20);//分成20组
            for(var j=0;j<19;j++){//前19组
                var str1 = '';
                for(var i=len*j;i<len*(j+1);i++){
                    str1 += '<li>' + array[i] + '</li>';
                }
                str = str + '<li> <div class="label_type" flag="0"> <span>+</span>part'+ j +'</div> <ul>' + str1 + '</ul></li>';
            }
            var str2 = '';//最后一组
            for(var i=len*19;i<array.length;i++){
                str2 += '<li>' + array[i] + '</li>';
            }
            str = str + '<li><div class="label_type" flag="0"> <span>+</span>part19</div><ul>' + str2 + '</ul></li>'
            $('#carLabelList').html('<ul>'+str+'</ul>');
            $(obj).parent().find('.choose_C_S').removeClass('active');
            $(obj).addClass('active');
        }
        /**
         * 点击折叠与展开
         */
        $('.label_type').on('click', function () {
            var type = $(this);
            if(type.attr('flag')==0){
                type.find('span').html('-');
                type.next().css({
                    'display':'block'
                });
                type.attr('flag',1);
            }
            else{
                type.find('span').html('+');
                type.next().css({
                    'display':'none'
                });
                type.attr('flag',0);
            }
        });
        /**
         * 点击车牌号
         */
        $('.label_type').next().find('li').on('click',function(){
            var value = $(this).text();
            $(this).toggleClass("toggleLabel");

            if($(this).attr('flag')!=1){
                $(this).css({
                    'font-weight':'bold'
                });
                $(this).attr('flag',1);
            }
            else{
                $(this).css({
                    'font-weight':'normal'
                });
                $(this).attr('flag',0);
            }
        });
    });
}