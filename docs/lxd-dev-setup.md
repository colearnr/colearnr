# Setup colearnr dev environment with lxd

## Environment
- Ubuntu 16.04 with lxd installed

## Steps
### Launch new ubuntu container
```bash
lxc launch ubuntu:16.04 colearnr-dev
```

### Install dependencies
```bash
lxc exec colearnr-dev -- apt-get install -y git-core curl zlib1g-dev build-essential libssl-dev libreadline-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev libcurl4-openssl-dev python-software-properties libgdbm-dev libncurses5-dev automake libtool bison libffi-dev

lxc exec colearnr-dev "curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -"
lxc exec colearnr-dev -- apt-get install -y nodejs mongodb redis-server libreoffice python2.7 ruby2.3 ruby-compass

lxc exec colearnr-dev -- npm config set python python2.7
lxc exec colearnr-dev -- npm install -g jscs jshint grunt grunt-cli gulp gulp-cli bower nodemon standard standard-format

lxc exec colearnr-dev -- cd /tmp && wget https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.7.3.deb && dpkg -i elasticsearch-1.7.3.deb

lxc exec colearnr-dev -- systemctl enable mongodb
lxc exec colearnr-dev -- systemctl enable redis-server
lxc exec colearnr-dev -- systemctl enable elasticsearch
```

### Share directories
```bash
# Find the uid for the following directory
sudo ls -l /var/lib/lxd/containers/colearnr-dev
# Eg: 165536

sudo mkdir /community
chown 165536:165536 /community
chmod 777 /community

lxc config device add colearnr-dev sdb disk source=/community path=cl
```

### Pull latest source code
```bash
lxc exec colearnr-dev -- cd /cl && git clone https://github.com/colearnr/colearnr.git && git clone https://github.com/colearnr/discuss.git
lxc exec colearnr-dev -- cd /cl/colearnr && npm install && gulp css
lxc exec colearnr-dev -- cd /cl/discuss && npm install
```

### DB setup
> mongo
rs.initiate({_id: 'clrs0', members: [{_id: 0, host: 'colearnr-dev:27017'}]});

```bash
lxc exec colearnr-dev -- mongo < /cl/colearnr/scripts/db-bootstrap.js
```
