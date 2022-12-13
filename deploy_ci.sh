#!/bin/sh
# file: deploy_ci.sh
echo "Running update..."
echo "Cleaning..."
rm -Rfv Call4Help-master
rm -Rfv master.zip

echo "Downloading..."
curl -L https://github.com/arielgos/Call4Help/archive/refs/heads/master.zip -o master.zip

echo "Uncompressing..."
unzip master.zip 

echo "Updating files..."
cd Call4Help-master
cp -R * /var/www/html/
cd ..
echo "Update finish..."

rm -Rfv Call4Help-master
rm -Rfv master.zip
