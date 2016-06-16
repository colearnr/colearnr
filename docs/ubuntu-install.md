# Ubuntu quick installation

## Versions tested
- 16.04 (Xenial Xerus)
- 15.10 (Wily Werewolf)
- 15.04 (Vivid Vervet)

## 1. Prepare
```
sudo apt-get install curl wget
```

## 2. Auto installation
```
curl -sS http://downloads.colearnr.com/scripts/ubuntu-install.sh | sudo bash

# Install latest from githuhub
curl -sS https://raw.githubusercontent.com/colearnr/colearnr/master/scripts/ubuntu-install.sh | sudo bash
```

## Manual installation

In case you wish to review the installer and manually install CoLearnr then do

```
curl -O http://downloads.colearnr.com/scripts/ubuntu-install.sh

# Review the code
sudo bash ubuntu-install.sh
```

## What the script does?

The script will install the following:

- Essential build tools and dev libraries
- Nodejs 6 from nodesource
- MongoDB
- Redis
- Python 2.7 (Required for npm native modules)
- Ruby (Required for sass compilation)

Then it will install CoLearnr community edition under /opt/colearnr. It will also create a 'colearnr' user.
