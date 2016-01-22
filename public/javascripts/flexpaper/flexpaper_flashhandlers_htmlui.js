var FLEXPAPER = window["FLEXPAPER"] = {};
FLEXPAPER.touchdevice = (function(){try {return 'ontouchstart' in document.documentElement;} catch (e) {return false;} })();

FLEXPAPER.bindFlashEventHandlers = FLEXPAPER.flashEventHandlers = (function(el){
    var root = el;
    var instance = jQuery(el).attr('id');
    
    /**
     * Adds the slider control to the UI
     *
     * @example addSlider( "slider1" );
     *
     * @param String id
     */
    function addSlider(id){
        var slider = window['documentViewerSlider'];

        if (!slider && !FLEXPAPER.touchdevice) {
            var maxZoom = getFlashParam("MaxZoomSize");
            slider = window['documentViewerSlider'] = new Slider(id, {
                callback: function(value){
                    $FlexPaper(instance).sliderChange(maxZoom * value);
                },
                animation_callback: function(value){
                    if (slider) {
                        if(value==0){value=parseFloat(getFlashParam("MinZoomSize"))/maxZoom;}
                        $FlexPaper(instance).sliderChange(maxZoom * value);
                    }
                }
            });
            slider.initialized = false;
        }
    }

    function getFlashParam(name){
        var retval = "";
        var childs = jQuery($FlexPaper('documentViewer')).children();
        childs.each(function(c){
            if(jQuery(childs[c]).attr("name")=="flashvars"){
                var flashvars = (childs[c].value).split('&');
                for(var i=0;i<flashvars.length;i++){
                    var valuepair = flashvars[i].split('=');
                    if(valuepair[0]==name){
                        retval = valuepair[1];
                    }
                }
            }
        });

        return retval;
    }

    function getButton(evt,bttnname){
        return jQuery(root).parent().find(bttnname);
    }

    /**
     * Handles the event of scale being changed
     *
     * @example onScaleChanged( 100 );
     *
     * @param float val
     */
    jQuery('#documentViewer').bind('onScaleChanged',function(e,val){
        var maxZoom = getFlashParam("MaxZoomSize");
        var slider = window['documentViewerSlider'];

        if(!slider && !FLEXPAPER.touchdevice)
            addSlider(getButton(e,'.flexpaper_zoomSlider').get(0));

        if(!FLEXPAPER.touchdevice){
            slider.setValue(val/maxZoom,true);
            slider.slide();
            slider.show();
            slider.initialized = true;
            jQuery(e.target).parent().find('.flexpaper_txtZoomFactor').val(Math.round((val * 100)) + "%");
        }
    });

    /**
     * Called when FlexPaper finishes loading
     *
     * @param object e
     */
    function swfCallbackFn(e){
        if(e.success){
            docViewer = e.ref;
        }else{
            docViewer = null;
        }
    }

    /**
     * Handles the event of a document is in progress of loading
     *
     */
    jQuery('#documentViewer').bind('onDocumentLoading',function(e){
        var slider = window['documentViewerSlider'];

        jQuery(".flexpaper_progress").show();

        if(PendingFullScreen){
            setFullScreen(true);
        }

        if(!slider){
            //if(window.FlexPaperFullScreen){addSlider('zoomSliderFullScreen');bindEventListeners(e);}
        }
    });

    /**
     * Handles the event of fit mode being changed
     *
     * @example onFitModeChanged("Fit Height")
     *
     * @param String mode
     */
    jQuery('#documentViewer').bind('onFitModeChanged',function(e,mode){
        getButton(e,'.flexpaper_tbbutton_fitmode').removeClass("flexpaper_tbbutton_pressed");

        if(mode == "Fit Height"){
            getButton(e,'.flexpaper_bttnFitHeight').addClass('flexpaper_tbbutton_pressed');
        }else if(mode == "Fit Width"){
            getButton(e,'.flexpaper_bttnFitWidth').addClass('flexpaper_tbbutton_pressed');
        }
    });

    /**
     * Receives messages about view mode being changed
     *
     * @example onViewModeChanged("Tile")
     *
     * @param String mode
     */
    jQuery('#documentViewer').bind('onViewModeChanged',function(e,mode){
        var slider = window['documentViewerSlider'];

        getButton(e,'.flexpaper_tbbutton_viewmode').removeClass("flexpaper_tbbutton_pressed");

        if(mode=="Tile" || mode=="ThumbView"){
            getButton(e,'.flexpaper_bttnThumbView').addClass("flexpaper_tbbutton_pressed");

            getButton(e,'.flexpaper_zoomSlider').addClass("flexpaper_tbbutton_disabled");
            getButton(e,'.flexpaper_txtZoomFactor').addClass("flexpaper_tbbutton_disabled");
            getButton(e,'.flexpaper_bttnFitWidth').addClass("flexpaper_tbbutton_disabled");
            getButton(e,'.flexpaper_bttnFitHeight').addClass("flexpaper_tbbutton_disabled");

            if(slider)
                slider.disable();
        }
        if(mode=="TwoPage"){
            getButton(e,'.flexpaper_bttnTwoPage').addClass("flexpaper_tbbutton_pressed");

            getButton(e,'.flexpaper_zoomSlider').addClass("flexpaper_tbbutton_disabled");
            getButton(e,'.flexpaper_txtZoomFactor').addClass("flexpaper_tbbutton_disabled");
            getButton(e,'.flexpaper_bttnFitWidth').addClass("flexpaper_tbbutton_disabled");
            getButton(e,'.flexpaper_bttnFitHeight').addClass("flexpaper_tbbutton_disabled");

            if(slider)
                slider.disable();
        }
        if(mode=="Portrait"){
            getButton(e,'.flexpaper_bttnSinglePage').addClass("flexpaper_tbbutton_pressed");

            getButton(e,'.flexpaper_zoomSlider').removeClass("flexpaper_tbbutton_disabled");
            getButton(e,'.flexpaper_txtZoomFactor').removeClass("flexpaper_tbbutton_disabled");
            getButton(e,'.flexpaper_bttnFitWidth').removeClass("flexpaper_tbbutton_disabled");
            getButton(e,'.flexpaper_bttnFitHeight').removeClass("flexpaper_tbbutton_disabled");

            if(slider)
                slider.enable();
        }
    });

    /**
     * Receives messages about the document being loaded
     *
     * @example onDocumentLoaded( 20 );
     *
     * @param int totalPages
     */
    jQuery('#documentViewer').bind('onDocumentLoaded',function(e,totalPages){
        getButton(e,'.flexpaper_lblTotalPages').html(" / " + totalPages);
        jQuery(".flexpaper_progress").hide();
    });

    /**
     * Receives messages about the page loaded
     *
     * @example onPageLoaded( 1 );
     *
     * @param int pageNumber
     */
    jQuery('#documentViewer').bind('onPageLoaded',function(e,pageNumber){
        jQuery(".flexpaper_progress").hide();
    });

    /**
     * Receives error messages when a document is not loading properly
     *
     * @example onDocumentLoadedError( "Network error" );
     *
     * @param String errorMessage
     */
    jQuery('#documentViewer').bind('onDocumentLoadedError',function(e,errMessage){

    });

    /**
     * Recieves progress information about the document being loaded
     *
     * @example onProgress( 100,10000 );
     *
     * @param int loaded
     * @param int total
     */
    jQuery('#documentViewer').bind('onProgress',function(e,loaded,total){

    });

    /**
     * Receives messages about the current page being changed
     *
     * @example onCurrentPageChanged( 10 );
     *
     * @param int pagenum
     */
    jQuery('#documentViewer').bind('onCurrentPageChanged',function(e,pagenum){
        getButton(e,'.flexpaper_txtPageNumber').val(pagenum);
    });


    jQuery(document).ready(function() {
        bindEventListeners();
    });


    /**
     * Receives messages about the current cursor changed
     *
     * @example onCursorModeChanged( "TextSelectorCursor" );
     *
     * @param String cursor
     */
    jQuery('#documentViewer').bind('onCursorModeChanged',function(e,cursor){
        jQuery(".flexpaper_bttnTextSelect, .flexpaper_bttnHand").removeClass("flexpaper_tbbutton_pressed");

        if(cursor == "TextSelectorCursor"){
            getButton(e,'.flexpaper_bttnTextSelect').addClass("flexpaper_tbbutton_pressed");
        }else{
            getButton(e,'.flexpaper_bttnHand').addClass("flexpaper_tbbutton_pressed");
        }
    });

    /**
     * Binds event listeners for the controls
     *
     */
    function bindEventListeners(){
        jQuery('.flexpaper_txtZoomFactor').bind('keypress', function(e) {
            if(e.keyCode==13){
                try{
                    var zf=jQuery(this).val().replace("%","")/100;
                    if(/^\d+$/.test(zf*100)){
                        $FlexPaper(instance).sliderChange(zf);
                    }
                }catch(exc){}
            }
        });

        jQuery(".flexpaper_txtSearchText, .flexpaper_txtSearch").bind('keypress', function(e) {
            if(e.keyCode==13){
                $FlexPaper(instance).searchText(jQuery(this).val());
            }
        });

        jQuery(".flexpaper_txtPageNumber").bind('keypress', function(e) {
            if(e.keyCode==13){
                try{$FlexPaper(instance).gotoPage(jQuery(this).val());}catch(exc){}
            }
        });
    }

    /**
     * Sets the fullscreen mode on the viewer
     *
     * @example setFullScreen(true)
     *
     * @param boolean val
     */
    function setFullScreen(val){
        if(val){
            jQuery("#bttnFullScreen").addClass("flexpaper_tbbutton_fullscreen_selected");
            window.FlexPaperFullScreen = true;
        }else{
            window.FlexPaperFullScreen = false;
        }
    }

    /**
     * Handles the event of external links getting clicked in the document.
     *
     * @example onExternalLinkClicked("http://www.google.com")
     *
     * @param String link
     */
    jQuery('#documentViewer').bind('onExternalLinkClicked',function(e,link){
       // alert("link " + link + " clicked" );
       window.location.href = link;
    });

    /**
     * jQuery OuterHTML
     * @param s
     * @return {*}
     */
    jQuery.fn.outerHTML = function(s) {
        return s
            ? this.before(s).remove()
            : jQuery("<p>").append(this.eq(0).clone()).html();
    };

    /**
     * shows FlexPaper in full screen
     *
     */
    jQuery.fn.showFullScreen = function()
    {
         var viewerId = jQuery(this).attr('id');

         var wrapper = jQuery(this).parent().get(0);
         var _this = this;
         var topMargin      = (jQuery(this).parent().children(0).height() / jQuery(this).parent().height()) * 100;
         var bottomMargin   = (jQuery(this).parent().children(2).height() / jQuery(this).parent().height()) * 100;

         if(window['ViewerMode'] == 'html'){
            $FlexPaper(viewerId).openFullScreen();
            return;
         }

         if(window.FlexPaperTrueFullscreen){
             if (document.cancelFullScreen) {
                 document.cancelFullScreen();
             } else if (document.mozCancelFullScreen) {
                 document.mozCancelFullScreen();
             } else if (document.webkitCancelFullScreen) { // safari disabled for now. doesn't work properly
                 document.webkitCancelFullScreen();
             }

             window.FlexPaperTrueFullscreen = false;
             return;
         }

         if(window.FlexPaperFullScreen)
         {
            window.close();
         }
         else
         {
             var conf = window['FlexPaperViewer_Instance'+viewerId].getConf();

             jQuery(this).parent().data('origStyle',jQuery(this).parent().attr('style'));

             if (document.documentElement.requestFullScreen) {
                 wrapper['requestFullScreen']();
                 jQuery(this).parent().css({position: 'absolute',left: '0px',top: '0px',width : '100%',height: '100%'});
                 jQuery('#'+viewerId).css({height: '93%'});
             } else if (document.documentElement.mozRequestFullScreen) {
                 wrapper['mozRequestFullScreen']();
                 jQuery(this).parent().css({position: 'absolute',left: '0px',top: '0px',width : '100%',height: '100%'});
                 jQuery('#'+viewerId).css({height: '93%'});
             } else if (document.documentElement.webkitRequestFullScreen) { // safari disabled for now. doesn't work properly
                 wrapper['webkitRequestFullScreen'](Element.ALLOW_KEYBOARD_INPUT);
                 jQuery(this).parent().css({position: 'absolute',left: '0px',top: '0px',width : '100%',height: '100%'}); // -bottomMargin not needed?
                 jQuery('#'+viewerId).css({height: '93%'});
             } else{
                 params  = 'toolbar=no, location=no, scrollbars=no, width='+screen.width;
                 params += ', height='+screen.height;
                 params += ', top=0, left=0'
                 params += ', fullscreen=yes';

                 nw=window.open('','windowname4', params);
                 nw.params = params;

                 var htmldata = '';

                 htmldata += '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
                 htmldata += '<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">';
                 htmldata += '<head>';
                 htmldata += '<link rel="stylesheet" type="text/css" href="css/flexpaper.css" />';
                 htmldata += '<scr'+'ipt type="text/javascript" src="js/jquery.min.js"></scr'+'ipt>';
                 htmldata += '<scr'+'ipt type="text/javascript" src="js/jquery.extensions.min.js"></scr'+'ipt>';
                 htmldata += '<scr'+'ipt type="text/javascript" src="js/flexpaper.js"></scr'+'ipt>';
                 htmldata += '<scr'+'ipt type="text/javascript" src="js/flexpaper_flashhandlers_htmlui.js"></scr'+'ipt>';
                 htmldata += '</head>';
                 htmldata += '<body onload="openViewer();">';
                 htmldata += '<div id="documentViewer" style="position:absolute;left:0px;top:0px;width:100%;height:100%;">';
                 htmldata += '</div>';
                 htmldata += '<scr'+'ipt type="text/javascript">';
                 htmldata += 'function openViewer(){';
                 htmldata += 'jQuery.get((!window.isTouchScreen)?"UI_flexpaper_desktop.html":"UI_flexpaper_mobile.html",';
                 htmldata += 'function(toolbarData) {';
                 htmldata += 'jQuery("#documentViewer").FlexPaperViewer(';
                 htmldata += '{ config : {';
                 htmldata += '';
                 htmldata += 'SWFFile : "' + conf.SwfFile + '",';
                 htmldata += 'IMGFiles : "' + conf.IMGFiles + '",';
                 htmldata += 'JSONFile : "' + conf.JSONFile + '",';
                 htmldata += 'PDFFile : "' + conf.PDFFile + '",';
                 htmldata += '';
                 htmldata += 'Scale : '+_this.scale+',';
                 htmldata += 'ZoomTransition : "' + conf.ZoomTransition + '",';
                 htmldata += 'ZoomTime : ' + conf.ZoomTime + ',';
                 htmldata += 'ZoomInterval : ' + conf.ZoomInterval + ',';
                 htmldata += 'FitPageOnLoad : ' + conf.FitPageOnLoad + ',';
                 htmldata += 'FitWidthOnLoad : ' + conf.FitWidthOnLoad + ',';
                 htmldata += 'FullScreenAsMaxWindow : ' + conf.FullScreenAsMaxWindow + ',';
                 htmldata += 'ProgressiveLoading : ' + conf.ProgressiveLoading + ',';
                 htmldata += 'MinZoomSize : ' + conf.MinZoomSize + ',';
                 htmldata += 'MaxZoomSize : ' + conf.MaxZoomSize + ',';
                 htmldata += 'SearchMatchAll : ' + conf.SearchMatchAll + ',';
                 htmldata += 'InitViewMode : "' + conf.InitViewMode + '",';
                 htmldata += 'RenderingOrder : "' + conf.RenderingOrder + '",';
                 htmldata += 'useCustomJSONFormat : ' + conf.useCustomJSONFormat + ',';
                 htmldata += 'JSONDataType : "' + conf.JSONDataType + '",';

                 htmldata += 'ViewModeToolsVisible : ' + conf.ViewModeToolsVisible + ',';
                 htmldata += 'ZoomToolsVisible : ' + conf.ZoomToolsVisible + ',';
                 htmldata += 'NavToolsVisible : ' + conf.NavToolsVisible + ',';
                 htmldata += 'CursorToolsVisible : ' + conf.CursorToolsVisible + ',';
                 htmldata += 'SearchToolsVisible : ' + conf.SearchToolsVisible + ',';
                 htmldata += 'UIConfig : "' + conf.UIConfig + '",';
                 htmldata += 'jsDirectory : "' + conf.jsDirectory + '",';
                 htmldata += 'cssDirectory : "' + conf.cssDirectory + '",';
                 htmldata += 'localeDirectory : "' + conf.localeDirectory + '",';
                 htmldata += 'Toolbar : toolbarData,'
                 htmldata += 'BottomToolbar : "' + conf.BottomToolbar + '",';
                 htmldata += 'key : "' + conf.key + '",';
                 htmldata += '';
                 htmldata += 'localeChain: "' + conf.localeChain + '"';
                 htmldata += '}});';
                 htmldata += '});';
                 htmldata += '}';
                 htmldata += '</scr'+'ipt>';
                 htmldata += '</body>';
                 htmldata += '</html>';

                 nw.document.write(htmldata);
                 nw.PendingFullScreen = true;

                 if (window.focus) {nw.focus()}
                 nw.document.close();
             }

             window.FlexPaperTrueFullscreen = true;

             setTimeout(function() {
                 $(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange',function(e){
                     if(jQuery(_this).parent().attr('style') != jQuery(_this).parent().data('origStyle')){ // need to exit full screen
                         jQuery(_this).parent().attr('style',jQuery(_this).parent().data('origStyle'));
                         $(document).unbind('webkitfullscreenchange mozfullscreenchange fullscreenchange');
                     }
                 });
             },1000);
         }
         return false;
    };

    function getLocaleValByName(localeRows,localeName,defaultval){
        for(var i=0;i<localeRows.length;i++){
            var cols = localeRows[i].split('=');
            if(cols[0] == localeName){
                return cols[1];
            }
        }

        if(defaultval){return defaultval};
        return null;
    };

    // load the locale selected
    jQuery.get(getFlashParam("localeDirectory")+getFlashParam("localeChain")+'/FlexPaper.txt', function(localeData) {
            var rows = localeData.split('\n');

            jQuery('.flexpaper_bttnPrint').attr('title',getLocaleValByName(rows,'Print'));
            jQuery('.flexpaper_bttnSinglePage').attr('title',getLocaleValByName(rows,'SinglePage'));
            jQuery('.flexpaper_bttnTwoPage, .flexpaper_bttnBookView').attr('title',getLocaleValByName(rows,"TwoPage"));
            jQuery('.flexpaper_bttnThumbView').attr('title',getLocaleValByName(rows,"ThumbView"));
            jQuery('.flexpaper_bttnFitWidth').attr('title',getLocaleValByName(rows,'FitWidth'));
            jQuery('.flexpaper_bttnFitHeight').attr('title',getLocaleValByName(rows,'FitHeight'));
            jQuery('.flexpaper_bttnFitHeight').attr('title',getLocaleValByName(rows,'FitPage'));
            jQuery('.flexpaper_zoomSlider').attr('title',getLocaleValByName(rows,'Scale'));
            jQuery('.flexpaper_txtZoomFactor').attr('title',getLocaleValByName(rows,'Scale'));
            jQuery('.flexpaper_bttnFullScreen, .flexpaper_bttnFullscreen').attr('title',getLocaleValByName(rows,'Fullscreen'));
            jQuery('.flexpaper_bttnPrevPage').attr('title',getLocaleValByName(rows,'PreviousPage'));
            jQuery('.flexpaper_txtPageNumber').attr('title',getLocaleValByName(rows,'CurrentPage'));
            jQuery('.flexpaper_bttnPrevNext').attr('title',getLocaleValByName(rows,'NextPage'));
            jQuery('.flexpaper_txtSearch').attr('title',getLocaleValByName(rows,'Search'));
            jQuery('.flexpaper_bttnFind').attr('title',getLocaleValByName(rows,'Search'));

            // annotations
            jQuery('.flexpaper_bttnHighlight').find('.flexpaper_tbtextbutton').html(getLocaleValByName(rows,'Highlight','Highlight'));
            jQuery('.flexpaper_bttnComment').find('.flexpaper_tbtextbutton').html(getLocaleValByName(rows,'Comment','Comment'));
            jQuery('.flexpaper_bttnStrikeout').find('.flexpaper_tbtextbutton').html(getLocaleValByName(rows,'Strikeout','Strikeout'));
            jQuery('.flexpaper_bttnDraw').find('.flexpaper_tbtextbutton').html(getLocaleValByName(rows,'Draw','Draw'));
            jQuery('.flexpaper_bttnDelete').find('.flexpaper_tbtextbutton').html(getLocaleValByName(rows,'Delete','Delete'));
            jQuery('.flexpaper_bttnShowHide').find('.flexpaper_tbtextbutton').html(getLocaleValByName(rows,'ShowAnnotations','Show Annotations'));
    });
});