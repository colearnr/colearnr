#!/bin/bash
INSTALL_DIR=/opt/colearnr
DOWNLOAD_DIR=$INSTALL_DIR/install_data
NODE_VERSION=6.2.1

if [ $EUID -ne 0 ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

banner() {
    echo '\033[0;34m'" ,-----.         ,--.                                              "'\033[0m'
    echo '\033[0;34m'"'  .--./  ,---.  |  |     ,---.   ,--,--. ,--.--. ,--,--,  ,--.--. "'\033[0m'
    echo '\033[0;34m'"|  |     | .-. | |  |    | .-. : ' ,-.  | |  .--' |      \ |  .--' "'\033[0m'
    echo '\033[0;34m'"'  '--'\ ' '-' ' |  '--. \   --. \ '-'  | |  |    |  ||  | |  |    "'\033[0m'
    echo '\033[0;34m'" \`-----'  \`---'  \`-----'  \`----'  \`--\`--' \`--'    \`--''--' \`--'    "'\033[0m'
}
banner

EDITION="community"
CENTOS_VERSION=`cat /etc/centos-release | grep -oE '[0-9]+\.[0-9]+'`
OS="centos"
OS_DIR=""

if [ -d $INSTALL_DIR ]; then
    echo "Existing CoLearnr installation found in $INSTALL_DIR. This will be moved to $INSTALL_DIR.old"
    rm -rf $INSTALL_DIR.old
    mv $INSTALL_DIR $INSTALL_DIR.old
else
    echo "Downloading dev and build tools"
    yum groupinstall -y 'Development Tools'
    yum install -y wget tar unzip gcc gcc-c++ python python-setuptools pam-devel java-1.8.0-openjdk-devel libX11-devel libXext-devel openssh-clients automake dhcp ntp ntpdate telnet git poppler-utils xz patch readline readline-devel curl zlib zlib-devel libyaml-devel libffi-devel openssl-devel make bzip2 autoconf automake libtool bison ruby rubygems

    cd /tmp
    wget https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz
    cd /usr && tar --strip-components 1 -xf /tmp/node-v$NODE_VERSION-linux-x64.tar.xz

    # Set npm python to 2.7
    npm config set python python2.7
    # Install global dependencies
    echo "Begin npm installation"
    npm install -g grunt grunt-cli gulp gulp-cli bower nodemon
    rpm -ivh https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.7.3.noarch.rpm
fi

mkdir -p $INSTALL_DIR $DOWNLOAD_DIR
cd $DOWNLOAD_DIR

UserExist() {
   awk -F":" '{ print $1 }' /etc/passwd | grep -x $1 > /dev/null
   return $?
}

UserExist colearnr
if [ $? = 0 ]; then
   echo "Found existing CoLearnr user!"
else
   # Create colearnr user
    useradd -m colearnr -c "User for CoLearnr"
fi

OS_DIR=${CENTOS_VERSION/./}
echo "Checking for pre-built package for $OS $OS_DIR ..."
wget http://downloads.colearnr.com/$OS$OS_DIR/colearnr-$EDITION.tar.xz
if [ $? = 0 ]; then
    echo "Extracting ..."
    tar -xf colearnr-$EDITION.tar.xz
    if [ $? = 0 ]; then
        mv community/colearnr $INSTALL_DIR/
        mv community/discuss $INSTALL_DIR/
    else
        echo "Installation failed during unarchiving"
        exit 1
    fi
else
    echo "No pre-built package found. Downloading source archive from git ..."
    if hash sass 2>/dev/null; then
        echo "Compass is already installed."
    else
        gem update
        gem update --system
        gem uninstall psych -v 2.0.17
        gem install compass
        gem install psych
    fi

    wget https://github.com/colearnr/colearnr/archive/master.zip
    unzip master.zip
    rm master.zip

    wget https://github.com/colearnr/discuss/archive/master.zip
    unzip master.zip
    rm master.zip

    cd $DOWNLOAD_DIR/colearnr-master
    npm install --loglevel warn
    gulp css
    cd $DOWNLOAD_DIR/discuss-master
    npm install --loglevel warn
    mv $DOWNLOAD_DIR/colearnr-master $INSTALL_DIR/colearnr
    mv $DOWNLOAD_DIR/discuss-master $INSTALL_DIR/discuss
fi

if [! -e "/etc/yum.repos.d/mongodb-org-3.2.repo"]; then
cat <<EOF >/etc/yum.repos.d/mongodb-org-3.2.repo
[mongodb-org-3.2]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/3.2/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.2.asc
EOF
fi

yum install -y mongodb-org
service mongod start
sleep 5

# Setting up database
mongo < $INSTALL_DIR/colearnr/scripts/db-bootstrap.js

rpm -ivh http://dl.fedoraproject.org/pub/epel/7/x86_64/e/epel-release-7-6.noarch.rpm
yum install redis -y

systemctl start redis.service

# Cleanup
rm -rf $DOWNLOAD_DIR
chown -R colearnr:colearnr $INSTALL_DIR
cd $INSTALL_DIR/colearnr && node app.js > /dev/null 2>&1 &
cd $INSTALL_DIR/discuss && node app.js > /dev/null 2>&1 &
echo "Installation of CoLearnr is now complete. You can access CoLearnr at http://localhost:8080"
