#! /bin/sh
usage() {
    echo "Usage: $0 url filename lbitid userid cloud_prefix"
    exit 1
}
[ $# -eq 0 ] && usage

export PATH=/usr/local/bin:$PATH:
PWD=`pwd`
URL=$1
DFILE=`echo $2`
CLOUD_PREFIX=$5
CACHE_DIR=/tmp/$3

mkdir -p $CACHE_DIR
cd $CACHE_DIR
if [ ! -e "$DFILE" ]; then
    echo "About to download file from ${CLOUD_PREFIX}/${DFILE} to ${CACHE_DIR}/${DFILE}"
    wget -O $DFILE $URL
else
    echo "File $DFILE already exists"
fi
