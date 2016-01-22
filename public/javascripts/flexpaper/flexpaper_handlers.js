jQuery(function() {
  /**
   * Handles the event of external links getting clicked in the document.
   *
   * @example onExternalLinkClicked("http://www.google.com")
   *
   * @param String link
   */
  jQuery('#documentViewer').bind('onExternalLinkClicked', function(e, link) {
    window.open(link, '_flexpaper_exturl');
  });

  /**
   * Recieves progress information about the document being loaded
   *
   * @example onProgress( 100,10000 );
   *
   * @param int loaded
   * @param int total
   */
  jQuery('#documentViewer').bind('onProgress', function(e, loadedBytes, totalBytes) {

  });

  /**
   * Handles the event of a document is in progress of loading
   *
   */
  jQuery('#documentViewer').bind('onDocumentLoading', function(e) {
    //jQuery('.flexpaper_bttnShowHide').addClass('flexpaper_tbtextbutton_pressed');
    if ($('#documentViewer') && !$('#documentViewer').hasClass('small') && !$('#documentViewer').hasClass('medium')) {
      $('.flexpaper_viewer_container').css('width', '100%').css('max-width', '100%');
      $('.flexpaper_viewer_container').css('height', '100%').css('max-height', '100%');
    }
    var id = jQuery(this).data('AnalyticsId');
    var topicId = jQuery(this).data('TopicId');
    $.ajax({
      type: "GET",
      url: '/userdata/' + id + '/annotations?type=pdf&topic_id=' + topicId,
      dataType: 'json',
      success: function(data) {
        if (window.$FlexPaper && $FlexPaper('documentViewer')) {
          $FlexPaper('documentViewer').addMarks(data);
        }
      }
    });
  });

  /**
   * Handles the event of a document is in progress of loading
   *
   */
  jQuery('#documentViewer').bind('onPageLoading', function(e, pageNumber) {
  });

  /**
   * Receives messages about the current page being changed
   *
   * @example onCurrentPageChanged( 10 );
   *
   * @param int pagenum
   */
  jQuery('#documentViewer').bind('onCurrentPageChanged', function(e, pageNumber) {
    /*
     if(jQuery(this).data('TrackingNumber')){
     var _gaq = window._gaq || [];window._gaq=_gaq;
     var trackingDoc = jQuery(this).data('TrackingDocument');
     var pdfFileName = trackingDoc.substr(0,trackingDoc.indexOf(".pdf")+4);

     _gaq.push(['_setAccount', jQuery(this).data('TrackingNumber')]);
     _gaq.push(['_trackEvent', 'PDF Documents', 'Page View', pdfFileName + ' - page ' + pageNumber]);

     (function() {
     var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
     ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
     var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
     })();
     }
     */
    if (jQuery(this).data('AnalyticsId')) {
      var id = jQuery(this).data('AnalyticsId');
      var topicId = jQuery(this).data('TopicId');
      $.get('/pdf_track?id=' + id + '&page=' + pageNumber + '&e=scroll&topic_id=' + topicId);
      if ($.postMessage) {
        $.postMessage(JSON.stringify({
          techName: 'pdf', lbit_id: id,
          topic_id: topicId, currentPage: pageNumber
        }), '*', parent);
      }
    }
  });

  /**
   * Receives messages about the document being loaded
   *
   * @example onDocumentLoaded( 20 );
   *
   * @param int totalPages
   */
  jQuery('#documentViewer').bind('onDocumentLoaded', function(e, totalPages) {
  });

  /**
   * Receives messages about the page loaded
   *
   * @example onPageLoaded( 1 );
   *
   * @param int pageNumber
   */
  jQuery('#documentViewer').bind('onPageLoaded', function(e, pageNumber) {
    if ($.postMessage) {
      var id = jQuery(this).data('AnalyticsId');
      var topicId = jQuery(this).data('TopicId');
      $.postMessage(JSON.stringify({
        techName: 'pdf', lbit_id: id,
        topic_id: topicId, currentPage: pageNumber
      }), '*', parent);
    }
  });

  /**
   * Receives messages about the page loaded
   *
   * @example onErrorLoadingPage( 1 );
   *
   * @param int pageNumber
   */
  jQuery('#documentViewer').bind('onErrorLoadingPage', function(e, pageNumber) {
    var id = jQuery(this).data('AnalyticsId');
    var topicId = jQuery(this).data('TopicId');
    $.get('/pdf_track?id=' + id + '&page=' + pageNumber + '&e=error&topic_id=' + topicId);
  });

  /**
   * Receives error messages when a document is not loading properly
   *
   * @example onDocumentLoadedError( "Network error" );
   *
   * @param String errorMessage
   */
  jQuery('#documentViewer').bind('onDocumentLoadedError', function(e, errMessage) {
    var id = jQuery(this).data('AnalyticsId');
    var topicId = jQuery(this).data('TopicId');
    $.get('/pdf_track?id=' + id + '&msg=' + errMessage + '&e=docloadError&topic_id=' + topicId);
  });

  /**
   * Receives error messages when a document has finished printed
   *
   * @example onDocumentPrinted();
   *
   */
  jQuery('#documentViewer').bind('onDocumentPrinted', function(e) {
    var id = jQuery(this).data('AnalyticsId');
    var topicId = jQuery(this).data('TopicId');
    $.get('/pdf_track?id=' + id + '&e=print&topic_id=' + topicId);
  });

  /**
   * Handles the event of annotations getting clicked.
   *
   * @example onMarkClicked(object)
   *
   * @param Object mark that was clicked
   */
  jQuery('#documentViewer').bind('onMarkClicked', function(e, mark) {

  });

  /**
   * Handles the event of annotations getting clicked.
   *
   * @example onMarkCreated(object)
   *
   * @param Object mark that was created
   */
  jQuery('#documentViewer').bind('onMarkCreated', function(e, mark) {
    var id = jQuery(this).data('AnalyticsId');
    var topicId = jQuery(this).data('TopicId');
    var sessionid = (window.socket && window.socket.socket && window.socket.socket.sessionid) ? window.socket.socket.sessionid : null;
    $.ajax({
      type: "POST",
      url: '/userdata/' + id + '/annotations',
      data: JSON.stringify({annotationData: mark, topicId: topicId, sessionid: sessionid}),
      contentType: 'application/json',
      dataType: 'json',
      success: function(data) {
        mark.annotationId = data.annotationId;
      }
    });
  });

  /**
   * Handles the event of annotations getting clicked.
   *
   * @example onMarkDeleted(object)
   *
   * @param Object mark that was deleted
   */
  jQuery('#documentViewer').bind('onMarkDeleted', function(e, mark) {
    if (mark.annotationId) {
      if (window.updatedAnnotationId && (window.updatedAnnotationId == mark.annotationId)) {
        window.updatedAnnotationId = null;
        return;
      }
      var id = jQuery(this).data('AnalyticsId');
      var topicId = jQuery(this).data('TopicId');
      var sessionid = (window.socket && window.socket.socket && window.socket.socket.sessionid) ? window.socket.socket.sessionid : null;
      mark.note = null;
      $.ajax({
        type: "DELETE",
        url: '/userdata/' + id + '/annotations/' + mark.annotationId,
        data: JSON.stringify({annotationData: mark, topicId: topicId, sessionid: sessionid}),
        contentType: 'application/json',
        dataType: 'json'
      });
    }
  });

  /**
   * Handles the event of annotations getting clicked.
   *
   * @example onMarkChanged(object)
   *
   * @param Object mark that was changed
   */
  jQuery('#documentViewer').bind('onMarkChanged', function(e, mark) {
    if (mark.annotationId) {
      var id = jQuery(this).data('AnalyticsId');
      var topicId = jQuery(this).data('TopicId');
      var sessionid = (window.socket && window.socket.socket && window.socket.socket.sessionid) ? window.socket.socket.sessionid : null;
      $.ajax({
        type: "PUT",
        url: '/userdata/' + id + '/annotations/' + mark.annotationId,
        data: JSON.stringify({annotationData: mark, topicId: topicId, sessionid: sessionid}),
        contentType: 'application/json',
        dataType: 'json'
      });
    }
  });
});


