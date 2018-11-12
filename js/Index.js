var Index = {
    data: {
        tl: null,
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
        tweenmax: function () {
            Index.data.tl = new TimelineLite({
                paused: true
            })

            var firstBg = document.querySelectorAll('.text__first-bg'),
                secBg = document.querySelectorAll('.text__second-bg'),
                word = document.querySelectorAll('.text__word');
            Index.data.tl
                // 標題 第一格 右滑速度
                .to(firstBg, 0.3, {
                    scaleX: 1
                })
                // 標題 第二格 右滑速度
                .to(secBg, .7, {
                    scaleX: 1
                })
                .to(word, 0.1, {
                    opacity: 1
                }, "-=0.1")
                .to(firstBg, 0, {
                    css: {
                        'transform-origin': "right"
                    }
                })
                // 標題 第一格 左滑速度
                .to(firstBg, 0.3, {
                    scaleX: 0
                })
                .to(secBg, 0, {
                    css: {
                        'transform-origin': "right"
                    }
                })
                // 標題 第二格 左滑速度
                .to(secBg, .7, {
                    scaleX: 0
                })
                .to($('main.abs p'), 0.5, {
                    css: {
                        'opacity': 1
                    }
                })
                .add(function () {
                    if (!is.mobile()) {
                        Index.selector.menuPC.show()
                        Index.selector.divContact.show()
                    }
                    Index.selector.divScroll.show()
                });

        }

    },
    initListener: function () {},
    init: function (callback) {
        this.setups.wow()
        this.setups.tweenmax()
        this.selector.init()
        setTimeout(function () {
            callback()
        }, 200);
    },
}

$(function () {
    setTimeout(function () {
        $('.loading').fadeOut(500, function () {
            Index.init(function () {
                Index.data.tl.play()
            })

        })
    }, 1000)
})