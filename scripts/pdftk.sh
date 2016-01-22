#! /bin/sh
usage() {
    echo "Usage: $0 url pdffile lbitid userid cloud_prefix"
    exit 1
}
[ $# -eq 0 ] && usage

export PATH=/usr/local/bin:$PATH:
PWD=`pwd`
URL=$1
PDF_FILE=$2
FNAME=`echo ${PDF_FILE} | sed -e "s/.pdf//g"`
LBIT=${3}
USER=${4}
CLOUD_PREFIX=${5}
CACHE_DIR=/tmp/${3}
USE_PDFTK=1
USE_PDFSEP=1
if [ ! -e "$PDF_FILE" ]; then
    sh /cl/scripts/download.sh $*
fi
cd $CACHE_DIR
if ! type "pdftk" > /dev/null 2>&1; then
    USE_PDFTK=0   
fi
if ! type "pdfseparate" > /dev/null 2>&1; then
    USE_PDFSEP=0   
fi
if ! type "pdf2json" > /dev/null 2>&1; then
    echo "pdf2json command not found. Please install the required libraries"
    exit 1
fi
echo "Starting pdf split for $PDF_FILE in $CACHE_DIR as ${FNAME}_%02d.pdf"
if [ $USE_PDFTK -eq 1 ];then
    pdftk "$PDF_FILE" burst output "${FNAME}_%02d.pdf" compress
else
    if [ $USE_PDFSEP -eq 1 ];then
        pdfseparate "$PDF_FILE" "${FNAME}_%02d.pdf"
    else
        echo "Need either pdktk or poppler-utils (pdfseparate) to be installed."
        exit 1
    fi
fi
OUT=$?
if [ $OUT -eq 0 ];then
    echo "Starting pdf2json conversion"
    pdf2json "$PDF_FILE" -enc UTF-8 -compress -split 10 "${FNAME}_%.js"
    OUT=$?
    if [ $OUT -eq 0 ];then
        mudraw -r100 -o "${FNAME}_%d.png" "$PDF_FILE"
        mudraw -r72 -w 256 -o "${FNAME}_thumb_%d.png" "$PDF_FILE"
        OUT=$?
        rm "$PDF_FILE"
        cd $PWD
        echo "Conversion complete for $LBIT"
        rm -rf "$CACHE_DIR"
    else
        exit 1
    fi
else
    exit 1
fi
