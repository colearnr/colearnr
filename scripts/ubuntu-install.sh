#!/bin/bash
INSTALL_DIR=/opt/colearnr
DOWNLOAD_DIR=$INSTALL_DIR/install_data

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
UBUNTU_VERSION=`lsb_release -r -s`
OS="ubuntu"
OS_DIR=""

if [ -d $INSTALL_DIR ]; then
    echo "Existing CoLearnr installation found in $INSTALL_DIR. This will be moved to $INSTALL_DIR.old"
    rm -rf $INSTALL_DIR.old
    mv $INSTALL_DIR $INSTALL_DIR.old
else
    echo "Downloading dev and build tools"
    sudo apt-get install -y git-core curl unzip zlib1g-dev build-essential libssl-dev libreadline-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev libcurl4-openssl-dev python-software-properties libgdbm-dev libncurses5-dev automake libtool bison libffi-dev
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
    sudo apt-get install -y nodejs mongodb redis-server python2.7

    # Set npm python to 2.7
    npm config set python python2.7
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

OS_DIR=${UBUNTU_VERSION/./}
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
    wget https://github.com/colearnr/colearnr/archive/master.zip
    unzip master.zip
    rm master.zip

    wget https://github.com/colearnr/discuss/archive/master.zip
    unzip master.zip
    rm master.zip

    sudo apt-get install -y ruby ruby-compass
    echo "Begin npm installation"
    npm config set python python2.7
    # Install global dependencies
    sudo npm install -g grunt grunt-cli gulp gulp-cli bower nodemon
    cd $DOWNLOAD_DIR/colearnr-master
    npm install --production --loglevel warn
    gulp css
    cd $DOWNLOAD_DIR/discuss-master
    npm install --production --loglevel warn
    mv $DOWNLOAD_DIR/colearnr-master $INSTALL_DIR/colearnr
    mv $DOWNLOAD_DIR/discuss-master $INSTALL_DIR/discuss
fi

# Setting up database
mongo < $INSTALL_DIR/colearnr/scripts/db-bootstrap.js

systemctl enable mongodb
systemctl enable redis-server
systemctl enable elasticsearch

# Cleanup
rm -rf $DOWNLOAD_DIR
chown -R colearnr:colearnr $INSTALL_DIR
cd $INSTALL_DIR/colearnr && node app.js > /dev/null 2>&1 &
cd $INSTALL_DIR/discuss && node app.js > /dev/null 2>&1 &
echo "Installation of CoLearnr is now complete. You can access CoLearnr at http://localhost:8080"
