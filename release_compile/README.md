/mozilla/client/ ------------------> source code 
/mozilla/client/package.json ------> library handler / command handler and others things
/mozilla/client/package-lock.json -> library handler / command handler and others things

/mozilla/bundle/ ---------------> file used by the user at the end ( bundle.zip excluse, I use it to send you the files )
/mozilla/bundle/manifest.json --> extension manifest
/mozilla/bundle/run.js ---------> use to run the code ( uptextv.js ) correctly
/mozilla/bundle/uptextv.js -----> generated code 

To obtain the final source code ( uptextv.js ) use by the user go to /mozilla/client/ and run the following command "npm run release"
You will obtain a zip file in /mozilla/client/release/ call uptextv.zip
All files / folders inside uptextv.zip are the same as this one 
DO NOT FORGET : You must run "npm run release" to obtain same folders / files

Library use to compile : https://en.wikipedia.org/wiki/Browserify 

if you need help to understand things feel free to contact me at valentinverst.developer@gmail.com
Good luck and have a good day