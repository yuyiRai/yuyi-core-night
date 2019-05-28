git add . 
git commit -a -m 'NEXT'
git push --set-upstream origin master
npm version patch && npm publish