(function (factory) {
  /* global define */
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else {
    // Browser globals: jQuery
    factory(window.jQuery);
  }
}(function ($) {
  // template
  var tmpl = $.summernote.renderer.getTemplate();
  var editor = $.summernote.eventHandler.getEditor();
  // core functions: range, dom
  var range = $.summernote.core.range;
  var dom = $.summernote.core.dom;

  var KEY = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    ENTER: 13
  };
  var COLUMN_LENGTH = 20;
  var COLUMN_WIDTH = 28;

  var currentColumn, currentRow, totalColumn, totalRow = 0;

  // emojiOne characters data set
  // to get list execute following on each tab of http://emojione.com/demo
  // $('#emoji-list li a').each(function(e){console.log('{ shortname: "' + $(this).data('shortname') + '", title: "' + $(this).attr('title') +'"},')})
  var emojiOneCharDataSet = {
    people: {
      title: 'People', icon: 'smile-o', icons: [
      { shortname: ":grinning:", title: "grinning face"},
      { shortname: ":grin:", title: "grinning face with smiling eyes"},
      { shortname: ":joy:", title: "face with tears of joy"},
      { shortname: ":smiley:", title: "smiling face with open mouth"},
      { shortname: ":smile:", title: "smiling face with open mouth and smiling eyes"},
      { shortname: ":sweat_smile:", title: "smiling face with open mouth and cold sweat"},
      { shortname: ":laughing:", title: "smiling face with open mouth and tightly-closed eyes"},
      { shortname: ":innocent:", title: "smiling face with halo"},
      { shortname: ":smiling_imp:", title: "smiling face with horns"},
      { shortname: ":imp:", title: "imp"},
      { shortname: ":wink:", title: "winking face"},
      { shortname: ":blush:", title: "smiling face with smiling eyes"},
      { shortname: ":relaxed:", title: "white smiling face"},
      { shortname: ":yum:", title: "face savouring delicious food"},
      { shortname: ":relieved:", title: "relieved face"},
      { shortname: ":heart_eyes:", title: "smiling face with heart-shaped eyes"},
      { shortname: ":sunglasses:", title: "smiling face with sunglasses"},
      { shortname: ":smirk:", title: "smirking face"},
      { shortname: ":neutral_face:", title: "neutral face"},
      { shortname: ":expressionless:", title: "expressionless face"},
      { shortname: ":unamused:", title: "unamused face"},
      { shortname: ":sweat:", title: "face with cold sweat"},
      { shortname: ":pensive:", title: "pensive face"},
      { shortname: ":confused:", title: "confused face"},
      { shortname: ":confounded:", title: "confounded face"},
      { shortname: ":kissing:", title: "kissing face"},
      { shortname: ":kissing_heart:", title: "face throwing a kiss"},
      { shortname: ":kissing_smiling_eyes:", title: "kissing face with smiling eyes"},
      { shortname: ":kissing_closed_eyes:", title: "kissing face with closed eyes"},
      { shortname: ":stuck_out_tongue:", title: "face with stuck-out tongue"},
      { shortname: ":stuck_out_tongue_winking_eye:", title: "face with stuck-out tongue and winking eye"},
      { shortname: ":stuck_out_tongue_closed_eyes:", title: "face with stuck-out tongue and tightly-closed eyes"},
      { shortname: ":disappointed:", title: "disappointed face"},
      { shortname: ":worried:", title: "worried face"},
      { shortname: ":angry:", title: "angry face"},
      { shortname: ":rage:", title: "pouting face"},
      { shortname: ":cry:", title: "crying face"},
      { shortname: ":persevere:", title: "persevering face"},
      { shortname: ":triumph:", title: "face with look of triumph"},
      { shortname: ":disappointed_relieved:", title: "disappointed but relieved face"},
      { shortname: ":frowning:", title: "frowning face with open mouth"},
      { shortname: ":anguished:", title: "anguished face"},
      { shortname: ":fearful:", title: "fearful face"},
      { shortname: ":weary:", title: "weary face"},
      { shortname: ":sleepy:", title: "sleepy face"},
      { shortname: ":tired_face:", title: "tired face"},
      { shortname: ":grimacing:", title: "grimacing face"},
      { shortname: ":sob:", title: "loudly crying face"},
      { shortname: ":open_mouth:", title: "face with open mouth"},
      { shortname: ":hushed:", title: "hushed face"},
      { shortname: ":cold_sweat:", title: "face with open mouth and cold sweat"},
      { shortname: ":scream:", title: "face screaming in fear"},
      { shortname: ":astonished:", title: "astonished face"},
      { shortname: ":flushed:", title: "flushed face"},
      { shortname: ":sleeping:", title: "sleeping face"},
      { shortname: ":dizzy_face:", title: "dizzy face"},
      { shortname: ":no_mouth:", title: "face without mouth"},
      { shortname: ":mask:", title: "face with medical mask"},
      { shortname: ":slight_frown:", title: "slightly frowning face"},
      { shortname: ":slight_smile:", title: "slightly smiling face"},
      { shortname: ":smile_cat:", title: "grinning cat face with smiling eyes"},
      { shortname: ":joy_cat:", title: "cat face with tears of joy"},
      { shortname: ":smiley_cat:", title: "smiling cat face with open mouth"},
      { shortname: ":heart_eyes_cat:", title: "smiling cat face with heart-shaped eyes"},
      { shortname: ":smirk_cat:", title: "cat face with wry smile"},
      { shortname: ":kissing_cat:", title: "kissing cat face with closed eyes"},
      { shortname: ":pouting_cat:", title: "pouting cat face"},
      { shortname: ":crying_cat_face:", title: "crying cat face"},
      { shortname: ":scream_cat:", title: "weary cat face"},
      { shortname: ":footprints:", title: "footprints"},
      { shortname: ":bust_in_silhouette:", title: "bust in silhouette"},
      { shortname: ":busts_in_silhouette:", title: "busts in silhouette"},
      { shortname: ":levitate:", title: "man in business suit levitating"},
      { shortname: ":spy:", title: "sleuth or spy"},
      { shortname: ":baby:", title: "baby"},
      { shortname: ":boy:", title: "boy"},
      { shortname: ":girl:", title: "girl"},
      { shortname: ":man:", title: "man"},
      { shortname: ":woman:", title: "woman"},
      { shortname: ":family:", title: "family"},
      { shortname: ":family_mwg:", title: "family (man,woman,girl)"},
      { shortname: ":family_mwgb:", title: "family (man,woman,girl,boy)"},
      { shortname: ":family_mwbb:", title: "family (man,woman,boy,boy)"},
      { shortname: ":family_mwgg:", title: "family (man,woman,girl,girl)"},
      { shortname: ":family_wwb:", title: "family (woman,woman,boy)"},
      { shortname: ":family_wwg:", title: "family (woman,woman,girl)"},
      { shortname: ":family_wwgb:", title: "family (woman,woman,girl,boy)"},
      { shortname: ":family_wwbb:", title: "family (woman,woman,boy,boy)"},
      { shortname: ":family_wwgg:", title: "family (woman,woman,girl,girl)"},
      { shortname: ":family_mmb:", title: "family (man,man,boy)"},
      { shortname: ":family_mmg:", title: "family (man,man,girl)"},
      { shortname: ":family_mmgb:", title: "family (man,man,girl,boy)"},
      { shortname: ":family_mmbb:", title: "family (man,man,boy,boy)"},
      { shortname: ":family_mmgg:", title: "family (man,man,girl,girl)"},
      { shortname: ":couple:", title: "man and woman holding hands"},
      { shortname: ":two_men_holding_hands:", title: "two men holding hands"},
      { shortname: ":two_women_holding_hands:", title: "two women holding hands"},
      { shortname: ":dancers:", title: "woman with bunny ears"},
      { shortname: ":bride_with_veil:", title: "bride with veil"},
      { shortname: ":person_with_blond_hair:", title: "person with blond hair"},
      { shortname: ":man_with_gua_pi_mao:", title: "man with gua pi mao"},
      { shortname: ":man_with_turban:", title: "man with turban"},
      { shortname: ":older_man:", title: "older man"},
      { shortname: ":older_woman:", title: "older woman"},
      { shortname: ":cop:", title: "police officer"},
      { shortname: ":construction_worker:", title: "construction worker"},
      { shortname: ":princess:", title: "princess"},
      { shortname: ":guardsman:", title: "guardsman"},
      { shortname: ":angel:", title: "baby angel"},
      { shortname: ":santa:", title: "father christmas"},
      { shortname: ":ghost:", title: "ghost"},
      { shortname: ":japanese_ogre:", title: "japanese ogre"},
      { shortname: ":japanese_goblin:", title: "japanese goblin"},
      { shortname: ":poop:", title: "pile of poo"},
      { shortname: ":skull:", title: "skull"},
      { shortname: ":alien:", title: "extraterrestrial alien"},
      { shortname: ":space_invader:", title: "alien monster"},
      { shortname: ":bow:", title: "person bowing deeply"},
      { shortname: ":information_desk_person:", title: "information desk person"},
      { shortname: ":no_good:", title: "face with no good gesture"},
      { shortname: ":ok_woman:", title: "face with ok gesture"},
      { shortname: ":raising_hand:", title: "happy person raising one hand"},
      { shortname: ":person_with_pouting_face:", title: "person with pouting face"},
      { shortname: ":person_frowning:", title: "person frowning"},
      { shortname: ":massage:", title: "face massage"},
      { shortname: ":haircut:", title: "haircut"},
      { shortname: ":couple_with_heart:", title: "couple with heart"},
      { shortname: ":couple_ww:", title: "couple (woman,woman)"},
      { shortname: ":couple_mm:", title: "couple (man,man)"},
      { shortname: ":couplekiss:", title: "kiss"},
      { shortname: ":kiss_ww:", title: "kiss (woman,woman)"},
      { shortname: ":kiss_mm:", title: "kiss (man,man)"},
      { shortname: ":raised_hands:", title: "person raising both hands in celebration"},
      { shortname: ":clap:", title: "clapping hands sign"},
      { shortname: ":ear:", title: "ear"},
      { shortname: ":eye:", title: "eye"},
      { shortname: ":eyes:", title: "eyes"},
      { shortname: ":nose:", title: "nose"},
      { shortname: ":lips:", title: "mouth"},
      { shortname: ":kiss:", title: "kiss mark"},
      { shortname: ":tongue:", title: "tongue"},
      { shortname: ":nail_care:", title: "nail polish"},
      { shortname: ":wave:", title: "waving hand sign"},
      { shortname: ":thumbsup:", title: "thumbs up sign"},
      { shortname: ":thumbsdown:", title: "thumbs down sign"},
      { shortname: ":point_up:", title: "white up pointing index"},
      { shortname: ":point_up_2:", title: "white up pointing backhand index"},
      { shortname: ":point_down:", title: "white down pointing backhand index"},
      { shortname: ":point_left:", title: "white left pointing backhand index"},
      { shortname: ":point_right:", title: "white right pointing backhand index"},
      { shortname: ":ok_hand:", title: "ok hand sign"},
      { shortname: ":v:", title: "victory hand"},
      { shortname: ":punch:", title: "fisted hand sign"},
      { shortname: ":fist:", title: "raised fist"},
      { shortname: ":raised_hand:", title: "raised hand"},
      { shortname: ":muscle:", title: "flexed biceps"},
      { shortname: ":open_hands:", title: "open hands sign"},
      { shortname: ":writing_hand:", title: "left writing hand"},
      { shortname: ":hand_splayed:", title: "raised hand with fingers splayed"},
      { shortname: ":middle_finger:", title: "reversed hand with middle finger extended"},
      { shortname: ":vulcan:", title: "raised hand with part between middle and ring fingers"},
      { shortname: ":pray:", title: "person with folded hands"}
    ]},
    nature: {
      title: 'Nature', icon: 'tree', icons: [
      { shortname: ":seedling:", title: "seedling"},
      { shortname: ":evergreen_tree:", title: "evergreen tree"},
      { shortname: ":deciduous_tree:", title: "deciduous tree"},
      { shortname: ":palm_tree:", title: "palm tree"},
      { shortname: ":cactus:", title: "cactus"},
      { shortname: ":tulip:", title: "tulip"},
      { shortname: ":cherry_blossom:", title: "cherry blossom"},
      { shortname: ":rose:", title: "rose"},
      { shortname: ":hibiscus:", title: "hibiscus"},
      { shortname: ":sunflower:", title: "sunflower"},
      { shortname: ":blossom:", title: "blossom"},
      { shortname: ":bouquet:", title: "bouquet"},
      { shortname: ":ear_of_rice:", title: "ear of rice"},
      { shortname: ":herb:", title: "herb"},
      { shortname: ":four_leaf_clover:", title: "four leaf clover"},
      { shortname: ":maple_leaf:", title: "maple leaf"},
      { shortname: ":fallen_leaf:", title: "fallen leaf"},
      { shortname: ":leaves:", title: "leaf fluttering in wind"},
      { shortname: ":mushroom:", title: "mushroom"},
      { shortname: ":chestnut:", title: "chestnut"},
      { shortname: ":rat:", title: "rat"},
      { shortname: ":mouse2:", title: "mouse"},
      { shortname: ":mouse:", title: "mouse face"},
      { shortname: ":hamster:", title: "hamster face"},
      { shortname: ":ox:", title: "ox"},
      { shortname: ":water_buffalo:", title: "water buffalo"},
      { shortname: ":cow2:", title: "cow"},
      { shortname: ":cow:", title: "cow face"},
      { shortname: ":tiger2:", title: "tiger"},
      { shortname: ":leopard:", title: "leopard"},
      { shortname: ":tiger:", title: "tiger face"},
      { shortname: ":chipmunk:", title: "chipmunk"},
      { shortname: ":rabbit2:", title: "rabbit"},
      { shortname: ":rabbit:", title: "rabbit face"},
      { shortname: ":cat2:", title: "cat"},
      { shortname: ":cat:", title: "cat face"},
      { shortname: ":racehorse:", title: "horse"},
      { shortname: ":horse:", title: "horse face"},
      { shortname: ":ram:", title: "ram"},
      { shortname: ":sheep:", title: "sheep"},
      { shortname: ":goat:", title: "goat"},
      { shortname: ":rooster:", title: "rooster"},
      { shortname: ":chicken:", title: "chicken"},
      { shortname: ":baby_chick:", title: "baby chick"},
      { shortname: ":hatching_chick:", title: "hatching chick"},
      { shortname: ":hatched_chick:", title: "front-facing baby chick"},
      { shortname: ":bird:", title: "bird"},
      { shortname: ":penguin:", title: "penguin"},
      { shortname: ":elephant:", title: "elephant"},
      { shortname: ":dromedary_camel:", title: "dromedary camel"},
      { shortname: ":camel:", title: "bactrian camel"},
      { shortname: ":boar:", title: "boar"},
      { shortname: ":pig2:", title: "pig"},
      { shortname: ":pig:", title: "pig face"},
      { shortname: ":pig_nose:", title: "pig nose"},
      { shortname: ":dog2:", title: "dog"},
      { shortname: ":poodle:", title: "poodle"},
      { shortname: ":dog:", title: "dog face"},
      { shortname: ":wolf:", title: "wolf face"},
      { shortname: ":bear:", title: "bear face"},
      { shortname: ":koala:", title: "koala"},
      { shortname: ":panda_face:", title: "panda face"},
      { shortname: ":monkey_face:", title: "monkey face"},
      { shortname: ":see_no_evil:", title: "see-no-evil monkey"},
      { shortname: ":hear_no_evil:", title: "hear-no-evil monkey"},
      { shortname: ":speak_no_evil:", title: "speak-no-evil monkey"},
      { shortname: ":monkey:", title: "monkey"},
      { shortname: ":dragon:", title: "dragon"},
      { shortname: ":dragon_face:", title: "dragon face"},
      { shortname: ":crocodile:", title: "crocodile"},
      { shortname: ":snake:", title: "snake"},
      { shortname: ":turtle:", title: "turtle"},
      { shortname: ":frog:", title: "frog face"},
      { shortname: ":whale2:", title: "whale"},
      { shortname: ":whale:", title: "spouting whale"},
      { shortname: ":dolphin:", title: "dolphin"},
      { shortname: ":octopus:", title: "octopus"},
      { shortname: ":fish:", title: "fish"},
      { shortname: ":tropical_fish:", title: "tropical fish"},
      { shortname: ":blowfish:", title: "blowfish"},
      { shortname: ":shell:", title: "spiral shell"},
      { shortname: ":snail:", title: "snail"},
      { shortname: ":bug:", title: "bug"},
      { shortname: ":ant:", title: "ant"},
      { shortname: ":bee:", title: "honeybee"},
      { shortname: ":beetle:", title: "lady beetle"},
      { shortname: ":spider:", title: "spider"},
      { shortname: ":spider_web:", title: "spider web"},
      { shortname: ":feet:", title: "paw prints"},
      { shortname: ":zap:", title: "high voltage sign"},
      { shortname: ":fire:", title: "fire"},
      { shortname: ":crescent_moon:", title: "crescent moon"},
      { shortname: ":sunny:", title: "black sun with rays"},
      { shortname: ":partly_sunny:", title: "sun behind cloud"},
      { shortname: ":cloud:", title: "cloud"},
      { shortname: ":cloud_rain:", title: "cloud with rain"},
      { shortname: ":cloud_snow:", title: "cloud with snow"},
      { shortname: ":cloud_lightning:", title: "cloud with lightning"},
      { shortname: ":cloud_tornado:", title: "cloud with tornado"},
      { shortname: ":droplet:", title: "droplet"},
      { shortname: ":sweat_drops:", title: "splashing sweat symbol"},
      { shortname: ":umbrella:", title: "umbrella with rain drops"},
      { shortname: ":fog:", title: "fog"},
      { shortname: ":dash:", title: "dash symbol"},
      { shortname: ":snowflake:", title: "snowflake"},
      { shortname: ":star2:", title: "glowing star"},
      { shortname: ":star:", title: "white medium star"},
      { shortname: ":stars:", title: "shooting star"},
      { shortname: ":sunrise_over_mountains:", title: "sunrise over mountains"},
      { shortname: ":sunrise:", title: "sunrise"},
      { shortname: ":rainbow:", title: "rainbow"},
      { shortname: ":ocean:", title: "water wave"},
      { shortname: ":volcano:", title: "volcano"},
      { shortname: ":milky_way:", title: "milky way"},
      { shortname: ":mount_fuji:", title: "mount fuji"},
      { shortname: ":japan:", title: "silhouette of japan"},
      { shortname: ":globe_with_meridians:", title: "globe with meridians"},
      { shortname: ":earth_africa:", title: "earth globe europe-africa"},
      { shortname: ":earth_americas:", title: "earth globe americas"},
      { shortname: ":earth_asia:", title: "earth globe asia-australia"},
      { shortname: ":new_moon:", title: "new moon symbol"},
      { shortname: ":waxing_crescent_moon:", title: "waxing crescent moon symbol"},
      { shortname: ":first_quarter_moon:", title: "first quarter moon symbol"},
      { shortname: ":waxing_gibbous_moon:", title: "waxing gibbous moon symbol"},
      { shortname: ":full_moon:", title: "full moon symbol"},
      { shortname: ":waning_gibbous_moon:", title: "waning gibbous moon symbol"},
      { shortname: ":last_quarter_moon:", title: "last quarter moon symbol"},
      { shortname: ":waning_crescent_moon:", title: "waning crescent moon symbol"},
      { shortname: ":new_moon_with_face:", title: "new moon with face"},
      { shortname: ":full_moon_with_face:", title: "full moon with face"},
      { shortname: ":first_quarter_moon_with_face:", title: "first quarter moon with face"},
      { shortname: ":last_quarter_moon_with_face:", title: "last quarter moon with face"},
      { shortname: ":sun_with_face:", title: "sun with face"},
      { shortname: ":wind_blowing_face:", title: "wind blowing face"}
    ]},
    food: {
      title: 'Food and drink', icon: 'cutlery', icons: [
      { shortname: ":tomato:", title: "tomato"},
      { shortname: ":eggplant:", title: "aubergine"},
      { shortname: ":corn:", title: "ear of maize"},
      { shortname: ":sweet_potato:", title: "roasted sweet potato"},
      { shortname: ":hot_pepper:", title: "hot pepper"},
      { shortname: ":grapes:", title: "grapes"},
      { shortname: ":melon:", title: "melon"},
      { shortname: ":watermelon:", title: "watermelon"},
      { shortname: ":tangerine:", title: "tangerine"},
      { shortname: ":lemon:", title: "lemon"},
      { shortname: ":banana:", title: "banana"},
      { shortname: ":pineapple:", title: "pineapple"},
      { shortname: ":apple:", title: "red apple"},
      { shortname: ":green_apple:", title: "green apple"},
      { shortname: ":pear:", title: "pear"},
      { shortname: ":peach:", title: "peach"},
      { shortname: ":cherries:", title: "cherries"},
      { shortname: ":strawberry:", title: "strawberry"},
      { shortname: ":hamburger:", title: "hamburger"},
      { shortname: ":pizza:", title: "slice of pizza"},
      { shortname: ":meat_on_bone:", title: "meat on bone"},
      { shortname: ":poultry_leg:", title: "poultry leg"},
      { shortname: ":rice_cracker:", title: "rice cracker"},
      { shortname: ":rice_ball:", title: "rice ball"},
      { shortname: ":rice:", title: "cooked rice"},
      { shortname: ":curry:", title: "curry and rice"},
      { shortname: ":ramen:", title: "steaming bowl"},
      { shortname: ":spaghetti:", title: "spaghetti"},
      { shortname: ":bread:", title: "bread"},
      { shortname: ":fries:", title: "french fries"},
      { shortname: ":dango:", title: "dango"},
      { shortname: ":oden:", title: "oden"},
      { shortname: ":sushi:", title: "sushi"},
      { shortname: ":fried_shrimp:", title: "fried shrimp"},
      { shortname: ":fish_cake:", title: "fish cake with swirl design"},
      { shortname: ":icecream:", title: "soft ice cream"},
      { shortname: ":shaved_ice:", title: "shaved ice"},
      { shortname: ":ice_cream:", title: "ice cream"},
      { shortname: ":doughnut:", title: "doughnut"},
      { shortname: ":cookie:", title: "cookie"},
      { shortname: ":chocolate_bar:", title: "chocolate bar"},
      { shortname: ":candy:", title: "candy"},
      { shortname: ":lollipop:", title: "lollipop"},
      { shortname: ":custard:", title: "custard"},
      { shortname: ":honey_pot:", title: "honey pot"},
      { shortname: ":cake:", title: "shortcake"},
      { shortname: ":bento:", title: "bento box"},
      { shortname: ":stew:", title: "pot of food"},
      { shortname: ":egg:", title: "cooking"},
      { shortname: ":fork_and_knife:", title: "fork and knife"},
      { shortname: ":tea:", title: "teacup without handle"},
      { shortname: ":coffee:", title: "hot beverage"},
      { shortname: ":sake:", title: "sake bottle and cup"},
      { shortname: ":wine_glass:", title: "wine glass"},
      { shortname: ":cocktail:", title: "cocktail glass"},
      { shortname: ":tropical_drink:", title: "tropical drink"},
      { shortname: ":beer:", title: "beer mug"},
      { shortname: ":beers:", title: "clinking beer mugs"},
      { shortname: ":baby_bottle:", title: "baby bottle"}
    ]},
    celebration: {
      title: 'Celebration', icon: 'users', icons: [
      { shortname: ":ribbon:", title: "ribbon"},
      { shortname: ":gift:", title: "wrapped present"},
      { shortname: ":birthday:", title: "birthday cake"},
      { shortname: ":jack_o_lantern:", title: "jack-o-lantern"},
      { shortname: ":christmas_tree:", title: "christmas tree"},
      { shortname: ":tanabata_tree:", title: "tanabata tree"},
      { shortname: ":bamboo:", title: "pine decoration"},
      { shortname: ":rice_scene:", title: "moon viewing ceremony"},
      { shortname: ":fireworks:", title: "fireworks"},
      { shortname: ":sparkler:", title: "firework sparkler"},
      { shortname: ":tada:", title: "party popper"},
      { shortname: ":confetti_ball:", title: "confetti ball"},
      { shortname: ":balloon:", title: "balloon"},
      { shortname: ":dizzy:", title: "dizzy symbol"},
      { shortname: ":sparkles:", title: "sparkles"},
      { shortname: ":boom:", title: "collision symbol"},
      { shortname: ":mortar_board:", title: "graduation cap"},
      { shortname: ":crown:", title: "crown"},
      { shortname: ":reminder_ribbon:", title: "reminder ribbon"},
      { shortname: ":military_medal:", title: "military medal"},
      { shortname: ":dolls:", title: "japanese dolls"},
      { shortname: ":flags:", title: "carp streamer"},
      { shortname: ":wind_chime:", title: "wind chime"},
      { shortname: ":crossed_flags:", title: "crossed flags"},
      { shortname: ":izakaya_lantern:", title: "izakaya lantern"},
      { shortname: ":ring:", title: "ring"},
      { shortname: ":heart:", title: "heavy black heart"},
      { shortname: ":broken_heart:", title: "broken heart"},
      { shortname: ":love_letter:", title: "love letter"},
      { shortname: ":two_hearts:", title: "two hearts"},
      { shortname: ":revolving_hearts:", title: "revolving hearts"},
      { shortname: ":heartbeat:", title: "beating heart"},
      { shortname: ":heartpulse:", title: "growing heart"},
      { shortname: ":sparkling_heart:", title: "sparkling heart"},
      { shortname: ":cupid:", title: "heart with arrow"},
      { shortname: ":gift_heart:", title: "heart with ribbon"},
      { shortname: ":heart_decoration:", title: "heart decoration"},
      { shortname: ":purple_heart:", title: "purple heart"},
      { shortname: ":yellow_heart:", title: "yellow heart"},
      { shortname: ":green_heart:", title: "green heart"},
      { shortname: ":blue_heart:", title: "blue heart"}
    ]},
    activity: {
      title: 'Activity', icon: 'soccer-ball-o', icons: [
      { shortname: ":runner:", title: "runner"},
      { shortname: ":walking:", title: "pedestrian"},
      { shortname: ":dancer:", title: "dancer"},
      { shortname: ":lifter:", title: "weight lifter"},
      { shortname: ":golfer:", title: "golfer"},
      { shortname: ":rowboat:", title: "rowboat"},
      { shortname: ":swimmer:", title: "swimmer"},
      { shortname: ":surfer:", title: "surfer"},
      { shortname: ":bath:", title: "bath"},
      { shortname: ":snowboarder:", title: "snowboarder"},
      { shortname: ":ski:", title: "ski and ski boot"},
      { shortname: ":snowman:", title: "snowman without snow"},
      { shortname: ":bicyclist:", title: "bicyclist"},
      { shortname: ":mountain_bicyclist:", title: "mountain bicyclist"},
      { shortname: ":motorcycle:", title: "racing motorcycle"},
      { shortname: ":race_car:", title: "racing car"},
      { shortname: ":horse_racing:", title: "horse racing"},
      { shortname: ":tent:", title: "tent"},
      { shortname: ":fishing_pole_and_fish:", title: "fishing pole and fish"},
      { shortname: ":soccer:", title: "soccer ball"},
      { shortname: ":basketball:", title: "basketball and hoop"},
      { shortname: ":football:", title: "american football"},
      { shortname: ":baseball:", title: "baseball"},
      { shortname: ":tennis:", title: "tennis racquet and ball"},
      { shortname: ":rugby_football:", title: "rugby football"},
      { shortname: ":golf:", title: "flag in hole"},
      { shortname: ":trophy:", title: "trophy"},
      { shortname: ":medal:", title: "sports medal"},
      { shortname: ":running_shirt_with_sash:", title: "running shirt with sash"},
      { shortname: ":checkered_flag:", title: "chequered flag"},
      { shortname: ":musical_keyboard:", title: "musical keyboard"},
      { shortname: ":guitar:", title: "guitar"},
      { shortname: ":violin:", title: "violin"},
      { shortname: ":saxophone:", title: "saxophone"},
      { shortname: ":trumpet:", title: "trumpet"},
      { shortname: ":musical_note:", title: "musical note"},
      { shortname: ":notes:", title: "multiple musical notes"},
      { shortname: ":musical_score:", title: "musical score"},
      { shortname: ":headphones:", title: "headphone"},
      { shortname: ":microphone:", title: "microphone"},
      { shortname: ":performing_arts:", title: "performing arts"},
      { shortname: ":ticket:", title: "ticket"},
      { shortname: ":tophat:", title: "top hat"},
      { shortname: ":circus_tent:", title: "circus tent"},
      { shortname: ":clapper:", title: "clapper board"},
      { shortname: ":film_frames:", title: "film frames"},
      { shortname: ":tickets:", title: "admission tickets"},
      { shortname: ":art:", title: "artist palette"},
      { shortname: ":dart:", title: "direct hit"},
      { shortname: ":8ball:", title: "billiards"},
      { shortname: ":bowling:", title: "bowling"},
      { shortname: ":slot_machine:", title: "slot machine"},
      { shortname: ":game_die:", title: "game die"},
      { shortname: ":video_game:", title: "video game"},
      { shortname: ":flower_playing_cards:", title: "flower playing cards"},
      { shortname: ":black_joker:", title: "playing card black joker"},
      { shortname: ":mahjong:", title: "mahjong tile red dragon"},
      { shortname: ":carousel_horse:", title: "carousel horse"},
      { shortname: ":ferris_wheel:", title: "ferris wheel"},
      { shortname: ":roller_coaster:", title: "roller coaster"}
    ]},
    travel: {
      title: 'Travel and places', icon: 'plane', icons: [
      { shortname: ":railway_car:", title: "railway car"},
      { shortname: ":mountain_railway:", title: "mountain railway"},
      { shortname: ":steam_locomotive:", title: "steam locomotive"},
      { shortname: ":train:", title: "Tram Car"},
      { shortname: ":monorail:", title: "monorail"},
      { shortname: ":bullettrain_side:", title: "high-speed train"},
      { shortname: ":bullettrain_front:", title: "high-speed train with bullet nose"},
      { shortname: ":train2:", title: "train"},
      { shortname: ":metro:", title: "metro"},
      { shortname: ":light_rail:", title: "light rail"},
      { shortname: ":station:", title: "station"},
      { shortname: ":tram:", title: "tram"},
      { shortname: ":railway_track:", title: "railway track"},
      { shortname: ":bus:", title: "bus"},
      { shortname: ":oncoming_bus:", title: "oncoming bus"},
      { shortname: ":trolleybus:", title: "trolleybus"},
      { shortname: ":minibus:", title: "minibus"},
      { shortname: ":ambulance:", title: "ambulance"},
      { shortname: ":fire_engine:", title: "fire engine"},
      { shortname: ":police_car:", title: "police car"},
      { shortname: ":oncoming_police_car:", title: "oncoming police car"},
      { shortname: ":rotating_light:", title: "police cars revolving light"},
      { shortname: ":taxi:", title: "taxi"},
      { shortname: ":oncoming_taxi:", title: "oncoming taxi"},
      { shortname: ":red_car:", title: "automobile"},
      { shortname: ":oncoming_automobile:", title: "oncoming automobile"},
      { shortname: ":blue_car:", title: "recreational vehicle"},
      { shortname: ":truck:", title: "delivery truck"},
      { shortname: ":articulated_lorry:", title: "articulated lorry"},
      { shortname: ":tractor:", title: "tractor"},
      { shortname: ":bike:", title: "bicycle"},
      { shortname: ":motorway:", title: "motorway"},
      { shortname: ":busstop:", title: "bus stop"},
      { shortname: ":fuelpump:", title: "fuel pump"},
      { shortname: ":construction:", title: "construction sign"},
      { shortname: ":vertical_traffic_light:", title: "vertical traffic light"},
      { shortname: ":traffic_light:", title: "horizontal traffic light"},
      { shortname: ":rocket:", title: "rocket"},
      { shortname: ":helicopter:", title: "helicopter"},
      { shortname: ":airplane:", title: "airplane"},
      { shortname: ":airplane_small:", title: "small airplane"},
      { shortname: ":airplane_departure:", title: "airplane departure"},
      { shortname: ":airplane_arriving:", title: "airplane arriving"},
      { shortname: ":seat:", title: "seat"},
      { shortname: ":anchor:", title: "anchor"},
      { shortname: ":ship:", title: "ship"},
      { shortname: ":cruise_ship:", title: "passenger ship"},
      { shortname: ":motorboat:", title: "motorboat"},
      { shortname: ":speedboat:", title: "speedboat"},
      { shortname: ":sailboat:", title: "sailboat"},
      { shortname: ":aerial_tramway:", title: "aerial tramway"},
      { shortname: ":mountain_cableway:", title: "mountain cableway"},
      { shortname: ":suspension_railway:", title: "suspension railway"},
      { shortname: ":passport_control:", title: "passport control"},
      { shortname: ":customs:", title: "customs"},
      { shortname: ":baggage_claim:", title: "baggage claim"},
      { shortname: ":left_luggage:", title: "left luggage"},
      { shortname: ":yen:", title: "banknote with yen sign"},
      { shortname: ":euro:", title: "banknote with euro sign"},
      { shortname: ":pound:", title: "banknote with pound sign"},
      { shortname: ":dollar:", title: "banknote with dollar sign"},
      { shortname: ":bellhop:", title: "bellhop bell"},
      { shortname: ":bed:", title: "bed"},
      { shortname: ":couch:", title: "couch and lamp"},
      { shortname: ":fork_knife_plate:", title: "fork and knife with plate"},
      { shortname: ":shopping_bags:", title: "shopping bags"},
      { shortname: ":statue_of_liberty:", title: "statue of liberty"},
      { shortname: ":moyai:", title: "moyai"},
      { shortname: ":foggy:", title: "foggy"},
      { shortname: ":tokyo_tower:", title: "tokyo tower"},
      { shortname: ":fountain:", title: "fountain"},
      { shortname: ":european_castle:", title: "european castle"},
      { shortname: ":japanese_castle:", title: "japanese castle"},
      { shortname: ":classical_building:", title: "classical building"},
      { shortname: ":stadium:", title: "stadium"},
      { shortname: ":mountain_snow:", title: "snow capped mountain"},
      { shortname: ":camping:", title: "camping"},
      { shortname: ":beach:", title: "beach with umbrella"},
      { shortname: ":desert:", title: "desert"},
      { shortname: ":island:", title: "desert island"},
      { shortname: ":park:", title: "national park"},
      { shortname: ":cityscape:", title: "cityscape"},
      { shortname: ":city_sunset:", title: "sunset over buildings"},
      { shortname: ":city_dusk:", title: "cityscape at dusk"},
      { shortname: ":night_with_stars:", title: "night with stars"},
      { shortname: ":bridge_at_night:", title: "bridge at night"},
      { shortname: ":house:", title: "house building"},
      { shortname: ":homes:", title: "house buildings"},
      { shortname: ":house_with_garden:", title: "house with garden"},
      { shortname: ":house_abandoned:", title: "derelict house building"},
      { shortname: ":contruction_site:", title: "building construction"},
      { shortname: ":office:", title: "office building"},
      { shortname: ":department_store:", title: "department store"},
      { shortname: ":factory:", title: "factory"},
      { shortname: ":post_office:", title: "japanese post office"},
      { shortname: ":european_post_office:", title: "european post office"},
      { shortname: ":hospital:", title: "hospital"},
      { shortname: ":bank:", title: "bank"},
      { shortname: ":hotel:", title: "hotel"},
      { shortname: ":love_hotel:", title: "love hotel"},
      { shortname: ":wedding:", title: "wedding"},
      { shortname: ":church:", title: "church"},
      { shortname: ":convenience_store:", title: "convenience store"},
      { shortname: ":school:", title: "school"},
      { shortname: ":map:", title: "world map"}
    ]},
    flags: {
      title: 'Flags', icon: 'flag', icons: [
      { shortname: ":flag_au:", title: "australia"},
      { shortname: ":flag_at:", title: "austria"},
      { shortname: ":flag_be:", title: "belgium"},
      { shortname: ":flag_br:", title: "brazil"},
      { shortname: ":flag_ca:", title: "canada"},
      { shortname: ":flag_cl:", title: "chile"},
      { shortname: ":flag_cn:", title: "china"},
      { shortname: ":flag_co:", title: "colombia"},
      { shortname: ":flag_dk:", title: "denmark"},
      { shortname: ":flag_fi:", title: "finland"},
      { shortname: ":flag_fr:", title: "france"},
      { shortname: ":flag_de:", title: "germany"},
      { shortname: ":flag_hk:", title: "hong kong"},
      { shortname: ":flag_in:", title: "india"},
      { shortname: ":flag_id:", title: "indonesia"},
      { shortname: ":flag_ie:", title: "ireland"},
      { shortname: ":flag_il:", title: "israel"},
      { shortname: ":flag_it:", title: "italy"},
      { shortname: ":flag_jp:", title: "japan"},
      { shortname: ":flag_kr:", title: "korea"},
      { shortname: ":flag_mo:", title: "macau"},
      { shortname: ":flag_my:", title: "malaysia"},
      { shortname: ":flag_mx:", title: "mexico"},
      { shortname: ":flag_nl:", title: "the netherlands"},
      { shortname: ":flag_nz:", title: "new zealand"},
      { shortname: ":flag_no:", title: "norway"},
      { shortname: ":flag_ph:", title: "the philippines"},
      { shortname: ":flag_pl:", title: "poland"},
      { shortname: ":flag_pt:", title: "portugal"},
      { shortname: ":flag_pr:", title: "puerto rico"},
      { shortname: ":flag_ru:", title: "russia"},
      { shortname: ":flag_sa:", title: "saudi arabia"},
      { shortname: ":flag_sg:", title: "singapore"},
      { shortname: ":flag_za:", title: "south africa"},
      { shortname: ":flag_es:", title: "spain"},
      { shortname: ":flag_se:", title: "sweden"},
      { shortname: ":flag_ch:", title: "switzerland"},
      { shortname: ":flag_tr:", title: "turkey"},
      { shortname: ":flag_gb:", title: "great britain"},
      { shortname: ":flag_us:", title: "united states"},
      { shortname: ":flag_ae:", title: "the united arab emirates"},
      { shortname: ":flag_vn:", title: "vietnam"},
      { shortname: ":flag_af:", title: "afghanistan"},
      { shortname: ":flag_al:", title: "albania"},
      { shortname: ":flag_dz:", title: "algeria"},
      { shortname: ":flag_ad:", title: "andorra"},
      { shortname: ":flag_ao:", title: "angola"},
      { shortname: ":flag_ai:", title: "anguilla"},
      { shortname: ":flag_ag:", title: "antigua and barbuda"},
      { shortname: ":flag_ar:", title: "argentina"},
      { shortname: ":flag_am:", title: "armenia"},
      { shortname: ":flag_aw:", title: "aruba"},
      { shortname: ":flag_ac:", title: "ascension"},
      { shortname: ":flag_az:", title: "azerbaijan"},
      { shortname: ":flag_bs:", title: "the bahamas"},
      { shortname: ":flag_bh:", title: "bahrain"},
      { shortname: ":flag_bd:", title: "bangladesh"},
      { shortname: ":flag_bb:", title: "barbados"},
      { shortname: ":flag_by:", title: "belarus"},
      { shortname: ":flag_bz:", title: "belize"},
      { shortname: ":flag_bj:", title: "benin"},
      { shortname: ":flag_bm:", title: "bermuda"},
      { shortname: ":flag_bt:", title: "bhutan"},
      { shortname: ":flag_bo:", title: "bolivia"},
      { shortname: ":flag_ba:", title: "bosnia and herzegovina"},
      { shortname: ":flag_bw:", title: "botswana"},
      { shortname: ":flag_bn:", title: "brunei"},
      { shortname: ":flag_bg:", title: "bulgaria"},
      { shortname: ":flag_bf:", title: "burkina faso"},
      { shortname: ":flag_bi:", title: "burundi"},
      { shortname: ":flag_kh:", title: "cambodia"},
      { shortname: ":flag_cm:", title: "cameroon"},
      { shortname: ":flag_cv:", title: "cape verde"},
      { shortname: ":flag_ky:", title: "cayman islands"},
      { shortname: ":flag_cf:", title: "central african republic"},
      { shortname: ":flag_km:", title: "the comoros"},
      { shortname: ":flag_cd:", title: "the democratic republic of the congo"},
      { shortname: ":flag_cg:", title: "the republic of the congo"},
      { shortname: ":flag_td:", title: "chad"},
      { shortname: ":flag_cr:", title: "costa rica"},
      { shortname: ":flag_ci:", title: "cote d'ivoire"},
      { shortname: ":flag_hr:", title: "croatia"},
      { shortname: ":flag_cu:", title: "cuba"},
      { shortname: ":flag_cy:", title: "cyprus"},
      { shortname: ":flag_cz:", title: "the czech republic"},
      { shortname: ":flag_dj:", title: "djibouti"},
      { shortname: ":flag_dm:", title: "dominica"},
      { shortname: ":flag_do:", title: "the dominican republic"},
      { shortname: ":flag_tl:", title: "east timor"},
      { shortname: ":flag_ec:", title: "ecuador"},
      { shortname: ":flag_eg:", title: "egypt"},
      { shortname: ":flag_sv:", title: "el salvador"},
      { shortname: ":flag_gq:", title: "equatorial guinea"},
      { shortname: ":flag_er:", title: "eritrea"},
      { shortname: ":flag_ee:", title: "estonia"},
      { shortname: ":flag_et:", title: "ethiopia"},
      { shortname: ":flag_fk:", title: "falkland islands"},
      { shortname: ":flag_fo:", title: "faroe islands"},
      { shortname: ":flag_fj:", title: "fiji"},
      { shortname: ":flag_pf:", title: "french polynesia"},
      { shortname: ":flag_ga:", title: "gabon"},
      { shortname: ":flag_gm:", title: "the gambia"},
      { shortname: ":flag_ge:", title: "georgia"},
      { shortname: ":flag_gh:", title: "ghana"},
      { shortname: ":flag_gi:", title: "gibraltar"},
      { shortname: ":flag_gr:", title: "greece"},
      { shortname: ":flag_gl:", title: "greenland"},
      { shortname: ":flag_gd:", title: "grenada"},
      { shortname: ":flag_gu:", title: "guam"},
      { shortname: ":flag_gt:", title: "guatemala"},
      { shortname: ":flag_gn:", title: "guinea"},
      { shortname: ":flag_gw:", title: "guinea-bissau"},
      { shortname: ":flag_gy:", title: "guyana"},
      { shortname: ":flag_ht:", title: "haiti"},
      { shortname: ":flag_hn:", title: "honduras"},
      { shortname: ":flag_hu:", title: "hungary"},
      { shortname: ":flag_is:", title: "iceland"},
      { shortname: ":flag_ir:", title: "iran"},
      { shortname: ":flag_iq:", title: "iraq"},
      { shortname: ":flag_jm:", title: "jamaica"},
      { shortname: ":flag_je:", title: "jersey"},
      { shortname: ":flag_jo:", title: "jordan"},
      { shortname: ":flag_kz:", title: "kazakhstan"},
      { shortname: ":flag_ke:", title: "kenya"},
      { shortname: ":flag_ki:", title: "kiribati"},
      { shortname: ":flag_xk:", title: "kosovo"},
      { shortname: ":flag_kw:", title: "kuwait"},
      { shortname: ":flag_kg:", title: "kyrgyzstan"},
      { shortname: ":flag_la:", title: "laos"},
      { shortname: ":flag_lv:", title: "latvia"},
      { shortname: ":flag_lb:", title: "lebanon"},
      { shortname: ":flag_ls:", title: "lesotho"},
      { shortname: ":flag_lr:", title: "liberia"},
      { shortname: ":flag_ly:", title: "libya"},
      { shortname: ":flag_li:", title: "liechtenstein"},
      { shortname: ":flag_lt:", title: "lithuania"},
      { shortname: ":flag_lu:", title: "luxembourg"},
      { shortname: ":flag_mk:", title: "macedonia"},
      { shortname: ":flag_mg:", title: "madagascar"},
      { shortname: ":flag_mw:", title: "malawi"},
      { shortname: ":flag_mv:", title: "maldives"},
      { shortname: ":flag_ml:", title: "mali"},
      { shortname: ":flag_mt:", title: "malta"},
      { shortname: ":flag_mh:", title: "the marshall islands"},
      { shortname: ":flag_mr:", title: "mauritania"},
      { shortname: ":flag_mu:", title: "mauritius"},
      { shortname: ":flag_fm:", title: "micronesia"},
      { shortname: ":flag_md:", title: "moldova"},
      { shortname: ":flag_mc:", title: "monaco"},
      { shortname: ":flag_mn:", title: "mongolia"},
      { shortname: ":flag_me:", title: "montenegro"},
      { shortname: ":flag_ms:", title: "montserrat"},
      { shortname: ":flag_ma:", title: "morocco"},
      { shortname: ":flag_mz:", title: "mozambique"},
      { shortname: ":flag_mm:", title: "myanmar"},
      { shortname: ":flag_na:", title: "namibia"},
      { shortname: ":flag_nr:", title: "nauru"},
      { shortname: ":flag_np:", title: "nepal"},
      { shortname: ":flag_nc:", title: "new caledonia"},
      { shortname: ":flag_ni:", title: "nicaragua"},
      { shortname: ":flag_ne:", title: "niger"},
      { shortname: ":flag_ng:", title: "nigeria"},
      { shortname: ":flag_nu:", title: "niue"},
      { shortname: ":flag_kp:", title: "north korea"},
      { shortname: ":flag_om:", title: "oman"},
      { shortname: ":flag_pk:", title: "pakistan"},
      { shortname: ":flag_pw:", title: "palau"},
      { shortname: ":flag_ps:", title: "palestinian authority"},
      { shortname: ":flag_pa:", title: "panama"},
      { shortname: ":flag_pg:", title: "papua new guinea"},
      { shortname: ":flag_py:", title: "paraguay"},
      { shortname: ":flag_pe:", title: "peru"},
      { shortname: ":flag_qa:", title: "qatar"},
      { shortname: ":flag_ro:", title: "romania"},
      { shortname: ":flag_rw:", title: "rwanda"},
      { shortname: ":flag_sh:", title: "saint helena"},
      { shortname: ":flag_kn:", title: "saint kitts and nevis"},
      { shortname: ":flag_lc:", title: "saint lucia"},
      { shortname: ":flag_vc:", title: "saint vincent and the grenadines"},
      { shortname: ":flag_ws:", title: "samoa"},
      { shortname: ":flag_sm:", title: "san marino"},
      { shortname: ":flag_st:", title: "sao tome and principe"},
      { shortname: ":flag_sn:", title: "senegal"},
      { shortname: ":flag_rs:", title: "serbia"},
      { shortname: ":flag_sc:", title: "the seychelles"},
      { shortname: ":flag_sl:", title: "sierra leone"},
      { shortname: ":flag_sk:", title: "slovakia"},
      { shortname: ":flag_si:", title: "slovenia"},
      { shortname: ":flag_sb:", title: "the solomon islands"},
      { shortname: ":flag_so:", title: "somalia"},
      { shortname: ":flag_lk:", title: "sri lanka"},
      { shortname: ":flag_sd:", title: "sudan"},
      { shortname: ":flag_sr:", title: "suriname"},
      { shortname: ":flag_sz:", title: "swaziland"},
      { shortname: ":flag_sy:", title: "syria"},
      { shortname: ":flag_tw:", title: "the republic of china"},
      { shortname: ":flag_tj:", title: "tajikistan"},
      { shortname: ":flag_tz:", title: "tanzania"},
      { shortname: ":flag_th:", title: "thailand"},
      { shortname: ":flag_tg:", title: "togo"},
      { shortname: ":flag_to:", title: "tonga"},
      { shortname: ":flag_tt:", title: "trinidad and tobago"},
      { shortname: ":flag_tn:", title: "tunisia"},
      { shortname: ":flag_tm:", title: "turkmenistan"},
      { shortname: ":flag_tv:", title: "tuvalu"},
      { shortname: ":flag_vi:", title: "u.s. virgin islands"},
      { shortname: ":flag_ug:", title: "uganda"},
      { shortname: ":flag_ua:", title: "ukraine"},
      { shortname: ":flag_uy:", title: "uruguay"},
      { shortname: ":flag_uz:", title: "uzbekistan"},
      { shortname: ":flag_vu:", title: "vanuatu"},
      { shortname: ":flag_va:", title: "the vatican city"},
      { shortname: ":flag_ve:", title: "venezuela"},
      { shortname: ":flag_wf:", title: "wallis and futuna"},
      { shortname: ":flag_eh:", title: "western sahara"},
      { shortname: ":flag_ye:", title: "yemen"},
      { shortname: ":flag_zm:", title: "zambia"},
      { shortname: ":flag_zw:", title: "zimbabwe"}
    ]},
    objects: {
      title: 'Objects', icon: 'cube', icons: [
      { shortname: ":watch:", title: "watch"},
      { shortname: ":iphone:", title: "mobile phone"},
      { shortname: ":calling:", title: "mobile phone with rightwards arrow at left"},
      { shortname: ":computer:", title: "personal computer"},
      { shortname: ":desktop:", title: "desktop computer"},
      { shortname: ":keyboard:", title: "wired keyboard"},
      { shortname: ":trackball:", title: "trackball"},
      { shortname: ":printer:", title: "printer"},
      { shortname: ":alarm_clock:", title: "alarm clock"},
      { shortname: ":clock:", title: "mantlepiece clock"},
      { shortname: ":hourglass_flowing_sand:", title: "hourglass with flowing sand"},
      { shortname: ":hourglass:", title: "hourglass"},
      { shortname: ":camera:", title: "camera"},
      { shortname: ":camera_with_flash:", title: "camera with flash"},
      { shortname: ":video_camera:", title: "video camera"},
      { shortname: ":movie_camera:", title: "movie camera"},
      { shortname: ":projector:", title: "film projector"},
      { shortname: ":tv:", title: "television"},
      { shortname: ":microphone2:", title: "studio microphone"},
      { shortname: ":level_slider:", title: "level slider"},
      { shortname: ":control_knobs:", title: "control knobs"},
      { shortname: ":radio:", title: "radio"},
      { shortname: ":pager:", title: "pager"},
      { shortname: ":joystick:", title: "joystick"},
      { shortname: ":telephone_receiver:", title: "telephone receiver"},
      { shortname: ":telephone:", title: "black telephone"},
      { shortname: ":fax:", title: "fax machine"},
      { shortname: ":minidisc:", title: "minidisc"},
      { shortname: ":floppy_disk:", title: "floppy disk"},
      { shortname: ":cd:", title: "optical disc"},
      { shortname: ":dvd:", title: "dvd"},
      { shortname: ":vhs:", title: "videocassette"},
      { shortname: ":battery:", title: "battery"},
      { shortname: ":electric_plug:", title: "electric plug"},
      { shortname: ":bulb:", title: "electric light bulb"},
      { shortname: ":flashlight:", title: "electric torch"},
      { shortname: ":candle:", title: "candle"},
      { shortname: ":satellite:", title: "satellite antenna"},
      { shortname: ":satellite_orbital:", title: "satellite"},
      { shortname: ":credit_card:", title: "credit card"},
      { shortname: ":money_with_wings:", title: "money with wings"},
      { shortname: ":moneybag:", title: "money bag"},
      { shortname: ":gem:", title: "gem stone"},
      { shortname: ":closed_umbrella:", title: "closed umbrella"},
      { shortname: ":pouch:", title: "pouch"},
      { shortname: ":purse:", title: "purse"},
      { shortname: ":handbag:", title: "handbag"},
      { shortname: ":briefcase:", title: "briefcase"},
      { shortname: ":school_satchel:", title: "school satchel"},
      { shortname: ":lipstick:", title: "lipstick"},
      { shortname: ":eyeglasses:", title: "eyeglasses"},
      { shortname: ":dark_sunglasses:", title: "dark sunglasses"},
      { shortname: ":womans_hat:", title: "womans hat"},
      { shortname: ":sandal:", title: "womans sandal"},
      { shortname: ":high_heel:", title: "high-heeled shoe"},
      { shortname: ":boot:", title: "womans boots"},
      { shortname: ":mans_shoe:", title: "mans shoe"},
      { shortname: ":athletic_shoe:", title: "athletic shoe"},
      { shortname: ":bikini:", title: "bikini"},
      { shortname: ":dress:", title: "dress"},
      { shortname: ":kimono:", title: "kimono"},
      { shortname: ":womans_clothes:", title: "womans clothes"},
      { shortname: ":shirt:", title: "t-shirt"},
      { shortname: ":necktie:", title: "necktie"},
      { shortname: ":jeans:", title: "jeans"},
      { shortname: ":door:", title: "door"},
      { shortname: ":shower:", title: "shower"},
      { shortname: ":bathtub:", title: "bathtub"},
      { shortname: ":toilet:", title: "toilet"},
      { shortname: ":barber:", title: "barber pole"},
      { shortname: ":syringe:", title: "syringe"},
      { shortname: ":pill:", title: "pill"},
      { shortname: ":microscope:", title: "microscope"},
      { shortname: ":telescope:", title: "telescope"},
      { shortname: ":crystal_ball:", title: "crystal ball"},
      { shortname: ":wrench:", title: "wrench"},
      { shortname: ":knife:", title: "hocho"},
      { shortname: ":dagger:", title: "dagger knife"},
      { shortname: ":nut_and_bolt:", title: "nut and bolt"},
      { shortname: ":hammer:", title: "hammer"},
      { shortname: ":tools:", title: "hammer and wrench"},
      { shortname: ":oil:", title: "oil drum"},
      { shortname: ":bomb:", title: "bomb"},
      { shortname: ":smoking:", title: "smoking symbol"},
      { shortname: ":gun:", title: "pistol"},
      { shortname: ":bookmark:", title: "bookmark"},
      { shortname: ":newspaper:", title: "newspaper"},
      { shortname: ":newspaper2:", title: "rolled-up newspaper"},
      { shortname: ":thermometer:", title: "thermometer"},
      { shortname: ":label:", title: "label"},
      { shortname: ":key:", title: "key"},
      { shortname: ":key2:", title: "old key"},
      { shortname: ":envelope:", title: "envelope"},
      { shortname: ":envelope_with_arrow:", title: "envelope with downwards arrow above"},
      { shortname: ":incoming_envelope:", title: "incoming envelope"},
      { shortname: ":e-mail:", title: "e-mail symbol"},
      { shortname: ":inbox_tray:", title: "inbox tray"},
      { shortname: ":outbox_tray:", title: "outbox tray"},
      { shortname: ":package:", title: "package"},
      { shortname: ":postal_horn:", title: "postal horn"},
      { shortname: ":postbox:", title: "postbox"},
      { shortname: ":mailbox_closed:", title: "closed mailbox with lowered flag"},
      { shortname: ":mailbox:", title: "closed mailbox with raised flag"},
      { shortname: ":mailbox_with_no_mail:", title: "open mailbox with lowered flag"},
      { shortname: ":mailbox_with_mail:", title: "open mailbox with raised flag"},
      { shortname: ":page_facing_up:", title: "page facing up"},
      { shortname: ":page_with_curl:", title: "page with curl"},
      { shortname: ":bookmark_tabs:", title: "bookmark tabs"},
      { shortname: ":wastebasket:", title: "wastebasket"},
      { shortname: ":notepad_spiral:", title: "spiral note pad"},
      { shortname: ":chart_with_upwards_trend:", title: "chart with upwards trend"},
      { shortname: ":chart_with_downwards_trend:", title: "chart with downwards trend"},
      { shortname: ":bar_chart:", title: "bar chart"},
      { shortname: ":date:", title: "calendar"},
      { shortname: ":calendar:", title: "tear-off calendar"},
      { shortname: ":calendar_spiral:", title: "spiral calendar pad"},
      { shortname: ":ballot_box:", title: "ballot box with ballot"},
      { shortname: ":low_brightness:", title: "low brightness symbol"},
      { shortname: ":high_brightness:", title: "high brightness symbol"},
      { shortname: ":compression:", title: "compression"},
      { shortname: ":frame_photo:", title: "frame with picture"},
      { shortname: ":scroll:", title: "scroll"},
      { shortname: ":clipboard:", title: "clipboard"},
      { shortname: ":book:", title: "open book"},
      { shortname: ":notebook:", title: "notebook"},
      { shortname: ":notebook_with_decorative_cover:", title: "notebook with decorative cover"},
      { shortname: ":ledger:", title: "ledger"},
      { shortname: ":closed_book:", title: "closed book"},
      { shortname: ":green_book:", title: "green book"},
      { shortname: ":blue_book:", title: "blue book"},
      { shortname: ":orange_book:", title: "orange book"},
      { shortname: ":books:", title: "books"},
      { shortname: ":card_index:", title: "card index"},
      { shortname: ":dividers:", title: "card index dividers"},
      { shortname: ":card_box:", title: "card file box"},
      { shortname: ":link:", title: "link symbol"},
      { shortname: ":paperclip:", title: "paperclip"},
      { shortname: ":paperclips:", title: "linked paperclips"},
      { shortname: ":pushpin:", title: "pushpin"},
      { shortname: ":scissors:", title: "black scissors"},
      { shortname: ":triangular_ruler:", title: "triangular ruler"},
      { shortname: ":round_pushpin:", title: "round pushpin"},
      { shortname: ":straight_ruler:", title: "straight ruler"},
      { shortname: ":triangular_flag_on_post:", title: "triangular flag on post"},
      { shortname: ":flag_white:", title: "waving white flag"},
      { shortname: ":flag_black:", title: "waving black flag"},
      { shortname: ":hole:", title: "hole"},
      { shortname: ":file_folder:", title: "file folder"},
      { shortname: ":open_file_folder:", title: "open file folder"},
      { shortname: ":file_cabinet:", title: "file cabinet"},
      { shortname: ":black_nib:", title: "black nib"},
      { shortname: ":pencil2:", title: "pencil"},
      { shortname: ":pen_ballpoint:", title: "lower left ballpoint pen"},
      { shortname: ":pen_fountain:", title: "lower left fountain pen"},
      { shortname: ":paintbrush:", title: "lower left paintbrush"},
      { shortname: ":crayon:", title: "lower left crayon"},
      { shortname: ":pencil:", title: "memo"},
      { shortname: ":lock_with_ink_pen:", title: "lock with ink pen"},
      { shortname: ":closed_lock_with_key:", title: "closed lock with key"},
      { shortname: ":lock:", title: "lock"},
      { shortname: ":unlock:", title: "open lock"},
      { shortname: ":mega:", title: "cheering megaphone"},
      { shortname: ":loudspeaker:", title: "public address loudspeaker"},
      { shortname: ":speaker:", title: "speaker"},
      { shortname: ":sound:", title: "speaker with one sound wave"},
      { shortname: ":loud_sound:", title: "speaker with three sound waves"},
      { shortname: ":mute:", title: "speaker with cancellation stroke"},
      { shortname: ":zzz:", title: "sleeping symbol"},
      { shortname: ":bell:", title: "bell"},
      { shortname: ":no_bell:", title: "bell with cancellation stroke"},
      { shortname: ":cross_heavy:", title: "heavy latin cross"},
      { shortname: ":om_symbol:", title: "om symbol"},
      { shortname: ":dove:", title: "dove of peace"},
      { shortname: ":thought_balloon:", title: "thought balloon"},
      { shortname: ":speech_balloon:", title: "speech balloon"},
      { shortname: ":anger_right:", title: "right anger bubble"},
      { shortname: ":children_crossing:", title: "children crossing"},
      { shortname: ":shield:", title: "shield"},
      { shortname: ":mag:", title: "left-pointing magnifying glass"},
      { shortname: ":mag_right:", title: "right-pointing magnifying glass"},
      { shortname: ":speaking_head:", title: "speaking head in silhouette"},
      { shortname: ":sleeping_accommodation:", title: "sleeping accommodation"},
      { shortname: ":no_entry_sign:", title: "no entry sign"},
      { shortname: ":no_entry:", title: "no entry"},
      { shortname: ":name_badge:", title: "name badge"},
      { shortname: ":no_pedestrians:", title: "no pedestrians"},
      { shortname: ":do_not_litter:", title: "do not litter symbol"},
      { shortname: ":no_bicycles:", title: "no bicycles"},
      { shortname: ":non-potable_water:", title: "non-potable water symbol"},
      { shortname: ":no_mobile_phones:", title: "no mobile phones"},
      { shortname: ":underage:", title: "no one under eighteen symbol"},
      { shortname: ":accept:", title: "circled ideograph accept"},
      { shortname: ":ideograph_advantage:", title: "circled ideograph advantage"},
      { shortname: ":white_flower:", title: "white flower"},
      { shortname: ":secret:", title: "circled ideograph secret"},
      { shortname: ":congratulations:", title: "circled ideograph congratulation"},
      { shortname: ":u5408:", title: "squared cjk unified ideograph-5408"},
      { shortname: ":u6e80:", title: "squared cjk unified ideograph-6e80"},
      { shortname: ":u7981:", title: "squared cjk unified ideograph-7981"},
      { shortname: ":u6709:", title: "squared cjk unified ideograph-6709"},
      { shortname: ":u7121:", title: "squared cjk unified ideograph-7121"},
      { shortname: ":u7533:", title: "squared cjk unified ideograph-7533"},
      { shortname: ":u55b6:", title: "squared cjk unified ideograph-55b6"},
      { shortname: ":u6708:", title: "squared cjk unified ideograph-6708"},
      { shortname: ":u5272:", title: "squared cjk unified ideograph-5272"},
      { shortname: ":u7a7a:", title: "squared cjk unified ideograph-7a7a"},
      { shortname: ":sa:", title: "squared katakana sa"},
      { shortname: ":koko:", title: "squared katakana koko"},
      { shortname: ":u6307:", title: "squared cjk unified ideograph-6307"},
      { shortname: ":chart:", title: "chart with upwards trend and yen sign"},
      { shortname: ":sparkle:", title: "sparkle"},
      { shortname: ":eight_spoked_asterisk:", title: "eight spoked asterisk"},
      { shortname: ":negative_squared_cross_mark:", title: "negative squared cross mark"},
      { shortname: ":white_check_mark:", title: "white heavy check mark"},
      { shortname: ":eight_pointed_black_star:", title: "eight pointed black star"},
      { shortname: ":vibration_mode:", title: "vibration mode"},
      { shortname: ":mobile_phone_off:", title: "mobile phone off"},
      { shortname: ":vs:", title: "squared vs"},
      { shortname: ":a:", title: "negative squared latin capital letter a"},
      { shortname: ":b:", title: "negative squared latin capital letter b"},
      { shortname: ":ab:", title: "negative squared ab"},
      { shortname: ":cl:", title: "squared cl"},
      { shortname: ":o2:", title: "negative squared latin capital letter o"},
      { shortname: ":sos:", title: "squared sos"},
      { shortname: ":id:", title: "squared id"},
      { shortname: ":parking:", title: "negative squared latin capital letter p"},
      { shortname: ":wc:", title: "water closet"},
      { shortname: ":cool:", title: "squared cool"},
      { shortname: ":free:", title: "squared free"},
      { shortname: ":new:", title: "squared new"},
      { shortname: ":ng:", title: "squared ng"},
      { shortname: ":ok:", title: "squared ok"},
      { shortname: ":up:", title: "squared up with exclamation mark"},
      { shortname: ":atm:", title: "automated teller machine"},
      { shortname: ":aries:", title: "aries"},
      { shortname: ":taurus:", title: "taurus"},
      { shortname: ":gemini:", title: "gemini"},
      { shortname: ":cancer:", title: "cancer"},
      { shortname: ":leo:", title: "leo"},
      { shortname: ":virgo:", title: "virgo"},
      { shortname: ":libra:", title: "libra"},
      { shortname: ":scorpius:", title: "scorpius"},
      { shortname: ":sagittarius:", title: "sagittarius"},
      { shortname: ":capricorn:", title: "capricorn"},
      { shortname: ":aquarius:", title: "aquarius"},
      { shortname: ":pisces:", title: "pisces"},
      { shortname: ":restroom:", title: "restroom"},
      { shortname: ":mens:", title: "mens symbol"},
      { shortname: ":womens:", title: "womens symbol"},
      { shortname: ":baby_symbol:", title: "baby symbol"},
      { shortname: ":wheelchair:", title: "wheelchair symbol"},
      { shortname: ":potable_water:", title: "potable water symbol"},
      { shortname: ":no_smoking:", title: "no smoking symbol"},
      { shortname: ":put_litter_in_its_place:", title: "put litter in its place symbol"},
      { shortname: ":arrow_forward:", title: "black right-pointing triangle"},
      { shortname: ":arrow_backward:", title: "black left-pointing triangle"},
      { shortname: ":arrow_up_small:", title: "up-pointing small red triangle"},
      { shortname: ":arrow_down_small:", title: "down-pointing small red triangle"},
      { shortname: ":fast_forward:", title: "black right-pointing double triangle"},
      { shortname: ":rewind:", title: "black left-pointing double triangle"},
      { shortname: ":arrow_double_up:", title: "black up-pointing double triangle"},
      { shortname: ":arrow_double_down:", title: "black down-pointing double triangle"},
      { shortname: ":arrow_right:", title: "black rightwards arrow"},
      { shortname: ":arrow_left:", title: "leftwards black arrow"},
      { shortname: ":arrow_up:", title: "upwards black arrow"},
      { shortname: ":arrow_down:", title: "downwards black arrow"},
      { shortname: ":arrow_upper_right:", title: "north east arrow"},
      { shortname: ":arrow_lower_right:", title: "south east arrow"},
      { shortname: ":arrow_lower_left:", title: "south west arrow"},
      { shortname: ":arrow_upper_left:", title: "north west arrow"},
      { shortname: ":arrow_up_down:", title: "up down arrow"},
      { shortname: ":left_right_arrow:", title: "left right arrow"},
      { shortname: ":arrows_counterclockwise:", title: "anticlockwise downwards and upwards open circle arrows"},
      { shortname: ":arrow_right_hook:", title: "rightwards arrow with hook"},
      { shortname: ":leftwards_arrow_with_hook:", title: "leftwards arrow with hook"},
      { shortname: ":arrow_heading_up:", title: "arrow pointing rightwards then curving upwards"},
      { shortname: ":arrow_heading_down:", title: "arrow pointing rightwards then curving downwards"},
      { shortname: ":twisted_rightwards_arrows:", title: "twisted rightwards arrows"},
      { shortname: ":repeat:", title: "clockwise rightwards and leftwards open circle arrows"},
      { shortname: ":repeat_one:", title: "clockwise rightwards and leftwards open circle arrows"},
      { shortname: ":hash:", title: "number sign"},
      { shortname: ":zero:", title: "digit zero"},
      { shortname: ":one:", title: "digit one"},
      { shortname: ":two:", title: "digit two"},
      { shortname: ":three:", title: "digit three"},
      { shortname: ":four:", title: "digit four"},
      { shortname: ":five:", title: "digit five"},
      { shortname: ":six:", title: "digit six"},
      { shortname: ":seven:", title: "digit seven"},
      { shortname: ":eight:", title: "digit eight"},
      { shortname: ":nine:", title: "digit nine"},
      { shortname: ":keycap_ten:", title: "keycap ten"},
      { shortname: ":1234:", title: "input symbol for numbers"},
      { shortname: ":abc:", title: "input symbol for latin letters"},
      { shortname: ":abcd:", title: "input symbol for latin small letters"},
      { shortname: ":capital_abcd:", title: "input symbol for latin capital letters"},
      { shortname: ":information_source:", title: "information source"},
      { shortname: ":signal_strength:", title: "antenna with bars"},
      { shortname: ":cinema:", title: "cinema"},
      { shortname: ":symbols:", title: "input symbol for symbols"},
      { shortname: ":heavy_plus_sign:", title: "heavy plus sign"},
      { shortname: ":heavy_minus_sign:", title: "heavy minus sign"},
      { shortname: ":wavy_dash:", title: "wavy dash"},
      { shortname: ":heavy_division_sign:", title: "heavy division sign"},
      { shortname: ":heavy_multiplication_x:", title: "heavy multiplication x"},
      { shortname: ":heavy_check_mark:", title: "heavy check mark"},
      { shortname: ":arrows_clockwise:", title: "clockwise downwards and upwards open circle arrows"},
      { shortname: ":tm:", title: "trade mark sign"},
      { shortname: ":copyright:", title: "copyright sign"},
      { shortname: ":registered:", title: "registered sign"},
      { shortname: ":currency_exchange:", title: "currency exchange"},
      { shortname: ":heavy_dollar_sign:", title: "heavy dollar sign"},
      { shortname: ":curly_loop:", title: "curly loop"},
      { shortname: ":loop:", title: "double curly loop"},
      { shortname: ":part_alternation_mark:", title: "part alternation mark"},
      { shortname: ":exclamation:", title: "heavy exclamation mark symbol"},
      { shortname: ":question:", title: "black question mark ornament"},
      { shortname: ":grey_exclamation:", title: "white exclamation mark ornament"},
      { shortname: ":grey_question:", title: "white question mark ornament"},
      { shortname: ":bangbang:", title: "double exclamation mark"},
      { shortname: ":interrobang:", title: "exclamation question mark"},
      { shortname: ":x:", title: "cross mark"},
      { shortname: ":o:", title: "heavy large circle"},
      { shortname: ":100:", title: "hundred points symbol"},
      { shortname: ":end:", title: "end with leftwards arrow above"},
      { shortname: ":back:", title: "back with leftwards arrow above"},
      { shortname: ":on:", title: "on with exclamation mark with left right arrow abo"},
      { shortname: ":top:", title: "top with upwards arrow above"},
      { shortname: ":soon:", title: "soon with rightwards arrow above"},
      { shortname: ":cyclone:", title: "cyclone"},
      { shortname: ":m:", title: "circled latin capital letter m"},
      { shortname: ":ophiuchus:", title: "ophiuchus"},
      { shortname: ":six_pointed_star:", title: "six pointed star with middle dot"},
      { shortname: ":beginner:", title: "japanese symbol for beginner"},
      { shortname: ":trident:", title: "trident emblem"},
      { shortname: ":warning:", title: "warning sign"},
      { shortname: ":hotsprings:", title: "hot springs"},
      { shortname: ":rosette:", title: "rosette"},
      { shortname: ":recycle:", title: "black universal recycling symbol"},
      { shortname: ":anger:", title: "anger symbol"},
      { shortname: ":diamond_shape_with_a_dot_inside:", title: "diamond shape with a dot inside"},
      { shortname: ":spades:", title: "black spade suit"},
      { shortname: ":clubs:", title: "black club suit"},
      { shortname: ":hearts:", title: "black heart suit"},
      { shortname: ":diamonds:", title: "black diamond suit"},
      { shortname: ":ballot_box_with_check:", title: "ballot box with check"},
      { shortname: ":white_circle:", title: "medium white circle"},
      { shortname: ":black_circle:", title: "medium black circle"},
      { shortname: ":radio_button:", title: "radio button"},
      { shortname: ":red_circle:", title: "large red circle"},
      { shortname: ":large_blue_circle:", title: "large blue circle"},
      { shortname: ":small_red_triangle:", title: "up-pointing red triangle"},
      { shortname: ":small_red_triangle_down:", title: "down-pointing red triangle"},
      { shortname: ":small_orange_diamond:", title: "small orange diamond"},
      { shortname: ":small_blue_diamond:", title: "small blue diamond"},
      { shortname: ":large_orange_diamond:", title: "large orange diamond"},
      { shortname: ":large_blue_diamond:", title: "large blue diamond"},
      { shortname: ":black_small_square:", title: "black small square"},
      { shortname: ":white_small_square:", title: "white small square"},
      { shortname: ":black_large_square:", title: "black large square"},
      { shortname: ":white_large_square:", title: "white large square"},
      { shortname: ":black_medium_square:", title: "black medium square"},
      { shortname: ":white_medium_square:", title: "white medium square"},
      { shortname: ":black_medium_small_square:", title: "black medium small square"},
      { shortname: ":white_medium_small_square:", title: "white medium small square"},
      { shortname: ":black_square_button:", title: "black square button"},
      { shortname: ":white_square_button:", title: "white square button"},
      { shortname: ":clock1:", title: "clock face one oclock"},
      { shortname: ":clock2:", title: "clock face two oclock"},
      { shortname: ":clock3:", title: "clock face three oclock"},
      { shortname: ":clock4:", title: "clock face four oclock"},
      { shortname: ":clock5:", title: "clock face five oclock"},
      { shortname: ":clock6:", title: "clock face six oclock"},
      { shortname: ":clock7:", title: "clock face seven oclock"},
      { shortname: ":clock8:", title: "clock face eight oclock"},
      { shortname: ":clock9:", title: "clock face nine oclock"},
      { shortname: ":clock10:", title: "clock face ten oclock"},
      { shortname: ":clock11:", title: "clock face eleven oclock"},
      { shortname: ":clock12:", title: "clock face twelve oclock"},
      { shortname: ":clock130:", title: "clock face one-thirty"},
      { shortname: ":clock230:", title: "clock face two-thirty"},
      { shortname: ":clock330:", title: "clock face three-thirty"},
      { shortname: ":clock430:", title: "clock face four-thirty"},
      { shortname: ":clock530:", title: "clock face five-thirty"},
      { shortname: ":clock630:", title: "clock face six-thirty"},
      { shortname: ":clock730:", title: "clock face seven-thirty"},
      { shortname: ":clock830:", title: "clock face eight-thirty"},
      { shortname: ":clock930:", title: "clock face nine-thirty"},
      { shortname: ":clock1030:", title: "clock face ten-thirty"},
      { shortname: ":clock1130:", title: "clock face eleven-thirty"},
      { shortname: ":clock1230:", title: "clock face twelve-thirty"}
    ]}
  };

  /**
   * @member plugin.emojiOne
   * @private
   * @param {jQuery} $editable
   * @return {String}
   */
  var getTextOnRange = function ($editable) {
    $editable.focus();

    var rng = range.create();

    // if range on anchor, expand range with anchor
    if (rng.isOnAnchor()) {
      var anchor = dom.ancestor(rng.sc, dom.isAnchor);
      rng = range.createFromNode(anchor);
    }

    return rng.toString();
  };

  /**
   * Make emojiOne Characters Table
   *
   * @member plugin.emojiOne
   * @private
   * @return {jQuery}
   */
  var makeEmojiOneCharSetTable = function (iconSet) {
    var $table = $('<table/>');
    for(var idx = 0; idx < emojiOneCharDataSet[iconSet].icons.length; idx++) {
      //console.log(emojiOneCharDataSet[iconSet][idx].shortname);
      var text = emojiOneCharDataSet[iconSet].icons[idx].shortname;
      var image = emojione.shortnameToImage(text);
      var title = emojiOneCharDataSet[iconSet].icons[idx].title;
      var $td = $('<td/>').addClass('note-emojionechar-node');
      var $tr = (idx % COLUMN_LENGTH === 0) ? $('<tr/>') : $table.find('tr').last();

      $td.append($(tmpl.button(image, {
        title: title,
        value: encodeURIComponent(text)
      })).css({
        width: COLUMN_WIDTH,
        'padding-left': '2px'
      }));

      $tr.append($td);
      if (idx % COLUMN_LENGTH === 0) {
        $table.append($tr);
      }
    }

    totalRow = $table.find('tr').length;
    totalColumn = COLUMN_LENGTH;

    return $table;
  };

  /**
   * Show emojiOne Characters and set event handlers on dialog controls.
   *
   * @member plugin.emojiOneChar
   * @private
   * @param {jQuery} $dialog
   * @param {jQuery} $dialog
   * @param {Object} text
   * @return {Promise}
   */
  var showEmojiOneCharDialog = function ($editable, $dialog, text) {
    return $.Deferred(function (deferred) {
      var $emojiOneCharDialog = $dialog.find('.note-emojionechar-dialog');
      var $emojiOneCharNode = $emojiOneCharDialog.find('div.tab-pane').find('.active').find('.note-emojionechar-node');
      var $selectedNode = null;
      var ARROW_KEYS = [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT];
      var ENTER_KEY = KEY.ENTER;

      $('.note-emojionechar-dialog').on('shown.bs.modal', function(e){
        totalRow = $(this).find('div.active table tr').length;
        $selectedNode && removeActiveClass($selectedNode);
        $selectedNode = null;
        currentColumn, currentRow = 1;
        $emojiOneCharNode = $emojiOneCharDialog.find('div.active').find('.note-emojionechar-node');
      });

      $('.note-emojionechar-dialog').on('shown.bs.tab', function(e){
        totalRow = $(this).find('div.active table tr').length;
        $selectedNode && removeActiveClass($selectedNode);
        $selectedNode = null;
        currentColumn, currentRow = 1;
        $emojiOneCharNode = $emojiOneCharDialog.find('div.active').find('.note-emojionechar-node');
      });

      function addActiveClass($target) {
        if (!$target) {
          return;
        }
        $target.find('button').addClass('active');
        $selectedNode = $target;
      }

      function removeActiveClass($target) {
        $target.find('button').removeClass('active');
        $selectedNode = null;
      }

      // find next node
      function findNextNode(row, column) {
        var findNode = null;
        $.each($emojiOneCharNode, function (idx, $node) {
          var findRow = Math.ceil((idx + 1) / COLUMN_LENGTH);
          var findColumn = ((idx + 1) % COLUMN_LENGTH === 0) ? COLUMN_LENGTH : (idx + 1) % COLUMN_LENGTH;
          if (findRow === row && findColumn === column) {
            findNode = $node;
            return false;
          }
        });
        return $(findNode);
      }

      function arrowKeyHandler(keyCode) {
        // left, right, up, down key
        var $nextNode;
        var lastRowColumnLength = $emojiOneCharNode.length % totalColumn;

        if (KEY.LEFT === keyCode) {

          if (currentColumn > 1) {
            currentColumn = currentColumn - 1;
          } else if (currentRow === 1 && currentColumn === 1) {
            currentColumn = lastRowColumnLength;
            currentRow = totalRow;
          } else {
            currentColumn = totalColumn;
            currentRow = currentRow - 1;
          }

        } else if (KEY.RIGHT === keyCode) {

          if (currentRow === totalRow && lastRowColumnLength === currentColumn) {
            currentColumn = 1;
            currentRow = 1;
          } else if (currentColumn < totalColumn) {
            currentColumn = currentColumn + 1;
          } else {
            currentColumn = 1;
            currentRow = currentRow + 1;
          }

        } else if (KEY.UP === keyCode) {
          if (currentRow === 1 && lastRowColumnLength < currentColumn) {
            currentRow = totalRow - 1;
          } else {
            currentRow = currentRow - 1;
          }
        } else if (KEY.DOWN === keyCode) {
          currentRow = currentRow + 1;
        }

        if (currentRow === totalRow && currentColumn > lastRowColumnLength) {
          currentRow = 1;
        } else if (currentRow > totalRow) {
          currentRow = 1;
        } else if (currentRow < 1) {
          currentRow = totalRow;
        }

        $nextNode = findNextNode(currentRow, currentColumn);

        if ($nextNode) {
          removeActiveClass($selectedNode);
          addActiveClass($nextNode);
        }
      }

      function enterKeyHandler() {
        if (!$selectedNode) {
          return;
        }

        deferred.resolve(decodeURIComponent($selectedNode.find('button').attr('data-value')));
        $emojiOneCharDialog.modal('hide');
      }

      function keyDownEventHandler(event) {
        event.preventDefault();
        var keyCode = event.keyCode;
        if (keyCode === undefined || keyCode === null) {
          return;
        }
        // check arrowKeys match
        if (ARROW_KEYS.indexOf(keyCode) > -1) {
          if ($selectedNode === null) {
            addActiveClass($emojiOneCharNode.eq(0));
            currentColumn = 1;
            currentRow = 1;
            return;
          }
          arrowKeyHandler(keyCode);
        } else if (keyCode === ENTER_KEY) {
          enterKeyHandler();
        }
        return false;
      }

      // remove class
      removeActiveClass($emojiOneCharNode);
      // find selected node
      if (text) {
        for (var i = 0; i < $emojiOneCharNode.length; i++) {
          var $checkNode = $($emojiOneCharNode[i]);
          if ($checkNode.text() === text) {
            addActiveClass($checkNode);
            currentRow = Math.ceil((i + 1) / COLUMN_LENGTH);
            currentColumn = (i + 1) % COLUMN_LENGTH;
          }
        }
      }

      $emojiOneCharDialog.one('shown.bs.modal', function () {
        $(document).on('keydown', keyDownEventHandler);
        $emojiOneCharDialog.find('.note-emojionechar-node').on('click', function (event) {
          event.preventDefault();
          $(this).find('button').removeClass('active');
          $(this).find('button').trigger('mouseleave');
          deferred.resolve(decodeURIComponent($(event.currentTarget).find('button').attr('data-value')));
          $emojiOneCharDialog.modal('hide');
        });
      }).one('hidden.bs.modal', function () {
        $emojiOneCharDialog.find('.note-emojionechar-node').off('click');
        $(document).off('keydown', keyDownEventHandler);
        if (deferred.state() === 'pending') {
          deferred.reject();
        }
      }).modal('show');

      // tooltip
      // $dialog.find('button').tooltip({
      //   container: $emojiOneCharDialog.find('div.active'),
      //   trigger: 'hover',
      //   placement: 'top'
      // }).on('click', function () {
      //   $(this).tooltip('hide');
      // });

      // $editable blur
      $editable.blur();
    });
  };

  /**
   * @class plugin.emojiOneChar
   *
   * emojiOne Characters Plugin
   *
   * ### load script
   *
   * ```
   * < script src="plugin/summernote-ext-emojione.js"></script >
   * ```
   *
   * ### use a plugin in toolbar
   * ```
   *    $("#editor").summernote({
   *    ...
   *    toolbar : [
   *        ['group', [ 'emojiOneChar' ]]
   *    ]
   *    ...    
   *    });
   * ```
   */
  $.summernote.addPlugin({
    /** @property {String} name name of plugin */
    name: 'emojiOneChar',
    /**
     * @property {Object} buttons
     * @property {function(object): string} buttons.emojiOneChar
     */
    buttons: {
      emojiOneChar: function (lang, options) {
       // return tmpl.iconButton(options.iconPrefix + 'smile-o ', {
        return tmpl.iconButton('fa fa-smile-o', {
          event: 'emojiOneDialog',
          title: lang.emojiOneChar.emojiOneChar,
          hide: true
        });
      }
    },

    /**
     * @property {Object} dialogs
     * @property {function(object, object): string} dialogs.emojiOneChar
    */
    dialogs: {
      emojiOneChar: function (lang) {
        var tabs = $('<ul/>').addClass('nav nav-tabs').attr('role', 'tablist');
        var panes = $('<div/>').addClass('tab-content');
        var n = 0;
        $.each(emojiOneCharDataSet, function(iconSet, value){
          var li = $('<li/>').attr('role', 'presentation');
          li.append("<a href='#tab_" + iconSet + "' aria-controls='tab_" + iconSet + "' role='tab' data-toggle='tab' title='" + emojiOneCharDataSet[iconSet].title + "'><i class='fa fa-" + emojiOneCharDataSet[iconSet].icon + "'></i></a>");
          n == 0 && li.addClass('active');
          tabs.append(li);

          var div = $('<div/>').addClass('tab-pane').attr('id', 'tab_' + iconSet).attr('role', 'tabpanel');
          n == 0 && div.addClass('active');
          var icons = makeEmojiOneCharSetTable(iconSet)[0].outerHTML;
          div.append(icons);
          panes.append(div)
          n++;
        })
        var body = tabs[0].outerHTML + panes[0].outerHTML;

        return tmpl.dialog('note-emojionechar-dialog', lang.emojiOneChar.select, body);
      }
    },
    /**
     * @property {Object} events
     * @property {Function} events.showEmojiOneCharDialog
     */
    events: {
      //emojiOneDialog: function (event, editor, layoutInfo, value) {
      emojiOneDialog: function (layoutInfo, value) {
        // Get current editable node
        var $editable = layoutInfo.editable(),
            $dialog = layoutInfo.dialog(),
            currentEmojiOneChar = getTextOnRange($editable);

        // save current range
        editor.saveRange($editable);

        showEmojiOneCharDialog($editable, $dialog, currentEmojiOneChar).then(function (selectChar) {
          // when ok button clicked

          // restore range
          editor.restoreRange($editable);
          
          // build node
          var $node = $('<span></span>').html(selectChar)[0];
          
          if ($node) {
            // insert emojiOne node
            editor.insertNode($editable, $node);
          }
        }).fail(function () {
          // when cancel button clicked
          editor.restoreRange($editable);
        });
      }
    },

    // define language
    langs: {
      'en-US': {
        emojiOneChar: {
          emojiOneChar: 'EmojiOne CHARACTERS',
          select: 'Select emoticon characters'
        }
      }
    }
  });
}));
