myQuery.define("ui/tabbutton", [
    "module/Widget",
    "ui/button",
    "main/query",
    "main/class",
    "main/event",
    "main/dom",
    "module/src"],

function($, Widget, Button, query, cls, event, dom, src) {
    "use strict"; //启用严格模式

    src.link({
        href: $.getPath("ui/css/tabbutton", ".css")
    });

    var tabbutton = Button.extend("ui.tabbutton", {
        options: {
            defualtCssName: "defaultTabButton",
            selectCssName: "selectTabButton",
            select: false,
            text: "",
            title: ""
        },
        getter: {
            defualtCssName: 1,
            selectCssName: 1,
            select: 1,
            text: 1,
            title: 1
        },
        setter: {
            defualtCssName: 1,
            selectCssName: 1,
            select: 1,
            text: 1,
            title: 1
        },
        publics: {
            select: 1,
            toggle: 1
        },
        _initHandler: function() {
            var self = this;
            this.event = function(e) {
                switch (e.type) {
                    case "click":
                        var para = {
                            type: self.getEventName("click"),
                            container: self.container,
                            target: self.target[0],
                            event: e
                        }
                        self.select();
                        self.target.trigger(para.type, self.target[0], para);
                        break;
                }
            }
            return this;
        },
        select: function() {
            this.options.select = true;
            return this.change();
        },
        toggle: function() {
            var opt = this.options;
            opt.select = !opt.select;
            return this.change();;
        },
        change: function() {
            var opt = this.options;

            if (opt.select == true) {
                this.target.removeClass(opt.defaultCssName).addClass(opt.selectCssName);
            } else {
                this.target.removeClass(opt.selectCssName).addClass(opt.defaultCssName);
            }
            return this;
        },
        render: function() {
            Button.invoke("render", this);

            if (this.defualtCssName != opt.defualtCssName) {
                this.target.removeClass(this.defualtCssName);
                this.defualtCssName = opt.defualtCssName;
            }
            if (this.selectCssName != opt.selectCssName;) {
                this.target.removeClass(this.selectCssName);
                this.selectCssName = opt.selectCssName;
            }

            this.change();
            return this;
        },
        init: function(opt, target) {
            this._super(opt, target);
            this.defualtCssName = opt.defualtCssName;
            this.selectCssName = opt.selectCssName;
            return this;
        }
        toString: function() {
            return "ui.tabbutton";
        },
        widgetEventPrefix: "tabbutton"
    });

    //提供注释
    $.fn.tabbutton = function(a, b, c, args) {
        return tabbutton.apply(this, arguments);
    }

    return tabbutton;
});