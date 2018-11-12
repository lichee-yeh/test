var Project = {
    data: {
        init: function () {},
    },
    selector: {
        init: function () {
            this.menuPC = $('nav.pc')
            this.divScroll = $('div.scroll')
            this.divContact = $('div.contact')
        },
    },

    setups: {
        wow: function () {
            // 預設
            // 客製直接寫在 data-wow-offset
            new WOW({
                offset: 300,
            }).init()
        },
    },
    initListener: function () {
        $('div.switchBox a.btn-top').on('click', function (e) {
            e.preventDefault();
            var body = $("html, body");
            body.stop().animate({
                scrollTop: 0
            }, 500, 'swing');
        })
    },
    init: function (callback) {
        this.setups.wow()
        this.selector.init();
        this.initListener()
        setTimeout(function () {
            callback()
        }, 200);
    },
}

$(function () {
    setTimeout(function () {
        $('.loading').fadeOut(500, function () {
            Project.init(function () {

                if (!is.mobile()) {
                    Project.selector.menuPC.show()
                    Project.selector.divContact.show()
                }
                Project.selector.divScroll.show()

            })

        })
    }, 1000)
})