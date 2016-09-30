$(document).ready(function () {

    // initialize variables
    var basicColor = '#11bb55';
    var username = "yeongjinoh";
    // var editFlag = false;
    var currentBlock, currentId, title, description, date, code, saveButton;

    var parent = div().append().size('100%', '100%');
    var sidebar = div().appendTo(parent).size('5%', '100%');
    var codelist = div().appendTo(parent).size('25%', '100%').border(1);
    var codeWrapper = div().appendTo(parent).size('65%', '100%').padding(20);

    // design sidebar

    var addZeroIfNeeded = function (num) {
        num = parseInt(num);
        return num < 10 ? '0' + num : num;
    };

    var getCurrentDate = function () {
        var date = new Date();
        var m_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var curr_date = addZeroIfNeeded(date.getDate());
        var curr_month = date.getMonth();
        var curr_year = date.getFullYear();
        var curr_hour = date.getHours();
        var curr_min = addZeroIfNeeded(date.getMinutes());
        var curr_sec = addZeroIfNeeded(date.getSeconds());
        return (curr_date + "-" + m_names[curr_month]
        + "-" + curr_year + "  " + curr_hour + ":" + curr_min + ":" + curr_sec);
    }


    // define code factory
    var codeFactory = {
        get: function (id, next) {
            $.get("/codes/code/get", {username: username, id: id})
                .done(next);
        },
        update: function (obj) {
            $.post("/codes/code/update", {
                username: username,
                id: 3,
                title: title.text(),
                date: curDate,
                desc: description.text(),
                code: code.text()
            })
                .done(function () {
                    alert("save successfully!");
                });
        }
    };


    // define index manager
    var IdManager = function () {

        var index = [];
        this.getIndex = function (fn) {
            $.get("/codes/index/get", {username: username})
                .done(function (data) {
                    index = data['index[]'];
                    if (typeof index == "string")
                        index = [index];
                })
                .done(function () {
                    if (typeof fn === "function")
                        fn(index);
                });
        };

        this.updateIndex = function () {
            $.post("/codes/index/update", {username: username, index: index})
        };

        this.getNextIndex = function () {
            if (index.length === 0)
                return 1;
            return Number(index[index.length - 1]) + 1;
        };

        this.pushIndex = function (idx) {
            index.push(idx);
            // this.updateIndex();
        };
    };

    // initialize id manager, block manager
    var idManager = new IdManager();

    // codelist에 새로운 block을 추가하고, 이를 리턴하는 함수
    var newBlock = function (id) {
        var blockWrapper = div().appendTo(listWrapper).padding(10).size('100%', '100px').borderOption('1px solid', 'bottom').borderOption('rgb(200,200,200)', 'color').color('#fafafa');
        var removeButton = div().appendTo(blockWrapper).size(10, 15).text('X').fontColor('gray').float('right').marginRight(20).cursorPointer();
        var onRemove = function () {
            clicked += 1;
            if (clicked > 1) {
                blockWrapper.remove();
                title.text('').editable(false);
                description.text('').editable(false);
                date.text('');
                code.text('').editable(false);
                saveButton.visibility('hidden');
            } else {
                removeButton.color('orange');
            }
        };
        removeButton.click(onRemove);

        var clicked = 0;
        var block = {
            title: div().appendTo(blockWrapper).size('100%', '30px').text('Title').fontSize(20).fontColor('#333333').fontBold(),
            date: div().appendTo(blockWrapper).size('100%', '15px').text(getCurrentDate()).fontSize(12).fontColor('gray'),
            description: div().appendTo(blockWrapper).size('100%', '35px').text('description').fontSize(16).fontColor('gray'),
            code: "code"
        };

        var onHover = function () {
            blockWrapper.color(basicColor);
            block.title.fontColor('white');
            block.date.fontColor('white');
            block.description.fontColor('white');
        };
        var offHover = function () {
            blockWrapper.color('#fafafa');
            block.title.fontColor('#333333');
            block.date.fontColor('gray');
            block.description.fontColor('gray');
            removeButton.color('inherit');
            clicked = 0;
        };
        var onClick = function () {
            title.editable(true).text(block.title.text());
            description.editable(true).css('outline', 'none').text(block.description.text());
            date.text(block.date.text());
            code.editable(true).text(block.code);
            saveButton.visibility('visible');
            currentBlock = block;
            currentId = id;
        }
        blockWrapper.hover(onHover, offHover).click(onClick);

        return block;
    };


    var onAdd = function () {
        var id = idManager.getNextIndex();
        var block = newBlock(id);
        idManager.pushIndex(id);
        saveBlock(id, block);
    };

    var addButton = div().appendTo(sidebar).size(30, 30).margin(15).marginTop(40).text('+').fontBold().fontSize(28).fontColor('green').border(1).borderColor(basicColor).borderOption('100%', 'radius')
        .textAlign('center').verticalAlign('middle').click(onAdd).cursorPointer();

    var saveBlock = function (id, block) {

        $.post("/codes/code/update", {
            username: username,
            id: id,
            title: block.title.text(),
            date: block.date.text(),
            desc: block.description.text(),
            code: block.code
        })
            .done(function () {
                idManager.updateIndex();
            });
    };

    var onSave = function () {
        currentBlock.title.text(title.text());
        currentBlock.description.text(description.text());
        currentBlock.code = code.text();
        var curDate = getCurrentDate();
        currentBlock.date.text(curDate);
        date.text(curDate);

        saveBlock(currentId, currentBlock);
    };


    // initialize codelist
    var getBlock = function (id) {
        $.get("/codes/code/get", {username: username, id: id})
            .done(function (data) {
                var block = newBlock(id);
                block.title.text(data.title);
                block.date.text(data.date);
                block.description.text(data.desc);
                block.code = data.code;
            });
    };
    var getAllBlocks = function (index) {
        for (var i = 0; i < index.length; i++) {
            getBlock(Number(index[i]));
        }
    };
    idManager.getIndex(getAllBlocks);


    // design codelist
    var listHeader = div().appendTo(codelist).size('100%', '120px').color('#dddddd');
    var listHeaderTitle = div().appendTo(listHeader).size('100%', '40px').marginTop(20).text('Code List').fontSize(28).textAlignCenter();
    var listName = div().appendTo(listHeader).size('100%', '50px').marginTop(20).text('javascript').fontSize(20).fontColor('gray').textAlignCenter();
    var listWrapper = div().appendTo(codelist).size('100%', codelist.heightPixel() - listHeader.heightPixel()).borderOption('1px solid gray', 'top').overflow('scroll');

    // design codeWrapper
    var wrapperHeader = div().appendTo(codeWrapper).size('95%', '60px').padding(20).borderOption('1px solid gray', 'bottom');
    description = div().size('600px', '60px').appendTo(wrapperHeader).fontSize(20).fontBold().fontColor('gray').overflow('scroll');
    saveButton = div().appendTo(wrapperHeader).size(50, 20).padding(5).color('#05aa33').text('Save').fontColor('white').textAlignCenter().fontSize(18).verticalAlign('middle')
        .borderOption(5, 'radius').float('right').visibility('hidden').click(onSave).cursorPointer();
    date = div().appendTo(wrapperHeader).fontSize(18).fontColor('gray').clear('right').float('right');

    title = div().size('600px', '40px').appendTo(codeWrapper).fontSize(30).fontBold().margin(20).fontColor('#05aa33').overflow('scroll');
    code = div().appendTo(codeWrapper).size('95%', '80%').marginTop(10).padding(20).fontSize(20).overflow('scroll');

});
