# Centos 6 installation

## Versions tested
- 6.7
- RedHat 6.7

## Pre-requisites

- Node.js 4 or 6. Tested with 6.2.0 (https://nodejs.org/dist/v6.2.0/node-v6.2.0-linux-x64.tar.xz)
- Python 2.7 (For node-gyp)
- MongoDB 3.0 or higher. Tested with 3.2 (Follow instructions in https://docs.mongodb.org/master/tutorial/install-mongodb-on-red-hat/)
- Redis 3.0 or higher. Tested with 3.0.7 (http://download.redis.io/releases/redis-3.0.7.tar.gz)
- Elasticsearch. Tested with 1.7.3 (https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.7.3.noarch.rpm)
- LibreOffice 4 or 5. (http://download.documentfoundation.org/libreoffice/stable/5.0.4/rpm/x86_64/LibreOffice_5.0.4_Linux_x86-64_rpm.tar.gz)

```
# Install general dependencies
yum install -y gcc gcc-c++ python python-setuptools pam-devel java-1.7.0-openjdk-devel libX11-devel libXext-devel libgcj libgcj-devel openssh-clients automake dhcp ntp ntpdate telnet git poppler-utils xz

# Install node 5
cd /tmp
wget https://nodejs.org/dist/v6.2.0/node-v6.2.0-linux-x64.tar.xz
cd /usr && tar --strip-components 1 -xf /tmp/node-v6.2.0-linux-x64.tar.xz
```

### Optional sass support for customisation
Stylesheets are based on compass framework (http://compass-style.org). Use the below commands to install the dependencies.
- Ruby 2.1.8

```
wget http://people.centos.org/tru/devtools-2/devtools-2.repo -O /etc/yum.repos.d/devtools-2.repo
yum install -y devtoolset-2-gcc devtoolset-2-binutils devtoolset-2-gcc-c++
scl enable devtoolset-2 bash

export CC=/opt/rh/devtoolset-2/root/usr/bin/gcc
export CPP=/opt/rh/devtoolset-2/root/usr/bin/cpp
export CXX=/opt/rh/devtoolset-2/root/usr/bin/c++

sudo yum install -y ruby
sudo yum install -y gcc g++ make automake autoconf curl-devel openssl-devel zlib-devel httpd-devel apr-devel apr-util-devel sqlite-devel
sudo yum install -y ruby-rdoc ruby-devel rubygems

sudo gem update
sudo gem update --system
sudo gem install compass
```

In case of RedHat 6.7
```
yum install -y devtoolset-4-toolchain ruby193-ruby ruby193-rubygem-sass
scl enable devtoolset-4 'bash'
```

## Build/Download CoLearnr

You can either build CoLearnr from source or download a pre-built version

### Pre-built packages
- [Centos 6.7 - .tar.xz](http://downloads.colearnr.com/centos6/colearnr-community.tar.xz)
- [MD5 hash](http://downloads.colearnr.com/centos6/colearnr-community.tar.xz.md5)
- [RedHat 6.7 - .tar.xz](http://downloads.colearnr.com/redhat6/colearnr-community.tar.xz)
- [MD5 hash](http://downloads.colearnr.com/redhat6/colearnr-community.tar.xz.md5)

### Build
```
PWD=`pwd`
npm config set python python2.7

# Install global dependencies
sudo npm install -g grunt grunt-cli gulp gulp-cli bower nodemon

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
rpm -ivh https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.7.3.noarch.rpm
sh <CoLearnr webapp dir>/scripts/setup-es.sh
```
## Setup document conversion
```
wget http://download.documentfoundation.org/libreoffice/stable/5.0.4/rpm/x86_64/LibreOffice_5.0.4_Linux_x86-64_rpm.tar.gz
tar -xf LibreOffice_5.0.4_Linux_x86-64_rpm.tar.gz
cd LibreOffice_5.0.4.2_Linux_x86-64_rpm/RPMS/
yum install -y *.rpm

# To fix any missing fonts issue do the below steps
# Find a good source for msttcore-fonts-installer. Sorry can't provide the link here :(
# rpm -ivh msttcore-fonts-installer-2.2-1.noarch.rpm
# fc-cache
# sed -i "s/LANG=C/LANG=en_GB.UTF-8/g" /etc/sysconfig/i18n
```
## Troubleshooting

### Stylesheets seems to be missing
You need to run gulp css or npm start from within colearnr webapp for the first time.
