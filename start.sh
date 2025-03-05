#! /bin/bash
pm2 start ./http/index.js --name http-server
tail -f /dev/null