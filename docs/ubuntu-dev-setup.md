# Ubuntu dev setup

## Versions tested
- 15.10 (Wily Werewolf)
- 15.04 (Vivid Vervet)
- 14.04 (Trusty Tahr)

## Pre-requisites

- Node.js 4 or 5. Tested with 5.5.0 (https://nodejs.org/dist/v5.5.0/node-v5.5.0-linux-x64.tar.gz)
- Python 2.7 (For node-gyp)
- MongoDB 3.0 or higher. Tested with 3.2 (https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1410-clang-3.2.1.tgz)
- Redis 3.0 or higher. Tested with 3.0.6 (http://download.redis.io/releases/redis-3.0.6.tar.gz)
- Elasticsearch. Tested with 1.7.3 (https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.7.3.deb)
- LibreOffice 4 or 5.

```
# Install node 5
sudo apt-get install -y git-core curl zlib1g-dev build-essential libssl-dev libreadline-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev libcurl4-openssl-dev python-software-properties libgdbm-dev libncurses5-dev automake libtool bison libffi-dev
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install ubuntu default versions
sudo apt-get install -y mongodb redis-server libreoffice python2.7
```

### Optional sass support for customisation
Stylesheets are based on compass framework (http://compass-style.org). Use the below commands to install compass.

```
# For 15.10 and 15.04
sudo apt-get install -y ruby2.1 ruby-compass

# For 14.04 install ruby 2.0
sudo apt-get install -y ruby2.0 ruby-compass

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
sudo npm install -g jscs jshint grunt grunt-cli gulp gulp-cli bower nodemon

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
