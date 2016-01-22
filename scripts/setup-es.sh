#!/bin/bash
/usr/share/elasticsearch/bin/plugin --url https://colearnr-dist.s3.amazonaws.com/lib/centos/elasticsearch-river-mongodb-2.0.7-SNAPSHOT.zip --install elasticsearch-river-mongodb

DATABASE="colearnr"
SERVER='"servers": [
{ "host": "localhost", "port": 27017 }
]'
ES_SERVER='localhost'
PORT=9200
echo .
echo "Stopping the existing river - mongodb-learnbits"
curl -XPOST $ES_SERVER:$PORT/_river/mongodb-learnbits/mongodb/stop -d'{"type":"mongodb","river":"mongodb"}'

curl -XPOST $ES_SERVER:$PORT/_river/mongodb-topics/mongodb/stop -d'{"type":"mongodb","river":"mongodb"}'

curl -XPOST $ES_SERVER:$PORT/_river/mongodb-users/mongodb/stop -d'{"type":"mongodb","river":"mongodb"}'

echo .
echo "Dropping the existing index learnbitsindex"
curl -XDELETE $ES_SERVER:$PORT/learnbitsindex

echo "Creating new index learnbitsindex"
curl -XPOST $ES_SERVER:$PORT/learnbitsindex -d '{
  "settings" : {
    "analysis": {
      "analyzer": {
        "indexAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop", "kstem", "learnbitsNGram"]
        },
        "searchAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop", "kstem"]
        },
        "tagsAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop"]
        },
        "shingleAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop", "kstem", "learnbitsShingle"],
          "char_filter" : ["learnbitsHtmlFilter"]
        }
      },
      "filter": {
        "learnbitsNGram" : {"type": "edgeNGram", "min_gram": 3, "max_gram": 15},
        "learnbitsShingle" : {"type": "shingle", "min_shingle_size": 2, "max_shingle_size": 5}
      },
      "char_filter": {
        "learnbitsHtmlFilter": {"type": "html_strip", "read_ahead": 1024}
      }
    }
  },
  "mappings" : {
    "learnbits" : {
      "properties": {
        "title": {
          "type": "string",
          "index_analyzer": "indexAnalyzer",
          "search_analyzer": "searchAnalyzer"
        },
        "description": {
          "type": "string",
          "analyzer": "shingleAnalyzer"
        },
        "body": {
          "type": "string",
          "analyzer": "shingleAnalyzer"
        },
        "tags": {
          "type": "string",
          "index_analyzer": "tagsAnalyzer",
          "search_analyzer": "tagsAnalyzer"
        },
        "added_date": {
          "type": "date"
        },
        "last_updated": {
          "type": "date"
        }
      }
    }
  }
}'

echo .
echo "Dropping the existing index topicsindex"
curl -XDELETE $ES_SERVER:$PORT/topicsindex

echo "Creating new index topicsindex"
curl -XPOST $ES_SERVER:$PORT/topicsindex -d '{
  "settings" : {
    "analysis": {
      "analyzer": {
        "indexAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop", "kstem", "topicsNGram"]
        },
        "searchAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop", "kstem"]
        },
        "tagsAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop"]
        },
        "shingleAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop", "kstem", "topicsShingle"],
          "char_filter" : ["topicsHtmlFilter"]
        }
      },
      "filter": {
        "topicsNGram" : {"type": "edgeNGram", "min_gram": 3, "max_gram": 15},
        "topicsShingle" : {"type": "shingle", "min_shingle_size": 2, "max_shingle_size": 5, "output_unigrams": false}
      },
      "char_filter": {
        "topicsHtmlFilter": {"type": "html_strip", "read_ahead": 1024}
      }
    }
  },
  "mappings" : {
    "topics" : {
      "properties": {
        "name": {
          "type": "string",
          "index_analyzer": "indexAnalyzer",
          "search_analyzer": "searchAnalyzer"
        },
        "description": {
          "type": "string",
          "analyzer": "shingleAnalyzer"
        },
        "body": {
          "type": "string",
          "analyzer": "shingleAnalyzer"
        },
        "tags": {
          "type": "string",
          "index_analyzer": "tagsAnalyzer",
          "search_analyzer": "tagsAnalyzer"
        },
        "added_date": {
          "type": "date"
        },
        "last_updated": {
          "type": "date"
        }
      }
    }
  }
}'

echo .
echo "Dropping the existing index usersindex"
curl -XDELETE $ES_SERVER:$PORT/usersindex

echo "Creating new index usersindex"
curl -XPOST $ES_SERVER:$PORT/usersindex -d '{
  "settings" : {
    "analysis": {
      "analyzer": {
        "indexAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop", "kstem", "usersNGram"]
        },
        "searchAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop", "kstem"]
        },
        "shingleAnalyzer" : {
          "type":"custom",
          "tokenizer": "standard",
          "filter": ["standard", "lowercase", "stop", "kstem", "usersShingle"],
          "char_filter" : ["usersHtmlFilter"]
        }
      },
      "filter": {
        "usersNGram" : {"type": "edgeNGram", "min_gram": 3, "max_gram": 15},
        "usersShingle" : {"type": "shingle", "min_shingle_size": 2, "max_shingle_size": 5}
      },
      "char_filter": {
        "usersHtmlFilter": {"type": "html_strip", "read_ahead": 1024}
      }
    }
  },
  "mappings" : {
    "users" : {
      "properties": {
        "name" : {
          "type": "object",
          "properties": {
            "first" : {
              "type": "string",
              "index_analyzer": "indexAnalyzer",
              "search_analyzer": "searchAnalyzer"
            },
            "middle" : {
              "type": "string",
              "index_analyzer": "indexAnalyzer",
              "search_analyzer": "searchAnalyzer"
            },
            "last" : {
              "type": "string",
              "index_analyzer": "indexAnalyzer",
              "search_analyzer": "searchAnalyzer"
            }
          }
        },
        "displayName": {
          "type": "string",
          "analyzer": "shingleAnalyzer"
        },
        "emails": {
          "type": "string",
          "analyzer": "shingleAnalyzer"
        }
      }
    }
  }
}'

echo .
echo "Configuring river mongodb for $DATABASE"

curl -XPUT $ES_SERVER:$PORT/_river/mongodb-learnbits/_meta -d '{
  "type": "mongodb",
  "mongodb": {
    '"$SERVER"',
    "db": "'"$DATABASE"'",
    "collection": "learnbits",
    "credentials":
    [
      { "db": "local","auth": "'"$DATABASE"'", "user": "colearnr-search", "password": "colearnr-search" },
      { "db": "'"$DATABASE"'", "user": "colearnr-search", "password": "colearnr-search" }
    ],
    "options": {
      "secondary_read_preference" : true,
      "include_fields": ["title", "description", "tags", "body", "added_by", "img_url", "url", "type", "topics", "added_date", "last_updated"],
      "include_collection": "learnbits",
      "is_mongos": false
    }
  },
  "index": {
    "name": "learnbitsindex-'"$CLIENT"'",
    "type": "learnbits"
  }
}'

curl -XPUT $ES_SERVER:$PORT/_river/mongodb-topics/_meta -d '{
  "type": "mongodb",
  "mongodb": {
    '"$SERVER"',
    "db": "'"$DATABASE"'",
    "collection": "topics",
    "credentials":
    [
      { "db": "local","auth": "'"$DATABASE"'", "user": "colearnr-search", "password": "colearnr-search" },
      { "db": "'"$DATABASE"'", "user": "colearnr-search", "password": "colearnr-search" }
    ],
    "options": {
      "secondary_read_preference" : true,
      "include_fields": ["id", "path", "name", "description", "tags", "body", "added_by", "img_url", "privacy_mode", "added_date", "last_updated"],
      "include_collection": "topics",
      "is_mongos": false
    }
  },
  "index": {
    "name": "topicsindex-'"$CLIENT"'",
    "type": "topics"
  }
}'

curl -XPUT $ES_SERVER:$PORT/_river/mongodb-users/_meta -d '{
  "type": "mongodb",
  "mongodb": {
    '"$SERVER"',
    "db": "'"$DATABASE"'",
    "collection": "users",
    "credentials":
    [
      { "db": "local","auth": "'"$DATABASE"'", "user": "colearnr-search", "password": "colearnr-search" },
      { "db": "'"$DATABASE"'", "user": "colearnr-search", "password": "colearnr-search" }
    ],
    "options": {
      "secondary_read_preference" : true,
      "include_fields": ["name.first", "name.middle", "name.last", "displayName", "emails", "profileImage", "join_date", "chat_id"],
      "include_collection": "users",
      "is_mongos": false
    }
  },
  "index": {
    "name": "usersindex-'"$CLIENT"'",
    "type": "users"
  }
}'

curl -XPOST $ES_SERVER:$PORT/_river/mongodb-learnbits/mongodb/start -d'{"type":"mongodb","river":"mongodb"}'

curl -XPOST $ES_SERVER:$PORT/_river/mongodb-topics/mongodb/start -d'{"type":"mongodb","river":"mongodb"}'

curl -XPOST $ES_SERVER:$PORT/_river/mongodb-users/mongodb/start -d'{"type":"mongodb","river":"mongodb"}'

curl -XGET http://$ES_SERVER:$PORT/_river/mongodb-learnbits/list
