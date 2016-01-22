#! /bin/sh
usage() {
    echo "Usage: $0 location lbitid userid cloud_prefix"
    exit 1
}
[ $# -eq 0 ] && usage

export PATH=/usr/local/bin:$PATH:
PWD=`pwd`
VIDEO_FILE=$1
LBIT=${2}
USER=${3}
CLOUD_PREFIX=${4}
CACHE_DIR=/tmp/${2}

cd $CACHE_DIR
echo "Optimising ${VIDEO_FILE} in $CACHE_DIR"
cp $VIDEO_FILE $CACHE_DIR/opt-$2.mp4

rm -rf "${CACHE_DIR}"
