# Deploying Cadence to a live link (GitHub + Vercel)

Run the git commands in a terminal **on your own computer**, opened in this
folder (the one containing package.json). In VS Code: open this folder, then
Terminal -> New Terminal.

## 1. Commit the code locally
```
git init
git add .
git commit -m "Cadence beta with RTM project data"
```
First time only, if git asks who you are:
```
git config --global user.email "ishaan.aggarwal@rtmec.com"
git config --global user.name "Ishaan Aggarwal"
```
then redo the commit.

## 2. Create the GitHub repo and push
- github.com -> New repository -> name `cadence` -> Private -> Create
  (do NOT add a README/gitignore; this folder already has files)
- Then, using the URL GitHub shows you:
```
git branch -M main
git remote add origin https://github.com/<your-username>/cadence.git
git push -u origin main
```

## 3. Deploy on Vercel
- vercel.com -> Sign up -> Continue with GitHub -> authorize
- Add New -> Project -> import the `cadence` repo
- Vercel auto-detects Vite (Build: `npm run build`, Output: `dist`) -> leave
  defaults -> Deploy
- ~1 min later you get a live URL like cadence-xxxx.vercel.app

## 4. The change loop
When Claude edits the files, deploy the update with:
```
git add . && git commit -m "describe the change" && git push
```
Vercel auto-rebuilds in ~1 min; refresh the live link.

## Notes
- Initialize git in the INNER gannt-main\gannt-main folder (where package.json is).
  If you used the outer folder, set Vercel's Root Directory to `gannt-main`.
- node_modules and dist are gitignored; Vercel installs/builds them itself.
- Data currently saves in each browser (localStorage). Shared data across users
  is a later step (small database).
```
