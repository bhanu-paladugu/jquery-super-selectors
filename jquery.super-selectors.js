/**
 * Super Selectors
 * A jQuery plugin enabling better CSS selector support for older browsers
 *  by leveraging jQuery's excellent selectors
 * 
 * Version 1.1.3
 * Author: Chris Patterson
 *
 * License: GPL 3 http://www.gnu.org/licenses/gpl-3.0.html
 * 
 **/
(function ($) {
  $.fn.superSelectify = function (options) {
    var dynamicCSS = "";
    var additionalElementCSS = "";
    var defaults = {
      emptyClass: "empty",
      firstClass: "first",
      lastClass: "last",
      oddClass: "odd",
      evenClass: "even",
      nextClass: "next",
      siblingClass: "sibling",
      firstChildClass: "first-child",
      lastChildClass: "last-child",
      onlyChildClass: "only-child",
      directChildClass: "child", /* For parent > child */
      textInputClass: "text",
      passwordInputClass: "password",
      radioInputClass: "radio",
      checkboxInputClass: "checkbox",
      submitInputClass: "submit",
      imageInputClass: "image",
      resetInputClass: "reset",
      buttonInputClass: "button",
      fileInputClass: "file",
      hoverClass: "hover",
      manualSelectors: false,
      forceStylesheetParsing: false,
      additionalElementHash: {} /* To allow specification of regular expressions & classes to extend SuperSelectors */
    };
    options = $.extend(defaults, options);
    // Add classes for additional Elements first
    for (var item in options.additionalElementHash) {
      if ($.isArray(options.additionalElementHash[item])) {
        $(options.additionalElementHash[item][0]).addClass(item);
        additionalElementCSS += options.additionalElementHash[item][0] + "{" + options.additionalElementHash[item][1] + "}";
      } else {
        $(options.additionalElementHash[item]).addClass(item);
      }
    }
    // Add our dynamic CSS to the <head>
    $('<style type="text/css" media="all">' + additionalElementCSS + '</style>').appendTo('head');
    function getMatches(CSS, path) {
      // We need to strip out any comments to make sure we don't apply styles inappropriately
      CSS = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
      // Also need to update any pathnames for images, to account for relative paths where the CSS and webpage are in different directories
      dynamicCSS = CSS.replace(/url\s*\(\s*['"]?([\w\.][\w\-\.\/]+)['"]?\s*\)/g, ("url('" + path + "$1')"));
      function _match_item(reg, className) {
        var fullSelector = new RegExp('[a-zA-Z0-9._+~#:\\s-]*' + reg, "gi");
        var classSelector = new RegExp(reg, "gi");
        var itemMatch = CSS.replace(/[\n\r]/gi, '').match(fullSelector);
        if (itemMatch) {
          itemMatch = itemMatch.join(", ");
          $(itemMatch).addClass(className);
        }
        dynamicCSS = dynamicCSS.replace(classSelector, '.' + className);
      }
      function _match_hover(reg, className) {
        var fullSelector = new RegExp('[a-zA-Z0-9._+~#:\\s-]*' + reg, "gi");
        var classSelector = new RegExp(reg, "gi");
        var itemMatch = CSS.replace(/[\n\r]/gi, '').match(fullSelector);
        if (itemMatch) {
          itemMatch = itemMatch.join(", ").replace(classSelector, '');
        }
        if (itemMatch) {
          $(itemMatch).hover(
          function () {
            $(this).addClass(className);
          }, function () {
            $(this).removeClass(className);
          });
        }
        dynamicCSS = dynamicCSS.replace(classSelector, '.' + className);
      }
      _match_item(':empty', options.emptyClass);
      _match_item('(:first[^-])', options.firstClass);
      _match_item('(:last[^-])', options.lastClass);
      _match_item('(:nth-child\\(odd\\))', options.oddClass);
      _match_item('(:nth-child\\(even\\))', options.evenClass);
      _match_item('([a-zA-Z0-9._+~#:-]+\\s?\\+\\s?[a-zA-Z0-9._+~#:-]+)', options.nextClass);
      _match_item('([a-zA-Z0-9._+~#:-]+\\s?\\~\\s?[a-zA-Z0-9._+~#:-]+)', options.siblingClass);
      _match_item('(:first-child)', options.firstChildClass);
      _match_item('(:last-child)', options.lastChildClass);
      _match_item('(:only-child)', options.onlyChildClass);
      _match_item('(\\>\\s?[a-zA-Z0-9._+~#:-]*)', options.directChildClass);
      _match_item('(input\\[type="text"\\])', options.textInputClass);
      _match_item('(input\\[type="password"\\])', options.passwordInputClass);
      _match_item('(input\\[type="radio"\\])', options.radioInputClass);
      _match_item('(input\\[type="checkbox"\\])', options.checkboxInputClass);
      _match_item('(input\\[type="submit"\\])', options.submitInputClass);
      _match_item('(input\\[type="image"\\])', options.imageInputClass);
      _match_item('(input\\[type="reset"\\])', options.resetInputClass);
      _match_item('(input\\[type="button"\\])', options.buttonInputClass);
      _match_item('(input\\[type="file"\\])', options.fileInputClass);
      // Also add hover listeners as needed
      _match_hover(':hover', options.hoverClass);
      // Check for any imports within the passes CSS
      var importedCSS = CSS.match(/[a-zA-Z0-9\.\-_\+\s]*import([a-zA-Z0-9\.\-_\+\/]*\.css)/gi);
      if (importedCSS) {
        var fakeStyleSheet = [];
        for (stylesheet = 0; stylesheet < importedCSS.length; stylesheet++) {
          fakeStyleSheet.href = importedCSS[stylesheet];
          getCSS(fakeStyleSheet);
        }
      }
      // Add our dynamic CSS to the <head>
      $('<style type="text/css" media="all">' + dynamicCSS + '</style>').appendTo('head');
    }
    // Retrieve the CSS if it's a link or import, otherwise process the embedded CSS


    function getCSS(sheet) {
      var docURL = String(window.location);
      if (sheet.href) {
        var RELATIVE = /^[\w\.]+[^:]*$/;
        var href = (RELATIVE.test(sheet.href)) ? (docURL.slice(0, docURL.lastIndexOf("/") + 1) + sheet.href) : sheet.href;
        $.ajax({
          url: href,
          success: function (response) {
            getMatches(response, (href.slice(0, href.lastIndexOf("/") + 1)));
          }
        });
      } else {
        getMatches(sheet.innerHTML, (docURL.slice(0, docURL.lastIndexOf("/") + 1)));
      }
    }
    // If manual selectors have been provided, apply those first
    if (options.manualSelectors) {
      getMatches(options.manualSelectors);
    }
    // Only parse the stylesheets if no manual selectors are provided, or the user is forcing the behavior
    if (!options.manualSelectors || options.forceStylesheetParsing) {
      // Safari loads things in parallel, so we have to wait for everything to finish before proceeding
      // otherwise it thinks there are no stylesheets
      if (jQuery.browser.safari && document.readyState != "complete") {
        setTimeout(arguments.callee, 100);
        return;
      }
      $("style,link[type=text/css]").each(function () {
        getCSS(this);
      });
    }
  };
})(jQuery);