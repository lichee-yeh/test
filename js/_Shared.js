var _Shared = {

    methods: {

    },
    initListener: function () {
        // 滾軸 scrollbar
        document.addEventListener('scroll', function (event) {
            if ($(window).scrollTop() + $(window).height() + 300 >= $(document).height()) {
                $('div.scroll').fadeOut()

            } else {
                $('div.scroll').fadeIn()
            }
        }, true);

        $('div.about a.close').on('click', function (e) {
            e.preventDefault();
            $('.about').removeClass('fadeInLeft')
            $('.about').addClass('fadeOutLeft')
        })

        // PC nav
        $('nav.pc').find('ul>li').on('click', function (e) {
            e.preventDefault();
            switch ($(this).data('nav-type')) {
                case 'about':
                    $('.about').removeClass('fadeOutLeft')
                    $('.about').addClass('fadeInLeft')
                    $('.about').show()
                    setTimeout(() => {
                        $('.about').removeClass('fadeInLeft')
                    }, 1000);
                    break;
                default:
                    window.location.href = $(this).find('a').attr('href');
                    break;
            }
        })

        //M nav
        $('nav.overlay-menu').find('ul>li').on('click', function (e) {
            e.preventDefault();
            console.log($(this).data('nav-type'));
            switch ($(this).data('nav-type')) {

                case 'about':
                    $('.about').removeClass('fadeOutLeft')
                    $('.about').addClass('fadeInLeft')
                    $('.about').show()
                    setTimeout(() => {
                        $('.about').removeClass('fadeInLeft')
                    }, 1000);
                    break;

                default:
                    window.location.href = $(this).find('a').attr('href');
                    break;
            }
        })

    },
    init: function () {
        this.initListener();
    }
}

$(function () {
    _Shared.init();

})