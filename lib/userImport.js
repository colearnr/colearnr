var util = require('../common/util'),
    _ = require('lodash'),
    constants = require('../common/constants'),
    logger = require('../common/log'),
    db = require("../common/db"),
    bcrypt = require("bcrypt"),
    config = require("./config").config,
    XLSImport = require('./xlsImport');

var UserImport={};

UserImport.substitutor = function(row) {
    if (!row) {
        return null;
    }
    var subsRow = {};
    var salt = bcrypt.genSaltSync(constants.SALT_WORK_FACTOR);
    // hash the password along with our new salt
    var hash = bcrypt.hashSync(config.DEFAULT_PASSWORD, salt);
    subsRow['salt'] = salt;
    subsRow['password'] = hash;
    for (var key in row) {
        var name = {first: '', last: ''};
        var val = util.trim(row[key]) || '';
        switch(key.toLowerCase().replace(/ /g, '')) {
            case 'firstname':
                if (subsRow['name']) {
                    name = subsRow['name'];
                }
                name['first'] = val;
                subsRow['name'] = name;
                break;
            case 'lastname':
                if (subsRow['name']) {
                    name = subsRow['name'];
                }
                name['last'] = val;
                subsRow['name'] = name;
                break;
            case 'e-mail':
            case 'email':
                val = val.toLowerCase();
                subsRow['emails'] = val.split(',');
                var id = util.create_hash(subsRow['emails'][0]);
                subsRow['email_verified'] = true;
                subsRow['_id'] = id;
                break;
            case 'institution':
            case 'currentinstitution':
                subsRow['organisation'] = val;
                break;
            case 'position':
            case 'currentposition':
                subsRow['description'] = val;
                break;
            case 'countryduringprogram':
                subsRow['location'] = val;
            default:
                subsRow[key] = val;
        }
    }
    if (subsRow.name && subsRow.name.first && subsRow.name.last) {
        subsRow['displayName'] = util.capitalise(subsRow.name.first) + ' ' + util.capitalise(subsRow.name.last);
    }
    subsRow['join_date'] = new Date();
    subsRow['acct_imported'] = true;
    subsRow['temporary_password'] = true;
    subsRow['agree_terms'] = "agreed";
    subsRow['profileImage'] = config.cdn_prefix + '/images/profile/profile_' + util.random(1, 10) + '.jpg';
    return subsRow;
}

UserImport.fromXLS = function(xlsFile, substitutorFn, callback) {
    XLSImport.getAsJson(xlsFile, (substitutorFn || UserImport.substitutor), function (err, dataMap) {
        if (!err) {
            var keys = _.keys(dataMap);
            var newUsers = dataMap[keys[0]];
            logger.log('info', 'About to import', newUsers.length, 'users');
            var done = 0;
            newUsers.forEach(function (auser) {
                db.users.save(auser);
                done++;
                if (done == newUsers.length) {
                    callback(err, newUsers);
                }
            })

        } else {
            callback(err, null);
        }
    });
}

exports.UserImport = UserImport;

var main = function() {
    var argv = require('optimist')
            .usage('Usage: $0 --xlsFile [xlsFile]')
            .demand(['xlsFile'])
            .argv;
    UserImport.fromXLS(argv.xlsFile, null, function (err, data) {
        //console.log(err, data);
    });
}

if (require.main === module) {
    main();
}
