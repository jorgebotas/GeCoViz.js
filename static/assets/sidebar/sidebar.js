/* MIT License

Copyright (c) 2017 Mohamed AZOUAOUI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

/* Code based on https://github.com/azouaoui-med/pro-sidebar-template */

jQuery(function ($) {

    // Dropdown menu
    $(".sidebar-dropdown > a").click(function () {
        $(".sidebar-submenu").slideUp(200);
        if ($(this).parent().hasClass("active")) {
            $(".sidebar-dropdown").removeClass("active");
            $(this).parent().removeClass("active");
        } else {
            $(".sidebar-dropdown").removeClass("active");
            $(this).next(".sidebar-submenu").slideDown(200);
            $(this).parent().addClass("active");
        }

    });

    //toggle sidebar
    $("#toggle-sidebar").click(function () {
        $(".page-wrapper").toggleClass("toggled");
    });
    //Pin sidebar
    $("#pin-sidebar").click(function () {
        if ($(".page-wrapper").hasClass("pinned")) {
            // unpin sidebar when hovered
            $(".page-wrapper").removeClass("pinned");
            $("#sidebar").unbind("hover");
        } else {
            $(".page-wrapper").addClass("pinned");
            $("#sidebar").hover(
                function () {
                    console.log("mouseenter");
                    $(".page-wrapper").addClass("sidebar-hovered");
                },
                function () {
                    console.log("mouseout");
                    $(".page-wrapper").removeClass("sidebar-hovered");
                }
            )

        }
    });

    //toggle sidebar overlay
    $("#overlay").click(function () {
        $(".page-wrapper").toggleClass("toggled");
    });

    //switch between themes 
    var themes = "default-theme legacy-theme chiller-theme ice-theme cool-theme light-theme";
    $('[data-theme]').click(function () {
        $('[data-theme]').removeClass("selected");
        $(this).addClass("selected");
        $('.page-wrapper').removeClass(themes);
        $('.page-wrapper').addClass($(this).attr('data-theme'));
    });

    // switch between background images
    var bgs = "bg1 bg2 bg3 bg4";
    $('[data-bg]').click(function () {
        $('[data-bg]').removeClass("selected");
        $(this).addClass("selected");
        $('.page-wrapper').removeClass(bgs);
        $('.page-wrapper').addClass($(this).attr('data-bg'));
    });

    // toggle background image
    $("#toggle-bg").change(function (e) {
        e.preventDefault();
        $('.page-wrapper').toggleClass("sidebar-bg");
    });

    // toggle border radius
    $("#toggle-border-radius").change(function (e) {
        e.preventDefault();
        $('.page-wrapper').toggleClass("border-radius-on");
    });

    //custom scroll bar is only used on desktop
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $(".sidebar-content").mCustomScrollbar({
            axis: "y",
            autoHideScrollbar: true,
            scrollInertia: 300
        });
        $(".sidebar-content").addClass("desktop");

    }
});