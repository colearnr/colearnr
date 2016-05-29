# Ubuntu dev setup

Interested in contributing or extending CoLearnr for your own purpose? These instructions would help you setup a working dev environment in no time.

## Versions tested
- 16.04 (Xenial Xerus)

## Pre-requisites

- Node.js 4 or 6. Tested with 6.2.0 (https://nodejs.org/dist/v6.2.0/node-v6.2.0-linux-x64.tar.gz)
- Python 2.7 (For node-gyp)
- MongoDB 2.6
- Redis 3.0 or higher. Tested with 3.0.6 (http://download.redis.io/releases/redis-3.0.6.tar.gz)
- Elasticsearch. Tested with 1.7.3 (https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.7.3.deb)
- LibreOffice 4 or 5.

```
# Install node 6
sudo apt-get install -y git-core curl zlib1g-dev build-essential libssl-dev libreadline-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev libcurl4-openssl-dev python-software-properties libgdbm-dev libncurses5-dev automake libtool bison libffi-dev
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install ubuntu default versions
sudo apt-get install -y mongodb redis-server libreoffice python2.7
```

### Optional sass support for customisation
Stylesheets are based on compass framework (http://compass-style.org). Use the below commands to install compass.

```
sudo apt-get install -y ruby2.3 ruby-compass
```

## Build/Download CoLearnr

You can either build CoLearnr from source or download a pre-built version

### Pre-built packages
- [Ubuntu 15.10 - .tar.xz](http://downloads.colearnr.com/ubuntu1510/colearnr-community.tar.xz) / [MD5 hash](http://downloads.colearnr.com/ubuntu1510/colearnr-community.tar.xz.md5)
- [Ubuntu 14.04 - .tar.xz](http://downloads.colearnr.com/ubuntu1404/colearnr-community.tar.xz) / [MD5 hash](http://downloads.colearnr.com/ubuntu1404/colearnr-community.tar.xz.md5)

### Build
```
PWD=`pwd`
npm config set python python2.7

# Install global dependencies
sudo npm install -g jscs jshint grunt grunt-cli gulp gulp-cli bower nodemon standard standard-format

# clone and build the main app
git clone https://github.com/colearnr/colearnr.git
cd colearnr
npm install
gulp css
cd $PWD

# clone and build the discuss app
git clone https://github.com/colearnr/discuss.git
cd discuss
npm install
```

## Starting the applications
```
# From two different terminals change directory to each app and then
npm start
```

## Setup database
```
# Do this manually for now.
mongo < <CoLearnr webapp dir>/scripts/db-bootstrap.js
```

## Setup search
CoLearnr uses elasticsearch and a custom version of elasticsearch mongodb river. River is deprecated in elasticsearch 2.0 onwards and hence you need version 1.7.x (Last tested with 1.7.3).

### MongoDB replica mode
MongoDB should be configured to run in replica mode. Default install needs some configuration changes. Refer to mongod.conf.sample in docs directory.
Then do
> mongo
rs.initiate({_id: 'clrs0', members: [{_id: 0, host: 'HOST:27017'}]});

```
# Make sure you install only 1.7 series
sudo apt-get install -y elasticsearch
sh <CoLearnr webapp dir>/scripts/setup-es.sh
```
## Setup document conversion

## Troubleshooting

### Stylesheets seems to be missing
You need to run gulp css or npm start from within colearnr webapp for the first time.
