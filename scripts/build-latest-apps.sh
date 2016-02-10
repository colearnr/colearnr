#!/bin/bash
BUILD_DIR=/tmp
cd $BUILD_DIR
rm -rf community
mkdir -p community
cd community
wget https://github.com/colearnr/colearnr/archive/master.zip
unzip master.zip
rm master.zip
wget https://github.com/colearnr/discuss/archive/master.zip
unzip master.zip
rm master.zip

cd colearnr-master
npm install && gulp css
# Remove dev dependencies after gulp
rm -rf node_modules
npm install --production --loglevel warn
cd ..
mv colearnr-master colearnr

cd discuss-master
npm install --production --loglevel warn
cd ..
mv discuss-master discuss

cd $BUILD_DIR

tar -cJf colearnr-community.tar.xz community
md5sum colearnr-community.tar.xz | awk '{print $1}' > "colearnr-community.tar.xz.md5"

# Host it somewhere please. Thanks.
