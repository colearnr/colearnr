db.createCollection("users");
db.createCollection("topics");
db.createCollection("learnbits");
db.createCollection("embedly_cache");
db.createCollection("userdata");
db.createCollection("access_tokens");

db.system.js.save({
    _id: "getIdForTopic",
    value: function (topic) { return db.topics.findOne({id: topic}, {_id: 1}); }
});

db.system.js.save({
    _id: "getIdForTopicPath",
    value: function (path, topic) { var args = {id: topic}; if (path && path != '') { args['path'] = path; } return db.topics.findOne(args, {_id: 1}); }
});

db.system.js.save({
    _id: "getIdForTopics",
    value: function (topicstr) { var topics = JSON.parse(topicstr); var l = []; topics.forEach(function(atopic) { l.push(getIdForTopic(atopic)); }); return l; }
});

db.users.ensureIndex({ emails: 1 }, { background: true });
db.users.ensureIndex({ _id: 1 }, { background: true });
db.topics.ensureIndex({ id: 1, name: 1, path: 1, added_by: 1 }, { unique: true });
db.topics.ensureIndex({ id: 1 }, { background: true });
db.topics.ensureIndex({ name: 1 }, { background: true });
db.topics.ensureIndex({ path: 1 }, { background: true });
db.learnbits.ensureIndex({ title: 1 }, { background: true });
db.learnbits.ensureIndex({ url: 1 }, { background: true });
db.embedly_cache.ensureIndex( {url: 1}, {unique: true, background: true} );

//db.learnbits.ensureIndex({ "$**": "text" }, { weights: {title: 10, description: 5, tags: 2}, name: "LearnbitTextIndex" });
//db.topics.ensureIndex({ "$**": "text" }, { weights: {name: 10, description: 5, tags: 2}, name: "TopicsTextIndex" });

db.learnbits.ensureIndex({topics: 1, safe: 1, moderation_required: 1, hidden: 1, missing: 1});
db.learnbits.ensureIndex({mentioned: 1});
db.learnbits.ensureIndex({discussed: 1});
db.learnbits.ensureIndex({likes: 1});

db.userdata.ensureIndex({lbit_oid: 1, type: 1, user: 1});

db.fs.chunks.createIndex({ files_id: 1, n: 1 }, { unique: true });

db.access_tokens.createIndex({ "expire_date": 1 }, { expireAfterSeconds: 0 });
