jQuery(function() {
  // acf ve benzeri post type'lar için
  // daha genel bi if yazılabilir
  if (jQuery(".post-type-acf-field-group").length > 0) {
    jQuery(document).on("click", "#publish, #save-post", postHandler);
    jQuery(document).on("input", "#post #postbox-container-2 input", function() {
      jQuery(this).parents(".acf-field-object").attr("data-save", "settings");
    });
  }
  else {
    jQuery("#post").on("submit", postHandler);
  }

  function postHandler(e,b,s) {
    jQuery("input[type=submit].button:focus").addClass("mui-clicked");
    buttonsState("off");

    e.preventDefault();
    e.stopPropagation();
    // validasyon gerekliyse
    if (jQuery('*[id^="acf-field_"]:visible').length > 0) {
      acf.validation.fetch({
        form: jQuery("#post"),
        loading: function() {
          console.log("validating");
        },
        complete: function() {
          console.log("validation completed");
        },
        success: function(a,b,c) {
          console.log("valid, posting...");
          postIt(e);
        },
        failure: function() {
          buttonsState("on");
        },
        reset: true // important
      });
    }
    else {
      postIt(e);
    }
    return false;
  }
  
  function postIt(e) {   
    console.log("post it");
    button = jQuery(".mui-clicked");
    
    var url = jQuery("#post").attr("action");

    // acf ise biraz farklı
    // performans normal  
    if (jQuery(".post-type-acf-field-group").length > 0) {
      jQuery("input:focus").trigger("blur").focus();
      var acfPostSelectors = [
        "#post > input",
        "#post #post-body-content input",
        "#post #postbox-container-1 input",
        "#post #postbox-container-2 [data-save=settings] input",
        "#post #postbox-container-2 [data-save=settings] select",
        "#post #postbox-container-2 [data-save=meta] .meta input",
        "#post #postbox-container-2 > * > *:not('#acf-field-group-fields') input",
        "#post #postbox-container-2 > * > *:not('#acf-field-group-fields') select"
      ];
      var data = jQuery(acfPostSelectors.join(",")).serialize();
    }
    else {
      var data = jQuery("#post").serialize();
    }

    saveFlag = "&" + button.attr("name") + "=" + button.val();
  
    if (data.indexOf("preview=dopreview") == -1) {
      jQuery.ajax({
        url:url + "?" + Date.now(),
        type: "POST",
        data: data + saveFlag,
        cache: false,
        success: function(result) {
          jQuery("[data-save=settings]").removeAttr("data-save");
          jQuery("[data-save=meta]").removeAttr("data-save");

          //buttonsState(button, "on");
          console.log("saved");
          saved = true;
          var result = jQuery('<div/>').html(result);
          jQuery("script").each(function() {
              if (typeof jQuery(this).attr("src") !== "undefined") {
                  if (jQuery(this).attr("src").indexOf("post.min") > -1) {
                      reloadJS = jQuery(this).attr("src");
                      console.log(reloadJS);
                      jQuery(this).remove();
                  }
              }
          });
  
          // hidden input'ları güncelleyelim
          jQuery("#post > input:hidden").remove();
          jQuery("#post").prepend(jQuery(result).find("#post > input:hidden"));
  
          // meta box'ları güncelleyelim
          if (jQuery(".post-type-acf-field-group").length > 0) {
            postboxContainer = "#postbox-container-1 > div > div";
          }
          else {
            postboxContainer = "#postbox-container-1 > div > div";
          }

          var pass = [
            "submitdiv",
            "revisionsdiv"
          ];

          jQuery("div[id^=taxonomy-]").parents(".postbox").each(function() {
            pass.push(jQuery(this).attr("id"));
          });

          jQuery("div[id^=tagsdiv-]").each(function() {
            pass.push(jQuery(this).attr("id"));
          });

          jQuery(postboxContainer).each(function() {
              var id = jQuery(this).attr("id");

              if (pass.indexOf(id) > -1) {
                jQuery(this)[0].innerHTML = jQuery(result).find("#"+id)[0].innerHTML;
              }
          });  
          jQuery("body").append("<script src='"+ reloadJS +"'></script>");
  
          // get slug
          jQuery("#titlediv > .inside").replaceWith(jQuery(result).find("#titlediv > .inside"));
  
          var newTitle = jQuery(result).find("title");
          jQuery("head > title").replaceWith(newTitle);
          history.replaceState("", newTitle, result.find("link#wp-admin-canonical").attr("href"))        

          // ui update (title, message vs.)
          var i = 0;
          jQuery(result).find("#wpbody-content > .wrap > *:not(:last)").each(function() {
              var tagName = jQuery(this).prop("tagName");
              var classes = jQuery(this).attr("class");
              classes = classes.replace(/ /g,".");
              var target = jQuery("#wpbody-content > .wrap").children(tagName + "." + classes);
              if (target.length) {
                  jQuery(target).replaceWith(jQuery(this));
              }
              else {
                  if (jQuery(this).attr("id") == "message") {
                      jQuery("#minor-publishing-actions").prepend(jQuery(this));
                      jQuery("#minor-publishing-actions #message").delay(750).fadeOut();
                      i = i - 0;
                  }
                  else {
                      jQuery(this).insertBefore(jQuery("#wpbody-content > .wrap > *").eq(i))
                  }
              }
              i = i + 1;
          });


          lastSave = jQuery("#post").serialize();    
          jQuery(window).off( 'beforeunload' );
          jQuery(window).on( 'beforeunload', function(e) {
            e.preventDefault();
            e.stopPropagation();            
            if (lastSave !== jQuery("#post").serialize()) {
              return true;
            }
          });
          try {
            prevNext();  
          } catch (error) {
            
          }
                 
        }
      });  
    }
  }

  function buttonsState(status) {
    if (status == "off") {
      jQuery(".preview.button, #publish, #save-post").addClass("mui-disabled");
      jQuery(".mui-clicked").siblings(".spinner").addClass("mui-active");
    }
    else if (status == "on") {
      jQuery(".mui-disabled").removeClass("mui-disabled");
      jQuery(".mui-active").removeClass("mui-active");
    }
  }  

  // simply disables save event for chrome
  jQuery(window).keypress(function (event) {
    if (!(event.which == 115 && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) && !(event.which == 19)) return true;
    event.preventDefault();
    return false;
  });

  // used to process the cmd+s and ctrl+s events
  jQuery(document).keydown(function (event) {
    if (event.which == 83 && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
      if (jQuery("#save-post").length > 0) {
        jQuery("#save-post").addClass("mui-clicked").click();
      }
      else {
        jQuery("#publish").addClass("mui-clicked").click();
      }
      event.preventDefault();
      return false;
    }
  });
  
});