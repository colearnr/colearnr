# Centos quick installation

## Versions tested
- 7.2

## 1. Prepare
```
sudo yum install -y curl wget tar unzip
```

## 2. Auto installation
```
curl -sS https://raw.githubusercontent.com/colearnr/colearnr/master/scripts/centos-install.sh | sudo bash
```

## Manual installation

In case you wish to review the installer and manually install CoLearnr then do

```
curl -O https://raw.githubusercontent.com/colearnr/colearnr/master/scripts/centos-install.sh

# Review the code
sudo bash centos-install.sh
```

## What the script does?

The script will install the following:

- Essential build tools and dev libraries
- Nodejs 6 from source
- MongoDB
- Redis (From Fedora EPEL)
- Python 2.7 (Required for npm native modules)
- Ruby (Required for sass compilation)

Then it will install CoLearnr community edition under /opt/colearnr. It will also create a 'colearnr' user.
