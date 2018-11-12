var Work = {
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
    initListener: function () {},
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
            Work.init(function () {

                if (!is.mobile()) {
                    Work.selector.menuPC.show()
                    Work.selector.divContact.show()
                }
                Work.selector.divScroll.show()

            })

        })
    }, 1000)
})