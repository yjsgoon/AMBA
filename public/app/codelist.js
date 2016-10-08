(function () {

    /** initialize variables **/

    var basicColor = 'rgb(17,187,85)', basicColorWeak = 'rgb(17,187,85,0.6)',
        projectColor = '#C8E6C9', moduleColor = '#B2DFDB';
    var currentBlock, currentCode, currentCodeManager;
    var projectHide = false, moduleHide = true;


    /** set user authentication **/

    var authFactory = function () {
        var ainfo = JSON.parse(localStorage.getItem('ainfo'));
        var aauth = localStorage.getItem('aauth');
        return {
            getUsername : function () {
                return (ainfo && ainfo.username);
            },
            getToken : function () {
                return aauth;
            }
        };
    }();
    var username = authFactory.getUsername();
    var token = authFactory.getToken();
    if (!username || !token) {
        $(location).attr('href', '/?app=signin');
        alert('로그인 페이지로 이동합니다.')
        return;
    }


    /** basic functions **/

    var addZeroIfNeeded = function (num) {
        num = parseInt(num);
        return num < 10 ? '0' + num : num;
    };
    var getCurrentDate = function () {
        var date = new Date();
        var curr_date = addZeroIfNeeded(date.getDate());
        var curr_month = addZeroIfNeeded(date.getMonth() + 1);
        var curr_year = date.getFullYear();
        return curr_year + "-" + curr_month + "-" + curr_date;
    };


    /** define Project, Code classes **/

        // Q. insert, update date는 db에 들어간 시간을 기준? 클라이언트 리퀘스트 기준?
    var Project = function (project) {
            this.pid = project.pid;
            this.title = project.title;
            this.main_cid = project.main_cid;
            this.description = project.description;
            this.ipt_date = project.ipt_date.slice(0, 10);
            this.upt_date = project.upt_date.slice(0, 10);
            this.codeManager;
        };

    var Code = function (code) {
        this.cid = code.cid;
        this.pid = code.pid;
        this.title = code.title;
        this.ctext = code.ctext;
        this.description = code.description;
        this.ipt_date = code.ipt_date.slice(0, 10);
        this.upt_date = code.upt_date.slice(0, 10);
    };

    var buildProject = function (obj) {
        return new Project(obj);
    };

    var buildCode = function (obj) {
        return new Code(obj);
    };


    /** define ProjectManager, CodeManager classes **/
    // TODO define functions using prototype
        // 모든 유저는 하나의 project manager를 가지고 project를 관리합니다.
    var ProjectManager = function () {

        var projects = [];
        var that = this;

        this.init = function () {
            that.getProjects()
                .done(function () {
                    for (var i = 0; i < projects.length; i++) {
                        newProjectBlock(projects[i]);
                    }
                });
        };

        this.getProjects = function () {
            return $.get("/projects", {token: token})
                .done(function (data) {
                    if (data.resultCode === 0) {
                        projects = data.projects.map(buildProject);
                    } else {
                        alert(data.msg);
                    }
                });
        };

        this.createProject = function () {
            var currentDate = getCurrentDate();
            var defaultProject = {
                title: prompt("프로젝트 명을 입력해주세요."),
                description: "project description",
                ipt_date: currentDate,
                upt_date: currentDate
            };
            var project = buildProject(defaultProject);
            return $.post("/projects", {token:token, project:JSON.stringify(project)})
                .done(function (data) {
                    if (data.resultCode === 0) {
                        project.pid = data.pid;
                        projects.push(project);
                    } else {
                        alert(data.msg);
                    }
                    data.project = project;
                    return data;
                });
        };

        this.deleteProject = function (pid) {

            $.post("/projects/delete", {token: token, pid:pid})
                .done(function (data) {
                    if (data.resultCode === 0) {
                        // remove from array;
                        for (var i = 0; i < projects.length; i++) {
                            if (projects[i].pid == pid) {
                                projects.splice(i, 1);
                                break;
                            }
                        }
                    } else {
                        alert(data.msg);
                    }
                });
        };
    };

    // 각각의 project는 하나의 code manager를 가지고 code들을 관리합니다.
    var CodeManager = function (pid) {

        var codes = [];
        var that = this;

        this.init = function () {
            that.getCodes()
                .done(that.resetCodelist);
        };

        this.resetCodelist = function () {
            listWrapper.empty()
            for (var i = 0; i < codes.length; i++) {
                newCodeBlock(codes[i]);
            }
            ;
        };

        this.getCodes = function () {
            return $.get("/projects/codes", {pid: pid})
                .done(function (data) {
                    if (data.resultCode === 0) {
                        codes = data.codes.map(buildCode);
                    } else {
                        alert(data.msg);
                    }
                });
        };

        this.createCode = function () {

            var currentDate = getCurrentDate();
            var defaultCode = {
                pid: pid,
                title: "new code " + codes.length,
                ctext: "// write code here",
                description: "code description",
                ipt_date: currentDate,
                upt_date: currentDate
            };
            var code = buildCode(defaultCode);
            return $.post("/projects/codes", {token:token, code:JSON.stringify(code)})
                .done(function (data) {
                    if (data.resultCode === 0) {
                        code.cid = data.cid;
                        codes.push(code);
                    } else {
                        alert(data.msg);
                    }
                    data.code = code;
                    return data;
                });
        };

        this.updateCode = function (newCode) {

            $.post("/projects/codes/update", newCode)
                .done(function (data) {
                    if (data.resultCode === 0) {
                        // update
                        for (var i = 0; i < codes.length; i++) {
                            if (codes[i].cid == newCode.cid) {
                                codes[i] = newCode;
                                break;
                            }
                        }
                    } else {
                        alert(data.msg);
                    }
                });
        };

        this.deleteCode = function (cid) {

            // remove from array;
            for (var i = 0; i < codes.length; i++) {
                if (codes[i].cid == cid) {
                    codes.splice(i, 1);
                    break;
                }
            }
            $.post("/projects/codes/delete", {cid: cid});
        };
    };

    /** define newProjectBlock, newCodeBlock functions **/

        // 주어진 project object로 부터 project block을 생성 및 append
    var newProjectBlock = function (project) {
            var blockWrapper = div().appendTo(projectListWrapper).padding(10).size('100%', '70px')
                .borderOption('1px solid', 'bottom').borderOption('rgb(200,200,200)', 'color');

            // remove functionality
            var removeButton = div().appendTo(blockWrapper).size(10, 15).text('X').fontColor('gray').float('right')
                .marginRight(20).cursorPointer()
                .click(function () {
                blockWrapper.remove();
                blank.appendTo(parent);
                projectManager.deleteProject(project.pid);
            });

            var block = {
                title: div().appendTo(blockWrapper).size('100%', '30px').text(project.title).fontSize(20).fontColor('#333333').fontBold(),
                ipt_date: div().appendTo(blockWrapper).size('100%', '15px').text(project.ipt_date).fontSize(12).fontColor('gray'),
            };

            var onHover = function () {
                blockWrapper.color(basicColor);
                block.title.fontColor('white');
                block.ipt_date.fontColor('white');
            };
            var offHover = function () {
                blockWrapper.color('inherit');
                block.title.fontColor('#333333');
                block.ipt_date.fontColor('gray');
                removeButton.color('inherit');
            };
            var onClickProject = function () {
                listHeaderTitle.text(block.title.text());
                listName.text(project.description);
                closeProjectList();
                resetCodes(project);
                clearCurrentCode();
            };
            blockWrapper.hover(onHover, offHover).click(onClickProject).cursorPointer();
        };


    // codelist에 새로운 block을 추가하고, 이를 리턴하는 함수
    var newCodeBlock = function (code) {
        var blockWrapper = div().appendTo(listWrapper).padding(10).size('100%', '100px').borderOption('1px solid', 'bottom')
            .borderOption('rgb(200,200,200)', 'color').color('#fafafa').cursorPointer();

        // remove functionality
        var removeButton = div().appendTo(blockWrapper).size(10, 15).text('X').fontColor('gray').float('right')
            .marginRight(20).cursorPointer()
            .click(function () {
                blockWrapper.remove();
                currentCodeManager.deleteCode(code.cid);
                clearCurrentCode();
        });

        // set viewer
        var viewerWrapper = div().width(codelist.widthPixel()-6).padding(3).backgroundColor('green').position('absolute').resizable().draggable().zIndex(5);
        var viewerHeader = div().appendTo(viewerWrapper);
        div().appendTo(viewerHeader).size(5,'100%'); // left space
        viewerHeader.size('100%',27).paddingTop(6).color(projectColor).fontSize(18).fontBold().fontColor('green')
            .borderBottom('2px solid green').cursorDefault();
        var viewer = div().appendTo(viewerWrapper).size('100%','100%').overflowAuto().backgroundColor('white');
        var viewerRemoveButton = div().appendTo(viewerHeader).size(10, 15).text('X').fontColor('green').float('right')
            .marginRight(5).cursorPointer()
            .click(function () {
            viewerWrapper.slideUp();
        });


        // trick to adjust resizing control point
        var virtualHeight = 35;
        viewerWrapper.borderTop(virtualHeight + 'px solid green');
        viewerHeader.marginTop(-virtualHeight);
        viewer.marginTop(-virtualHeight+16);

        var block = {
            title: div().appendTo(blockWrapper).size('100%', '30px').text(code.title).fontSize(20).fontColor('#333333').fontBold().disableSelection(),
            date: div().appendTo(blockWrapper).size('100%', '15px').text(code.upt_date).fontSize(12).fontColor('gray').disableSelection(),
            description: div().appendTo(blockWrapper).size('100%', '35px').text(code.description).fontSize(16).fontColor('gray').disableSelection(),
            refresh: function () {
                this.title.text(code.title);
                this.date.text(code.upt_date);
                this.description.text(code.description);
            },
            run: function () {
                // save code
                var txt = '(function(){' + codeEditor.text() + '})();'; // get text from code editor and modularize it
                localStorage.setItem('acode', txt);

                // set viewer
                viewer.empty().viewer();
                viewerHeader.text('  ' + titleEditor.text());
                viewerWrapper.after(listHeader);
                viewerWrapper.left(listWrapper.positionLeft()).top(listWrapper.positionTop()).append().hide().slideDown();
            }
        };

        var onHover = function () {
            blockWrapper.color(basicColorWeak);
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
        };
        var onClickCode = function () {
            if (currentBlock === undefined)
                moduleListButton.opacity(0).displayInlineBlock().animate({opacity: 1}, 300);
            if (currentBlock != block) {
                codeWrapper.displayInlineBlock();
                titleEditor.text(code.title);
                descEditor.text(code.description);
                dateEditor.text(code.upt_date);
                codeEditor.text(code.ctext);
                currentCode = code;
                currentBlock = block;
            }
        };
        blockWrapper.hover(onHover, offHover).click(onClickCode);
    };

    /** functions for code list and project list **/

    // project의 codeManager를 세팅하고, codelist를 현재 project 하위의 코드들로 세팅합니다.
    var resetCodes = function (project) {
        if (project.codeManager) {
            project.codeManager.resetCodelist();
        } else {
            project.codeManager = new CodeManager(project.pid);
            project.codeManager.init();
        }
        currentCodeManager = project.codeManager;
    };

    var clearCurrentCode = function () {
        currentCode = undefined;
        currentBlock = undefined;
        moduleListButton.animate({opacity: 0}, 300, function () {
            moduleListButton.displayNone();
        });
        codeWrapper.displayNone();
    };


    var openProjectList = function () {
        projectList.zIndex(3).animate({opacity: 1}, 300);
        closeModuleList();
        addCodeButton.animate({opacity: 0}, 150, function() {
            addCodeButton.displayNone();
            projectAddButton.displayInlineBlock().animate({opacity: 1}, 150);
        });
        projectHide = false;
    };

    var closeProjectList = function () {
        projectList.animate({opacity: 0, 'z-index': -1}, 300);
        projectAddButton.animate({opacity: 0}, 150, function() {
            projectAddButton.displayNone();
            addCodeButton.displayInlineBlock().animate({opacity: 1}, 150);
        });
        projectHide = true;
    };

    var openModuleList = function () {
        moduleList.displayInlineBlock().zIndex(3).animate({opacity: 1}, 300);
        closeProjectList();
        moduleHide = false;
    };

    var closeModuleList = function () {
        moduleList.animate({opacity: 0, 'z-index': -1}, 300, function () {
            moduleList.displayNone();
        });
        moduleHide = true;
    };

    /** on click events **/

    var onAddCode = function () {
        currentCodeManager.createCode()
            .done(function (data) {
                if (data.resultCode === 0)
                    newCodeBlock(data.code);
            });
    };

    var onAddProject = function () {
        projectManager.createProject()
            .done(function (data) {
                if (data.resultCode === 0)
                    newProjectBlock(data.project);
            });
    };

    var onRun = function () {
        currentBlock.run();
    };

    var onModule = function () {
        var res = confirm('모듈화를 하시겠습니까?');
        console.log(res);
    };

    var onSave = function () {
        currentCode.title = titleEditor.text();
        currentCode.upt_date = getCurrentDate();
        currentCode.description = descEditor.text();
        currentCode.ctext = codeEditor.text();
        currentBlock.refresh();
        currentCodeManager.updateCode(currentCode);
    };

    var onProjectList = function () {
        if (projectHide)
            openProjectList();
        else if (currentCodeManager)
            closeProjectList();
    };

    var onModuleList = function () {
        if (moduleHide)
            openModuleList();
        else
            closeModuleList();
    };

    var onLogout = function () {
        localStorage.clear('aauth');
        localStorage.clear('ainfo');
        $(location).attr('href', '/?app=signin');
    };


    /** design **/

    // basic layout
    var parent = div().append().size(outerWidth, outerHeight);
    var sidebar = div().appendTo(parent).size(outerWidth/20, outerHeight).color('white');
    var content = div().appendTo(parent).size(outerWidth*19/20, outerHeight);
    var projectList = div().appendTo(content).zIndex(3).size(outerWidth/4, outerHeight).color(projectColor)
        .border(1).borderColor('#aaaaaa').position('absolute').left(content.positionLeft()).top(content.positionTop());
    var moduleList = div().appendTo(content).cssSameWith(projectList).color(moduleColor).displayNone();
    var codelist = div().appendTo(content).zIndex(1).size(outerWidth/4, outerHeight).border(1).borderOption('#aaaaaa', 'color');
    var codeWrapper = div().appendTo(content).zIndex(1).size(outerWidth*13/20, outerHeight).padding(15).color('white').displayNone();
    var blank = div();

    // design sidebar
    var decoButton = function (div) {
            div.size(20, 20).padding(5).margin(15).border(1).borderColor(basicColor).borderOption('100%', 'radius').marginTop(10)
                .fontBold().fontSize(20).fontColor('green').textAlign('center').verticalAlign('middle').cursorPointer();
        };
    var logoutButton = div().appendTo(sidebar).size(50,20).margin(5).marginTop(15).paddingTop(4).color('green')
        .border(2).borderRadius(4).borderColor('green').textAlignCenter().text('logout').fontSize(14).fontColor('white')
        .cursorPointer().hoverColor('white','green').hoverTextColor('green','white').click(onLogout);
    var addCodeButton = div().appendTo(sidebar).deco(decoButton).marginTop(30)
        .paddingTop(0).height(25).text('+').fontSize(28).click(onAddCode).displayNone();
    var projectAddButton = div().appendTo(sidebar).deco(decoButton).marginTop(30).text('new').fontSize(12).click(onAddProject);
    var projectListButton = div().appendTo(sidebar).deco(decoButton).text('P').click(onProjectList);
    var moduleListButton = div().appendTo(sidebar).deco(decoButton).text('M').click(onModuleList).displayNone();

    // design projectlist
    var projectHeader = div().appendTo(projectList).size('100%', '170px').color('#white').borderBottom('3px solid green');
    var projectHeaderTitle = div().appendTo(projectHeader).size('100%', '40px').marginTop(50).text('Project List').fontSize(28).textAlignCenter();
    var projectName = div().appendTo(projectHeader).size('100%', '50px').marginTop(20).text(username).fontSize(22).fontColor('gray').textAlignCenter();
    var projectListWrapper = div().appendTo(projectList).size('100%', projectList.heightPixel() - projectHeader.heightPixel())
        .borderOption('1px solid gray', 'top').overflowAuto();

    // design modulelist
    var moduleHeader = div().appendTo(moduleList).size('100%', '170px').color('#white').borderBottom('3px solid green');
    var moduleHeaderTitle = div().appendTo(moduleHeader).size('100%', '40px').marginTop(50).text('Module List').fontSize(28).textAlignCenter();
    var moduleName = div().appendTo(moduleHeader).size('100%', '50px').marginTop(20).text(username).fontSize(22).fontColor('gray').textAlignCenter();
    var moduleListWrapper = div().appendTo(moduleList).size('100%', moduleList.heightPixel() - moduleHeader.heightPixel())
        .borderOption('1px solid gray', 'top').overflowAuto();

    // design codelist
    var listHeader = div().appendTo(codelist).size('100%', '150px').color(basicColor);
    var listHeaderTitle = div().appendTo(listHeader).size('100%', '40px').marginTop(40).text('Project name')
        .fontSize(28).fontBold().fontColor('white').textAlignCenter();
    var listName = div().appendTo(listHeader).size('100%', '20px').marginTop(10).text(username).fontSize(20)
        .fontColor('#1B5E20').textAlignCenter();
    var listWrapper = div().appendTo(codelist).size('100%', codelist.heightPixel() - listHeader.heightPixel())
        .borderOption('1px solid gray', 'top').overflowAuto().color('white');

    // design codeWrapper
    var wrapperHeader = div().appendTo(codeWrapper).size('95%', '100px').padding(10).borderOption('1px solid gray', 'bottom');
    var leftWrapperHeader = div().width('60%').appendTo(wrapperHeader).float('left');
    var rightWrapperHeader = div().width('35%').appendTo(wrapperHeader).float('right');
    var titleEditor = div().appendTo(leftWrapperHeader).size('600px', '40px').editable().fontSize(30).fontBold()
        .fontColor(basicColor).overflowAuto();
    var descEditor = div().appendTo(leftWrapperHeader).size('600px', '60px').editable().marginTop(10).marginLeft(10)
        .fontSize(20).fontBold().fontColor('gray').overflowAuto();
    var codeEditor = div().appendTo(codeWrapper).aceEditor().zIndex(1).size('95%', '80%').marginTop(10).padding(20)
        .fontSize(20).overflowAuto();
    var saveButton = div().appendTo(rightWrapperHeader).size(50, 20).padding(5).color('#05aa33').text('Save').fontColor('white')
        .textAlignCenter().fontSize(18).verticalAlign('middle').borderOption(5, 'radius').float('right').cursorPointer().click(onSave);
    var runButton = div().appendTo(rightWrapperHeader).cssSameWith(saveButton).text('Run').marginRight(20).click(onRun);
    var moduleButton = div().appendTo(rightWrapperHeader).cssSameWith(runButton).text('Module').fontSize(15).click(onModule);
    var dateEditor = div().appendTo(rightWrapperHeader).marginTop(50).fontSize(18).fontColor('gray').clear('right').float('right');


    /** initialization **/

    var projectManager = new ProjectManager();
    projectManager.init();

})();