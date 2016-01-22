
/*
 * Global player parameters & tracking data
 */

var playerData = {
    reportUrl: '',
    slidesPerIndexPage: 20,
    sessionId: '',
    talkId: 0,
    maxLen: 0,
    startTimecode: null,
    endTimecode: null,
    slides: null,
    isFlashPlayer: null,
    isPlaying: false,
    currentSlide: -1,
    watchedDuration: 0,
    watchedMaxTimecode: 0
}


/*
 * Functions to interface with page & non-player elements
 */

function bindPageNavigationAndSlideIndex()
{
    $('#talkPlayerShowHideNavButton').show().on('click', function() {
        return togglePageNavigation();
    });

    $('#talkPlayerSlideIndexButton').show().on('click', function() {
        return toggleSlideIndex();
    });
}

function togglePageNavigation()
{
    var navShowing = ShowHideNavbar();

    $('#talkPlayerShowHideNavButton span').html(navShowing ? 'Player Only' : 'Full Page');
    return false;
}

function toggleSlideIndex()
{
    $('#ovpTalkPlayerSlideIndex').toggle('fast');
    return false;
}

function activateSlideIndex(slides, maxLen)
{
    var firstUnavailableSlide = slides.length;

    if (maxLen > 0)
    {
        for (var i = 0; i < slides.length; i++)
        {
            if (slides[i].timecode > maxLen)
            {
                firstUnavailableSlide = i;
                break;
            }
        }
    }

    $('#ovpTalkPlayerSlideIndex ol li:lt(' + firstUnavailableSlide + ')')
        .removeClass('disabled')
        .each(function(idx, elem) {
            var slideIndex = idx;
            $(this).off('click').on('click', function() { jumpToSlide(slideIndex); return false; })
        });
}

function highlightSlide(slide)
{
    showSlideIndexForPage(Math.floor(slide / playerData.slidesPerIndexPage));
    $('#ovpTalkPlayerSlideIndex ol li').removeClass('active');
    $('#ovpTalkPlayerSlideIndex ol li:nth-child(' + (slide + 1) + ')').addClass('active');
}

function jumpToSlide(slide)
{
    flashSeek(playerData.slides[slide].timecode);
    return false;
}

function showSlideIndexForPage(page)
{
    var min = page * playerData.slidesPerIndexPage;
    var max = min + playerData.slidesPerIndexPage;

    $('#ovpTalkPlayerSlideIndex ol li').css({ visibility:'hidden', position:'absolute' });
    $('#ovpTalkPlayerSlideIndex ol li').slice(min, max).css({ visibility:'visible', position:'' });
    return false;
}

function displayTalkOverlay(show)
{
    if (show)
    {
        flashExitFullScreen();
        flashSeekStart();
        flashPause();
        ShowTalkOverlay();
    }
    else
    {
        HideTalkOverlay();
    }
}

function isTalkOverlayShowing()
{
    return IsTalkOverlayShowing();
}

/*
 * Functions to pause, play and restart the player.
 */

function flashPause()
{
    if (window.kdp && !isTalkOverlayShowing())
    {
        window.kdp.sendNotification('doPause');
    }
}

function flashPlay()
{
    if (window.kdp && !isTalkOverlayShowing())
    {
        window.kdp.sendNotification('doPlay');
    }
}

function flashSeek(timecode)
{
    if (window.kdp && !isTalkOverlayShowing())
    {
        window.kdp.sendNotification('doSeek', timecode);
    }
}

function flashSeekStart()
{
    flashSeek(0);
}

function flashRestart()
{
    displayTalkOverlay(false);
    flashSeekStart();
    flashPlay();
}

function flashExitFullScreen()
{
    if (window.kdp)
    {
        window.kdp.sendNotification('closeFullScreen');
    }
}

/*
 * Functions for Kaltura event callbacks & processing
 */

function log(v)
{
    console.log(v);
}

function jsCallbackReady(objectId)
{
    //alert(objectId);
    window.kdp = document.getElementById(objectId);
    window.kdp.addJsListener("kdpReady", "playerReady");
    window.kdp.addJsListener("playerUpdatePlayhead", "playerUpdatedPlayhead");
    window.kdp.addJsListener("playerPaused", "playerPaused");
    window.kdp.addJsListener("playerPlayed", "playerPlayed");
    window.kdp.addJsListener("playerPlayEnd", "playerPlayEnd");
    window.kdp.addJsListener("freePreviewEnd", "freePreviewEnd");
    window.kdp.addJsListener("hasOpenedFullScreen", "hasOpenedFullScreen");
    window.kdp.addJsListener("hasCloseFullScreen", "hasCloseFullScreen");

    // If this is the HTML5 player, we need to set the appropriate CSS
    // for the lower player buttons

    if (!$(window.kdp).is('object'))
    {
        $('#talkPlayerLowerControls').addClass('mobilePlayer');
    }
}

function playerReady(id)
{
    playerData.isFlashPlayer = (window.kdp.nodeName.toUpperCase() == 'OBJECT');
    if (!playerData.isFlashPlayer)
    {
        $('#ovpTalkPlayerCaption').addClass('html5Player');
    }

    window.kdp.tabIndex = 0;
    window.kdp.focus();
}

function playerUpdatedPlayhead(data, id) {
    // data = the player's progress time in seconds
    // id = the ID of the player that fired the notification

    if (playerData.startTimecode)
    {
        flashSeek(playerData.startTimecode);
        playerData.startTimecode = null;
    }

    var slideChanged = setCurrentSlide(data);
    if (slideChanged)
    {
        updateSlideCaption();
    }

    if (data > playerData.watchedMaxTimecode)
    {
        playerData.watchedMaxTimecode = data;
    }

    if (playerData.maxLen >= 0 && data >= playerData.maxLen)
    {
        displayTalkOverlay(true);
    }

    if (playerData.endTimecode && data >= playerData.endTimecode && data <= (playerData.endTimecode + 1))
    {
        flashPause();
        playerData.endTimecode = null;
    }
}

function playerPaused(id)
{
    playerData.isPlaying = false;
}

function playerPlayed(id)
{
    playerData.isPlaying = true;
}

function playerPlayEnd(id)
{
    playerData.isPlaying = false;
    displayTalkOverlay(true);
}

function freePreviewEnd(id)
{
    playerData.isPlaying = false;
    displayTalkOverlay(true);
}

function hasOpenedFullScreen(id)
{
}

function hasCloseFullScreen(id)
{
}

function customFunc1(id)
{
    togglePageNavigation();
}

/*
 * Duration + timecode tracking
 */

function trackingIncrementDuration()
{
    if (playerData.isPlaying)
    {
        playerData.watchedDuration++;
    }
}

function trackingReportStats()
{
    var url = playerData.reportUrl;
    url += 'talk_session_id=' + playerData.sessionId + '&talk=' + playerData.talkId;
    url += '&duration=' + playerData.watchedDuration + '&timecode=' + playerData.watchedMaxTimecode;
    url += '&cache=' + (new Date().getTime());

    var ajax = new AJAX();
    ajax.Send(url);
}

/*
 * Slide management & info
 */

function findSlideIndexForTimecode(currentTimecode)
{
    var min = 0;
    var max = playerData.slides.length;

    while (max > min)
    {
        var mid = Math.ceil((max + min) / 2);

        if (playerData.slides[mid].timecode > currentTimecode)
        {
            max = mid - 1;
        }
        else
        {
            min = mid;
        }
    }

    return min;
}

function getTimecodeRangeForSlide(slide)
{
    if (slide < 0)
    {
        return [-1, -1];
    }
    else if (slide >= playerData.slides.length - 1)
    {
        return [playerData.slides[playerData.slides.length - 1].timecode, Number.MAX_VALUE];
    }
    else
    {
        return [playerData.slides[slide].timecode, playerData.slides[slide+1].timecode];
    }
}

function setCurrentSlide(timecode)
{
    range = getTimecodeRangeForSlide(playerData.currentSlide);

    if (timecode < range[0] || timecode >= range[1])
    {
        playerData.currentSlide = findSlideIndexForTimecode(timecode);
        highlightSlide(playerData.currentSlide);
        return true;
    }

    return false;
}

function updateSlideCaption()
{
    $('#ovpTalkPlayerCaption').html(playerData.slides[playerData.currentSlide].caption);
}

/*
 * Entry point
 */

function launchKalturaPlayer(authUrl, reportUrl, startPaused, startTimecode, endTimecode, unixTime, streaming, noExtraButtons, noCaptions)
{
    showSlideIndexForPage(0);

    if (streaming == 'progressive' || streaming == 'http')
    {
        streaming = 'http';
    }
    else if (streaming == 'akamai' || streaming == 'hdnetwork')
    {
        streaming = 'hdnetwork';
    }
    else if (streaming == 'hds' || streaming == 'hdnetworkmanifest')
    {
        streaming = 'hdnetworkmanifest';
    }
    else if (streaming == 'rtmp')
    {
        streaming = 'rtmp';
    }
    else
    {
        streaming = 'auto';
    }

    //console.log('Kaltura streaming type: ' + streaming);

    playerData.reportUrl = reportUrl;

    var callback = function(text, headers)
    {
        result = JSON.parse(text);

        if (!result.result || !result.talks[0].entry)
        {
            $('#ovpTalkPlayerErrorPanel').fadeIn('fast');
            return;
        }

        playerData.sessionId = result.talk_session_id;
        playerData.talkId = result.talks[0].talk_id;
        playerData.maxLen = result.talks[0].maxlen;
        playerData.startTimecode = startTimecode;
        playerData.endTimecode = endTimecode;
        playerData.slides = result.talks[0].slides;

        activateSlideIndex(playerData.slides, playerData.maxLen);

        if (!noExtraButtons)
        {
            bindPageNavigationAndSlideIndex();
        }

        var flashVars = {
            'akamaiHD.loadingPolicy': 'preInitialize',
            'akamaiHD.asyncInit': true,
            'streamerType': streaming,
            'disableExternalInterface': false,
            'autoPlay': (!startPaused && !Effects.isMobileDevice())
        };

        if (noCaptions)
        {
            flashVars['ccOverComboBox.visible'] = false;
        }

        if (result.ks)
        {
            flashVars.ks = result.ks;
        }

        kWidget.embed({
            'targetId': 'ovpTalkPlayer',
            'wid': '_1271591',
            'uiconf_id': 13324382,
            'cache_st': unixTime,
            'entry_id': result.talks[0].entry,
            'flashvars': flashVars,
            'params': {
                // params allows you to set flash embed params such as wmode, allowFullScreen etc
                'wmode': 'opaque'
            }
        });

        setInterval(trackingIncrementDuration, 1000);
        setInterval(trackingReportStats, 60 * 1000);
    };

    var ajax = new AJAX(callback);
    ajax.Send(authUrl);
}


