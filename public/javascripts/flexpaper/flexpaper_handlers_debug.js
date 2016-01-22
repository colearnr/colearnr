/**
 * Helper function for appending the output log
 */
function appendLog(val){
	jQuery("#txt_eventlog").val(val + '\n' + jQuery("#txt_eventlog").val());
}

jQuery(function() {
    /**
     * Handles the event of external links getting clicked in the document.
     *
     * @example onExternalLinkClicked("http://www.google.com")
     *
     * @param String link
     */
    jQuery('#documentViewer').bind('onExternalLinkClicked',function(e,link){
        jQuery("#txt_eventlog").val('onExternalLinkClicked:' + link + '\n' + jQuery("#txt_eventlog").val());

        window.open(link,'_flexpaper_exturl');
    });

    /**
     * Recieves progress information about the document being loaded
     *
     * @example onProgress( 100,10000 );
     *
     * @param int loaded
     * @param int total
     */
    jQuery('#documentViewer').bind('onProgress',function(e,loadedBytes,totalBytes){
        jQuery("#txt_progress").val('onProgress:' + loadedBytes + '/' + totalBytes + '\n');
    });

    /**
     * Handles the event of a document is in progress of loading
     *
     */
    jQuery('#documentViewer').bind('onDocumentLoading',function(e){
        jQuery("#txt_eventlog").val('onDocumentLoading' + '\n' + jQuery("#txt_eventlog").val());
    });

    /**
     * Handles the event of a document is in progress of loading
     *
     */
    jQuery('#documentViewer').bind('onPageLoading',function(e,pageNumber){
        jQuery("#txt_eventlog").val('onPageLoading:' + pageNumber + '\n' + jQuery("#txt_eventlog").val());
    });

    /**
     * Receives messages about the current page being changed
     *
     * @example onCurrentPageChanged( 10 );
     *
     * @param int pagenum
     */
    jQuery('#documentViewer').bind('onCurrentPageChanged',function(e,pagenum){
        jQuery("#txt_eventlog").val('onCurrentPageChanged:' + pagenum + '\n' + jQuery("#txt_eventlog").val());
    });

    /**
     * Receives messages about the document being loaded
     *
     * @example onDocumentLoaded( 20 );
     *
     * @param int totalPages
     */
    jQuery('#documentViewer').bind('onPageLoaded',function(e,pageNumber){

    });

    jQuery('#documentViewer').bind('onDocumentLoaded',function(e,totalPages){
        chainOfMethods();
    });


    /**
     * Receives messages about the page loaded
     *
     * @example onErrorLoadingPage( 1 );
     *
     * @param int pageNumber
     */
    jQuery('#documentViewer').bind('onErrorLoadingPage',function(e,pageNumber){
        jQuery("#txt_eventlog").val('onErrorLoadingPage:' + pageNumber + '\n' + jQuery("#txt_eventlog").val());
    });

    /**
     * Receives error messages when a document is not loading properly
     *
     * @example onDocumentLoadedError( "Network error" );
     *
     * @param String errorMessage
     */
    jQuery('#documentViewer').bind('onDocumentLoadedError',function(e,errMessage){
        jQuery("#txt_eventlog").val('onDocumentLoadedError:' + errMessage + '\n' + jQuery("#txt_eventlog").val());
    });

    /**
     * Receives error messages when a document has finished printed
     *
     * @example onDocumentPrinted();
     *
     */
    jQuery('#documentViewer').bind('onDocumentPrinted',function(e){
        jQuery("#txt_eventlog").val('onDocumentPrinted\n' + jQuery("#txt_eventlog").val());
    });

    /**
     * Handles the event of annotations getting clicked.
     *
     * @example onMarkClicked(object)
     *
     * @param Object mark that was clicked
     */
    jQuery('#documentViewer').bind('onMarkClicked',function(e,mark){
        appendLog('onMarkClicked:' + mark);
    });

    /**
     * Handles the event of annotations getting clicked.
     *
     * @example onMarkCreated(object)
     *
     * @param Object mark that was created
     */
    jQuery('#documentViewer').bind('onMarkCreated',function(e,mark){
        appendLog('onMarkCreated:' + mark);
    });

    /**
     * Handles the event of annotations getting clicked.
     *
     * @example onMarkDeleted(object)
     *
     * @param Object mark that was deleted
     */
    jQuery('#documentViewer').bind('onMarkDeleted',function(e,mark){
        appendLog('onMarkDeleted:' + mark);
    });

    /**
     * Handles the event of annotations getting clicked.
     *
     * @example onMarkChanged(object)
     *
     * @param Object mark that was changed
     */
    jQuery('#documentViewer').bind('onMarkChanged',function(e,mark){
        appendLog('onMarkChanged:' + mark);
    });


    /**
     * Handles the event of selected mark being changed
     *
     * @example onSelectedMarkChanged(object)
     *
     * @param Object mark that was selected
     */
    jQuery('#documentViewer').bind('onSelectedMarkChanged',function(e,mark){
        appendLog('onSelectedMarkChanged:' + mark);
    });
});





function chainOfMethods(){
	var viewer = $FlexPaper('documentViewer');

    var mark3 = new Object();
    mark3.type = 'drawing';
    mark3.color = '#fa1100';
    mark3.pageIndex = 1;
    mark3.id = 'blah';
    mark3.points = '274.41,972.65:275.6,972.65:279.16,972.65:285.1,972.65:293.42,970.27:310.05,966.71:324.3,964.33:336.18,963.14:350.44,959.57:364.69,956:380.14,953.63:397.95,951.25:408.65,947.68:419.34,945.3:426.46,944.11:431.22,942.93:437.16,941.74:438.34,940.55:440.72,940.55:441.91,940.55:443.1,940.55:444.28,939.36:446.66,939.36:450.22,939.36:453.79,936.98:457.35,934.6:463.29,932.22:469.23,929.85:475.17,927.47:481.11,926.28:482.3,926.28:483.48,925.09:484.67,925.09:483.48,925.09:482.3,925.09:481.11,925.09:477.55,925.09:473.98,925.09:468.04,925.09:462.1,922.71:454.97,921.52:450.22,920.33:446.66,920.33:443.1,920.33:441.91,919.14:440.72,919.14:439.53,919.14:438.34,919.14:437.16,919.14:437.16,919.14:438.34,919.14:440.72,919.14:446.66,919.14:450.22,919.14:454.97,919.14:458.54,919.14:462.1,919.14:465.67,919.14:469.23,919.14:472.79,919.14:475.17,919.14:476.36,920.33:478.73,920.33:479.92,920.33:479.92,921.52:481.11,921.52:482.3,922.71:482.3,923.9:482.3,925.09:482.3,926.28:482.3,926.28:481.11,928.66:478.73,932.22:476.36,936.98:475.17,940.55:472.79,945.3:470.42,950.06:469.23,952.44:469.23,954.82:469.23,956:466.85,956';
    mark3.displayFormat = 'html';

    var sampleList = new Array(mark3);
    viewer.addMarks(sampleList);

	viewer.addMark({type:'note', note: 'The annotations plug-in allows both highlighting and notes to be created\n\nNotes can be resized, moved and deleted.',positionX:-5,positionY:330,width:200,height:180,pageIndex:2,collapsed:false,displayFormat:'html'});
	viewer.addMark({type:'note', note: 'The plug-in features a full set of API functions which can be used to interact with the viewer so that annotations can be stored and recreated later.',positionX:530,positionY:150,width:200,height:180,pageIndex:1,collapsed:false,displayFormat:'html'});
	viewer.addMark({type:'highlight', selection_info: '1;0;20',has_selection:false,color:'#facd56'});
	viewer.addMark({type:'highlight', selection_info: '3;23;58',has_selection:false,color:'#fffc15'});
    viewer.addMark({type:'highlight', selection_info: '5;1;20',has_selection:false,color:'#fffc15'});

	var mark1 = new Object();
	mark1.type = 'highlight';
	mark1.selection_info = '5;9;195';
	mark1.color =  "#fffc15";

	var mark2 = new Object();
	mark2.type = 'highlight';
	mark2.selection_info = '5;581;767';
	mark2.color =  "#fffc15";
}