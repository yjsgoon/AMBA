/**
 * Created by JiSoo on 2016-09-25.
 */

var root = div().append().size('100%', '100%').color('#4c00e6');

var form = div().appendTo(root).displayBlock().size('300px', '340px').position('relative').margin('auto').top('50%').transform('translate(0%, -50%)').color('#4c00e6');
div().appendTo(form).displayBlock().size('240px', '60px').margin('auto').color('#4c00e6').text('AMBA').fontSize('50px').fontBold()
     .fontColor('white').textAlignCenter().textDragNone().cursorDefault();

div().appendTo(form).displayBlock().size('270px', '20px').margin('auto').marginTop('20px').color('#4c00e6').text('Email').fontSize('15px').fontColor('white').textDragNone().cursorDefault();
var email = div().appendTo(form).displayBlock().size('270px', '30px').margin('auto').marginTop('5px').color('white').borderRadius(5).boxShadow('5px 5px 5px black').text('').editable().fontSize('20px').cursorText();

div().appendTo(form).displayBlock().size('270px', '20px').margin('auto').marginTop('15px').color('#4c00e6').text('Password').fontSize('15px').fontColor('white').textDragNone().cursorDefault();
var password = div().appendTo(form).displayBlock().size('270px', '30px').margin('auto').marginTop('5px').color('white').borderRadius(5).boxShadow('5px 5px 5px black').text('').editable().textPassword().fontSize('20px').cursorText();

div().appendTo(form).displayBlock().size('270px', '40px').margin('auto').marginTop('30px').color('#1a53ff').borderRadius(5).boxShadow('5px 5px 5px black')
    .text('Sign In').textAlignCenter().fontSize('25px').fontColor('white').fontBold().textDragNone().cursorPointer().hover(function (dv) {
    dv.fontColor('black');
},  function (dv) {
    dv.fontColor('white');
}).click( function () {
    $.post("http://soma-amba.herokuapp.com/users/login", { email: email.text(), password: password.text() })
        .done(function (data) {
            if( data.resultCode === 0) {
                alert('signin success');
                localStorage.setItem('aauth', data.aauth);
                localStorage.setItem('ainfo', data.ainfo);
                $(location).attr('href', '/?app=codelist');
            } else
                alert(data.msg);
        });
});

div().appendTo(form).displayBlock().size('50px', '20px').float('right').marginRight('15px').marginTop('10px').textAlignRight().color('#4c00e6').text('Sign Up').fontSize('13px').fontColor('white').fontBold().textDragNone().cursorPointer().hover(function (dv) {
    dv.fontColor('black');
},  function (dv) {
    dv.fontColor('white');
}).click( function () {
    $(location).attr('href', '?app=signup');
});