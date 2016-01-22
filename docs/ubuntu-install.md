# Ubuntu installation

## Versions tested
- 15.10 (Wily Werewolf)
- 15.04 (Vivid Vervet)

## Pre-requisites

- Node.js 4 or 5. Tested with 5.5.0 (https://nodejs.org/dist/v5.5.0/node-v5.5.0-linux-x64.tar.gz)
- Python 2.7 (For node-gyp)
- MongoDB 3.0 or higher. Tested with 3.2 (https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1410-clang-3.2.1.tgz)
- Redis 3.0 or higher. Tested with 3.0.6 (http://download.redis.io/releases/redis-3.0.6.tar.gz)
- Elasticsearch. Tested with 1.7.3 (https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.7.3.deb)
- LibreOffice 4 or 5.

```
# Install node 5
sudo apt-get install -y git-core curl
sudo apt-get install -y curl zlib1g-dev build-essential libssl-dev libreadline-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev libcurl4-openssl-dev python-software-properties
sudo apt-get install -y libgdbm-dev libncurses5-dev automake libtool bison libffi-dev
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install ubuntu default versions
sudo apt-get -y mongodb redis-server libreoffice python2.7
```

### Optional sass support for customisation
Stylesheets are based on compass framework (http://compass-style.org). Use the below commands to install the dependencies.
- Ruby 2.1.8

```

# Setup rvm to install the ruby 2.1.8
sudo gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3

curl -L https://get.rvm.io | bash -s stable
source /etc/profile.d/rvm.sh
echo "source /etc/profile.d/rvm.sh" >> ~/.bashrc
rvm install 2.1.8
rvm use 2.1.8 --default

sudo gem update
sudo gem update --system
sudo gem install compass
```

## Build CoLearnr
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
mongo <CoLearnr webapp dir>/scripts/db-bootstrap.js
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
