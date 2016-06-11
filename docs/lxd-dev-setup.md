# Setup colearnr dev environment with lxd

## Environment

- Ubuntu 16.04 with lxd installed

## Steps

### Launch new ubuntu container

```bash
sudo lxc launch ubuntu:16.04 colearnr-dev
```

### Install dependencies

```bash
sudo lxc exec colearnr-dev -- apt-get install -y git-core curl zlib1g-dev build-essential libssl-dev libreadline-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev libcurl4-openssl-dev python-software-properties libgdbm-dev libncurses5-dev automake libtool bison libffi-dev
sudo lxc exec colearnr-dev -- sh -c 'curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -'
sudo lxc exec colearnr-dev -- apt-get install -y nodejs mongodb redis-server libreoffice python2.7 ruby2.3 ruby-compass

sudo lxc exec colearnr-dev -- npm config set python python2.7
sudo lxc exec colearnr-dev -- sh -c 'npm install -g jscs jshint grunt grunt-cli gulp gulp-cli bower nodemon standard standard-format'

sudo lxc exec colearnr-dev -- sh -c 'cd /tmp && wget https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.7.3.deb && dpkg -i elasticsearch-1.7.3.deb'

sudo lxc exec colearnr-dev -- systemctl enable mongodb
sudo lxc exec colearnr-dev -- systemctl enable redis-server
sudo lxc exec colearnr-dev -- systemctl enable elasticsearch

sudo lxc exec colearnr-dev -- systemctl restart elasticsearch
```

### Share directories

```bash
# Find the uid for the following directory
sudo ls -l /var/lib/lxd/containers/colearnr-dev
# Eg: 165536

sudo mkdir /community
chown 165536:165536 /community
chmod 777 /community

sudo lxc config device add colearnr-dev sdb disk source=/community path=cl
```

### Pull latest source code

```bash
sudo lxc exec colearnr-dev -- sh -c 'cd /cl && git clone https://github.com/colearnr/colearnr.git && git clone https://github.com/colearnr/discuss.git'
sudo lxc exec colearnr-dev -- sh -c 'cd /cl/colearnr && npm install && gulp css'
sudo lxc exec colearnr-dev -- sh -c 'cd /cl/discuss && npm install'
```

### DB setup

```bash
sudo lxc exec colearnr-dev -- sh -c 'mongo < /cl/colearnr/scripts/mongo-dev-rs.js'
sleep 5
sudo lxc exec colearnr-dev -- sh -c 'mongo < /cl/colearnr/scripts/db-bootstrap.js'
```

### Start the applications

Use two terminals.
```bash
sudo lxc exec colearnr-dev -- sh -c 'cd /cl/colearnr && npm start'
sudo lxc exec colearnr-dev -- sh -c 'cd /cl/discuss && npm start'
```

Visit http://<lxc ip>:8080.  Eg: http://10.3.148.139:8080
